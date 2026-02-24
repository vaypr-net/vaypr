import api from '@/api/axios';

export const notificationService = {
  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },
  async markAsRead(id: string) {
    const res = await api.post(`/notifications/${id}/read`);
    return res.data;
  }
};
