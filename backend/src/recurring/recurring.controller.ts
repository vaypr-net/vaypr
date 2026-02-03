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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('recurring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recurring')
export class RecurringController {
  constructor(
    private readonly recurringService: RecurringService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body() createRecurringDto: CreateRecurringDto,
    @UploadedFile() logo: Express.Multer.File,
    @Request() req,
  ) {
    if (logo) {
      const result = await this.cloudinaryService.uploadImage(logo);
      createRecurringDto.logo = result.secure_url;
    }
    return this.recurringService.create(createRecurringDto, req.user.userId);
  }

  @Get()
  findAll(@Request() req) {
    return this.recurringService.findAll(req.user.userId);
  }

  @Get('active')
  findActive(@Request() req) {
    return this.recurringService.findActive(req.user.userId);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string, @Request() req) {
    return this.recurringService.findByClient(clientId, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.recurringService.findOne(id, req.user.userId);
  }

  @Post(':id/generate-invoice')
  generateInvoice(@Param('id') id: string, @Request() req) {
    return this.recurringService.generateInvoice(id, req.user.userId);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param('id') id: string,
    @Body() updateRecurringDto: UpdateRecurringDto,
    @UploadedFile() logo: Express.Multer.File,
    @Request() req,
  ) {
    if (logo) {
      const result = await this.cloudinaryService.uploadImage(logo);
      updateRecurringDto.logo = result.secure_url;
    }
    return this.recurringService.update(id, updateRecurringDto, req.user.userId);
  }

  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string, @Request() req) {
    return this.recurringService.toggleActive(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.recurringService.remove(id, req.user.userId);
  }
}
