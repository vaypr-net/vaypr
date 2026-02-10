import axios from '../axios';

export interface ActivityItem {
  _id: string;
  type: string;
  title: string;
  description: string;
  relatedEntityId?: string;
  createdAt: string;
}

export interface ActivityResponse {
  data: ActivityItem[];
  total: number;
}

class ActivityService {
  async getActivities(limit: number = 10, skip: number = 0): Promise<ActivityResponse> {
    const response = await axios.get(`/activities?limit=${limit}&skip=${skip}`);
    return response.data;
  }
}

export default new ActivityService();
