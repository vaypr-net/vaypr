import { Controller, Post, UseGuards, Req, Body, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TwofaService } from './twofa.service';
import { UserService } from '../user/user.service';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { TwoFAPendingGuard } from './guards/twofa-pending.guard';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../user/session.service';
import type { Request } from 'express';

@ApiTags('2FA')
@Controller()
export class TwofaController {
  constructor(
    private readonly twofa: TwofaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  // POST /2fa/setup - user must be logged in
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setup(@Req() req: Request) {
    // @ts-ignore
    const userId = req.user.sub || req.user._id;
    const user = await this.userService.findOne(userId.toString());
    if (!user) throw new BadRequestException('User not found');

    const secret = this.twofa.generateSecretForUser(user.email);
    const qrDataUrl = await this.twofa.qrDataUrlFromOtpUrl(secret.otpauth_url!);

    // Encrypt & save secret as pending (do not enable yet)
    const encrypted = this.twofa.encryptSecret(secret.base32);
    await this.userService.update(userId.toString(), { twoFactorSecret: encrypted, twoFactorEnabled: false } as any);

    return { qrDataUrl, manualKey: secret.base32 };
  }

  // POST /2fa/verify-setup - confirm code and enable
  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify-setup')
  async verifySetup(@Req() req: Request, @Body() body: VerifyCodeDto) {
    if (!body || !body.code) throw new BadRequestException('code is required');
    // @ts-ignore
    const userId = req.user.sub || req.user._id;
    const user = await this.userService.findOne(userId.toString());
    if (!user) throw new BadRequestException('User not found');
    if (!user.twoFactorSecret) throw new BadRequestException('No pending 2FA setup found');

    const decrypted = this.twofa.decryptSecret(user.twoFactorSecret);
    const ok = this.twofa.verifyTokenWithSecret(decrypted, body.code);
    if (!ok) throw new BadRequestException('Invalid code');

    await this.userService.update(userId.toString(), { twoFactorEnabled: true, twoFactorVerifiedAt: new Date() } as any);
    return { enabled: true };
  }

  // POST /auth/2fa-login - verify temp token + TOTP and issue real access token
  @UseGuards(TwoFAPendingGuard)
  @Post('auth/2fa-login')
  async twofaLogin(@Req() req: Request, @Body() body: VerifyCodeDto) {
    if (!body || !body.code) throw new BadRequestException('code is required');
    // @ts-ignore - attached by TwoFAPendingGuard
    const payload = req.user as any;
    const user = await this.userService.findOne(payload.sub.toString());
    if (!user) throw new BadRequestException('User not found');
    if (!user.twoFactorEnabled || !user.twoFactorSecret) throw new BadRequestException('2FA not enabled');

    const decrypted = this.twofa.decryptSecret(user.twoFactorSecret);
    const ok = this.twofa.verifyTokenWithSecret(decrypted, body.code);
    if (!ok) throw new BadRequestException('Invalid code');

    // Issue real access token
    const accessPayload = { sub: user._id, email: user.email, isSuperAdmin: user.isSuperAdmin || false };
    const accessToken = this.jwtService.sign(accessPayload);

    // Create session (best-effort)
    try {
      await this.sessionService.createSession(
        user._id,
        (req.headers['user-agent'] as string) || 'unknown',
        (req.ip as string) || (req.connection as any)?.remoteAddress || 'unknown',
        accessToken,
      );
    } catch (err) {
      // ignore session errors
    }

    return { access_token: accessToken };
  }
}

export default TwofaController;
