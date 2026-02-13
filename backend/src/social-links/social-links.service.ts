import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdateSocialLinkDto } from './dto/update-social-link.dto';
import { ReorderSocialLinksDto } from './dto/reorder-social-links.dto';
import { SocialLink, SocialLinkDocument } from './entities/social-link.entity';

@Injectable()
export class SocialLinksService {
  constructor(
    @InjectModel(SocialLink.name)
    private socialLinkModel: Model<SocialLinkDocument>,
  ) {}

  async create(createSocialLinkDto: CreateSocialLinkDto) {
    // Get the highest order number and increment
    const highestOrder = await this.socialLinkModel
      .findOne()
      .sort({ order: -1 })
      .select('order')
      .lean();

    const order = createSocialLinkDto.order ?? (highestOrder?.order ?? 0) + 1;

    const socialLink = new this.socialLinkModel({
      ...createSocialLinkDto,
      order,
    });

    return socialLink.save();
  }

  async findAll() {
    return this.socialLinkModel.find().sort({ order: 1 }).lean();
  }

  async findPublic() {
    return this.socialLinkModel.find({ enabled: true }).sort({ order: 1 }).lean();
  }

  async findOne(id: string) {
    const link = await this.socialLinkModel.findById(id).lean();
    if (!link) {
      throw new NotFoundException('Social link not found');
    }
    return link;
  }

  async update(id: string, updateSocialLinkDto: UpdateSocialLinkDto) {
    const updated = await this.socialLinkModel
      .findByIdAndUpdate(id, updateSocialLinkDto, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException('Social link not found');
    }

    return updated;
  }

  async remove(id: string) {
    const result = await this.socialLinkModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Social link not found');
    }
    return { success: true, message: 'Social link deleted successfully' };
  }

  async reorder(reorderDto: ReorderSocialLinksDto) {
    const bulkOps = reorderDto.links.map((link) => ({
      updateOne: {
        filter: { _id: link.id },
        update: { $set: { order: link.order } },
      },
    }));

    await this.socialLinkModel.bulkWrite(bulkOps);

    return { success: true, message: 'Social links reordered successfully' };
  }

  async toggleEnabled(id: string) {
    const link = await this.socialLinkModel.findById(id);
    if (!link) {
      throw new NotFoundException('Social link not found');
    }

    link.enabled = !link.enabled;
    await link.save();

    return link;
  }
}
