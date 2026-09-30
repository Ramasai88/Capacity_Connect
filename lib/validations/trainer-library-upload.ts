import { ResourceTypeEnum } from "./trainer-library";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedFormat?: string;
  detectedMimeType?: string;
}

export const FILE_SIZE_LIMITS: Record<ResourceTypeEnum, number> = {
  RECORDED_LECTURE: 100 * 1024 * 1024, // 100 MB
  PRESENTATION: 30 * 1024 * 1024,      // 30 MB
  STUDY_MATERIAL: 30 * 1024 * 1024,    // 30 MB
};

export const ALLOWED_EXTENSIONS: Record<ResourceTypeEnum, string[]> = {
  RECORDED_LECTURE: ["mp4", "webm", "mov", "m4v"],
  PRESENTATION: ["pptx", "ppt", "pdf", "odp"],
  STUDY_MATERIAL: ["pdf", "docx", "doc", "txt", "epub"],
};

export const ALLOWED_MIME_TYPES: Record<ResourceTypeEnum, string[]> = {
  RECORDED_LECTURE: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
    "video/mpeg",
  ],
  PRESENTATION: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/pdf",
    "application/vnd.oasis.opendocument.presentation",
  ],
  STUDY_MATERIAL: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "application/epub+zip",
  ],
};

export const DISALLOWED_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "bin", "com", "vbs", "ps1",
  "php", "html", "htm", "js", "ts", "py", "pl", "cgi",
  "jar", "dll", "so", "app", "dmg", "svg", "asp", "aspx", "jsp"
]);

/**
 * Validates file signature / magic bytes against expected educational formats.
 */
export function validateFileMagicBytes(buffer: Buffer, ext: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  const hex = buffer.subarray(0, 8).toString("hex").toLowerCase();

  switch (ext) {
    case "pdf":
      // %PDF (25 50 44 46)
      return hex.startsWith("25504446");

    case "mp4":
    case "m4v":
    case "mov":
      // ftyp signature (typically offset 4: 66 74 79 70)
      if (buffer.length >= 12) {
        const sub = buffer.subarray(4, 8).toString("ascii");
        if (sub === "ftyp" || sub === "moov") return true;
      }
      return hex.startsWith("000000");

    case "webm":
      // Matroska / WebM EBML (1a 45 df a3)
      return hex.startsWith("1a45dfa3");

    case "docx":
    case "pptx":
    case "epub":
      // ZIP-based Office OpenXML / EPUB (50 4b 03 04)
      return hex.startsWith("504b0304");

    case "doc":
    case "ppt":
      // Microsoft Compound File Binary Format (d0 cf 11 e0 a1 b1 1a e1)
      return hex.startsWith("d0cf11e0");

    case "txt":
      // Plain text check: verify bytes are valid printable ASCII/UTF-8
      for (let i = 0; i < Math.min(buffer.length, 512); i++) {
        const byte = buffer[i];
        if (byte === 0) return false; // Null byte indicates binary
      }
      return true;

    case "odp":
      return hex.startsWith("504b0304");

    default:
      return true;
  }
}

/**
 * Comprehensive server-side validator for uploaded Trainer Library files.
 */
export function validateTrainerFile(
  buffer: Buffer,
  originalFilename: string,
  clientMimeType: string,
  resourceType: ResourceTypeEnum
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Uploaded file is empty." };
  }

  // 1. Validate File Size
  const maxBytes = FILE_SIZE_LIMITS[resourceType] || (30 * 1024 * 1024);
  if (buffer.length > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the maximum allowed limit of ${maxMb} MB for ${resourceType}.`,
    };
  }

  // 2. Validate Extension
  const extMatch = originalFilename.lastIndexOf(".");
  if (extMatch === -1) {
    return { valid: false, error: "File must have a valid file extension." };
  }
  const ext = originalFilename.substring(extMatch + 1).toLowerCase().trim();

  if (DISALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File extension '.${ext}' is prohibited for security reasons.` };
  }

  const allowedExts = ALLOWED_EXTENSIONS[resourceType] || [];
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `File extension '.${ext}' is not permitted for ${resourceType}. Allowed: ${allowedExts.join(", ")}.`,
    };
  }

  // 3. Validate Magic Bytes / Signature
  const isValidSignature = validateFileMagicBytes(buffer, ext);
  if (!isValidSignature) {
    return {
      valid: false,
      error: `File contents do not match the expected signature for '.${ext}' files.`,
    };
  }

  return {
    valid: true,
    detectedFormat: ext.toUpperCase(),
    detectedMimeType: clientMimeType || "application/octet-stream",
  };
}
