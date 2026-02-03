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
import { RecieptService } from './reciept.service';
import { CreateReceiptDto } from './dto/create-reciept.dto';
import { UpdateReceiptDto } from './dto/update-reciept.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('receipts')
export class RecieptController {
  constructor(
    private readonly recieptService: RecieptService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body() createReceiptDto: CreateReceiptDto,
    @UploadedFile() logo: Express.Multer.File,
    @Request() req,
  ) {
    if (logo) {
      const result = await this.cloudinaryService.uploadImage(logo);
      createReceiptDto.logo = result.secure_url;
    }
    return this.recieptService.create(createReceiptDto, req.user.userId);
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    if (status) {
      return this.recieptService.findByStatus(status, req.user.userId);
    }
    return this.recieptService.findAll(req.user.userId);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string, @Request() req) {
    return this.recieptService.findByClient(clientId, req.user.userId);
  }

  @Get('invoice/:invoiceId')
  findByInvoice(@Param('invoiceId') invoiceId: string, @Request() req) {
    return this.recieptService.findByInvoice(invoiceId, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.recieptService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param('id') id: string,
    @Body() updateReceiptDto: UpdateReceiptDto,
    @UploadedFile() logo: Express.Multer.File,
    @Request() req,
  ) {
    if (logo) {
      const result = await this.cloudinaryService.uploadImage(logo);
      updateReceiptDto.logo = result.secure_url;
    }
    return this.recieptService.update(id, updateReceiptDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.recieptService.remove(id, req.user.userId);
  }
}
