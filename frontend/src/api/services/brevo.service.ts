import axios from '../axios';

export interface DnsRecord {
  type: 'TXT' | 'CNAME';
  host: string;
  value: string;
  ttl?: string;
  purpose: 'BREVO_CODE' | 'DKIM' | 'DMARC' | 'SPF';
}

export interface DomainChecks {
  brevo_code: 'PENDING' | 'OK' | 'FAIL';
  dkim: 'PENDING' | 'OK' | 'FAIL';
  dmarc: 'MISSING' | 'OK' | 'FAIL';
}

export interface BrevoD {
  _id?: string;
  id?: string;
  domain: string;
  status: 'NOT_STARTED' | 'DNS_PENDING' | 'VERIFIED' | 'FAILED';
  checks: DomainChecks;
  dnsRecords: DnsRecord[];
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  errorMessage?: string | null;
}

class BrevoDomainService {
  // Get all domains
  async getDomains(): Promise<BrevoD[]> {
    try {
      const response = await axios.get('/api/superadmin/brevo/domains');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Brevo domains:', error);
      throw error;
    }
  }

  // Get single domain with DNS records
  async getDomain(id: string): Promise<BrevoD> {
    try {
      const response = await axios.get(`/api/superadmin/brevo/domains/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch domain ${id}:`, error);
      throw error;
    }
  }

  // Add new domain
  async createDomain(domain: string): Promise<BrevoD> {
    try {
      const response = await axios.post('/api/superadmin/brevo/domains', {
        domain: domain.toLowerCase().trim(),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create domain:', error);
      throw error;
    }
  }

  // Verify domain DNS records
  async verifyDomain(id: string): Promise<BrevoD> {
    try {
      const response = await axios.post(`/api/superadmin/brevo/domains/${id}/verify`);
      return response.data;
    } catch (error) {
      console.error(`Failed to verify domain ${id}:`, error);
      throw error;
    }
  }

  // Delete domain
  async deleteDomain(id: string): Promise<void> {
    try {
      await axios.delete(`/api/superadmin/brevo/domains/${id}`);
    } catch (error) {
      console.error(`Failed to delete domain ${id}:`, error);
      throw error;
    }
  }
}

export const BrevoService = new BrevoDomainService();
