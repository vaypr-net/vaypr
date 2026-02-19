import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM

export function encryptText(plain: string, keyBase64: string): string {
  if (!keyBase64) throw new Error('TWOFA_ENCRYPTION_KEY is not configured');
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) throw new Error('TWOFA_ENCRYPTION_KEY must be 32 bytes (base64)');

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // return iv:tag:ciphertext as base64
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptText(payload: string, keyBase64: string): string {
  if (!keyBase64) throw new Error('TWOFA_ENCRYPTION_KEY is not configured');
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) throw new Error('TWOFA_ENCRYPTION_KEY must be 32 bytes (base64)');

  const parts = payload.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted payload');

  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export default { encryptText, decryptText };
