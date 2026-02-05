import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Super Admin Guard
 * 
 * Protects routes that should only be accessible by super admin
 * 
 * Usage:
 *   @UseGuards(SuperAdminGuard)
 *   @Get('/admin/users')
 *   getAllUsers() { ... }
 * 
 * How it works:
 * 1. First checks JWT authentication (extends JwtAuthGuard)
 * 2. Then checks if user.isSuperAdmin === true
 * 3. Throws ForbiddenException if not super admin
 * 
 * Requirements:
 * - User must be authenticated (valid JWT token)
 * - User must have isSuperAdmin = true in database
 */
@Injectable()
export class SuperAdminGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check JWT authentication
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get user from request (populated by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user is super admin
    if (!user || !user.isSuperAdmin) {
      throw new ForbiddenException('Super admin access required');
    }

    return true;
  }
}
