import axios from '../axios';

interface Expense {
  _id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  vendor?: string;
  receipt?: string;
  notes?: string;
  createdAt: string;
}

interface CreateExpenseDto {
  category: string;
  description: string;
  amount: number;
  currency?: string;
  date: string;
  vendor?: string;
  notes?: string;
}

interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  byCategory: {
    category: string;
    amount: number;
    count: number;
  }[];
}

interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
}

export const ExpenseService = {
  async getAll(filters?: ExpenseFilters): Promise<Expense[]> {
    const response = await axios.get<Expense[]>('/expense', { params: filters });
    return response.data;
  },

  async getById(id: string): Promise<Expense> {
    const response = await axios.get<Expense>(`/expense/${id}`);
    return response.data;
  },

  async create(data: CreateExpenseDto, receipt?: File): Promise<Expense> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    if (receipt) {
      formData.append('receipt', receipt);
    }

    const response = await axios.post<Expense>('/expense', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: string, data: UpdateExpenseDto, receipt?: File): Promise<Expense> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    if (receipt) {
      formData.append('receipt', receipt);
    }

    const response = await axios.patch<Expense>(`/expense/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(`/expense/${id}`);
    return response.data;
  },

  async getStats(filters?: { startDate?: string; endDate?: string }): Promise<ExpenseStats> {
    const response = await axios.get<ExpenseStats>('/expense/stats', { params: filters });
    return response.data;
  },
};
