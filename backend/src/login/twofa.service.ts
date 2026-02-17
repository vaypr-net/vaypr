import { Injectable, BadRequestException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFAService {
  generateSecret(email: string) {
    const secret = speakeasy.generateSecret({ length: 20, name: `VAYPR (${email})` });
    return secret; // contains ascii, hex, base32, otpauth_url
  }

  async generateQRCodeDataURL(otpauthUrl: string) {
    try {
      return await qrcode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  verifyToken(secret: string, token: string) {
    if (!secret) return false;
    return speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  }
}

export default TwoFAService;
