import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { ReorderFaqDto } from './dto/reorder-faq.dto';

@Controller('super-admin/faqs')
@UseGuards(SuperAdminGuard)
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  create(@Body() createFaqDto: CreateFaqDto) {
    return this.faqsService.create(createFaqDto);
  }

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('publishedOnly') publishedOnly?: string,
  ) {
    const published = publishedOnly === 'true' ? true : undefined;
    return this.faqsService.findAll({ category, publishedOnly: published });
  }

  @Get('categories/list')
  findCategories() {
    return this.faqsService.findCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.faqsService.findOne(id);
  }

  @Patch('reorder/bulk')
  reorder(@Body() body: { faqs: ReorderFaqDto[] }) {
    return this.faqsService.reorder(body.faqs || []);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return this.faqsService.update(id, updateFaqDto);
  }

  @Patch(':id/toggle-published')
  togglePublished(@Param('id') id: string) {
    return this.faqsService.togglePublished(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.faqsService.remove(id);
  }
}
