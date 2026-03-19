import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private s3: S3Client) {}

  private buildPublicUrl(key: string): string {
    // DO_SPACES_URL = https://vaypr-uploads.sfo3.digitaloceanspaces.com
    const spacesUrl = (process.env.DO_SPACES_URL || '').replace(/\/$/, '');

    if (spacesUrl) {
      return `${spacesUrl}/${key}`;
    }

    // Fallback: construct from endpoint + bucket
    const bucket = process.env.DO_SPACES_BUCKET;
    const endpoint = (process.env.DO_SPACES_ENDPOINT || '').replace(/\/$/, '');
    return `${endpoint}/${bucket}/${key}`;
  }

  private async upload(
    file: Express.Multer.File,
    folder: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto',
  ): Promise<any> {
    const ext = path.extname(file.originalname) || '';
    const uniqueKey = `${folder}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: uniqueKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' as any,
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      console.error('[DO Spaces] Upload error:', error);
      throw new InternalServerErrorException(
        `Failed to upload file to DigitalOcean Spaces: ${error.message || 'Unknown error'}`,
      );
    }

    const url = this.buildPublicUrl(uniqueKey);

    // Return in the same shape as Cloudinary so all controllers stay untouched
    return {
      secure_url: url,
      url,
      public_id: uniqueKey,
      resource_type: resourceType,
      original_filename: file.originalname,
    };
  }

  async uploadImage(file: Express.Multer.File, folder = 'profiles'): Promise<any> {
    return this.upload(file, folder, 'image');
  }

  async uploadFile(file: Express.Multer.File, folder = 'uploads'): Promise<any> {
    return this.upload(file, folder, 'auto');
  }

  async deleteImage(publicId: string): Promise<any> {
    const command = new DeleteObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: publicId,
    });

    try {
      return await this.s3.send(command);
    } catch (error) {
      console.error('[DO Spaces] Delete error:', error);
      throw new InternalServerErrorException(
        `Failed to delete file from DigitalOcean Spaces: ${error.message || 'Unknown error'}`,
      );
    }
  }
}
