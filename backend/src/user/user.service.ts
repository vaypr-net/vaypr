import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserProfile } from '../userprofile/entities/userprofile.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    // Generate JWT token
    const payload = { sub: savedUser._id, email: savedUser.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
      },
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Create a new user from Google OAuth data
   * 
   * Called when a user signs up via Google for the first time
   * Sets:
   * - password = undefined (no password for OAuth users)
   * - authProvider = 'google'
   * - emailVerified = true (Google verifies emails)
   * 
   * Also creates a basic UserProfile with placeholder data
   * User can complete their profile later
   */
  async createGoogleUser(googleData: {
    email: string;
    fullName: string;
    googleId: string;
    profilePicture?: string;
  }): Promise<User> {
    // Create user
    const user = new this.userModel({
      email: googleData.email,
      fullName: googleData.fullName,
      googleId: googleData.googleId,
      profilePicture: googleData.profilePicture,
      authProvider: 'google',
      emailVerified: true,
      // password is undefined/null - OAuth users don't have passwords
    });

    const savedUser = await user.save();

    // Create basic UserProfile with data from Google
    // Required fields get placeholder values that user can update later
    const userProfile = new this.userProfileModel({
      userId: savedUser._id,
      fullName: googleData.fullName,
      email: googleData.email,
      phoneNumber: '', // User will fill this later
      companyName: '', // User will fill this later
      businessAddress: '', // User will fill this later
      timeZone: 'UTC',
      profileImage: googleData.profilePicture || '',
    });

    await userProfile.save();

    return savedUser;
  }

  /**
   * Link Google account to existing user
   * 
   * Called when a user who signed up manually later logs in with Google
   * Updates their account to include Google OAuth info
   */
  async linkGoogleAccount(
    userId: string,
    googleId: string,
    profilePicture?: string,
  ): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          googleId,
          profilePicture,
          emailVerified: true, // Auto-verify email when linking Google
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update Google OAuth tokens for a user
   * 
   * CRITICAL LOGIC:
   * - Always update accessToken and tokenExpiry
   * - ONLY update refreshToken if it's present (not null/undefined)
   * - Google only returns refreshToken on first consent or when prompt=consent
   * - Never overwrite existing refreshToken with null
   * 
   * This ensures we don't lose the refresh token on subsequent logins
   */
  async updateGoogleTokens(
    userId: string,
    accessToken: string,
    tokenExpiry: Date,
    refreshToken?: string,
  ): Promise<User> {
    const updateData: any = {
      googleAccessToken: accessToken,
      googleTokenExpiry: tokenExpiry,
    };

    // CRITICAL: Only update refresh token if present
    // Never overwrite with null/undefined
    if (refreshToken) {
      updateData.googleRefreshToken = refreshToken;
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get user's Google refresh token
   * 
   * Used by GmailService to refresh access tokens
   * Returns null if user hasn't granted Gmail permission
   */
  async getGoogleRefreshToken(userId: string): Promise<string | null> {
    const user = await this.userModel
      .findById(userId)
      .select('googleRefreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.googleRefreshToken || null;
  }

  /**
   * Clear Google OAuth tokens from user account
   * 
   * Called after revoking tokens via Google's API
   * This ensures the database reflects the revoked state
   */
  async clearGoogleTokens(userId: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          googleAccessToken: null,
          googleRefreshToken: null,
          googleTokenExpiry: null,
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
