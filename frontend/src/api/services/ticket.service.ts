import axios from '../axios';

// ==================== TYPES ====================

export interface Ticket {
  _id: string;
  subject: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  description: string;
  assignedTo: string;
  resolvedAt?: string;
  closedAt?: string;
  messages: Array<{
    message: string;
    author: string;
    timestamp: string;
  }>;
  internalNotes?: Array<{
    note: string;
    author: string;
    timestamp: string;
    scope?: 'admin' | 'user';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface TicketStats {
  open: number;
  pending: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

// ==================== DTOs ====================

export interface CreateTicketDto {
  subject: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  priority: string;
  category: string;
  description: string;
  assignedTo?: string;
}

export interface UpdateTicketDto extends Partial<CreateTicketDto> {}

// ==================== SERVICE ====================

const BASE_URL = '/super-admin/tickets';
const USER_BASE_URL = '/tickets';

export const TicketService = {
  // ========== TICKET CRUD ==========

  async getTickets(
    search?: string,
    status?: string,
    priority?: string,
    category?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PaginatedResponse<Ticket>> {
    const params = { search, status, priority, category, limit, offset };
    const response = await axios.get<PaginatedResponse<Ticket>>(BASE_URL, { params });
    return response.data;
  },

  async getTicketById(id: string): Promise<Ticket> {
    const response = await axios.get<Ticket>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createTicket(data: CreateTicketDto): Promise<Ticket> {
    const response = await axios.post<Ticket>(BASE_URL, data);
    return response.data;
  },

  async updateTicket(id: string, data: UpdateTicketDto): Promise<Ticket> {
    const response = await axios.patch<Ticket>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async updateTicketStatus(
    id: string,
    status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed',
  ): Promise<Ticket> {
    const response = await axios.patch<Ticket>(`${BASE_URL}/${id}/status`, { status });
    return response.data;
  },

  async addMessage(id: string, message: string, author: string): Promise<Ticket> {
    const response = await axios.post<Ticket>(`${BASE_URL}/${id}/messages`, {
      message,
      author,
    });
    return response.data;
  },

  async deleteTicket(id: string): Promise<void> {
    await axios.delete(`${BASE_URL}/${id}`);
  },

  // ========== STATS ==========

  async getStats(): Promise<TicketStats> {
    const response = await axios.get<TicketStats>(`${BASE_URL}/stats`);
    return response.data;
  },

  // ========== USER TICKETS ==========

  async getMyTickets(
    search?: string,
    status?: string,
    priority?: string,
    category?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PaginatedResponse<Ticket>> {
    const params = { search, status, priority, category, limit, offset };
    const response = await axios.get<PaginatedResponse<Ticket>>(USER_BASE_URL, { params });
    return response.data;
  },

  async getMyTicketStats(): Promise<TicketStats> {
    const response = await axios.get<TicketStats>(`${USER_BASE_URL}/stats`);
    return response.data;
  },

  async createMyTicket(data: Omit<CreateTicketDto, 'customerId'>): Promise<Ticket> {
    const response = await axios.post<Ticket>(USER_BASE_URL, data);
    return response.data;
  },

  async addMyTicketMessage(id: string, message: string): Promise<Ticket> {
    const response = await axios.post<Ticket>(`${USER_BASE_URL}/${id}/messages`, { message });
    return response.data;
  },

  async updateMyTicket(
    id: string,
    data: {
      status?: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
      priority?: string;
      assignedTo?: string;
    },
  ): Promise<Ticket> {
    const response = await axios.patch<Ticket>(`${USER_BASE_URL}/${id}`, data);
    return response.data;
  },

  async addMyTicketInternalNote(id: string, note: string): Promise<Ticket> {
    const response = await axios.post<Ticket>(`${USER_BASE_URL}/${id}/internal-notes`, { note });
    return response.data;
  },
};
