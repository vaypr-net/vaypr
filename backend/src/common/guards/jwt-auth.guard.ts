import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

@Injectable()
export class JwtAuthGuard {
  constructor(private jwtService: JwtService, @InjectConnection() private readonly db: Connection) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Confirmation and 2FA tokens cannot act as login tokens. Always check the
      // current account so deleting it invalidates even unexpired JWTs.
      if (payload.type || !Types.ObjectId.isValid(payload.sub)) throw new Error('Invalid login token');
      const account = await this.db.collection('users').findOne({ _id: new Types.ObjectId(payload.sub) }, { projection: { isSuperAdmin: 1 } });
      if (!account) throw new Error('Account no longer exists');
      // Map 'sub' to 'userId' for consistency across the application
      request.user = {
        ...payload,
        userId: payload.sub,
        isSuperAdmin: account.isSuperAdmin === true,
      };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
