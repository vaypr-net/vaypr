import axios from 'axios';

const API_URL = 'http://localhost:8081';

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  attachmentData?: string; // Base64 encoded PDF
  attachmentFilename?: string; // e.g., "Invoice_480.pdf"
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export interface GmailStatusResponse {
  hasPermission: boolean;
  message: string;
}

/**
 * GmailService
 * 
 * Handles email sending via Gmail API
 * Emails are sent from the authenticated user's Gmail account
 */
class GmailServiceClass {
  /**
   * Send email from user's Gmail account
   * 
   * User must have granted Gmail permission during Google login
   * Email will be sent from their actual Gmail address
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Not authenticated. Please log in.');
    }

    try {
      const response = await axios.post<SendEmailResponse>(
        `${API_URL}/gmail/send`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(error.response.data.message || 'Gmail permission not granted. Please log in with Google.');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to send email');
    }
  }

  /**
   * Check if user has granted Gmail permission
   */
  async checkGmailStatus(): Promise<GmailStatusResponse> {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      return {
        hasPermission: false,
        message: 'Not authenticated',
      };
    }

    try {
      const response = await axios.get<GmailStatusResponse>(
        `${API_URL}/gmail/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      return {
        hasPermission: false,
        message: 'Failed to check Gmail status',
      };
    }
  }
}

export const GmailService = new GmailServiceClass();
