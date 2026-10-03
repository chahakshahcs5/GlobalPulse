import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WeatherService } from '../../../apps/api/src/modules/weather/weather.service';
import { buildServer } from '../../../apps/api/src/server';
import { FastifyInstance } from 'fastify';

describe('WeatherService & WeatherController API', () => {
  describe('WeatherService', () => {
    it('returns weather forecast with fallback if upstream network error occurs', async () => {
      const service = new WeatherService();
      // Even if fetch throws or network is simulated offline:
      const forecast = await service.getForecast(999, 999);
      expect(forecast).toBeDefined();
      expect(forecast.temperature).toBeDefined();
      expect(forecast.condition).toBeDefined();
      expect(forecast.icon).toBeDefined();
      expect(Array.isArray(forecast.forecast)).toBe(true);
      expect(forecast.forecast.length).toBe(4);
    });

    it('caches subsequent calls for the same coordinates', async () => {
      const service = new WeatherService();
      const first = await service.getForecast(28.61, 77.2);
      const second = await service.getForecast(28.61, 77.2);
      expect(second).toEqual(first);
    });

    it('returns reverse geocoding data', async () => {
      const service = new WeatherService();
      const res = await service.reverseGeocode(28.6139, 77.209);
      expect(res).toBeDefined();
      expect(typeof res.city).toBe('string');
    });
  });

  describe('GET /api/weather/forecast & /api/weather/geocode Endpoints', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
      app = buildServer({ logger: false });
      await app.ready();
    });

    afterEach(async () => {
      await app.close();
    });

    it('returns 200 and live weather forecast', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/weather/forecast?lat=28.6139&lon=77.209',
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.temperature).toBeDefined();
      expect(data.condition).toBeDefined();
      expect(Array.isArray(data.forecast)).toBe(true);
    });

    it('returns 200 and reverse geocode', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/weather/geocode?lat=28.6139&lon=77.209',
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.city).toBeDefined();
    });
  });
});
