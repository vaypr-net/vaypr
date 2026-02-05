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
    console.log('🎫 Fetching tickets:', params);
    const response = await axios.get<PaginatedResponse<Ticket>>(BASE_URL, { params });
    console.log('✅ Tickets response:', response.data);
    return response.data;
  },

  async getTicketById(id: string): Promise<Ticket> {
    console.log('🎫 Fetching ticket:', id);
    const response = await axios.get<Ticket>(`${BASE_URL}/${id}`);
    console.log('✅ Ticket response:', response.data);
    return response.data;
  },

  async createTicket(data: CreateTicketDto): Promise<Ticket> {
    console.log('🎫 Creating ticket:', data);
    const response = await axios.post<Ticket>(BASE_URL, data);
    console.log('✅ Ticket created:', response.data);
    return response.data;
  },

  async updateTicket(id: string, data: UpdateTicketDto): Promise<Ticket> {
    console.log('🎫 Updating ticket:', id, data);
    const response = await axios.patch<Ticket>(`${BASE_URL}/${id}`, data);
    console.log('✅ Ticket updated:', response.data);
    return response.data;
  },

  async updateTicketStatus(
    id: string,
    status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed',
  ): Promise<Ticket> {
    console.log('🎫 Updating ticket status:', id, status);
    const response = await axios.patch<Ticket>(`${BASE_URL}/${id}/status`, { status });
    console.log('✅ Status updated:', response.data);
    return response.data;
  },

  async addMessage(id: string, message: string, author: string): Promise<Ticket> {
    console.log('🎫 Adding message to ticket:', id);
    const response = await axios.post<Ticket>(`${BASE_URL}/${id}/messages`, {
      message,
      author,
    });
    console.log('✅ Message added:', response.data);
    return response.data;
  },

  async deleteTicket(id: string): Promise<void> {
    console.log('🎫 Deleting ticket:', id);
    await axios.delete(`${BASE_URL}/${id}`);
    console.log('✅ Ticket deleted');
  },

  // ========== STATS ==========

  async getStats(): Promise<TicketStats> {
    console.log('🎫 Fetching ticket stats');
    const response = await axios.get<TicketStats>(`${BASE_URL}/stats`);
    console.log('✅ Stats response:', response.data);
    return response.data;
  },
};
