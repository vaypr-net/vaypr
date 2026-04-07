import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/user.service';

/**
 * SwaggerAuthMiddleware
 *
 * Protects /api and /api-json with HTTP Basic Auth backed by the real
 * super admin record in the database.
 *
 * Access rules:
 *  - Username = super admin email (case-insensitive)
 *  - Password = super admin plaintext password (compared via bcrypt)
 *  - User must exist AND have isSuperAdmin = true
 *
 * Security guarantees:
 *  - No credentials stored in env
 *  - Password is never compared in plaintext — always via bcrypt.compare()
 *  - Generic 401 on any failure (does not leak why auth failed)
 *  - Triggers browser Basic Auth popup via WWW-Authenticate header
 *  - Automatically respects password/email changes in DB
 */
@Injectable()
export class SwaggerAuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const deny = (): void => {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Access"');
      res.status(401).send('Authentication required.');
    };

    const authHeader = req.headers['authorization'];

    // Must have a Basic auth header
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return deny();
    }

    let email: string;
    let password: string;

    try {
      const base64Credentials = authHeader.slice('Basic '.length).trim();
      const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');

      // Find first colon — everything before is username, everything after is password
      // (passwords themselves may contain colons, so we split on the first one only)
      const colonIndex = decoded.indexOf(':');
      if (colonIndex === -1) {
        return deny();
      }

      email = decoded.slice(0, colonIndex).toLowerCase().trim();
      password = decoded.slice(colonIndex + 1);
    } catch {
      return deny();
    }

    if (!email || !password) {
      return deny();
    }

    try {
      // Fetch the user; findByEmail returns null if not found
      const user = await this.userService.findByEmail(email);

      console.log('[SwaggerAuth] attempt:', {
        email,
        userFound: !!user,
        isSuperAdmin: user?.isSuperAdmin,
        hasPassword: !!user?.password,
      });

      // Rule 1: User must exist
      // Rule 2: User must be super admin
      // Rule 3: User must have a stored hashed password (not a Google-only account)
      if (!user || !user.isSuperAdmin || !user.password) {
        console.log('[SwaggerAuth] denied — user/role/password check failed');
        return deny();
      }

      // Rule 4: Verify entered password against stored bcrypt hash
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('[SwaggerAuth] bcrypt result:', isPasswordValid);
      if (!isPasswordValid) {
        console.log('[SwaggerAuth] denied — wrong password');
        return deny();
      }

      // All checks passed — allow through
      console.log('[SwaggerAuth] granted for', email);
      next();
    } catch (err) {
      // Treat any unexpected DB/service error as auth failure
      console.error('[SwaggerAuth] error:', err?.message);
      return deny();
    }
  }
}
