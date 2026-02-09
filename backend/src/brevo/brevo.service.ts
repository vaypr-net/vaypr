import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as dns from 'dns';
import { promisify } from 'util';
import { BrevoDomain, DNSRecord, DomainChecks } from './entities/brevo.entity';
import { CreateBrevoDomainDto } from './dto/create-brevo-domain.dto';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

@Injectable()
export class BrevoService {
  private brevoApiUrl: string;
  private brevoApiKey: string;

  constructor(
    @InjectModel(BrevoDomain.name) private brevioDomainModel: Model<BrevoDomain>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.brevoApiUrl = 'https://api.brevo.com/v3';
    this.brevoApiKey = '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';
    
    console.log('[Brevo] API Key configured:', this.brevoApiKey ? 'YES' : 'NO');
  }

  /**
   * Get all domains
   */
  async getAllDomains(): Promise<BrevoDomain[]> {
    return this.brevioDomainModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Get single domain by ID
   */
  async getDomainById(id: string): Promise<BrevoDomain> {
    const domain = await this.brevioDomainModel.findById(id).exec();
    if (!domain) {
      throw new NotFoundException(`Domain with ID ${id} not found`);
    }
    return domain;
  }

  /**
   * Create new domain via Brevo API
   */
  async createDomain(createDto: CreateBrevoDomainDto): Promise<BrevoDomain> {
    const { domain } = createDto;

    // Validate Brevo API key is set
    if (!this.brevoApiKey) {
      throw new InternalServerErrorException('Brevo API key is not configured in environment variables');
    }

    // Validate domain format
    if (domain.includes('http://') || domain.includes('https://')) {
      throw new BadRequestException('Domain must not include protocol');
    }
    if (domain.includes('/')) {
      throw new BadRequestException('Domain must not include path');
    }
    if (!domain.includes('.')) {
      throw new BadRequestException('Domain must be a valid base domain (e.g., example.com)');
    }

    // Check if domain already exists in our database
    const existing = await this.brevioDomainModel.findOne({ domain: domain.toLowerCase() }).exec();
    if (existing) {
      throw new ConflictException(`Domain ${domain} already exists`);
    }

    try {
      // Call Brevo API to create domain
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.brevoApiUrl}/senders/domains`,
          { name: domain.toLowerCase() },
          {
            headers: {
              'api-key': this.brevoApiKey,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      // Log the Brevo API response to see structure
      console.log('[Brevo] API Response:', JSON.stringify((response as any).data, null, 2));

      // Extract DNS records from Brevo API response
      const dnsRecords = this.mapBrevoDNSRecords((response as any).data, domain);

      // Create domain document in our database
      const newDomain = new this.brevioDomainModel({
        domain: domain.toLowerCase(),
        status: 'DNS_PENDING',
        checks: {
          brevo_code: 'PENDING',
          dkim: 'PENDING',
          dmarc: 'PENDING',
        },
        dnsRecords,
        lastCheckedAt: null,
        errorMessage: null,
      });

      return newDomain.save();
    } catch (error) {
      if (error.response?.status === 409) {
        throw new ConflictException(`Domain ${domain} already exists in Brevo`);
      }
      throw new InternalServerErrorException(
        `Failed to create domain in Brevo: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Map Brevo API DNS records to our format
   */
  private mapBrevoDNSRecords(brevoData: any, domain: string): DNSRecord[] {
    const records: DNSRecord[] = [];

    if (!brevoData.dns_records) {
      console.warn('[Brevo] No dns_records in API response');
      return records;
    }

    const dnsRecords = brevoData.dns_records;

    // Brevo code (TXT record)
    if (dnsRecords.brevo_code) {
      const brevoRecord = dnsRecords.brevo_code;
      records.push({
        type: brevoRecord.type || 'TXT',
        host: brevoRecord.host_name || '@',
        value: brevoRecord.value,
        ttl: '3600',
        purpose: 'BREVO_CODE',
      });
    }

    // DKIM records - Brevo uses dkim1Record, dkim2Record, etc.
    const dkimArray: any[] = [];
    
    // Check for dkim1Record, dkim2Record, dkim3Record, etc.
    for (let i = 1; i <= 10; i++) {
      const key = `dkim${i}Record`;
      if (dnsRecords[key]) {
        dkimArray.push(dnsRecords[key]);
      }
    }
    
    // Also check for old format (dkim_record, dkim_1_record, etc.)
    if (dnsRecords.dkim_record && !dkimArray.length) {
      dkimArray.push(dnsRecords.dkim_record);
    }
    
    if (Array.isArray(dnsRecords.dkim_records)) {
      dkimArray.push(...dnsRecords.dkim_records);
    }

    // Add all DKIM records
    dkimArray.forEach((dkimRecord) => {
      records.push({
        type: dkimRecord.type || 'TXT',
        host: dkimRecord.host_name,
        value: dkimRecord.value,
        ttl: '3600',
        purpose: 'DKIM',
      });
    });

    // DMARC record
    if (dnsRecords.dmarc_record) {
      const dmarcRecord = dnsRecords.dmarc_record;
      records.push({
        type: dmarcRecord.type || 'TXT',
        host: dmarcRecord.host_name || '_dmarc',
        value: dmarcRecord.value,
        ttl: '3600',
        purpose: 'DMARC',
      });
    }

    // SPF record (if available)
    if (dnsRecords.spf_record) {
      const spfRecord = dnsRecords.spf_record;
      records.push({
        type: spfRecord.type || 'TXT',
        host: spfRecord.host_name || domain,
        value: spfRecord.value,
        ttl: '3600',
        purpose: 'SPF',
      });
    }

    console.log(`[Brevo] Mapped ${records.length} DNS records from API`);
    records.forEach((r, i) => console.log(`  [${i + 1}] ${r.purpose} (${r.type}): ${r.host}`));
    
    return records;
  }

  /**
   * Verify domain via Brevo API
   */
  async verifyDomain(id: string): Promise<BrevoDomain> {
    const domain = await this.getDomainById(id);

    try {
      // Call Brevo API to get domain status
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.brevoApiUrl}/senders/domains/${domain.domain}`,
          {
            headers: {
              'api-key': this.brevoApiKey,
            },
          }
        )
      );

      // Update checks based on Brevo API response
      const checks = this.mapBrevoChecks((response as any).data);

      // Determine overall status
      let status: 'VERIFIED' | 'DNS_PENDING' | 'FAILED' = 'DNS_PENDING';
      let errorMessage: string | null = null;

      // Domain is VERIFIED if all critical records are verified in Brevo
      if (checks.brevo_code === 'OK' && checks.dkim === 'OK') {
        status = 'VERIFIED';
      } else if (checks.brevo_code === 'FAIL' || checks.dkim === 'FAIL') {
        status = 'FAILED';
        const failedChecks: string[] = [];
        if (checks.brevo_code === 'FAIL') failedChecks.push('Brevo Code');
        if (checks.dkim === 'FAIL') failedChecks.push('DKIM');
        errorMessage = `Failed to verify: ${failedChecks.join(', ')}. Please check your DNS records in your provider.`;
      }

      // Update domain
      domain.status = status;
      domain.checks = checks;
      domain.lastCheckedAt = new Date();
      domain.errorMessage = errorMessage;

      return domain.save();
    } catch (error) {
      domain.status = 'FAILED';
      domain.lastCheckedAt = new Date();
      domain.errorMessage = `Brevo API error: ${error.response?.data?.message || error.message}`;
      await domain.save();
      throw new BadRequestException(domain.errorMessage);
    }
  }

  /**
   * Map Brevo API response to our check status format
   */
  private mapBrevoChecks(brevoData: any): DomainChecks {
    const checks: DomainChecks = {
      brevo_code: this.mapBrevoStatus(brevoData.dns_records?.brevo_code?.status),
      dkim: this.mapBrevoStatus(brevoData.dns_records?.dkim_record?.status),
      dmarc: this.mapBrevoStatus(brevoData.dns_records?.dmarc_record?.status),
    };

    return checks;
  }

  /**
   * Map Brevo boolean status to our status format
   */
  private mapBrevoStatus(brevoStatus: boolean | undefined): 'OK' | 'FAIL' | 'PENDING' {
    if (brevoStatus === true) {
      return 'OK';
    } else if (brevoStatus === false) {
      return 'FAIL';
    }
    return 'PENDING';
  }

  /**
   * Delete domain
   */
  async deleteDomain(id: string): Promise<void> {
    const result = await this.brevioDomainModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Domain with ID ${id} not found`);
    }
  }
}
