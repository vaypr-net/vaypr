import { Controller, Get, Post, UseGuards, Req, Body, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TwoFAService } from './twofa.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../user/session.service';
import type { Request } from 'express';

@ApiTags('2FA')
@Controller('auth/2fa')
export class TwoFAController {
  constructor(
    private readonly twoFAService: TwoFAService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  // Generate a TOTP secret and QR code (not persisted yet)
  @UseGuards(JwtAuthGuard)
  @Get('setup')
  async setup(@Req() req: Request) {
    // @ts-ignore
    const userId = req.user.sub || req.user._id;
    const user = await this.userService.findOne(userId.toString());
    const secret = this.twoFAService.generateSecret(user.email);
    const qr = await this.twoFAService.generateQRCodeDataURL(secret.otpauth_url!);
    return { secret: secret.base32, otpauth_url: secret.otpauth_url, qr };
  }

  // Verify code and enable 2FA (persist secret)
  @UseGuards(JwtAuthGuard)
  @Post('enable')
  async enable(@Req() req: Request, @Body() body: { secret: string; token: string }) {
    if (!body?.secret || !body?.token) throw new BadRequestException('secret and token are required');
    // @ts-ignore
    const userId = req.user.sub || req.user._id;
    const verified = this.twoFAService.verifyToken(body.secret, body.token);
    if (!verified) throw new BadRequestException('Invalid token');
    // Persist secret and enable flag
    await this.userService.update(userId.toString(), { twoFactorSecret: body.secret, twoFactorEnabled: true } as any);
    return { success: true };
  }

  // Verify TOTP during login using temp token (JwtAuthGuard will validate temp token)
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verify(@Req() req: Request, @Body() body: { token: string }) {
    if (!body?.token) throw new BadRequestException('token is required');
    // @ts-ignore
    const userId = req.user.sub || req.user._id;
    const user = await this.userService.findOne(userId.toString());
    if (!user.twoFactorEnabled || !user.twoFactorSecret) throw new BadRequestException('2FA not enabled');
    const verified = this.twoFAService.verifyToken(user.twoFactorSecret, body.token);
    if (!verified) throw new BadRequestException('Invalid token');

    // Issue full access token
    const payload = { sub: user._id, email: user.email, isSuperAdmin: user.isSuperAdmin || false };
    const accessToken = this.jwtService.sign(payload);

    // Create a session for this login
    try {
      await this.sessionService.createSession(
        user._id,
        (req.headers['user-agent'] as string) || 'unknown',
        (req.ip as string) || (req.connection as any)?.remoteAddress || 'unknown',
        accessToken,
      );
    } catch (err) {
      // ignore session creation errors
    }

    return { access_token: accessToken, user: { id: user._id, fullName: user.fullName, email: user.email } };
  }
}

export default TwoFAController;
