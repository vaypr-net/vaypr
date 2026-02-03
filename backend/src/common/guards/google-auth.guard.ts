import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 * 
 * Initiates Google OAuth flow when applied to a route
 * Redirects user to Google's login page
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
