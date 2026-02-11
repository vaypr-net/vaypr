import axios from '../axios';

interface Client {
  _id: string;
  clientType: 'individual' | 'company';
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateClientDto {
  clientType: 'individual' | 'company';
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  notes?: string;
}

interface UpdateClientDto extends Partial<CreateClientDto> {}

interface BulkImportClientsRequest {
  clients: Array<CreateClientDto & { rowNumber?: number }>;
}

export interface BulkImportClientsResponse {
  total: number;
  imported: number;
  failed: number;
  failures: Array<{
    rowNumber: number;
    email: string;
    reason: string;
  }>;
}

export const ClientService = {
  async getAll(includeStats: boolean = false): Promise<Client[]> {
    const params = includeStats ? { includeStats: 'true' } : {};
    const response = await axios.get<Client[]>('/clients', { params });
    return response.data;
  },

  async getById(id: string): Promise<Client> {
    const response = await axios.get<Client>(`/clients/${id}`);
    return response.data;
  },

  async create(data: CreateClientDto): Promise<Client> {
    const response = await axios.post<Client>('/clients', data);
    return response.data;
  },

  async bulkImport(data: BulkImportClientsRequest): Promise<BulkImportClientsResponse> {
    const response = await axios.post<BulkImportClientsResponse>('/clients/bulk-import', data);
    return response.data;
  },

  async update(id: string, data: UpdateClientDto): Promise<Client> {
    const response = await axios.patch<Client>(`/clients/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`/clients/${id}`);
  },
};
