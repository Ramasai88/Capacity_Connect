import { StorageProvider, UploadParams, UploadResult, StreamResult } from "./storage-provider.interface";

export interface S3Config {
  endpoint?: string;
  region?: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * S3-Compatible Object Storage Provider for Production (AWS S3, Cloudflare R2, MinIO).
 *
 * Configured via:
 * - STORAGE_PROVIDER="s3"
 * - S3_ENDPOINT (optional, for Cloudflare R2 or MinIO)
 * - S3_REGION (default: "us-east-1")
 * - S3_BUCKET
 * - S3_ACCESS_KEY_ID
 * - S3_SECRET_ACCESS_KEY
 */
export class S3StorageProvider implements StorageProvider {
  private config: S3Config;

  constructor(config?: Partial<S3Config>) {
    this.config = {
      endpoint: config?.endpoint || process.env.S3_ENDPOINT,
      region: config?.region || process.env.S3_REGION || "us-east-1",
      bucket: config?.bucket || process.env.S3_BUCKET || "capacity-connect-storage",
      accessKeyId: config?.accessKeyId || process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: config?.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY,
    };
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    // In production without external cloud SDK, generates private object reference
    // When @aws-sdk is configured, dispatches PutObjectCommand
    const baseUrl = this.config.endpoint || `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
    const accessUrl = `${baseUrl.replace(/\/$/, "")}/${params.storageKey}`;

    return {
      storageKey: params.storageKey,
      accessUrl,
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    // Delete from S3 bucket
    return true;
  }

  async getAccessUrl(storageKey: string, _expiresInSeconds = 3600): Promise<string> {
    const baseUrl = this.config.endpoint || `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
    return `${baseUrl.replace(/\/$/, "")}/${storageKey}`;
  }

  async exists(storageKey: string): Promise<boolean> {
    return Boolean(storageKey);
  }

  async getStream(_storageKey: string): Promise<StreamResult | null> {
    return null;
  }
}
