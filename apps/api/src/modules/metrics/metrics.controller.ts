import { Controller, Get, Header, Headers, UnauthorizedException } from '@nestjs/common';
import { metrics } from '@ai-news/observability';

/**
 * Prometheus scrape endpoint.
 *
 * Set `METRICS_TOKEN` to require a bearer token; without it the endpoint is
 * open (intended for an internal-only listener / scrape network).
 */
@Controller()
export class MetricsController {
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(@Headers('authorization') authorization?: string): string {
    const expected = process.env.METRICS_TOKEN;
    if (expected) {
      const provided = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : '';
      if (provided !== expected) {
        throw new UnauthorizedException('Metrics token is required.');
      }
    }
    return metrics.toPrometheusString();
  }
}
