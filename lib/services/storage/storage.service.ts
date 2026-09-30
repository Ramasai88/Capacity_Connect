import crypto from "crypto";
import { StorageProvider } from "./storage-provider.interface";
import { LocalStorageProvider } from "./local-storage.provider";
import { S3StorageProvider } from "./s3-storage.provider";

export class StorageService {
  private static providerInstance: StorageProvider | null = null;

  /**
   * Returns the active storage provider (S3 in production when configured, LocalStorageProvider in dev/test).
   */
  static getProvider(): StorageProvider {
    if (!this.providerInstance) {
      const providerType = process.env.STORAGE_PROVIDER?.toLowerCase();
      if (providerType === "s3") {
        this.providerInstance = new S3StorageProvider();
      } else {
        this.providerInstance = new LocalStorageProvider();
      }
    }
    return this.providerInstance;
  }

  /**
   * For testing: allows overriding provider with a mock or custom directory instance.
   */
  static setProvider(provider: StorageProvider | null) {
    this.providerInstance = provider;
  }

  /**
   * Generates a collision-resistant, organization-scoped storage key.
   * Format: organizations/{organizationId}/trainer-resources/{randomId}.{ext}
   */
  static generateStorageKey(organizationId: string, originalFilename: string): string {
    const ext = originalFilename.includes(".")
      ? originalFilename.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
      : "bin";
    const uniqueId = `res_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    const safeOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, "");

    return `organizations/${safeOrgId}/trainer-resources/${uniqueId}.${ext}`;
  }

  /**
   * Formats raw byte size into human-readable string (e.g., "14.2 MB", "850 KB").
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Uploads a file buffer to storage.
   */
  static async upload(params: {
    organizationId: string;
    filename: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ storageKey: string; accessUrl: string; fileSizeBytes: number; fileSizeFormatted: string }> {
    const storageKey = this.generateStorageKey(params.organizationId, params.filename);
    const provider = this.getProvider();

    const result = await provider.upload({
      storageKey,
      buffer: params.buffer,
      mimeType: params.mimeType,
    });

    return {
      storageKey: result.storageKey,
      accessUrl: result.accessUrl,
      fileSizeBytes: params.buffer.length,
      fileSizeFormatted: this.formatFileSize(params.buffer.length),
    };
  }

  /**
   * Deletes a stored file object. Failures are logged safely without throwing.
   */
  static async delete(storageKey: string | null | undefined): Promise<boolean> {
    if (!storageKey || typeof storageKey !== "string" || storageKey.trim().length === 0) {
      return false;
    }

    try {
      const provider = this.getProvider();
      return await provider.delete(storageKey.trim());
    } catch (err) {
      console.warn(`[StorageService] Failed to delete storage object '${storageKey}':`, err);
      return false;
    }
  }

  /**
   * Checks if a stored object exists.
   */
  static async exists(storageKey: string | null | undefined): Promise<boolean> {
    if (!storageKey || typeof storageKey !== "string" || storageKey.trim().length === 0) {
      return false;
    }
    try {
      const provider = this.getProvider();
      return await provider.exists(storageKey.trim());
    } catch {
      return false;
    }
  }

  /**
   * Retrieves a readable stream for the stored file.
   */
  static async getStream(storageKey: string | null | undefined): Promise<any> {
    if (!storageKey || typeof storageKey !== "string" || storageKey.trim().length === 0) {
      return null;
    }
    try {
      const provider = this.getProvider();
      if (provider.getStream) {
        return await provider.getStream(storageKey.trim());
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Returns an authorized access URL for the stored resource.
   */
  static async getAccessUrl(storageKey: string, expiresInSeconds = 3600): Promise<string> {
    const provider = this.getProvider();
    return provider.getAccessUrl(storageKey, expiresInSeconds);
  }
}
