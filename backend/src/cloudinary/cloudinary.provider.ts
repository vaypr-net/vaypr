import { S3Client } from '@aws-sdk/client-s3';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT || '',
      region: process.env.DO_SPACES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
      },
      forcePathStyle: false, // DO Spaces uses virtual-hosted-style URLs
    });
  },
};
