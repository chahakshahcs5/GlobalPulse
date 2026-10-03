/**
 * API Client — Weather and Geocoding Service Client
 */
import { request } from './core';

export interface WeatherForecastDay {
  day: string;
  icon: string;
  temp: number;
}

export interface LiveWeatherData {
  city?: string;
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

export async function getWeatherForecast(lat: number, lon: number): Promise<LiveWeatherData> {
  return request<LiveWeatherData>(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeData> {
  return request<GeocodeData>(`/api/weather/geocode?lat=${lat}&lon=${lon}`);
}
