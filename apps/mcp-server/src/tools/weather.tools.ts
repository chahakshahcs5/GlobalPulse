import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AuthService, type AuthenticatedPrincipal } from '@ai-news/auth';
import { mcpJsonResponse } from './tool-helpers';

function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Overcast';
}

const CAPITAL_COORDINATES: Record<string, { lat: number; lon: number; label: string }> = {
  'new-delhi': { lat: 28.6139, lon: 77.209, label: 'New Delhi, India' },
  delhi: { lat: 28.6139, lon: 77.209, label: 'New Delhi, India' },
  'new-york': { lat: 40.7128, lon: -74.006, label: 'New York, USA' },
  nyc: { lat: 40.7128, lon: -74.006, label: 'New York, USA' },
  london: { lat: 51.5074, lon: -0.1278, label: 'London, UK' },
  tokyo: { lat: 35.6762, lon: 139.6503, label: 'Tokyo, Japan' },
  paris: { lat: 48.8566, lon: 2.3522, label: 'Paris, France' },
  berlin: { lat: 52.52, lon: 13.405, label: 'Berlin, Germany' },
  singapore: { lat: 1.3521, lon: 103.8198, label: 'Singapore' },
  dubai: { lat: 25.2048, lon: 55.2708, label: 'Dubai, UAE' },
  sydney: { lat: -33.8688, lon: 151.2093, label: 'Sydney, Australia' },
  ahmedabad: { lat: 23.0276, lon: 72.5871, label: 'Ahmedabad, India' },
  mumbai: { lat: 19.076, lon: 72.8777, label: 'Mumbai, India' },
};

export function registerWeatherTools(
  server: McpServer,
  getPrincipal: () => AuthenticatedPrincipal
) {
  server.tool(
    'get_realtime_weather',
    '[READ-ONLY] Retrieve realtime live location weather and 4-day forecast via Open-Meteo public API.',
    {
      city: z
        .string()
        .optional()
        .describe('City name to lookup (e.g. "Tokyo", "London", "Ahmedabad", "New York")'),
      latitude: z.number().optional().describe('Geographic latitude (-90 to 90)'),
      longitude: z.number().optional().describe('Geographic longitude (-180 to 180)'),
    },
    async ({ city, latitude, longitude }) => {
      const principal = getPrincipal();
      AuthService.requireScope(principal, 'news:read');

      let lat = latitude;
      let lon = longitude;
      let resolvedCityName = city || 'Local Area';

      // If lat/lon not provided, resolve from city name
      if (lat === undefined || lon === undefined) {
        const normalized = (city || 'new-delhi').toLowerCase().trim();
        const preConfig = CAPITAL_COORDINATES[normalized];

        if (preConfig) {
          lat = preConfig.lat;
          lon = preConfig.lon;
          resolvedCityName = preConfig.label;
        } else {
          // Open-Meteo Geocoding Search
          try {
            const geoRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                normalized
              )}&count=1&language=en&format=json`
            );
            if (geoRes.ok) {
              const geoData = (await geoRes.json()) as {
                results?: Array<{
                  latitude: number;
                  longitude: number;
                  name: string;
                  country?: string;
                }>;
              };
              if (geoData.results && geoData.results.length > 0) {
                const first = geoData.results[0];
                lat = first.latitude;
                lon = first.longitude;
                resolvedCityName = `${first.name}${first.country ? `, ${first.country}` : ''}`;
              }
            }
          } catch {
            // Fallback
          }
        }
      }

      // Default to New Delhi if geocoding failed
      if (lat === undefined || lon === undefined) {
        lat = 28.6139;
        lon = 77.209;
        resolvedCityName = 'New Delhi, India';
      }

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=auto`,
        { headers: { Accept: 'application/json' } }
      );

      if (!weatherRes.ok) {
        throw new Error(`Open-Meteo weather fetch failed with status ${weatherRes.status}`);
      }

      const weatherData = (await weatherRes.json()) as {
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          weather_code?: number;
          wind_speed_10m?: number;
        };
        daily?: {
          time?: string[];
          weather_code?: number[];
          temperature_2m_max?: number[];
        };
      };

      const currentCode = weatherData.current?.weather_code ?? 0;
      const condition = getWeatherCondition(currentCode);
      const tempC = Math.round(weatherData.current?.temperature_2m ?? 20);
      const tempF = Math.round((tempC * 9) / 5 + 32);

      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyDates = weatherData.daily?.time || [];
      const dailyCodes = weatherData.daily?.weather_code || [];
      const dailyTemps = weatherData.daily?.temperature_2m_max || [];

      const forecast = dailyDates.slice(1, 5).map((dStr, idx) => {
        const dateObj = new Date(dStr);
        const day = daysOfWeek[dateObj.getDay()] || 'Day';
        const code = dailyCodes[idx + 1] ?? 0;
        const maxC = Math.round(dailyTemps[idx + 1] ?? 20);
        return {
          day,
          condition: getWeatherCondition(code),
          temperatureMaxCelsius: maxC,
          temperatureMaxFahrenheit: Math.round((maxC * 9) / 5 + 32),
        };
      });

      return mcpJsonResponse({
        location: {
          city: resolvedCityName,
          latitude: lat,
          longitude: lon,
        },
        current: {
          temperatureCelsius: tempC,
          temperatureFahrenheit: tempF,
          condition,
          humidityPercent: Math.round(weatherData.current?.relative_humidity_2m ?? 50),
          windSpeedKmH: Math.round(weatherData.current?.wind_speed_10m ?? 10),
        },
        forecast,
        source: 'Open-Meteo Public Weather API',
      });
    }
  );
}
