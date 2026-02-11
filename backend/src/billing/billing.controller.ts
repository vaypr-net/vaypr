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
import {
  CancelSubscriptionDto,
  CancellationConfirmationDto,
  CancellationPreviewDto,
  CancellationReason,
  CancellationMethod,
} from './dto/cancel-subscription.dto';

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

  /**
   * Get available cancellation reasons
   * Used by frontend to populate cancellation form
   */
  @Get('cancellation-reasons')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get cancellation reasons',
    description: 'Returns list of available cancellation reasons for the cancellation form',
  })
  @ApiResponse({
    status: 200,
    description: 'List of cancellation reasons',
    schema: {
      example: {
        reasons: [
          { value: 'too_expensive', label: 'Too expensive' },
          { value: 'switching_to_competitor', label: 'Switching to competitor' },
          { value: 'missing_features', label: 'Missing features' },
          { value: 'poor_quality', label: 'Poor quality' },
          { value: 'not_using', label: 'Not using it' },
          { value: 'other', label: 'Other' },
        ],
      },
    },
  })
  getCancellationReasons() {
    return {
      reasons: [
        { value: CancellationReason.TOO_EXPENSIVE, label: 'Too expensive' },
        {
          value: CancellationReason.SWITCHING_TO_COMPETITOR,
          label: 'Switching to competitor',
        },
        {
          value: CancellationReason.MISSING_FEATURES,
          label: 'Missing features',
        },
        { value: CancellationReason.POOR_QUALITY, label: 'Poor quality' },
        {
          value: CancellationReason.NOT_USING,
          label: 'Not using it',
        },
        { value: CancellationReason.OTHER, label: 'Other' },
      ],
    };
  }

  /**
   * Get cancellation preview
   * Shows user what will happen if they cancel
   */
  @Post('cancellation-preview')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cancellation preview',
    description: 'Shows what will happen to the subscription if canceled (refund amount, end date, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cancellation preview',
    type: CancellationPreviewDto,
  })
  async getCancellationPreview(
    @Body('method') method: 'immediate' | 'at_period_end' = 'immediate',
    @Request() req: any,
  ) {
    try {
      return await this.stripeService.getCancellationPreview(
        req.user.sub,
        method,
      );
    } catch (error) {
      this.logger.error(`Cancellation preview error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel subscription
   * Handles immediate or at_period_end cancellations
   * Can issue refunds based on strategy
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancels user subscription immediately or at period end, with optional refund',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled successfully',
    type: CancellationConfirmationDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid cancellation request or no active subscription',
  })
  async cancelSubscription(
    @Body() body: CancelSubscriptionDto,
    @Request() req: any,
  ) {
    try {
      const { method, refundStrategy, reason, feedback } = body;

      return await this.stripeService.cancelSubscription(
        req.user.sub,
        method,
        refundStrategy,
        reason,
        feedback,
      );
    } catch (error) {
      this.logger.error(`Cancel subscription error: ${error.message}`);
      throw error;
    }
  }
}
