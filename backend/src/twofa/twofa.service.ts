import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { encryptText, decryptText } from '../common/crypto/crypto.util';

@Injectable()
export class TwofaService {
  constructor(private readonly config: ConfigService) {}

  private getEncryptionKey(): string {
    const key = this.config.get<string>('TWOFA_ENCRYPTION_KEY');
    if (!key) {
      throw new InternalServerErrorException('TWOFA_ENCRYPTION_KEY is not configured');
    }
    return key;
  }

  generateSecretForUser(email: string) {
    const secret = speakeasy.generateSecret({ length: 20, name: `VAYPR (${email})` });
    return secret; // has base32 and otpauth_url
  }

  async qrDataUrlFromOtpUrl(otpauthUrl: string) {
    try {
      return await qrcode.toDataURL(otpauthUrl);
    } catch (err) {
      throw new InternalServerErrorException('Failed to generate QR code');
    }
  }

  encryptSecret(base32Secret: string) {
    const key = this.getEncryptionKey();
    return encryptText(base32Secret, key);
  }

  decryptSecret(encrypted: string) {
    const key = this.getEncryptionKey();
    return decryptText(encrypted, key);
  }

  verifyTokenWithSecret(base32Secret: string, token: string) {
    if (!base32Secret) return false;
    return speakeasy.totp.verify({
      secret: base32Secret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }
}

export default TwofaService;
