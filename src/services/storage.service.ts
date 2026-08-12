import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { b2Client, BUCKET_NAME } from  '@/lib/storage/b2-client'

export const StorageService = {

  // Upload a file buffer to B2, returns the storage key (path)
  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<{ success: boolean; key?: string; error?: string }> {
    try {
      await b2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      )
      return { success: true, key }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Generate a temporary signed URL to view/download a file (expires in 1 hour by default)
  async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
      const url = await getSignedUrl(b2Client, command, { expiresIn: expiresInSeconds })
      return url
    } catch {
      return null
    }
  },

  // Delete a file from B2
  async deleteFile(key: string): Promise<boolean> {
    try {
      await b2Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      )
      return true
    } catch {
      return false
    }
  },

  // Generate a unique storage key (path) for a file
  generateKey(folder: string, tenantId: string, fileName: string): string {
    const timestamp = Date.now()
    const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `${folder}/${tenantId}/${timestamp}_${cleanName}`
  },
}