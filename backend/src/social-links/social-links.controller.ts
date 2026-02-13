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

@Controller('super-admin/social-links')
export class SocialLinksController {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @UseGuards(SuperAdminGuard)
  @Post()
  create(@Body() createSocialLinkDto: CreateSocialLinkDto) {
    return this.socialLinksService.create(createSocialLinkDto);
  }

  @UseGuards(SuperAdminGuard)
  @Get()
  findAll() {
    return this.socialLinksService.findAll();
  }

  @UseGuards(SuperAdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.socialLinksService.findOne(id);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSocialLinkDto: UpdateSocialLinkDto,
  ) {
    return this.socialLinksService.update(id, updateSocialLinkDto);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id/toggle')
  toggleEnabled(@Param('id') id: string) {
    return this.socialLinksService.toggleEnabled(id);
  }

  @UseGuards(SuperAdminGuard)
  @Post('reorder')
  reorder(@Body() reorderDto: ReorderSocialLinksDto) {
    return this.socialLinksService.reorder(reorderDto);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.socialLinksService.remove(id);
  }
}
