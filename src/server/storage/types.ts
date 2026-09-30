export type StoredFile = {
  /** Driver-specific key, persisted in the database so the file can be deleted later. */
  key: string;
  /** URL the browser uses to load the file. */
  url: string;
};

export type SaveInput = {
  /** Path-like key, e.g. "videos/2026/09/abc123.mp4". */
  key: string;
  body: ReadableStream<Uint8Array>;
  contentType: string;
  size: number;
};

/**
 * Every storage backend implements this. The app only talks to the interface returned by
 * `getStorage()`, so switching from local disk to S3 or Cloudinary is a config change.
 */
export interface StorageDriver {
  readonly name: "local" | "s3" | "cloudinary";
  save(input: SaveInput): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}
