import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateLoginDto } from './dto/create-login.dto';
import { UserService } from '../user/user.service';
import { SessionService } from '../user/session.service';
import { Request } from 'express';
import { SuperadminSettingsService } from '../superadmin-settings/superadmin-settings.service';
import { BrevoService } from '../brevo/brevo.service';

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
    private readonly configService: ConfigService,
    private readonly superadminSettingsService: SuperadminSettingsService,
    private readonly brevoService: BrevoService,
  ) {}

  private getFrontendUrl(): string {
    const raw = this.configService.get<string>('FRONTEND_URL') ?? '';
    const firstUrl = raw.split(',')[0]?.trim();
    return (firstUrl || 'http://localhost:8080').replace(/\/+$/, '');
  }

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
        type: '2fa_pending',
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
        type: '2fa_pending',
      };
      const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });
      return { requires2fa: true, tempToken: tempToken };
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(email.toLowerCase().trim());

    if (!user) {
      throw new BadRequestException('No account found with that email address. Please check and try again.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresMinutes = Number(this.configService.get<string>('PASSWORD_RESET_EXPIRES_MINUTES') || '15');
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await this.userService.setPasswordResetToken(user._id.toString(), tokenHash, expiresAt);

    const resetUrl = `${this.getFrontendUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2>Password Reset Request</h2>
        <p>Hello ${user.fullName || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to continue:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>This link expires in ${expiresMinutes} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `;

    try {
      const supportEmail = await this.superadminSettingsService.getSystemSupportEmail();
      console.log(`[ForgotPassword] Sending reset email from: ${supportEmail} to: ${user.email}`);

      await this.brevoService.sendEmail(
        supportEmail,
        user.email,
        'Reset your password',
        htmlBody,
        undefined,
        undefined,
        {
          replyTo: supportEmail,
          senderName: 'Support Team',
        },
      );
      console.log(`[ForgotPassword] ✅ Email sent successfully to ${user.email}`);
    } catch (error) {
      console.error(`[ForgotPassword] ❌ DETAILED ERROR:`, {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        response: error?.response?.data || error?.response,
        fullError: JSON.stringify(error, null, 2),
      });
      await this.userService.clearPasswordResetToken(user._id.toString());
      throw new BadRequestException('Unable to send password reset email. Please try again.');
    }

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const didReset = await this.userService.resetPasswordWithToken(tokenHash, newPassword);

    if (!didReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return { message: 'Password reset successful. You can now sign in with your new password.' };
  }

  /**
   * Bootstrap / override the super admin account.
   *
   * Protected by SUPER_ADMIN_SETUP_SECRET env var — never by JWT.
   * Safe to call multiple times: always upserts the target user and
   * removes isSuperAdmin from every other account.
   */
  async setupSuperAdmin(
    setupSecret: string,
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ message: string; email: string }> {
    const expected = this.configService.get<string>('SUPER_ADMIN_SETUP_SECRET');
    if (!expected || setupSecret !== expected) {
      throw new BadRequestException('Invalid setup secret');
    }

    const normalised = email.toLowerCase().trim();
    const hashed = await (await import('bcrypt')).hash(password, 10);

    // Clear isSuperAdmin from any previous super admin (except the target email)
    await this.userService.clearAllSuperAdmins(normalised);

    // Upsert the target user
    const user = await this.userService.upsertSuperAdmin(normalised, fullName, hashed);

    return {
      message: `Super admin account ready. You can now log in at /auth/login.`,
      email: user.email,
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
