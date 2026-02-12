import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';

/**
 * Public FAQs Controller
 * 
 * Allows unauthenticated users to view published FAQs
 * Used by the landing page and public FAQ sections
 */
@ApiTags('faqs-public')
@Controller('faqs')
export class FaqsPublicController {
  constructor(private readonly faqsService: FaqsService) {}

  /**
   * Get all published FAQs
   * Used by: Landing page, public FAQ sections
   * Authentication: Not required
   */
  @ApiOperation({ summary: 'Get all published FAQs' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @Get('published')
  async getPublishedFaqs(@Query('category') category?: string) {
    return this.faqsService.findAll({
      publishedOnly: true,
      category: category,
    });
  }

  /**
   * Get all categories that have published FAQs
   * Used by: Landing page FAQ filter
   * Authentication: Not required
   */
  @ApiOperation({ summary: 'Get categories with published FAQs' })
  @Get('categories/public')
  async getPublishedCategories() {
    const faqs = await this.faqsService.findAll({
      publishedOnly: true,
    });

    // Extract unique categories from published FAQs
    const categories = Array.from(new Set(faqs.map((faq) => faq.category))).sort(
      (a, b) => a.localeCompare(b),
    );

    return categories;
  }
}
