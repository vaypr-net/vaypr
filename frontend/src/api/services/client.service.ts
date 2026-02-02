import axios from '../axios';

interface Client {
  _id: string;
  type: 'individual' | 'company';
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  createdAt: string;
  totalBilled: number;
  totalPaid: number;
}

interface CreateClientDto {
  type: 'individual' | 'company';
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
}

interface UpdateClientDto extends Partial<CreateClientDto> {}

export const ClientService = {
  async getAll(): Promise<Client[]> {
    const response = await axios.get<Client[]>('/clients');
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

  async update(id: string, data: UpdateClientDto): Promise<Client> {
    const response = await axios.patch<Client>(`/clients/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(`/clients/${id}`);
    return response.data;
  },

  async bulkImport(data: CreateClientDto[]): Promise<{ imported: number; failed: number }> {
    const response = await axios.post<{ imported: number; failed: number }>('/clients/bulk-import', { clients: data });
    return response.data;
  },
};
