import "server-only";
import type { SaveInput, StorageDriver, StoredFile } from "./types";

/**
 * S3 (or any S3-compatible store: R2, MinIO, Backblaze) driver.
 *
 * To enable:
 *   1. npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
 *   2. Set STORAGE_DRIVER=s3 and the S3_* variables in .env
 *   3. Replace the bodies below with:
 *        const upload = new Upload({ client, params: { Bucket, Key: key, Body: body, ContentType: contentType } });
 *        await upload.done();
 *      and DeleteObjectCommand for delete().
 *
 * Nothing else in the app needs to change: videos store the returned key and URL.
 */
export class S3Storage implements StorageDriver {
  readonly name = "s3" as const;

  constructor(
    private readonly config = {
      bucket: process.env.S3_BUCKET ?? "",
      region: process.env.S3_REGION ?? "",
      publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "",
    }
  ) {}

  private assertConfigured() {
    if (!this.config.bucket || !this.config.region || !process.env.S3_ACCESS_KEY_ID) {
      throw new Error("S3 storage is not configured. Set the S3_* variables in .env.");
    }
  }

  async save(input: SaveInput): Promise<StoredFile> {
    this.assertConfigured();
    void input;
    throw new Error("S3 upload is not implemented yet. See src/server/storage/s3.ts.");
  }

  async delete(key: string): Promise<void> {
    this.assertConfigured();
    void key;
    throw new Error("S3 delete is not implemented yet. See src/server/storage/s3.ts.");
  }

  publicUrl(key: string) {
    return `${this.config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }
}
