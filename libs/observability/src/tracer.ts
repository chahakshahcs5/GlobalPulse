export interface Span {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, unknown>;
  status: 'ok' | 'error';
  end(error?: Error): void;
}

export class SimpleTracer {
  private activeSpans: Span[] = [];
  private completedSpans: Span[] = [];

  private generateId(length: number = 16): string {
    const chars = 'abcdef0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public startSpan(
    name: string,
    attributes: Record<string, unknown> = {},
    parentTraceId?: string
  ): Span {
    const traceId = parentTraceId || this.generateId(32);
    const spanId = this.generateId(16);
    const startTime = Date.now();

    const span: Span = {
      traceId,
      spanId,
      name,
      startTime,
      attributes: { ...attributes },
      status: 'ok',
      end: (err?: Error) => {
        span.endTime = Date.now();
        if (err) {
          span.status = 'error';
          span.attributes['error.message'] = err.message;
          span.attributes['error.name'] = err.name;
        }
        const idx = this.activeSpans.indexOf(span);
        if (idx !== -1) {
          this.activeSpans.splice(idx, 1);
        }
        this.completedSpans.push(span);
      },
    };

    this.activeSpans.push(span);
    return span;
  }

  public async traceAsync<T>(
    name: string,
    attributes: Record<string, unknown>,
    fn: (span: Span) => Promise<T>,
    parentTraceId?: string
  ): Promise<T> {
    const span = this.startSpan(name, attributes, parentTraceId);
    try {
      const result = await fn(span);
      span.end();
      return result;
    } catch (err: unknown) {
      span.end(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  public getCompletedSpans(): Span[] {
    return [...this.completedSpans];
  }

  public clear(): void {
    this.activeSpans = [];
    this.completedSpans = [];
  }
}

export const tracer = new SimpleTracer();
