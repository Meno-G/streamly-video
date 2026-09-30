import "server-only";
import type { SaveInput, StorageDriver, StoredFile } from "./types";

/**
 * Cloudinary driver.
 *
 * To enable:
 *   1. npm install cloudinary
 *   2. Set STORAGE_DRIVER=cloudinary and CLOUDINARY_* in .env
 *   3. In save(), pipe `body` into cloudinary.uploader.upload_stream({ public_id: key, resource_type: "auto" })
 *      and return { key: result.public_id, url: result.secure_url }.
 *      In delete(), call cloudinary.uploader.destroy(key, { resource_type: "video" | "image" }).
 *
 * Cloudinary can also generate thumbnails and adaptive streams from the same public_id.
 */
export class CloudinaryStorage implements StorageDriver {
  readonly name = "cloudinary" as const;

  private assertConfigured() {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error("Cloudinary is not configured. Set the CLOUDINARY_* variables in .env.");
    }
  }

  async save(input: SaveInput): Promise<StoredFile> {
    this.assertConfigured();
    void input;
    throw new Error("Cloudinary upload is not implemented yet. See src/server/storage/cloudinary.ts.");
  }

  async delete(key: string): Promise<void> {
    this.assertConfigured();
    void key;
    throw new Error("Cloudinary delete is not implemented yet. See src/server/storage/cloudinary.ts.");
  }

  publicUrl(key: string) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${key}`;
  }
}
