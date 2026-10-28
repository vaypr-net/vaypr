import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createCipheriv, createDecipheriv } from 'crypto';

// Hesabe's official JavaScript kit uses AES-256-CBC, PKCS7 and hex encoding.
export function encryptHesabe(value: unknown, key: string, iv: string): string {
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv));
  return Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]).toString('hex');
}

export function decryptHesabe(value: string, key: string, iv: string): any {
  if (!/^(?:[a-fA-F0-9]{32})+$/.test(value) || value.length > 131072) {
    throw new BadGatewayException('Invalid Hesabe response');
  }
  try {
    // The PHP kit can pad to 32 bytes. Accept either official kit's padding.
    const decipher = createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv));
    decipher.setAutoPadding(false);
    const bytes = Buffer.concat([decipher.update(Buffer.from(value, 'hex')), decipher.final()]);
    const pad = bytes[bytes.length - 1];
    if (pad < 1 || pad > 32 || !bytes.subarray(-pad).every(byte => byte === pad)) throw new Error('padding');
    return JSON.parse(bytes.subarray(0, -pad).toString('utf8'));
  } catch {
    throw new BadGatewayException('Unable to decode Hesabe response');
  }
}

@Injectable()
export class HesabeGateway {
  readonly baseUrl = 'https://sandbox.hesabe.com';
  constructor(private readonly config: ConfigService) {}

  settings() {
    const frontend = this.config.get<string>('FRONTEND_URL') || '';
    const api = this.config.get<string>('HESABE_CALLBACK_BASE_URL') || '';
    const staging = frontend === 'https://staging.vaypr.net' && api === 'https://api-staging.vaypr.net';
    const live = frontend === 'https://vaypr.net' && api === 'https://api.vaypr.net' &&
      this.config.get('HESABE_SANDBOX_ON_LIVE_SITE') === 'true';
    // Live-domain sandbox use is an explicit deployment choice. The payment
    // provider remains the sandbox and test transactions stay outside revenue.
    if (this.config.get('PAYMENT_PROVIDER') !== 'hesabe' ||
        this.config.get('HESABE_ENVIRONMENT') !== 'sandbox' ||
        (!staging && !live)) {
      throw new ServiceUnavailableException('Hesabe sandbox deployment is not configured for this site');
    }
    const merchantCode = this.config.get<string>('HESABE_MERCHANT_CODE') || '';
    const accessCode = this.config.get<string>('HESABE_ACCESS_CODE') || '';
    const key = this.config.get<string>('HESABE_SECRET_KEY') || '';
    const iv = this.config.get<string>('HESABE_IV_KEY') || '';
    if (!merchantCode || !accessCode || Buffer.byteLength(key) !== 32 || Buffer.byteLength(iv) !== 16) {
      throw new ServiceUnavailableException('Hesabe sandbox credentials are not configured');
    }
    return { frontend, api, merchantCode, accessCode, key, iv, database: live ? 'vaypr' : 'vaypr_staging' };
  }

  decode(raw: any) {
    const { key, iv } = this.settings();
    if (typeof raw === 'string') {
      const value = raw.trim().replace(/^"|"$/g, '');
      if (/^[a-fA-F0-9]+$/.test(value)) return decryptHesabe(value, key, iv);
      try { return JSON.parse(raw); } catch { throw new BadGatewayException('Invalid Hesabe response'); }
    }
    return raw;
  }

  async checkout(request: Record<string, unknown>): Promise<{ paymentToken: string; redirectData: string }> {
    const { key, iv, accessCode, merchantCode } = this.settings();
    try {
      const result = await axios.post(`${this.baseUrl}/checkout`,
        new URLSearchParams({ data: encryptHesabe({ ...request, merchantCode }, key, iv) }).toString(),
        { timeout: 20000, maxRedirects: 0, headers: { accessCode, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' } });
      const body = this.decode(result.data);
      const paymentToken = body?.token;
      const redirectData = body?.response?.data;
      // The current sandbox returns two distinct values: a transaction token for
      // enquiry and a longer opaque encrypted payload for the payment redirect.
      if (body?.status !== true || typeof paymentToken !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(paymentToken) ||
          typeof redirectData !== 'string' || !/^[a-fA-F0-9]{32,16384}$/.test(redirectData)) {
        throw new BadGatewayException('Hesabe could not start checkout');
      }
      return { paymentToken, redirectData };
    } catch {
      // Never log Axios errors: they include headers and the merchant access code.
      throw new BadGatewayException('Hesabe sandbox checkout is unavailable. Please try again.');
    }
  }

  async enquire(token: string) {
    const { accessCode } = this.settings();
    if (!/^[a-zA-Z0-9_-]{8,128}$/.test(token)) throw new BadGatewayException('Invalid payment token');
    try {
      const result = await axios.get(`${this.baseUrl}/api/transaction/${encodeURIComponent(token)}`,
        { timeout: 15000, maxRedirects: 0, headers: { accessCode, Accept: 'application/json' } });
      return this.decode(result.data);
    } catch {
      throw new BadGatewayException('Payment confirmation is temporarily unavailable. Please check again.');
    }
  }
}
