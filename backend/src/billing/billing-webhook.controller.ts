import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

/**
 * Webhook controller for Stripe events
 * 
 * CRITICAL: This uses raw body (Buffer), not JSON parsing
 * For local testing with Stripe CLI:
 * 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Add webhook signing secret to .env: STRIPE_WEBHOOK_SECRET=whsec_...
 * 3. Run: stripe listen --forward-to localhost:8081/billing/webhook
 * 4. Copy the provided signing secret to .env
 * 5. Run: stripe trigger payment.intent.succeeded (to test)
 */
@Controller('billing/webhook')
@ApiTags('Billing - Webhooks')
export class BillingWebhookController {
  private logger = new Logger(BillingWebhookController.name);

  constructor(private stripeService: StripeService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
    description: 'Receives Stripe webhook events for subscription updates',
  })
  @ApiResponse({ status: 200, description: 'Webhook received and processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Body() rawBody: Buffer | string,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await this.stripeService.verifyWebhookSignature(rawBody, signature);
    } catch (error) {
      this.logger.error(`Webhook verification failed: ${error.message}`);
      throw error;
    }

    this.logger.debug(`Received webhook event: ${event.type}`);

    try {
      // Handle different webhook events
      switch (event.type) {
        // Subscription activation
        case 'checkout.session.completed':
          await this.stripeService.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        // Subscription updates (renewal, status change, trial ending)
        case 'customer.subscription.updated':
          await this.stripeService.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        // Subscription canceled
        case 'customer.subscription.deleted':
          await this.stripeService.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        // Payment failure
        case 'invoice.payment_failed':
          await this.stripeService.handlePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        // Payment success (invoice paid)
        case 'invoice.payment_succeeded':
          await this.stripeService.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice,
          );
          break;

        // Invoice paid (alternative event)
        case 'invoice.paid':
          await this.stripeService.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice,
          );
          break;

        // Unhandled events (just log and ignore)
        default:
          this.logger.debug(`Unhandled webhook event: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook handler error: ${error.message}`);
      // Still return 200 to acknowledge receipt; don't want Stripe to retry
      return { received: true, error: error.message };
    }
  }
}
