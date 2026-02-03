import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateLoginDto } from './dto/create-login.dto';
import { UserService } from '../user/user.service';

interface GoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  profilePicture?: string;
}

@Injectable()
export class LoginService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(createLoginDto: CreateLoginDto) {
    const user = await this.userService.findByEmail(createLoginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(createLoginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user._id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
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
   * 3. If doesn't exist:
   *    - CREATE new user with Google data
   *    - password = null, authProvider = 'google', emailVerified = true
   * 
   * This ensures:
   * - No duplicate accounts for same email
   * - Existing users can link Google account
   * - New Google users are auto-verified
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
      // Else: User already has Google linked, proceed with normal login
    } else {
      // User doesn't exist - CREATE new Google user
      user = await this.userService.createGoogleUser({
        email: googleUser.email,
        fullName: googleUser.fullName,
        googleId: googleUser.googleId,
        profilePicture: googleUser.profilePicture,
      });
    }

    // Issue JWT token (same as manual login)
    const payload = { sub: user._id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    };
  }
}
