'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Wind, Droplets, RefreshCw } from 'lucide-react';
import { getWeatherForecast, reverseGeocode } from '../lib/api-client';
import { emitWeatherLocationUpdated } from '../lib/event-bus';

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

export interface WeatherCityConfig {
  key: string;
  name: string;
  label: string;
  lat: number;
  lon: number;
}

export const DELHI_FALLBACK: WeatherCityConfig = {
  key: 'new-delhi',
  name: 'New Delhi',
  label: 'New Delhi, India',
  lat: 28.6139,
  lon: 77.209,
};

export const WEATHER_CITIES: WeatherCityConfig[] = [
  DELHI_FALLBACK,
  { key: 'mumbai', name: 'Mumbai', label: 'Mumbai, India', lat: 19.076, lon: 72.8777 },
  { key: 'bengaluru', name: 'Bengaluru', label: 'Bengaluru, India', lat: 12.9716, lon: 77.5946 },
  { key: 'ahmedabad', name: 'Ahmedabad', label: 'Ahmedabad, India', lat: 23.0225, lon: 72.5714 },
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
  const [detectedLocationName, setDetectedLocationName] = useState<string>('');
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | 'preset'>('preset');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('globalpulse_weather_location');
      if (saved) {
        setSelectedCityKey(saved);
      } else {
        setSelectedCityKey('auto');
      }
    } catch {
      setSelectedCityKey('auto');
    }
  }, []);

  const fetchLiveWeather = async (cityKey = selectedCityKey, forceGps = false) => {
    setIsLoading(true);
    try {
      let lat = DELHI_FALLBACK.lat;
      let lon = DELHI_FALLBACK.lon;
      let city = DELHI_FALLBACK.label;
      let source: 'gps' | 'ip' | 'preset' = 'preset';

      if (cityKey === 'auto' || forceGps) {
        let resolved = false;

        // Prompt the user for location access on land or when auto is requested
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
          setIsLocating(true);
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 8000,
                enableHighAccuracy: true,
              });
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            source = 'gps';
            resolved = true;

            // Reverse geocode GPS coords via backend Weather service
            try {
              const geoData = await reverseGeocode(lat, lon);
              city = geoData.city || 'Your Location';
            } catch {
              city = 'Your Location';
            }
          } catch (err) {
            // User denied or dismissed GPS prompt, or timeout occurred:
            // Fall back strictly to Delhi as configured
            console.warn(
              'Geolocation permission denied or unavailable, falling back to Delhi:',
              err
            );
            lat = DELHI_FALLBACK.lat;
            lon = DELHI_FALLBACK.lon;
            city = DELHI_FALLBACK.label;
            source = 'preset';
            resolved = true;
          } finally {
            setIsLocating(false);
          }
        }

        if (!resolved) {
          // If browser does not support geolocation, fallback to Delhi
          lat = DELHI_FALLBACK.lat;
          lon = DELHI_FALLBACK.lon;
          city = DELHI_FALLBACK.label;
          source = 'preset';
        }

        setDetectedLocationName(city);
        setLocationSource(source);
      } else {
        const found = WEATHER_CITIES.find((c) => c.key === cityKey) || DELHI_FALLBACK;
        lat = found.lat;
        lon = found.lon;
        city = found.label;
        setLocationSource('preset');
      }

      // Real-time Weather Fetch via GlobalPulse Backend Weather Service
      const data = await getWeatherForecast(lat, lon);

      setWeather({
        city,
        temperature: data.temperature,
        condition: data.condition,
        icon: data.icon,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        forecast: data.forecast,
      });
    } catch {
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      setWeather({
        city: detectedLocationName || DELHI_FALLBACK.label,
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
      emitWeatherLocationUpdated(newKey);
    } catch {}
  };

  const handleRequestGps = () => {
    setSelectedCityKey('auto');
    fetchLiveWeather('auto', true);
  };

  if (isLoading && !weather) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3.5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-500/50" />
            <div className="h-4 w-32 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-shimmer" />
          </div>
          <div className="h-4 w-14 bg-slate-200/80 dark:bg-slate-800/80 rounded-full animate-shimmer" />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl animate-shimmer" />
            <div className="space-y-1">
              <div className="h-7 w-20 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-shimmer" />
              <div className="h-3 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-shimmer" />
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-3 w-16 ml-auto bg-slate-200/80 dark:bg-slate-800/80 rounded animate-shimmer" />
            <div className="h-3 w-14 ml-auto bg-slate-200/80 dark:bg-slate-800/80 rounded animate-shimmer" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-1">
              <div className="h-3 w-8 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-shimmer" />
              <div className="w-6 h-6 bg-slate-200/80 dark:bg-slate-800/80 rounded-md my-0.5 animate-shimmer" />
              <div className="h-3 w-6 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 min-w-0 max-w-[70%]">
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <select
            value={selectedCityKey}
            onChange={(e) => handleCityChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none p-0 focus:ring-0 cursor-pointer hover:text-blue-600 transition truncate"
            title="Switch weather location"
          >
            <option
              value="auto"
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              📍 Auto: {detectedLocationName || 'Detecting Location...'}
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
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleRequestGps}
            disabled={isLocating}
            title="Detect precise GPS location (triggers browser permission prompt)"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 transition cursor-pointer"
          >
            {isLocating ? 'Locating...' : locationSource === 'gps' ? 'GPS Active' : 'Use GPS'}
          </button>
          <button
            onClick={() => fetchLiveWeather(selectedCityKey)}
            title="Refresh live weather"
            className="hover:text-blue-600 transition p-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
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
