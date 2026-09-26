export interface MetricLabelSet {
  [key: string]: string | number;
}

export class MetricsRegistry {
  private counters: Map<string, Map<string, number>> = new Map();
  private gauges: Map<string, Map<string, number>> = new Map();
  private histograms: Map<string, Map<string, number[]>> = new Map();

  private serializeLabels(labels?: MetricLabelSet): string {
    if (!labels || Object.keys(labels).length === 0) return '';
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  // Counter
  public incrementCounter(
    name: string,
    value: number = 1,
    labels?: MetricLabelSet
  ): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, new Map());
    }
    const labelKey = this.serializeLabels(labels);
    const subMap = this.counters.get(name)!;
    const current = subMap.get(labelKey) || 0;
    subMap.set(labelKey, current + value);
  }

  public getCounterValue(name: string, labels?: MetricLabelSet): number {
    const subMap = this.counters.get(name);
    if (!subMap) return 0;
    if (labels === undefined) {
      let total = 0;
      for (const val of subMap.values()) {
        total += val;
      }
      return total;
    }
    const labelKey = this.serializeLabels(labels);
    return subMap.get(labelKey) || 0;
  }

  // Gauge
  public setGauge(name: string, value: number, labels?: MetricLabelSet): void {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Map());
    }
    const labelKey = this.serializeLabels(labels);
    this.gauges.get(name)!.set(labelKey, value);
  }

  public getGaugeValue(name: string, labels?: MetricLabelSet): number {
    const subMap = this.gauges.get(name);
    if (!subMap) return 0;
    const labelKey = this.serializeLabels(labels);
    return subMap.get(labelKey) || 0;
  }

  // Histogram / Summary
  public recordHistogram(
    name: string,
    value: number,
    labels?: MetricLabelSet
  ): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new Map());
    }
    const labelKey = this.serializeLabels(labels);
    const subMap = this.histograms.get(name)!;
    const list = subMap.get(labelKey) || [];
    list.push(value);
    subMap.set(labelKey, list);
  }

  public getHistogramValues(
    name: string,
    labels?: MetricLabelSet
  ): number[] {
    const subMap = this.histograms.get(name);
    if (!subMap) return [];
    const labelKey = this.serializeLabels(labels);
    return subMap.get(labelKey) || [];
  }

  public toPrometheusString(): string {
    const lines: string[] = [];

    // Render Counters
    for (const [name, map] of this.counters.entries()) {
      lines.push(`# TYPE ${name} counter`);
      for (const [labels, val] of map.entries()) {
        const labelPart = labels ? `{${labels}}` : '';
        lines.push(`${name}${labelPart} ${val}`);
      }
    }

    // Render Gauges
    for (const [name, map] of this.gauges.entries()) {
      lines.push(`# TYPE ${name} gauge`);
      for (const [labels, val] of map.entries()) {
        const labelPart = labels ? `{${labels}}` : '';
        lines.push(`${name}${labelPart} ${val}`);
      }
    }

    // Render Histograms as count and sum
    for (const [name, map] of this.histograms.entries()) {
      lines.push(`# TYPE ${name} summary`);
      for (const [labels, list] of map.entries()) {
        const count = list.length;
        const sum = list.reduce((a, b) => a + b, 0);
        const prefix = labels ? `${labels},` : '';
        lines.push(`${name}_count{${labels}} ${count}`);
        lines.push(`${name}_sum{${labels}} ${sum}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  public reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

export const metrics = new MetricsRegistry();
