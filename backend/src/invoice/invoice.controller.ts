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
    if (logo) {
      const result = await this.cloudinaryService.uploadImage(logo);
      createInvoiceDto.logo = result.secure_url;
    }
    return this.invoiceService.create(createInvoiceDto, req.user.sub);
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    if (status) {
      return this.invoiceService.findByStatus(status, req.user.sub);
    }
    return this.invoiceService.findAll(req.user.sub);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string, @Request() req) {
    return this.invoiceService.findByClient(clientId, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoiceService.findOne(id, req.user.sub);
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
    if (logo) {
      const result = await this.cloudinaryService.uploadImage(logo);
      updateInvoiceDto.logo = result.secure_url;
    }
    return this.invoiceService.update(id, updateInvoiceDto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.invoiceService.remove(id, req.user.sub);
  }
}
