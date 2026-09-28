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

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<LiveWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveWeather = async () => {
    setIsLoading(true);
    try {
      // Default to global newsroom hub (New York, 40.7128, -74.0060)
      let lat = 40.7128;
      let lon = -74.006;
      let city = 'New York';

      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          city = 'Local Weather';
        } catch {
          // Keep default city
        }
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
      // In case of network isolation, show fallback
      setWeather({
        city: 'Global Intelligence Hub',
        temperature: 21,
        condition: 'Clear Sky',
        icon: '☀️',
        humidity: 50,
        windSpeed: '12 km/h',
        forecast: [
          { day: 'Tue', icon: '☀️', temp: 22 },
          { day: 'Wed', icon: '⛅', temp: 20 },
          { day: 'Thu', icon: '🌧️', temp: 18 },
          { day: 'Fri', icon: '☀️', temp: 23 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveWeather();
  }, []);

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
        <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{weather.city}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px]">Live satellite</span>
          <button
            onClick={fetchLiveWeather}
            title="Refresh weather"
            className="hover:text-blue-600 transition p-0.5"
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
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {weather.condition}
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
