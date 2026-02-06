import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SocialLinksService } from './social-links.service';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdateSocialLinkDto } from './dto/update-social-link.dto';
import { ReorderSocialLinksDto } from './dto/reorder-social-links.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@UseGuards(SuperAdminGuard)
@Controller('super-admin/social-links')
export class SocialLinksController {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @Post()
  create(@Body() createSocialLinkDto: CreateSocialLinkDto) {
    return this.socialLinksService.create(createSocialLinkDto);
  }

  @Get()
  findAll() {
    return this.socialLinksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.socialLinksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSocialLinkDto: UpdateSocialLinkDto,
  ) {
    return this.socialLinksService.update(id, updateSocialLinkDto);
  }

  @Patch(':id/toggle')
  toggleEnabled(@Param('id') id: string) {
    return this.socialLinksService.toggleEnabled(id);
  }

  @Post('reorder')
  reorder(@Body() reorderDto: ReorderSocialLinksDto) {
    return this.socialLinksService.reorder(reorderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.socialLinksService.remove(id);
  }
}
