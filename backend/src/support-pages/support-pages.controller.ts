import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupportPagesService } from './support-pages.service';
import { CreateSupportPageDto } from './dto/create-support-page.dto';
import { UpdateSupportPageDto } from './dto/update-support-page.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { PageType } from './entities/support-page.entity';

@Controller('pages')
export class SupportPagesController {
  constructor(private readonly supportPagesService: SupportPagesService) {}

  /**
   * Public endpoint - Get all enabled pages
   */
  @Get()
  findAll(@Query('enabledOnly') enabledOnly?: string) {
    const enabled = enabledOnly === 'true' ? true : undefined;
    return this.supportPagesService.findAll(enabled);
  }

  /**
   * Public endpoint - Get page by slug
   */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.supportPagesService.findBySlug(slug);
  }

  /**
   * Public endpoint - Get page by type
   */
  @Get('type/:type')
  findByType(@Param('type') type: PageType) {
    return this.supportPagesService.findByType(type);
  }

  /**
   * Public endpoint - Get single page
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supportPagesService.findOne(id);
  }

  /**
   * Protected endpoint - Create new page
   */
  @UseGuards(SuperAdminGuard)
  @Post('admin')
  create(@Body() createSupportPageDto: CreateSupportPageDto) {
    return this.supportPagesService.create(createSupportPageDto);
  }

  /**
   * Protected endpoint - Update page
   */
  @UseGuards(SuperAdminGuard)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() updateSupportPageDto: UpdateSupportPageDto) {
    return this.supportPagesService.update(id, updateSupportPageDto);
  }

  /**
   * Protected endpoint - Toggle enabled status
   */
  @UseGuards(SuperAdminGuard)
  @Patch('admin/:id/toggle')
  toggleEnabled(@Param('id') id: string) {
    return this.supportPagesService.toggleEnabled(id);
  }

  /**
   * Protected endpoint - Toggle footer visibility
   */
  @UseGuards(SuperAdminGuard)
  @Patch('admin/:id/toggle-footer')
  toggleFooterVisibility(@Param('id') id: string) {
    return this.supportPagesService.toggleFooterVisibility(id);
  }

  /**
   * Protected endpoint - Delete page
   */
  @UseGuards(SuperAdminGuard)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.supportPagesService.remove(id);
  }

  /**
   * Protected endpoint - Initialize default pages
   */
  @UseGuards(SuperAdminGuard)
  @Post('admin/init-defaults')
  initializeDefaults() {
    return this.supportPagesService.initializeDefaultPages();
  }
}
