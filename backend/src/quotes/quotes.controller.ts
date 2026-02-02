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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  create(@Body() createQuoteDto: CreateQuoteDto, @Request() req) {
    return this.quotesService.create(createQuoteDto, req.user.sub);
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    if (status) {
      return this.quotesService.findByStatus(status, req.user.sub);
    }
    return this.quotesService.findAll(req.user.sub);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string, @Request() req) {
    return this.quotesService.findByClient(clientId, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.quotesService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
    @Request() req,
  ) {
    return this.quotesService.update(id, updateQuoteDto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.quotesService.remove(id, req.user.sub);
  }
}
