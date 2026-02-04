import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 * 
 * CRITICAL: This guard MUST pass scopes at runtime
 * Passport only respects scopes passed via the guard constructor
 * 
 * Scopes requested:
 * - openid: User authentication
 * - email: User's email address
 * - profile: User's name and photo
 * - gmail.send: Send emails from user's Gmail account
 * 
 * OAuth settings:
 * - accessType: 'offline' - Required to get refresh_token
 * - prompt: 'consent' - Forces consent screen to ensure refresh_token is returned
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor() {
    super({
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.send',
      ],
      accessType: 'offline',
      prompt: 'consent select_account',  // Force consent + account selection
      approvalPrompt: 'force',             // Legacy parameter for older OAuth
    });
  }
}
