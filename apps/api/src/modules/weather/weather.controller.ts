import { Controller, Get, Query, UseGuards, Inject, Optional } from '@nestjs/common';
import { NestAuthGuard, RequireScope } from '../../common/auth.guard';
import { WeatherService, WeatherData, GeocodeData } from './weather.service';

@Controller('api/weather')
@UseGuards(NestAuthGuard)
export class WeatherController {
  private readonly weatherService: WeatherService;

  constructor(@Optional() @Inject(WeatherService) weatherService?: WeatherService) {
    this.weatherService = weatherService || new WeatherService();
  }

  @Get('forecast')
  @RequireScope('news:read')
  async getForecast(
    @Query('lat') latStr?: string,
    @Query('lon') lonStr?: string
  ): Promise<WeatherData> {
    const lat = latStr ? parseFloat(latStr) : 28.6139;
    const lon = lonStr ? parseFloat(lonStr) : 77.209;
    return this.weatherService.getForecast(isNaN(lat) ? 28.6139 : lat, isNaN(lon) ? 77.209 : lon);
  }

  @Get('geocode')
  @RequireScope('news:read')
  async reverseGeocode(
    @Query('lat') latStr?: string,
    @Query('lon') lonStr?: string
  ): Promise<GeocodeData> {
    const lat = latStr ? parseFloat(latStr) : 28.6139;
    const lon = lonStr ? parseFloat(lonStr) : 77.209;
    return this.weatherService.reverseGeocode(
      isNaN(lat) ? 28.6139 : lat,
      isNaN(lon) ? 77.209 : lon
    );
  }
}
