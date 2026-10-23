export interface SharedMediaAsset {
  id: string;
  organizationId?: string;
  url: string;
  mediaType: string;
  title?: string;
  altText?: string;
  caption?: string;
  createdAt: string;
  s3Bucket?: string;
  metadata?: Record<string, unknown>;
  variants: Array<{
    suffix?: string;
    format?: string;
    width: number;
    height: number;
    url: string;
    sizeBytes?: number;
  }>;
}

export class SharedMediaRegistry {
  private static instance: SharedMediaRegistry;
  private assets = new Map<string, SharedMediaAsset>();

  public static getInstance(): SharedMediaRegistry {
    if (!SharedMediaRegistry.instance) {
      SharedMediaRegistry.instance = new SharedMediaRegistry();
    }
    return SharedMediaRegistry.instance;
  }

  public get(id: string): SharedMediaAsset | undefined {
    return this.assets.get(id);
  }

  public set(id: string, asset: SharedMediaAsset): void {
    this.assets.set(id, asset);
  }

  public has(id: string): boolean {
    return this.assets.has(id);
  }

  public delete(id: string): boolean {
    return this.assets.delete(id);
  }

  public clear(): void {
    this.assets.clear();
  }
}

export const sharedMediaRegistry = SharedMediaRegistry.getInstance();
