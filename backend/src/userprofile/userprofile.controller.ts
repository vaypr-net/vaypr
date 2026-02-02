import { Controller, Get, Post, Body, Patch, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UserprofileService } from './userprofile.service';
import { CreateUserprofileDto } from './dto/create-userprofile.dto';
import { UpdateUserprofileDto } from './dto/update-userprofile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('userprofile')
@UseGuards(JwtAuthGuard)
export class UserprofileController {
  constructor(private readonly userprofileService: UserprofileService) {}

  @Post()
  async create(@Request() req, @Body() createUserprofileDto: CreateUserprofileDto) {
    return this.userprofileService.create(req.user.sub, createUserprofileDto);
  }

  @Get()
  async findOne(@Request() req) {
    return this.userprofileService.findByUserId(req.user.sub);
  }

  @Patch()
  async update(@Request() req, @Body() updateUserprofileDto: UpdateUserprofileDto) {
    return this.userprofileService.update(req.user.sub, updateUserprofileDto);
  }

  @Patch('upload-image')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.userprofileService.uploadProfileImage(req.user.sub, file);
  }

  @Delete()
  async remove(@Request() req) {
    return this.userprofileService.remove(req.user.sub);
  }
}
