import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq, FaqDocument } from './entities/faq.entity';
import { ReorderFaqDto } from './dto/reorder-faq.dto';

@Injectable()
export class FaqsService {
  constructor(
    @InjectModel(Faq.name)
    private faqModel: Model<FaqDocument>,
  ) {}

  create(createFaqDto: CreateFaqDto) {
    return this.createFaq(createFaqDto);
  }

  async createFaq(createFaqDto: CreateFaqDto): Promise<Faq> {
    let order = createFaqDto.order;
    if (order === undefined || order === null) {
      const lastFaq = await this.faqModel.findOne().sort({ order: -1 }).exec();
      order = (lastFaq?.order ?? -1) + 1;
    }

    const faq = new this.faqModel({
      ...createFaqDto,
      order,
      category: createFaqDto.category || 'General',
      published: createFaqDto.published ?? true,
    });
    return faq.save();
  }

  async findAll(filters?: {
    category?: string;
    publishedOnly?: boolean;
  }): Promise<Faq[]> {
    const query: Record<string, any> = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.publishedOnly === true) query.published = true;

    return this.faqModel.find(query).sort({ order: 1, createdAt: -1 }).exec();
  }

  async findCategories(): Promise<string[]> {
    const categories = await this.faqModel.distinct('category').exec();
    return categories.sort((a, b) => a.localeCompare(b));
  }

  async findOne(id: string): Promise<Faq> {
    const faq = await this.faqModel.findById(id).exec();
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  async update(id: string, updateFaqDto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.faqModel
      .findByIdAndUpdate(id, updateFaqDto, { new: true })
      .exec();
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  async togglePublished(id: string): Promise<Faq> {
    const faq = await this.faqModel
      .findByIdAndUpdate(id, [{ $set: { published: { $not: '$published' } } }], {
        new: true,
      })
      .exec();
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  async reorder(items: ReorderFaqDto[]): Promise<Faq[]> {
    if (items.length === 0) return this.findAll();

    await Promise.all(
      items.map(({ id, order }) =>
        this.faqModel.findByIdAndUpdate(id, { order }, { new: false }).exec(),
      ),
    );

    return this.findAll();
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.faqModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return { message: 'FAQ deleted successfully' };
  }
}
