import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

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
  sentVia: 'gmail' | 'brevo'; // Shows which service was used
}

/**
 * Email Service
 * 
 * Automatically routes emails to either Gmail or Brevo based on user's branding domain:
 * - If user has brandingDomain set → uses Brevo (from that domain)
 * - If user has no brandingDomain → uses Gmail (from their Gmail address)
 */
class EmailServiceClass {
  /**
   * Send email via user's configured email service
   * 
   * Automatically routes to Gmail or Brevo based on brandingDomain
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Not authenticated. Please log in.');
    }

    try {
      const response = await axios.post<SendEmailResponse>(
        `${API_URL}/email/send`,
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
        throw new Error(error.response?.data?.message || 'Email permission not granted.');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to send email');
    }
  }
}

export const EmailService = new EmailServiceClass();
