import axios from '../axios';

export interface AuditLogItem {
  id: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const BASE_URL = '/super-admin/audit-logs';

export const AuditLogService = {
  async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLogsResponse> {
    const response = await axios.get<AuditLogsResponse>(BASE_URL, {
      params: { limit, offset },
    });
    return response.data;
  },
};
