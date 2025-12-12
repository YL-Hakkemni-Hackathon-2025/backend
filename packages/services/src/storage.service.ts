import { Storage, Bucket } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

// Default signed URL expiration time (1 hour)
const DEFAULT_SIGNED_URL_EXPIRATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Signed URL expiration for document viewing (7 days)
const DOCUMENT_VIEW_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export class StorageService {
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  constructor() {
    // Initialize Google Cloud Storage
    // Uses Application Default Credentials (ADC) from GOOGLE_APPLICATION_CREDENTIALS env var
    this.storage = new Storage();
    this.bucketName = process.env.GCS_BUCKET_NAME || 'hakkemni-documents';
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Generate a randomized file name to prevent predictable URLs
   */
  private generateRandomFileName(originalFileName: string): string {
    const ext = path.extname(originalFileName);
    const uuid = uuidv4();
    const timestamp = Date.now();
    // Format: uuid_timestamp.ext (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890_1702500000000.pdf")
    return `${uuid}_${timestamp}${ext}`;
  }

  /**
   * Upload a file to Google Cloud Storage
   * @param fileBuffer The file content as a Buffer
   * @param originalFileName Original file name (used to extract extension)
   * @param mimeType MIME type of the file
   * @param userId User ID (used for organizing files in folders)
   * @returns Object containing the GCS path and a signed URL for viewing
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    userId: string
  ): Promise<{ gcsPath: string; signedUrl: string }> {
    // Generate randomized file name
    const randomFileName = this.generateRandomFileName(originalFileName);

    // Organize files by user ID: documents/{userId}/{randomFileName}
    const gcsPath = `documents/${userId}/${randomFileName}`;

    const file = this.bucket.file(gcsPath);

    try {
      // Upload the file
      await file.save(fileBuffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            originalFileName: originalFileName,
            uploadedAt: new Date().toISOString(),
            userId: userId
          }
        },
        resumable: false, // For files < 10MB, non-resumable is faster
        validation: 'crc32c'
      });

      // Generate a signed URL for viewing
      const signedUrl = await this.generateSignedUrl(gcsPath, 'read');

      console.log(`✅ File uploaded to GCS: ${gcsPath}`);

      return {
        gcsPath,
        signedUrl
      };
    } catch (error) {
      console.error('❌ GCS upload error:', error);
      throw new Error(`Failed to upload file to cloud storage: ${error}`);
    }
  }

  /**
   * Generate a signed URL for accessing a file
   * @param gcsPath The path to the file in GCS
   * @param action 'read' for viewing, 'write' for uploading
   * @param expirationMs Expiration time in milliseconds (default: 7 days for read)
   * @returns Signed URL
   */
  async generateSignedUrl(
    gcsPath: string,
    action: 'read' | 'write' = 'read',
    expirationMs: number = DOCUMENT_VIEW_EXPIRATION
  ): Promise<string> {
    const file = this.bucket.file(gcsPath);

    const options: any = {
      version: 'v4' as const,
      action: action,
      expires: Date.now() + expirationMs
    };

    try {
      const [signedUrl] = await file.getSignedUrl(options);
      return signedUrl;
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error}`);
    }
  }

  /**
   * Delete a file from Google Cloud Storage
   * @param gcsPath The path to the file in GCS
   */
  async deleteFile(gcsPath: string): Promise<void> {
    try {
      const file = this.bucket.file(gcsPath);
      await file.delete();
      console.log(`✅ File deleted from GCS: ${gcsPath}`);
    } catch (error) {
      console.error('❌ GCS delete error:', error);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Check if a file exists in GCS
   * @param gcsPath The path to the file in GCS
   */
  async fileExists(gcsPath: string): Promise<boolean> {
    try {
      const file = this.bucket.file(gcsPath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh a signed URL for an existing file
   * Used when the previous signed URL has expired
   * @param gcsPath The path to the file in GCS
   */
  async refreshSignedUrl(gcsPath: string): Promise<string> {
    return this.generateSignedUrl(gcsPath, 'read');
  }
}

export const storageService = new StorageService();

