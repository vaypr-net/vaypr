import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) {}

  async uploadImage(file: Express.Multer.File, folder = 'profiles'): Promise<any> {
    return new Promise((resolve, reject) => {
      // Set timeout for upload (30 seconds)
      const uploadTimeout = setTimeout(() => {
        reject(new InternalServerErrorException('Image upload timeout - took too long'));
      }, 30000);

      const upload = this.cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          timeout: 30000,
        },
        (error, result) => {
          // Clear timeout once upload completes (success or failure)
          clearTimeout(uploadTimeout);

          if (error) {
            console.error('[Cloudinary] Upload error:', error);
            return reject(
              new InternalServerErrorException(
                `Failed to upload image to Cloudinary: ${error.message || 'Unknown error'}`
              )
            );
          }

          if (!result) {
            return reject(
              new InternalServerErrorException('Image upload failed - no result returned')
            );
          }

          resolve(result);
        },
      );

      // Handle stream errors
      upload.on('error', (error) => {
        clearTimeout(uploadTimeout);
        console.error('[Cloudinary] Stream error:', error);
        reject(
          new InternalServerErrorException(
            `Image upload stream error: ${error.message || 'Unknown error'}`
          )
        );
      });

      // Pipe file buffer to upload stream
      try {
        Readable.from(file.buffer).pipe(upload);
      } catch (pipeError) {
        clearTimeout(uploadTimeout);
        console.error('[Cloudinary] Pipe error:', pipeError);
        reject(
          new InternalServerErrorException(
            `Failed to process image file: ${pipeError.message || 'Unknown error'}`
          )
        );
      }
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    return this.cloudinary.uploader.destroy(publicId);
  }
}
