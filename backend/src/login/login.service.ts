import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateLoginDto } from './dto/create-login.dto';
import { UserService } from '../user/user.service';
import { SessionService } from '../user/session.service';
import { Request } from 'express';

interface GoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  accessToken?: string; // Google OAuth access token
  refreshToken?: string; // Google OAuth refresh token (may be null)
  tokenExpiry?: Date; // When access token expires
}

@Injectable()
export class LoginService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async login(createLoginDto: CreateLoginDto, req?: Request) {
    const user = await this.userService.findByEmail(createLoginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(createLoginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // DEBUG: Confirm isSuperAdmin is in the user object
    console.log('🔐 LOGIN SERVICE DEBUG:', {
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      isSuperAdminType: typeof user.isSuperAdmin,
      userKeys: Object.keys(user),
      fullUser: JSON.stringify(user, null, 2),
    });

    // If user has 2FA enabled, return a short-lived temp token requiring TOTP verification
    if (user.twoFactorEnabled) {
      const tempPayload = {
        sub: user._id,
        email: user.email,
        twoFactor: true,
      };
      const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });
      return { two_factor_required: true, temp_token: tempToken };
    }

    // Generate JWT token with isSuperAdmin flag for performance
    const payload = {
      sub: user._id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
    };
    const token = this.jwtService.sign(payload);

    // Create session if req is provided
    if (req) {
      await this.sessionService.createSession(
        user._id,
        req.headers['user-agent'] || 'unknown',
        req.ip || req.connection?.remoteAddress || 'unknown',
        token,
      );
    }

    return {
      access_token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin || false,
      },
    };
  }

  /**
   * Google OAuth Login/Signup Handler
   * 
   * CRITICAL LOGIC:
   * 1. Check if user exists by email (email is source of truth)
   * 2. If exists:
   *    - If googleId is null: LINK Google account to existing user
   *    - If googleId exists: Normal Google login
   *    - Update Google tokens (access token always, refresh token only if present)
   * 3. If doesn't exist:
   *    - CREATE new user with Google data
   *    - password = null, authProvider = 'google', emailVerified = true
   *    - Store Google tokens
   * 
   * This ensures:
   * - No duplicate accounts for same email
   * - Existing users can link Google account
   * - New Google users are auto-verified
   * - Google tokens are stored for Gmail API access
   */
  async validateGoogleUser(googleUser: GoogleUser) {
    // Find user by email (source of truth)
    let user = await this.userService.findByEmail(googleUser.email);

    if (user) {
      // User exists - check if we need to link Google account
      if (!user.googleId) {
        // LINK Google account to existing manual signup user
        user = await this.userService.linkGoogleAccount(
          user._id.toString(),
          googleUser.googleId,
          googleUser.profilePicture,
        );
      }
      // User exists (either already linked or just linked)
      // Update Google tokens for Gmail API access
      if (googleUser.accessToken && googleUser.tokenExpiry) {
        user = await this.userService.updateGoogleTokens(
          user._id.toString(),
          googleUser.accessToken,
          googleUser.tokenExpiry,
          googleUser.refreshToken, // Only updates if present
        );
      }
    } else {
      // User doesn't exist - CREATE new Google user
      user = await this.userService.createGoogleUser({
        email: googleUser.email,
        fullName: googleUser.fullName,
        googleId: googleUser.googleId,
        profilePicture: googleUser.profilePicture,
      });

      // Store Google tokens for Gmail API access
      if (googleUser.accessToken && googleUser.tokenExpiry) {
        user = await this.userService.updateGoogleTokens(
          user._id.toString(),
          googleUser.accessToken,
          googleUser.tokenExpiry,
          googleUser.refreshToken, // Only updates if present
        );
      }
    }

    // Issue JWT token with isSuperAdmin flag for performance (same as manual login)
    // If user has 2FA enabled, return a short-lived temp token requiring TOTP verification
    if ((user as any).twoFactorEnabled) {
      const tempPayload = {
        sub: user._id,
        email: user.email,
        twoFactor: true,
      };
      const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });
      return { two_factor_required: true, temp_token: tempToken };
    }

    const payload = {
      sub: user._id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
    };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        isSuperAdmin: user.isSuperAdmin || false,
      },
    };
  }

  /**
   * Revoke Google OAuth tokens
   * 
   * Calls Google's revoke endpoint to invalidate all tokens for a user
   * This forces Google to return a NEW refresh_token on next login
   * 
   * @param email - User email to revoke tokens for
   */
  async revokeGoogleTokens(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    if (!user.googleAccessToken) {
      throw new Error(`User ${email} has no Google access token`);
    }

    try {
      // Call Google's revoke endpoint
      const response = await fetch(
        `https://oauth2.googleapis.com/revoke?token=${user.googleAccessToken}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error(`Google revoke failed: ${response.statusText}`);
      }

      // Clear tokens from database
      await this.userService.clearGoogleTokens(user._id.toString());

      return {
        success: true,
        message: `Google tokens revoked for ${email}. Next login will request fresh tokens including refresh_token.`,
      };
    } catch (error) {
      throw new Error(`Failed to revoke Google tokens: ${error.message}`);
    }
  }
}
