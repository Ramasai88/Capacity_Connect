import { Readable } from "stream";

export interface UploadParams {
  storageKey: string;
  buffer: Buffer;
  mimeType: string;
}

export interface UploadResult {
  storageKey: string;
  accessUrl: string;
}

export interface StreamResult {
  stream: Readable;
  contentLength?: number;
  contentType?: string;
}

/**
 * Common pluggable interface for all storage provider adapters (Local, S3, R2, etc.)
 */
export interface StorageProvider {
  /**
   * Uploads a file buffer with safe storageKey and returns its persistent key and initial access URL.
   */
  upload(params: UploadParams): Promise<UploadResult>;

  /**
   * Deletes a stored file object by storageKey.
   */
  delete(storageKey: string): Promise<boolean>;

  /**
   * Generates a secure, authorized access URL (e.g. short-lived signed URL or local file streaming route).
   */
  getAccessUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Checks whether a file object exists in storage.
   */
  exists(storageKey: string): Promise<boolean>;

  /**
   * Returns a readable stream for the stored file (used for local authorized streaming).
   */
  getStream?(storageKey: string): Promise<StreamResult | null>;
}
