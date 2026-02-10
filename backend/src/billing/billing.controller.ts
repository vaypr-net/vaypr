import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Controller('billing')
@ApiTags('Billing - Stripe Checkout Subscriptions')
@ApiBearerAuth()
export class BillingController {
  private logger = new Logger(BillingController.name);

  constructor(private stripeService: StripeService) {}

  /**
   * Create Stripe checkout session for plan subscription
   * User is redirected to Stripe Checkout page
   */
  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create checkout session for subscription',
    description: 'Creates a Stripe checkout session and returns the URL to redirect user to payment',
  })
  @ApiResponse({ status: 200, description: 'Checkout session created', schema: { example: { url: 'https://checkout.stripe.com/...' } } })
  @ApiResponse({ status: 400, description: 'Invalid plan or billing cycle' })
  async createCheckoutSession(
    @Body() body: CreateCheckoutSessionDto,
    @Request() req: any,
  ) {
    const { planId, billingCycle } = body;

    if (!planId || !billingCycle) {
      throw new BadRequestException('planId and billingCycle are required');
    }

    try {
      const result = await this.stripeService.createCheckoutSession(
        req.user.sub, // userId from JWT
        planId,
        billingCycle,
      );
      return result;
    } catch (error) {
      this.logger.error(`Checkout session error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create Stripe Billing Portal session
   * User can manage subscription, upgrade/downgrade, cancel, update payment method
   */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create billing portal session',
    description: 'Creates a Stripe Billing Portal session for subscription management',
  })
  @ApiResponse({ status: 200, description: 'Portal session created', schema: { example: { url: 'https://billing.stripe.com/...' } } })
  async createBillingPortal(@Request() req: any) {
    try {
      const result = await this.stripeService.createBillingPortalSession(
        req.user.sub, // userId from JWT
      );
      return result;
    } catch (error) {
      this.logger.error(`Billing portal error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription details for logged-in user
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current subscription info',
    description: 'Returns subscription status, current plan, and renewal date',
  })
  async getSubscriptionInfo(@Request() req: any) {
    try {
      const result = await this.stripeService.getSubscriptionInfo(req.user.sub);
      return result;
    } catch (error) {
      this.logger.error(`Get subscription error: ${error.message}`);
      throw error;
    }
  }
}
