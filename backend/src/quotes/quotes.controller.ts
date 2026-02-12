import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body() createQuoteDto: CreateQuoteDto,
    @UploadedFile() logo: Express.Multer.File,
    @Request() req,
  ) {
    try {
      if (logo) {
        // Validate file size (max 5MB)
        if (logo.size > 5 * 1024 * 1024) {
          throw new Error('Image file too large. Maximum size is 5MB');
        }

        // Validate file type
        if (!logo.mimetype.startsWith('image/')) {
          throw new Error('Invalid file type. Only images are allowed');
        }

        const result = await this.cloudinaryService.uploadImage(logo, 'quotes');
        createQuoteDto.logo = result.secure_url;
      }
      return this.quotesService.create(createQuoteDto, req.user.userId);
    } catch (error) {
      console.error('[Quote Create] Error:', error);
      throw error;
    }
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    if (status) {
      return this.quotesService.findByStatus(status, req.user.userId);
    }
    return this.quotesService.findAll(req.user.userId);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string, @Request() req) {
    return this.quotesService.findByClient(clientId, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.quotesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
    @UploadedFile() logo: Express.Multer.File,
    @Request() req,
  ) {
    try {
      if (logo) {
        // Validate file size (max 5MB)
        if (logo.size > 5 * 1024 * 1024) {
          throw new Error('Image file too large. Maximum size is 5MB');
        }

        // Validate file type
        if (!logo.mimetype.startsWith('image/')) {
          throw new Error('Invalid file type. Only images are allowed');
        }

        const result = await this.cloudinaryService.uploadImage(logo, 'quotes');
        updateQuoteDto.logo = result.secure_url;
      }
      return this.quotesService.update(id, updateQuoteDto, req.user.userId);
    } catch (error) {
      console.error('[Quote Update] Error:', error);
      throw error;
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.quotesService.remove(id, req.user.userId);
  }
}
