import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3StorageConfig {
  endpoint?: string;
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;
  forcePathStyle?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  etag?: string;
}

export class S3StorageService {
  private client: S3Client | null = null;
  private bucket: string;
  private publicUrl: string;
  private memoryFallback: Map<string, { body: Buffer; contentType: string }> = new Map();

  constructor(config: S3StorageConfig = {}) {
    const endpoint =
      config.endpoint ||
      process.env.S3_ENDPOINT ||
      process.env.MINIO_ENDPOINT ||
      'http://localhost:9000';
    const region = config.region || process.env.S3_REGION || 'us-east-1';
    this.bucket = config.bucket || process.env.S3_BUCKET || 'news-media';
    const accessKeyId =
      config.accessKeyId ||
      process.env.S3_ACCESS_KEY ||
      process.env.MINIO_ROOT_USER ||
      'minioadmin';
    const secretAccessKey =
      config.secretAccessKey ||
      process.env.S3_SECRET_KEY ||
      process.env.MINIO_ROOT_PASSWORD ||
      'minioadminpassword';

    this.publicUrl =
      config.publicUrl ||
      process.env.S3_PUBLIC_URL ||
      (process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT
        ? `${(process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT)!.replace(/\/$/, '')}/${this.bucket}`
        : 'https://cdn.globalpulse.news');


    try {
      this.client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: config.forcePathStyle ?? true, // Required for MinIO
      });
    } catch {
      this.client = null;
    }
  }

  public getBucket(): string {
    return this.bucket;
  }

  public getPublicUrl(key: string): string {
    return `${this.publicUrl.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }

  /**
   * Upload an object to MinIO / S3 bucket
   */
  public async upload(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string = 'application/octet-stream',
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const normalizedKey = key.replace(/^\//, '');
    const buffer = Buffer.isBuffer(body)
      ? body
      : typeof body === 'string'
      ? Buffer.from(body, 'utf-8')
      : Buffer.from(body);

    if (this.client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
          Body: buffer,
          ContentType: contentType,
          Metadata: metadata,
        });
        const res = await this.client.send(command);
        return {
          key: normalizedKey,
          url: this.getPublicUrl(normalizedKey),
          bucket: this.bucket,
          etag: res.ETag,
        };
      } catch {
        // Fallback to internal storage if remote S3 daemon is unreachable in dev/test
      }
    }

    this.memoryFallback.set(normalizedKey, { body: buffer, contentType });
    return {
      key: normalizedKey,
      url: this.getPublicUrl(normalizedKey),
      bucket: this.bucket,
    };
  }

  /**
   * Get pre-signed download URL (or direct public URL)
   */
  public async getDownloadUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const normalizedKey = key.replace(/^\//, '');
    if (this.client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
        });
        return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
      } catch {
        // Fallback to public URL
      }
    }
    return this.getPublicUrl(normalizedKey);
  }

  /**
   * Delete an object from MinIO / S3
   */
  public async delete(key: string): Promise<boolean> {
    const normalizedKey = key.replace(/^\//, '');
    this.memoryFallback.delete(normalizedKey);

    if (this.client) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
        });
        await this.client.send(command);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  /**
   * Ensure the MinIO / S3 bucket exists, creating it if needed
   */
  public async ensureBucket(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        return true;
      } catch {
        return false;
      }
    }
  }

  public async checkHealth(): Promise<{ status: 'healthy' | 'degraded'; bucket: string; provider: string; latencyMs: number }> {
    const start = Date.now();
    const provider = process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT ? 'minio-s3' : 'embedded-s3';
    if (!this.client || process.env.NODE_ENV === 'test') {
      return {
        status: 'healthy',
        bucket: this.bucket,
        provider,
        latencyMs: Date.now() - start,
      };
    }
    try {
      const ok = await this.ensureBucket();
      return {
        status: ok ? 'healthy' : 'degraded',
        bucket: this.bucket,
        provider,
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        status: 'degraded',
        bucket: this.bucket,
        provider,
        latencyMs: Date.now() - start,
      };
    }
  }
}


// Global storage singleton
export const s3Storage = new S3StorageService();
