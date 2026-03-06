import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BrevoCheckStatus = 'PENDING' | 'OK' | 'FAIL' | 'MISSING';
export type BrevoStatus = 'NOT_STARTED' | 'DNS_PENDING' | 'VERIFIED' | 'FAILED';
export type DNSRecordType = 'TXT' | 'CNAME';
export type DNSPurpose = 'BREVO_CODE' | 'DKIM' | 'DMARC' | 'SPF';

@Schema({ _id: false })
export class DNSRecord {
  @Prop({ type: String, enum: ['TXT', 'CNAME'], required: true })
  type: DNSRecordType;

  @Prop({ required: true })
  host: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: false })
  ttl?: string;

  @Prop({ type: String, enum: ['BREVO_CODE', 'DKIM', 'DMARC', 'SPF'], required: true })
  purpose: DNSPurpose;
}

@Schema({ _id: false })
export class DomainChecks {
  @Prop({ type: String, enum: ['PENDING', 'OK', 'FAIL'], default: 'PENDING' })
  brevo_code: BrevoCheckStatus;

  @Prop({ type: String, enum: ['PENDING', 'OK', 'FAIL'], default: 'PENDING' })
  dkim: BrevoCheckStatus;

  @Prop({ type: String, enum: ['PENDING', 'OK', 'FAIL', 'MISSING'], default: 'MISSING' })
  dmarc: BrevoCheckStatus;

  @Prop({ type: String, enum: ['PENDING', 'OK', 'FAIL', 'MISSING'], default: 'MISSING' })
  spf: BrevoCheckStatus;
}

@Schema({ timestamps: true })
export class BrevoDomain extends Document {
  @Prop({ required: true, unique: true, lowercase: true })
  domain: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId: Types.ObjectId; // User who owns this domain

  @Prop({ type: String, enum: ['NOT_STARTED', 'DNS_PENDING', 'VERIFIED', 'FAILED'], default: 'NOT_STARTED' })
  status: BrevoStatus;

  @Prop({ type: DomainChecks, default: () => ({ brevo_code: 'PENDING', dkim: 'PENDING', dmarc: 'MISSING', spf: 'MISSING' }) })
  checks: DomainChecks;

  @Prop({ type: [DNSRecord], default: [] })
  dnsRecords: DNSRecord[];

  @Prop({ type: Date, default: null })
  lastCheckedAt: Date | null;

  @Prop({ type: String, default: null })
  errorMessage: string | null;
}

export const BrevoSchema = SchemaFactory.createForClass(BrevoDomain);
