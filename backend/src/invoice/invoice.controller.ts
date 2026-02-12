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
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoice')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
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

        const result = await this.cloudinaryService.uploadImage(logo, 'invoices');
        createInvoiceDto.logo = result.secure_url;
      }
      return this.invoiceService.create(createInvoiceDto, req.user.userId);
    } catch (error) {
      console.error('[Invoice Create] Error:', error);
      throw error;
    }
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    if (status) {
      return this.invoiceService.findByStatus(status, req.user.userId);
    }
    return this.invoiceService.findAll(req.user.userId);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string, @Request() req) {
    return this.invoiceService.findByClient(clientId, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoiceService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
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

        const result = await this.cloudinaryService.uploadImage(logo, 'invoices');
        updateInvoiceDto.logo = result.secure_url;
      }
      return this.invoiceService.update(id, updateInvoiceDto, req.user.userId);
    } catch (error) {
      console.error('[Invoice Update] Error:', error);
      throw error;
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.invoiceService.remove(id, req.user.userId);
  }
}
