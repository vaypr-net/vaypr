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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CorporatePagesService } from './corporate-pages.service';
import { CreateCorporatePageDto } from './dto/create-corporate-page.dto';
import { UpdateCorporatePageDto } from './dto/update-corporate-page.dto';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { CorporatePageType } from './entities/corporate-page.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('corporate')
export class CorporatePagesController {
  constructor(
    private readonly corporatePagesService: CorporatePagesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Public endpoint - Get all enabled corporate pages
   */
  @Get()
  findAll(@Query('enabledOnly') enabledOnly?: string) {
    const enabled = enabledOnly === 'true' ? true : undefined;
    return this.corporatePagesService.findAll(enabled);
  }

  /**
   * Public endpoint - Get page by slug
   */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.corporatePagesService.findBySlug(slug);
  }

  /**
   * Public endpoint - Get page by type
   */
  @Get('type/:type')
  findByType(@Param('type') type: CorporatePageType) {
    return this.corporatePagesService.findByType(type);
  }

  /**
   * Protected endpoint - Create new page
   */
  @UseGuards(SuperAdminGuard)
  @Post('admin')
  create(@Body() createCorporatePageDto: CreateCorporatePageDto) {
    return this.corporatePagesService.create(createCorporatePageDto);
  }

  /**
   * Protected endpoint - Update page
   */
  @UseGuards(SuperAdminGuard)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() updateCorporatePageDto: UpdateCorporatePageDto) {
    return this.corporatePagesService.update(id, updateCorporatePageDto);
  }

  /**
   * Protected endpoint - Toggle enabled status
   */
  @UseGuards(SuperAdminGuard)
  @Patch('admin/:id/toggle')
  toggleEnabled(@Param('id') id: string) {
    return this.corporatePagesService.toggleEnabled(id);
  }

  /**
   * Protected endpoint - Toggle footer visibility
   */
  @UseGuards(SuperAdminGuard)
  @Patch('admin/:id/toggle-footer')
  toggleFooterVisibility(@Param('id') id: string) {
    return this.corporatePagesService.toggleFooterVisibility(id);
  }

  /**
   * Protected endpoint - Delete page
   */
  @UseGuards(SuperAdminGuard)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.corporatePagesService.remove(id);
  }

  /**
   * Protected endpoint - Initialize default pages
   */
  @UseGuards(SuperAdminGuard)
  @Post('admin/init-defaults')
  initializeDefaults() {
    return this.corporatePagesService.initializeDefaultPages();
  }

  // ==================== GUIDES ENDPOINTS ====================

  /**
   * Public endpoint - Get all guides
   */
  @Get('guides')
  findAllGuides(@Query('publishedOnly') publishedOnly?: string) {
    const published = publishedOnly === 'true' ? true : undefined;
    return this.corporatePagesService.findAllGuides(published);
  }

  /**
   * Public endpoint - Get single guide
   */
  @Get('guides/:id')
  findOneGuide(@Param('id') id: string) {
    return this.corporatePagesService.findOneGuide(id);
  }

  /**
   * Public endpoint - Download guide (increments download counter)
   */
  @Get('guides/:id/download')
  async downloadGuide(@Param('id') id: string) {
    const guide = await this.corporatePagesService.incrementGuideDownloads(id);
    return {
      message: 'Download started',
      fileUrl: guide.fileUrl,
      fileName: guide.fileName,
      downloads: guide.downloads,
    };
  }

  /**
   * Public endpoint - Get single page
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.corporatePagesService.findOne(id);
  }

  /**
   * Protected endpoint - Create guide (file uploaded to Cloudinary from frontend)
   */
  @UseGuards(SuperAdminGuard)
  @Post('admin/guides')
  createGuide(@Body() createGuideDto: CreateGuideDto) {
    return this.corporatePagesService.createGuide(createGuideDto);
  }

  @UseGuards(SuperAdminGuard)
  @Post('admin/guides/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadGuideFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { message: 'No file uploaded' };
    }
    const result = await this.cloudinaryService.uploadFile(file, 'guides');
    return {
      url: result?.secure_url,
      publicId: result?.public_id,
      originalName: file.originalname,
      resourceType: result?.resource_type,
    };
  }

  @UseGuards(SuperAdminGuard)
  @Post('admin/team/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTeamMemberImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { message: 'No file uploaded' };
    }
    const result = await this.cloudinaryService.uploadImage(file, 'team-members');
    return {
      url: result?.secure_url,
      publicId: result?.public_id,
      originalName: file.originalname,
      resourceType: result?.resource_type,
    };
  }

  /**
   * Protected endpoint - Update guide
   */
  @UseGuards(SuperAdminGuard)
  @Patch('admin/guides/:id')
  updateGuide(
    @Param('id') id: string,
    @Body() updateGuideDto: UpdateGuideDto,
  ) {
    return this.corporatePagesService.updateGuide(id, updateGuideDto);
  }

  /**
   * Protected endpoint - Toggle guide published status
   */
  @UseGuards(SuperAdminGuard)
  @Patch('admin/guides/:id/toggle')
  toggleGuidePublished(@Param('id') id: string) {
    return this.corporatePagesService.toggleGuidePublished(id);
  }

  /**
   * Protected endpoint - Delete guide
   */
  @UseGuards(SuperAdminGuard)
  @Delete('admin/guides/:id')
  removeGuide(@Param('id') id: string) {
    return this.corporatePagesService.removeGuide(id);
  }
}
