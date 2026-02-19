import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class TwoFAPendingGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || Array.isArray(auth)) throw new UnauthorizedException('Missing authorization token');
    const parts = (auth as string).split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') throw new UnauthorizedException('Malformed authorization header');
    const token = parts[1];
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'default_secret';
      const payload = this.jwtService.verify(token, { secret }) as any;
      if (!payload || payload.type !== '2fa_pending') throw new UnauthorizedException('Invalid token type');
      // attach payload to request.user for controller
      (req as any).user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

export default TwoFAPendingGuard;
