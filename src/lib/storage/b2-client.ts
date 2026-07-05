import { S3Client } from '@aws-sdk/client-s3'

export const b2Client = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
})

export const BUCKET_NAME = process.env.B2_BUCKET_NAME!