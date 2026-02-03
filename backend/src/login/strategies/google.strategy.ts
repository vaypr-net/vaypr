import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth 2.0 Strategy
 * 
 * This strategy handles the OAuth flow with Google.
 * Only requests minimal scopes: openid, email, profile
 * Does NOT request Gmail API access or other Google services
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['openid', 'email', 'profile'], // ONLY auth scopes, no Gmail
    });
  }

  /**
   * Validates the Google OAuth response
   * 
   * Returns user profile data to be used in the callback route
   * This does NOT create the user - that happens in the LoginService
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // Extract only the data we need for authentication
    const { id, name, emails, photos } = profile;

    const user = {
      googleId: id,
      email: emails[0].value,
      fullName: `${name.givenName} ${name.familyName}`,
      profilePicture: photos[0]?.value,
    };

    // Pass user data to the callback route
    // Note: We do NOT store Google tokens (not needed for auth-only)
    done(null, user);
  }
}
