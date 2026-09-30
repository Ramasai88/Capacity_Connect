import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { StorageService } from "@/lib/services/storage/storage.service";
import { LocalStorageProvider } from "@/lib/services/storage/local-storage.provider";

/**
 * GET /api/trainer/library/files/[...key]
 *
 * Authorized file streaming route for local development & private storage.
 * Enforces organization boundary and trainee publication state before streaming bytes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER", "TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    if (!params.key || params.key.length === 0) {
      return NextResponse.json(
        { error: { code: "MISSING_KEY", message: "File storage key is required." } },
        { status: 400 }
      );
    }

    // Reconstruct storageKey from route segments
    const storageKey = params.key.map(decodeURIComponent).join("/");

    // Cross-tenant Isolation Check
    const keySegments = storageKey.split("/");
    if (keySegments.length >= 2 && keySegments[0] === "organizations") {
      const targetOrgId = keySegments[1];
      if (targetOrgId !== auth.organizationId) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Access across tenant boundaries is forbidden." } },
          { status: 403 }
        );
      }
    }

    // Security Check: Find the corresponding TrainerResource in database
    const resource = await prisma.trainerResource.findFirst({
      where: {
        storageKey,
        organizationId: auth.organizationId!,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Requested resource was not found." } },
        { status: 404 }
      );
    }

    // Trainee access rule: Must be published
    if (auth.user.role === "TRAINEE" && !resource.isPublished) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "This resource is unpublished and inaccessible." } },
        { status: 403 }
      );
    }

    const provider = StorageService.getProvider();

    if (provider instanceof LocalStorageProvider && provider.getStream) {
      const fileData = await provider.getStream(storageKey);
      if (!fileData) {
        return NextResponse.json(
          { error: { code: "FILE_NOT_FOUND", message: "Stored file artifact is missing." } },
          { status: 404 }
        );
      }

      const stream = fileData.stream;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const fileBuffer = Buffer.concat(chunks);
      const mimeType = resource.mimeType || "application/octet-stream";
      const filename = resource.originalFileName || "download";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": fileBuffer.length.toString(),
          "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // If cloud provider (S3), redirect to authorized pre-signed URL
    const accessUrl = await provider.getAccessUrl(storageKey);
    return NextResponse.redirect(accessUrl);
  } catch (error: any) {
    console.error("GET /api/trainer/library/files error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to stream requested file." } },
      { status: 500 }
    );
  }
}
