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
import { BillingPlanService } from './billing-plan.service';
import { CreateBillingPlanDto } from './dto/create-billing-plan.dto';
import { UpdateBillingPlanDto } from './dto/update-billing-plan.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('super-admin/billing-plans')
@UseGuards(SuperAdminGuard)
export class BillingPlanController {
  constructor(private readonly billingPlanService: BillingPlanService) {}

  @Post()
  create(@Body() createBillingPlanDto: CreateBillingPlanDto) {
    return this.billingPlanService.create(createBillingPlanDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.billingPlanService.findAll(
      status,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('stats')
  getStats() {
    return this.billingPlanService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billingPlanService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBillingPlanDto: UpdateBillingPlanDto) {
    return this.billingPlanService.update(id, updateBillingPlanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.billingPlanService.remove(id);
  }
}

