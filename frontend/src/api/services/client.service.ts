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

  async delete(id: string): Promise<void> {
    await axios.delete(`/clients/${id}`);
  },
};
