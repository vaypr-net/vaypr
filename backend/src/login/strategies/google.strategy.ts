import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth 2.0 Strategy
 * 
 * This strategy handles the OAuth flow with Google.
 * Requests scopes: openid, email, profile, gmail.send
 * 
 * CRITICAL SETTINGS:
 * - access_type: 'offline' - Required to receive refresh_token
 * - prompt: 'consent' - Forces consent screen to always show (ensures refresh_token is returned)
 * 
 * REFRESH TOKEN BEHAVIOR:
 * - Google only returns refresh_token on FIRST consent or when prompt=consent
 * - If user already granted permission, refresh_token may be null
 * - We only update refresh_token in DB when it's present (never overwrite with null)
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: [
        'openid', 
        'email', 
        'profile',
        'https://www.googleapis.com/auth/gmail.send', // Gmail API: Send emails as the user
      ],
      accessType: 'offline', // CRITICAL: Required to get refresh_token (camelCase)
      prompt: 'consent', // CRITICAL: Force consent screen to always return refresh_token
    } as any); // Type assertion needed for non-standard OAuth options
  }

  /**
   * Validates the Google OAuth response
   * 
   * IMPORTANT: This method receives accessToken and refreshToken from Google
   * - accessToken: Short-lived (1 hour) - used for API calls
   * - refreshToken: Long-lived - used to get new accessTokens (only returned on consent)
   * 
   * Returns user profile data + tokens to be used in the callback route
   * This does NOT create the user - that happens in the LoginService
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // Extract user profile data
    const { id, name, emails, photos } = profile;

    const user = {
      googleId: id,
      email: emails[0].value,
      fullName: `${name.givenName} ${name.familyName}`,
      profilePicture: photos[0]?.value,
      // CRITICAL: Pass tokens to LoginService for storage
      accessToken: accessToken,
      refreshToken: refreshToken, // May be null if user already granted permission before
      // Calculate token expiry (Google access tokens last 1 hour)
      tokenExpiry: new Date(Date.now() + 3600 * 1000), // Current time + 1 hour
    };

    // Pass user data + tokens to the callback route
    done(null, user);
  }
}
