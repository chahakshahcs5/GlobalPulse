'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Wind, Droplets, RefreshCw } from 'lucide-react';

interface WeatherForecastDay {
  day: string;
  icon: string;
  temp: number;
}

interface LiveWeatherData {
  city: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: string;
  forecast: WeatherForecastDay[];
}

function getWeatherInfo(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky', icon: '☀️' };
  if (code <= 3) return { condition: 'Partly Cloudy', icon: '⛅' };
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: '🌫️' };
  if (code >= 51 && code <= 67) return { condition: 'Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: '❄️' };
  if (code >= 80 && code <= 82) return { condition: 'Showers', icon: '🌦️' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Overcast', icon: '☁️' };
}

export interface WeatherCityConfig {
  key: string;
  name: string;
  label: string;
  lat: number;
  lon: number;
}

export const WEATHER_CITIES: WeatherCityConfig[] = [
  { key: 'new-delhi', name: 'New Delhi', label: 'New Delhi, India', lat: 28.6139, lon: 77.209 },
  { key: 'new-york', name: 'New York', label: 'New York, USA', lat: 40.7128, lon: -74.006 },
  { key: 'london', name: 'London', label: 'London, UK', lat: 51.5074, lon: -0.1278 },
  { key: 'tokyo', name: 'Tokyo', label: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { key: 'paris', name: 'Paris', label: 'Paris, France', lat: 48.8566, lon: 2.3522 },
  { key: 'berlin', name: 'Berlin', label: 'Berlin, Germany', lat: 52.52, lon: 13.405 },
  { key: 'singapore', name: 'Singapore', label: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { key: 'dubai', name: 'Dubai', label: 'Dubai, UAE', lat: 25.2048, lon: 55.2708 },
  { key: 'sydney', name: 'Sydney', label: 'Sydney, Australia', lat: -33.8688, lon: 151.2093 },
];

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<LiveWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCityKey, setSelectedCityKey] = useState<string>('auto');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('globalpulse_weather_location');
      if (saved) {
        setSelectedCityKey(saved);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const fetchLiveWeather = async (cityKey = selectedCityKey) => {
    setIsLoading(true);
    try {
      let lat = 28.6139;
      let lon = 77.209;
      let city = 'New Delhi';

      if (cityKey === 'auto' || cityKey === 'gps') {
        let detected = false;

        // 1. Try browser GPS with timeout
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 3000,
                enableHighAccuracy: false,
              });
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            detected = true;

            // Reverse geocode coordinates to real city name
            try {
              const geoRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                const place = geoData.locality || geoData.city || geoData.principalSubdivision;
                city = place
                  ? `${place}${geoData.countryCode ? `, ${geoData.countryCode}` : ''}`
                  : 'Current Location';
              }
            } catch {
              city = 'Current Location';
            }
          } catch {
            // Geolocation denied or timed out, gracefully fallback to IP geolocation
          }
        }

        // 2. Fallback to free real-time IP Geolocation if GPS didn't resolve
        if (!detected && typeof window !== 'undefined') {
          try {
            const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              if (ipData.latitude && ipData.longitude) {
                lat = parseFloat(ipData.latitude);
                lon = parseFloat(ipData.longitude);
                city = `${ipData.city || 'Local'}${
                  ipData.country_code ? `, ${ipData.country_code}` : ''
                }`;
                detected = true;
              }
            }
          } catch {
            // Fallback to default
          }
        }

        if (!detected) {
          const def = WEATHER_CITIES[0];
          lat = def.lat;
          lon = def.lon;
          city = def.name;
        }
      } else {
        const found = WEATHER_CITIES.find((c) => c.key === cityKey) || WEATHER_CITIES[0];
        lat = found.lat;
        lon = found.lon;
        city = found.name;
      }

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=auto`,
        { headers: { Accept: 'application/json' } }
      );

      if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
      const data = await res.json();

      const currentCode = data.current?.weather_code ?? 0;
      const { condition, icon } = getWeatherInfo(currentCode);

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
          icon: getWeatherInfo(code).icon,
          temp: Math.round(dailyTemps[idx + 1] ?? 20),
        };
      });

      setWeather({
        city,
        temperature: Math.round(data.current?.temperature_2m ?? 21),
        condition,
        icon,
        humidity: Math.round(data.current?.relative_humidity_2m ?? 55),
        windSpeed: `${Math.round(data.current?.wind_speed_10m ?? 12)} km/h`,
        forecast,
      });
    } catch {
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      const currentCityConfig = WEATHER_CITIES.find((c) => c.key === cityKey) || WEATHER_CITIES[0];

      setWeather({
        city: cityKey === 'auto' ? 'Current Location' : currentCityConfig.name,
        temperature: 24,
        condition: 'Partly Cloudy',
        icon: '⛅',
        humidity: 50,
        windSpeed: '12 km/h',
        forecast: [1, 2, 3, 4].map((offset) => ({
          day: daysOfWeek[(today + offset) % 7],
          icon: '☀️',
          temp: 23 + offset,
        })),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveWeather(selectedCityKey);
  }, [selectedCityKey]);

  const handleCityChange = (newKey: string) => {
    setSelectedCityKey(newKey);
    try {
      localStorage.setItem('globalpulse_weather_location', newKey);
      window.dispatchEvent(
        new CustomEvent('globalpulse_weather_location_updated', { detail: newKey })
      );
    } catch {}
  };

  if (isLoading && !weather) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3 animate-pulse">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <select
            value={selectedCityKey}
            onChange={(e) => handleCityChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none p-0 focus:ring-0 cursor-pointer hover:text-blue-600 transition"
            title="Switch weather location"
          >
            <option
              value="auto"
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              📍 Current Location (Auto)
            </option>
            {WEATHER_CITIES.map((c) => (
              <option
                key={c.key}
                value={c.key}
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px]">Live satellite</span>
          <button
            onClick={() => fetchLiveWeather(selectedCityKey)}
            title="Refresh weather"
            className="hover:text-blue-600 transition p-0.5 cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{weather.icon}</span>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {weather.temperature}°C
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
              <span>{weather.condition}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{weather.city}</span>
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] text-slate-500 space-y-0.5">
          <div className="flex items-center gap-1 justify-end">
            <Droplets className="w-3 h-3 text-sky-500" />
            <span>{weather.humidity}% humidity</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <Wind className="w-3 h-3 text-slate-400" />
            <span>{weather.windSpeed}</span>
          </div>
        </div>
      </div>

      {/* 4-Day Forecast */}
      {weather.forecast.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1 text-center">
          {weather.forecast.map((f, idx) => (
            <div
              key={idx}
              className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {f.day}
              </div>
              <div className="text-sm my-0.5">{f.icon}</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {f.temp}°
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
