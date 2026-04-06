import { Controller, Post, Body, Get, UseGuards, Req, Res, Headers } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { LoginService } from './login.service';
import { CreateLoginDto } from './dto/create-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetupSuperAdminDto } from './dto/setup-super-admin.dto';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard';
import type { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly configService: ConfigService,
  ) {}

  private getFrontendUrl(): string {
    const raw = this.configService.get<string>('FRONTEND_URL') ?? '';
    const firstUrl = raw.split(',')[0]?.trim();
    return (firstUrl || 'http://localhost:8080').replace(/\/+$/, '');
  }

  /**
   * Manual login (email/password)
   * Endpoint: POST /auth/login
   */
  @Post('login')
  async login(@Body() createLoginDto: CreateLoginDto, @Req() req: Request) {
    return this.loginService.login(createLoginDto, req);
  }

  /**
   * Bootstrap / override super admin credentials.
   * Endpoint: POST /auth/setup-super-admin
   * Header: X-Setup-Secret (must match SUPER_ADMIN_SETUP_SECRET env var)
   * Body: { email, password, fullName }
   * No JWT needed — protected by secret header.
   */
  @Post('setup-super-admin')
  @ApiHeader({
    name: 'X-Setup-Secret',
    description: 'Setup secret from SUPER_ADMIN_SETUP_SECRET env var',
    required: true,
    schema: { type: 'string', example: '474abf57d71a5e26034208c16d006b0ccf7c2c475b37c697b4e10243ca971dd8' },
  })
  async setupSuperAdmin(
    @Headers('x-setup-secret') setupSecret: string,
    @Body() body: SetupSuperAdminDto,
  ) {
    return this.loginService.setupSuperAdmin(
      setupSecret,
      body.email,
      body.password,
      body.fullName,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.loginService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.loginService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  /**
   * Google OAuth - Initiate
   * Endpoint: GET /auth/google
   * 
   * Redirects user to Google's OAuth consent screen
   * Frontend should redirect to this URL via window.location.href
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // GoogleAuthGuard handles the redirect to Google
    // This method is never actually called
  }

  /**
   * Google OAuth - Callback
   * Endpoint: GET /auth/google/callback
   * 
   * Google redirects here after user authorizes
   * 
   * CRITICAL FLOW:
   * 1. Passport validates Google response
   * 2. GoogleStrategy returns user profile data
   * 3. This method receives validated user in req.user
   * 4. LoginService handles user lookup/creation
   * 5. JWT token is generated
   * 6. User is redirected to frontend with token
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    // req.user contains validated Google user data from GoogleStrategy
    const result = await this.loginService.validateGoogleUser(req.user);

    const frontendUrl = this.getFrontendUrl();

    // Redirect to frontend with JWT token
    // Frontend should extract token from URL and store it
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  /**
   * Revoke Google OAuth tokens
   * Endpoint: GET /auth/google/revoke
   * 
   * TESTING HELPER: Forces Google to issue new refresh_token on next login
   * 
   * This endpoint:
   * 1. Gets current user's googleAccessToken from DB
   * 2. Calls Google's revoke endpoint to invalidate ALL tokens
   * 3. This forces Google to return a NEW refresh_token on next consent
   * 
   * Usage: Visit http://localhost:8081/auth/google/revoke in browser
   */
  @Get('google/revoke')
  async revokeGoogleAccess(@Res() res: Response) {
    try {
      // For testing: you can hardcode a user email or token here
      // In production, this should be authenticated with JWT
      const testEmail = 'saadtanoli445@gmail.com'; // Change this to your test email
      
      const result = await this.loginService.revokeGoogleTokens(testEmail);
      
      res.send(`
        <html>
          <head><title>Google Access Revoked</title></head>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>✅ Google Access Revoked</h1>
            <p>${result.message}</p>
            <p>Next steps:</p>
            <ol style="text-align: left; max-width: 500px; margin: 20px auto;">
              <li>Go to your app</li>
              <li>Click "Continue with Google"</li>
              <li>Grant all permissions (including Gmail)</li>
              <li>Check database - googleRefreshToken should now exist!</li>
            </ol>
            <a href="${this.getFrontendUrl()}" 
               style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px;">
              Go to App
            </a>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>❌ Error</h1>
            <p>${error.message}</p>
          </body>
        </html>
      `);
    }
  }
}
