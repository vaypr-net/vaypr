import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { LoginService } from './login.service';
import { CreateLoginDto } from './dto/create-login.dto';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Manual login (email/password)
   * Endpoint: POST /auth/login
   */
  @Post('login')
  async login(@Body() createLoginDto: CreateLoginDto) {
    return this.loginService.login(createLoginDto);
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

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Redirect to frontend with JWT token
    // Frontend should extract token from URL and store it
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }
}

