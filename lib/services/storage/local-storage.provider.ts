import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { StorageProvider, UploadParams, UploadResult, StreamResult } from "./storage-provider.interface";

/**
 * Local Disk Storage Provider for Development, CI, and Test Environments.
 * Stores files under an isolated ./uploads/trainer-library/ directory.
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.resolve(process.cwd(), "uploads", "trainer-library");
  }

  private resolvePath(storageKey: string): string {
    // Sanitize key against directory traversal
    const safeKey = storageKey.replace(/\.\./g, "").replace(/^\/+/, "");
    return path.join(this.baseDir, safeKey);
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const fullPath = this.resolvePath(params.storageKey);
    const dir = path.dirname(fullPath);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(fullPath, params.buffer);

    const accessUrl = `/api/trainer/library/files/${encodeURIComponent(params.storageKey)}`;

    return {
      storageKey: params.storageKey,
      accessUrl,
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(storageKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.warn(`[LocalStorageProvider] Failed to delete file ${storageKey}:`, err);
      return false;
    }
  }

  async getAccessUrl(storageKey: string): Promise<string> {
    return `/api/trainer/library/files/${encodeURIComponent(storageKey)}`;
  }

  async exists(storageKey: string): Promise<boolean> {
    const fullPath = this.resolvePath(storageKey);
    return fs.existsSync(fullPath);
  }

  async getStream(storageKey: string): Promise<StreamResult | null> {
    const fullPath = this.resolvePath(storageKey);
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const stat = await fs.promises.stat(fullPath);
    const stream = fs.createReadStream(fullPath);

    return {
      stream: stream as unknown as Readable,
      contentLength: stat.size,
    };
  }
}
