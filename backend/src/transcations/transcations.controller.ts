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
import { TranscationsService } from './transcations.service';
import { CreateTranscationDto } from './dto/create-transcation.dto';
import { UpdateTranscationDto } from './dto/update-transcation.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@UseGuards(SuperAdminGuard)
@Controller('super-admin/transactions')
export class TranscationsController {
  constructor(private readonly transcationsService: TranscationsService) {}

  @Post()
  create(@Body() createTranscationDto: CreateTranscationDto) {
    return this.transcationsService.create(createTranscationDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 50;
    const o = offset ? parseInt(offset, 10) : 0;
    return this.transcationsService.findAll(search, status, type, l, o);
  }

  @Get('stats')
  stats() {
    return this.transcationsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transcationsService.findOne(id);
  }

  @Get(':id/invoices')
  getInvoices(@Param('id') id: string) {
    return this.transcationsService.getInvoicesForTransaction(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTranscationDto: UpdateTranscationDto) {
    return this.transcationsService.update(id, updateTranscationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transcationsService.remove(id);
  }
}
