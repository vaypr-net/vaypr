/**
 * Manual Webhook Trigger Script
 * 
 * This script manually triggers the checkout.session.completed webhook
 * to create a transaction record in the database
 * 
 * Run: node trigger-webhook.js <subscription_id>
 * Example: node trigger-webhook.js sub_1T1RHgIIR6aBzb6clNARjg0b
 */

const Stripe = require('stripe');
require('dotenv').config();

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:8081/billing/webhook';

const stripe = new Stripe(STRIPE_KEY);

async function triggerWebhook(subscriptionId) {
  try {
    console.log('\n🎯 MANUAL WEBHOOK TRIGGER\n');
    console.log('='.repeat(60));

    if (!subscriptionId) {
      console.log('❌ Please provide subscription ID');
      console.log('Usage: node trigger-webhook.js sub_xxxxx');
      process.exit(1);
    }

    console.log(`📡 Fetching subscription: ${subscriptionId}`);
    
    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });

    console.log(`✅ Found subscription for customer: ${subscription.customer}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Amount: ${subscription.items.data[0].price.unit_amount / 100} ${subscription.items.data[0].price.currency}`);

    // Get the customer to find checkout session
    const customer = await stripe.customers.retrieve(subscription.customer);
    console.log(`\n👤 Customer email: ${customer.email}`);

    // Find a recent checkout session for this subscription
    console.log(`\n🔍 Finding checkout session for this subscription...`);
    const sessions = await stripe.checkout.sessions.list({
      customer: subscription.customer,
      status: 'complete',
      limit: 1,
    });

    if (sessions.data.length === 0) {
      console.log('❌ No completed checkout session found for this customer');
      console.log('\nManual workaround:');
      console.log('1. Go to Stripe Dashboard → Events');
      console.log('2. Find "checkout.session.completed" event');
      console.log('3. Click "Send to endpoint" → /billing/webhook');
      process.exit(1);
    }

    const session = sessions.data[0];
    console.log(`✅ Found session: ${session.id}`);

    // Manually call your webhook endpoint
    console.log(`\n📨 Sending webhook to: ${WEBHOOK_URL}`);

    // Create the webhook event payload
    const webhookPayload = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: {
        id: null,
        idempotency_key: null,
      },
      type: 'checkout.session.completed',
    };

    // Get webhook signing secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log('\n⚠️  WARNING: STRIPE_WEBHOOK_SECRET not set in .env');
      console.log('Need to sign the webhook. Set STRIPE_WEBHOOK_SECRET to continue.\n');

      // Just POST without signature for testing
      console.log('Attempting to send webhook without signature (test mode)...\n');
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(webhookPayload),
      });

      console.log(`Response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`Response: ${responseText}`);
    } else {
      // Sign with webhook secret
      const crypto = require('crypto');
      const timestamp = Math.floor(Date.now() / 1000);
      const signedContent = `${timestamp}.${JSON.stringify(webhookPayload)}`;
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedContent)
        .digest('base64');
      const stripeSignature = `t=${timestamp},v1=${signature}`;

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': stripeSignature,
        },
        body: JSON.stringify(webhookPayload),
      });

      console.log(`✅ Webhook sent!`);
      console.log(`Response status: ${response.status}`);
      const responseData = await response.text();
      console.log(`Response: ${responseData}`);
    }

    console.log('\n✅ Check your database - transaction should be created now!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get subscription ID from command line
const subscriptionId = process.argv[2];
triggerWebhook(subscriptionId);
