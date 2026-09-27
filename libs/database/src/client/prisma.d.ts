declare module '@prisma/client' {
  export interface PrismaClientOptions {
    log?: Array<{ level: string; emit: string }>;
  }

  export class PrismaClient {
    constructor(options?: PrismaClientOptions);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw(query: TemplateStringsArray | string, ...values: unknown[]): Promise<unknown>;
    $transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
    source: Record<string, unknown>;
    story: Record<string, unknown>;
    topic: Record<string, unknown>;
    event: Record<string, unknown>;
    entity: Record<string, unknown>;
    auditLog: Record<string, unknown>;
    idempotencyRecord: Record<string, unknown>;
    [key: string]: unknown;
  }
}
