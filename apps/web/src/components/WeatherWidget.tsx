'use client';

import React from 'react';
import { LOCAL_WEATHER } from '../lib/news-data';
import { MapPin, Wind, Droplets } from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const weather = LOCAL_WEATHER;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{weather.city}</span>
        </div>
        <span className="text-[11px]">Your local weather</span>
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

      {/* 4-Day Mini Forecast */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1 text-center">
        {weather.forecast.map((f, idx) => (
          <div
            key={idx}
            className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{f.day}</div>
            <div className="text-sm my-0.5">{f.icon}</div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {f.temp}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
