import { Controller, Get, Query, Inject, StreamableFile, Header, NotFoundException, BadRequestException } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

/**
 * Proxy endpoint so the frontend can fetch DO Spaces objects through the
 * backend (same-origin). This avoids CORS restrictions when html2canvas
 * needs to draw logo images onto a canvas for PDF export.
 *
 * The objects are already public-read on DO Spaces, so no auth is required
 * here — this controller simply forwards the request and response.
 */
@Controller('storage')
export class StorageController {
  constructor(@Inject('CLOUDINARY') private readonly s3: S3Client) {}

  @Get('proxy')
  @Header('Cache-Control', 'public, max-age=3600')
  async proxyFile(@Query('key') key: string): Promise<StreamableFile> {
    if (!key) {
      throw new BadRequestException('Missing key parameter');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
      });

      const data = await this.s3.send(command);

      return new StreamableFile(data.Body as Readable, {
        type: data.ContentType || 'application/octet-stream',
      });
    } catch (error) {
      console.error('[StorageProxy] Failed to fetch object:', key, error?.message);
      throw new NotFoundException('File not found');
    }
  }
}
