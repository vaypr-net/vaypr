import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BillingPlanService } from './billing-plan.service';

/**
 * Public Billing Plans Controller
 * 
 * Allows unauthenticated users to view available subscription plans
 * Used by the pricing page and plan selection
 */
@ApiTags('billing-plans')
@Controller('billing-plans')
export class BillingPlanPublicController {
  constructor(private readonly billingPlanService: BillingPlanService) {}

  /**
   * Get all active billing plans
   * Used by: Pricing page, plan selection UI
   * Authentication: None required
   */
  @ApiOperation({ summary: 'Get all active billing plans' })
  @ApiQuery({ name: 'status', required: false, example: 'active' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @Get()
  findAll(
    @Query('status') status: string = 'active',
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    return this.billingPlanService.findAll(
      status,
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
  }

  /**
   * Get a single billing plan by ID
   * Used by: Plan detail page, subscription confirmation
   * Authentication: None required
   */
  @ApiOperation({ summary: 'Get a single billing plan' })
  @Get(':id')
  findOne(@Query('id') id: string) {
    return this.billingPlanService.findOne(id);
  }
}
