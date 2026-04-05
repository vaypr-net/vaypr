import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserprofileDto } from './dto/create-userprofile.dto';
import { UpdateUserprofileDto } from './dto/update-userprofile.dto';
import { UserProfile } from './entities/userprofile.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UserprofileService {
  constructor(
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(userId: string, createUserprofileDto: CreateUserprofileDto): Promise<UserProfile> {
    const existingProfile = await this.userProfileModel.findOne({ userId: new Types.ObjectId(userId) });
    
    if (existingProfile) {
      throw new ConflictException('Profile already exists for this user');
    }

    const profile = new this.userProfileModel({
      ...createUserprofileDto,
      userId: new Types.ObjectId(userId),
    });

    return profile.save();
  }

  async findByUserId(userId: string): Promise<UserProfile> {
    const userObjectId = new Types.ObjectId(userId);
    const existingProfile = await this.userProfileModel
      .findOne({ userId: userObjectId })
      .exec();

    if (existingProfile) {
      return existingProfile;
    }

    // Auto-provision an empty profile so GET /userprofile does not 404
    const profile = new this.userProfileModel({ userId: userObjectId });
    return profile.save();
  }

  async update(userId: string, updateUserprofileDto: UpdateUserprofileDto): Promise<UserProfile> {
    const profile = await this.userProfileModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: updateUserprofileDto },
        { new: true }
      )
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File): Promise<UserProfile> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.cloudinaryService.uploadImage(file, 'profiles');
    
    const profile = await this.userProfileModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { profileImage: result.secure_url },
        { new: true }
      )
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async remove(userId: string): Promise<void> {
    const result = await this.userProfileModel.findOneAndDelete({ userId: new Types.ObjectId(userId) }).exec();
    
    if (!result) {
      throw new NotFoundException('Profile not found');
    }
  }
}
