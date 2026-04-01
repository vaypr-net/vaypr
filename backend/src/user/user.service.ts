import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserProfile } from '../userprofile/entities/userprofile.entity';
import { BrevoService } from '../brevo/brevo.service';
import { ActivityService } from '../activity/activity.service';
import { BillingPlan } from '../billing-plan/entities/billing-plan.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
    @InjectModel(BillingPlan.name) private billingPlanModel: Model<BillingPlan>,
    private readonly jwtService: JwtService,
    private readonly brevoService: BrevoService,
    private readonly activityService: ActivityService,
  ) {}

  /**
   * Dynamically resolves the Free plan ID from the DB.
   * Never relies on a hardcoded ObjectId that may not exist in production.
   */
  private async getFreePlanId(): Promise<string | undefined> {
    const freePlan =
      (await this.billingPlanModel.findOne({ price: 0, status: 'active' }).sort({ createdAt: 1 })) ||
      (await this.billingPlanModel.findOne({ name: /free/i, status: 'active' }).sort({ createdAt: 1 })) ||
      (await this.billingPlanModel.findOne({ status: 'active' }).sort({ price: 1, createdAt: 1 }));
    return freePlan?._id?.toString();
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // If user provides a domain, verify it's authenticated in Brevo
    let brandingDomain: string | undefined;
    if (createUserDto.brandingDomain) {
      console.log(`[Register] Verifying domain: ${createUserDto.brandingDomain}`);
      
      // Check if domain is verified in Brevo
      const domains = await this.brevoService.getAllDomains();
      const verifiedDomain = domains.find(
        d => d.domain === createUserDto.brandingDomain && d.status === 'VERIFIED'
      );

      if (!verifiedDomain) {
        throw new BadRequestException(
          `Domain ${createUserDto.brandingDomain} is not verified in Brevo. Please verify it first.`
        );
      }

      brandingDomain = createUserDto.brandingDomain;
      console.log(`[Register] Domain verified successfully: ${brandingDomain}`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const freePlanId = await this.getFreePlanId();
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      brandingDomain, // Set the verified domain
      // Assign Free plan to new users (resolved dynamically from DB)
      planId: freePlanId,
      subscriptionStatus: 'free',
      billingCycle: 'monthly',
      // SECURITY: isSuperAdmin can ONLY be set via CLI script
      // Never allow API registration to create super admin
      isSuperAdmin: false,
    });

    const savedUser = await user.save();

    // Create activity for new subscriber
    try {
      await this.activityService.create({
        type: 'new_subscriber',
        title: 'New subscriber',
        description: `${savedUser.fullName} signed up for a free trial`,
        relatedEntityId: savedUser._id.toString(),
      });
    } catch (error) {
      console.error('Failed to create activity:', error);
      // Don't fail registration if activity creation fails
    }

    // Generate JWT token with isSuperAdmin flag for performance
    const payload = { 
      sub: savedUser._id, 
      email: savedUser.email,
      isSuperAdmin: savedUser.isSuperAdmin || false,
    };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        brandingDomain: savedUser.brandingDomain,
        isSuperAdmin: savedUser.isSuperAdmin || false,
      },
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const freePlanId = await this.getFreePlanId();
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      // Assign Free plan to new users (resolved dynamically from DB)
      planId: freePlanId,
      subscriptionStatus: 'free',
      billingCycle: 'monthly',
      // SECURITY: isSuperAdmin can ONLY be set via CLI script
      // This ensures create() method never creates a super admin
      isSuperAdmin: false,
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
    const user = await this.userModel
      .findOne({ email })
      .lean()
      .exec();
    
    // Explicitly log to debug isSuperAdmin field
    if (user) {
      console.log('🔍 findByEmail DEBUG:', {
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        type: typeof user.isSuperAdmin,
        allKeys: Object.keys(user),
      });
    }
    return user as any;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // SECURITY: Remove isSuperAdmin from update data if somehow it got through
    // isSuperAdmin can ONLY be modified via CLI script (setSuperAdmin method)
    const { isSuperAdmin, ...safeUpdateData } = updateUserDto as any;

    const user = await this.userModel
      .findByIdAndUpdate(id, safeUpdateData, { new: true })
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
    const freePlanId = await this.getFreePlanId();
    const user = new this.userModel({
      email: googleData.email,
      fullName: googleData.fullName,
      googleId: googleData.googleId,
      profilePicture: googleData.profilePicture,
      authProvider: 'google',
      emailVerified: true,
      // Assign Free plan to new Google OAuth users (resolved dynamically from DB)
      planId: freePlanId,
      subscriptionStatus: 'free',
      billingCycle: 'monthly',
      // SECURITY: isSuperAdmin can ONLY be set via CLI script
      // OAuth signup never creates super admin
      isSuperAdmin: false,
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

    // Create activity for new subscriber (same as manual signup)
    try {
      await this.activityService.create({
        type: 'new_subscriber',
        title: 'New subscriber',
        description: `${savedUser.fullName} signed up via Google`,
        relatedEntityId: savedUser._id.toString(),
      });
    } catch (error) {
      console.error('Failed to create activity for Google user:', error);
      // Don't fail signup if activity creation fails
    }

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

  /**
   * Set or remove super admin status for a user
   * 
   * Used by CLI script to manage super admin accounts
   * Only one super admin should exist at a time
   */
  async setSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { isSuperAdmin },
        { new: true },
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get current user profile with provider information
   * 
   * Used by frontend to detect which providers user has configured (Gmail or Brevo)
   * Returns essential fields including auth provider tokens
   * 
   * @param userId - User ID from JWT token
   * @returns User profile with authentication details
   */
  async getUserProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userModel
      .findById(userId)
      .select('email fullName googleAccessToken googleRefreshToken verifiedDomains pendingDomains brandingDomain authProvider')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Transform response to indicate which providers are available
    return {
      email: user.email,
      fullName: user.fullName,
      googleAccessToken: user.googleAccessToken, // Will be truthy if user has Gmail enabled
      googleRefreshToken: user.googleRefreshToken, // Will be truthy if user has Gmail enabled
      verifiedDomains: user.verifiedDomains, // Will be non-empty if user has Brevo domains
      pendingDomains: user.pendingDomains,
      brandingDomain: user.brandingDomain,
      authProvider: user.authProvider,
    };
  }

  /**
   * Change user password
   * 
   * Verifies current password before allowing password change
   * @param userId - User ID
   * @param changePasswordDto - Current password and new password
   * @returns Success message
   */
  async changePassword(userId: string, changePasswordDto: any): Promise<{ message: string }> {
    // Validate password match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    // Get user from database
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password in database
    await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword });

    return { message: 'Password changed successfully' };
  }
}
