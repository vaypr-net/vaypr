import { Controller, Get, Post, Body, Patch, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UserprofileService } from './userprofile.service';
import { CreateUserprofileDto } from './dto/create-userprofile.dto';
import { UpdateUserprofileDto } from './dto/update-userprofile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserService } from '../user/user.service';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('userprofile')
@UseGuards(JwtAuthGuard)
export class UserprofileController {
  constructor(
    private readonly userprofileService: UserprofileService,
    private readonly userService: UserService,
  ) {}

  private static readonly multerOpts = { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } };

  private getAuthUserId(req: any): string {
    return req?.user?.userId || req?.user?.sub;
  }

  @Post()
  async create(@Request() req, @Body() createUserprofileDto: CreateUserprofileDto) {
    return this.userprofileService.create(this.getAuthUserId(req), createUserprofileDto);
  }

  @Get()
  async findOne(@Request() req) {
    const userId = this.getAuthUserId(req);
    const profile = await this.userprofileService.findByUserId(userId);
    const user = await this.userService.findOne(userId);
    
    // Merge user profile with isSuperAdmin flag and 2FA status
    return {
      ...profile.toObject(),
      isSuperAdmin: user.isSuperAdmin || false,
      twoFactorEnabled: user.twoFactorEnabled || false,
    };
  }

  @Patch()
  async update(@Request() req, @Body() updateUserprofileDto: UpdateUserprofileDto) {
    return this.userprofileService.update(this.getAuthUserId(req), updateUserprofileDto);
  }

  @Patch('upload-image')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', UserprofileController.multerOpts))
  async uploadImage(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.userprofileService.uploadProfileImage(this.getAuthUserId(req), file);
  }

  @Delete()
  async remove(@Request() req) {
    return this.userprofileService.remove(this.getAuthUserId(req));
  }
}
