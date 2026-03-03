import { Controller, Get, Post, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SuperadminSettingsService } from './superadmin-settings.service';
import { CreateSuperadminSettingsDto } from './dto/create-superadmin-settings.dto';
import { UpdateSuperadminSettingsDto } from './dto/update-superadmin-settings.dto';
import { ChangePasswordDto } from '../common/dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('superadmin-settings')
@ApiBearerAuth()
@Controller('superadmin-settings')
@UseGuards(JwtAuthGuard)
export class SuperadminSettingsController {
  constructor(private readonly service: SuperadminSettingsService) {}

  @Post()
  async create(@Request() req, @Body() createDto: CreateSuperadminSettingsDto) {
    return this.service.create(req.user.sub, createDto);
  }

  @Get()
  async findOne(@Request() req) {
    return this.service.findByUserId(req.user.sub);
  }

  @Patch()
  async update(@Request() req, @Body() updateDto: UpdateSuperadminSettingsDto) {
    return this.service.update(req.user.sub, updateDto);
  }

  @Patch('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.service.changePassword(req.user.sub, changePasswordDto);
  }
}
