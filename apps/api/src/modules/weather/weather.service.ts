import { Injectable, Logger } from '@nestjs/common';

export interface WeatherForecastDay {
  day: string;
  icon: string;
  temp: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: string;
  forecast: WeatherForecastDay[];
}

export interface GeocodeData {
  city: string;
  locality?: string;
  country?: string;
  countryCode?: string;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private weatherCache = new Map<string, CacheEntry<WeatherData>>();
  private geocodeCache = new Map<string, CacheEntry<GeocodeData>>();

  private getWeatherInfo(code: number): { condition: string; icon: string } {
    if (code === 0) return { condition: 'Clear Sky', icon: '☀️' };
    if (code <= 3) return { condition: 'Partly Cloudy', icon: '⛅' };
    if (code === 45 || code === 48) return { condition: 'Foggy', icon: '🌫️' };
    if (code >= 51 && code <= 67) return { condition: 'Rain', icon: '🌧️' };
    if (code >= 71 && code <= 77) return { condition: 'Snow', icon: '❄️' };
    if (code >= 80 && code <= 82) return { condition: 'Showers', icon: '🌦️' };
    if (code >= 95) return { condition: 'Thunderstorm', icon: '⛈️' };
    return { condition: 'Overcast', icon: '☁️' };
  }

  async getForecast(lat: number, lon: number): Promise<WeatherData> {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const now = Date.now();
    const cached = this.weatherCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=auto`,
        { headers: { Accept: 'application/json' } }
      );

      if (!res.ok) {
        throw new Error(`Open-Meteo returned status ${res.status}`);
      }

      const data = await res.json();
      const currentCode = data.current?.weather_code ?? 0;
      const { condition, icon } = this.getWeatherInfo(currentCode);

      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyDates: string[] = data.daily?.time || [];
      const dailyCodes: number[] = data.daily?.weather_code || [];
      const dailyTemps: number[] = data.daily?.temperature_2m_max || [];

      const forecast: WeatherForecastDay[] = dailyDates.slice(1, 5).map((dStr, idx) => {
        const dateObj = new Date(dStr);
        const dayName = daysOfWeek[dateObj.getDay()] || 'Day';
        const code = dailyCodes[idx + 1] ?? 0;
        return {
          day: dayName,
          icon: this.getWeatherInfo(code).icon,
          temp: Math.round(dailyTemps[idx + 1] ?? 20),
        };
      });

      const weather: WeatherData = {
        temperature: Math.round(data.current?.temperature_2m ?? 24),
        condition,
        icon,
        humidity: Math.round(data.current?.relative_humidity_2m ?? 50),
        windSpeed: `${Math.round(data.current?.wind_speed_10m ?? 10)} km/h`,
        forecast,
      };

      // 15-minute TTL cache
      this.weatherCache.set(key, { data: weather, expiresAt: now + 15 * 60 * 1000 });
      return weather;
    } catch (err) {
      this.logger.warn(`Failed to fetch live weather for [${lat}, ${lon}]: ${err}`);
      // Graceful fallback
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      return {
        temperature: 28,
        condition: 'Clear Sky',
        icon: '☀️',
        humidity: 45,
        windSpeed: '8 km/h',
        forecast: [1, 2, 3, 4].map((offset) => ({
          day: daysOfWeek[(today + offset) % 7],
          icon: '☀️',
          temp: 28 + offset,
        })),
      };
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeocodeData> {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const now = Date.now();
    const cached = this.geocodeCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    try {
      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        { headers: { Accept: 'application/json' } }
      );

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const place =
          geoData.locality || geoData.city || geoData.principalSubdivision || 'Your Location';
        const result: GeocodeData = {
          city: place
            ? `${place}${geoData.countryCode ? `, ${geoData.countryCode}` : ''}`
            : 'Your Location',
          locality: geoData.locality,
          country: geoData.countryName,
          countryCode: geoData.countryCode,
        };
        // 24-hour TTL cache
        this.geocodeCache.set(key, { data: result, expiresAt: now + 24 * 60 * 60 * 1000 });
        return result;
      }
    } catch (err) {
      this.logger.warn(`Reverse geocode failed for [${lat}, ${lon}]: ${err}`);
    }

    return { city: 'Your Location' };
  }
}
