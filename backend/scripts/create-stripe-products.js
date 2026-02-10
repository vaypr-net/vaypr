/**
 * Create Stripe Products & Prices for local testing
 * 
 * Usage: node scripts/create-stripe-products.js
 * 
 * This script creates test products in your Stripe account and outputs
 * the price IDs so you can update your MongoDB plans
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  try {
    console.log('🚀 Creating Stripe Products & Prices...\n');

    // ============ CREATE PRO PLAN ============
    console.log('📦 Creating PRO Plan...');
    const proProduct = await stripe.products.create({
      name: 'Upedge Pro',
      description: 'Unlimited Quotes, Receipts & Clients',
      type: 'service',
      metadata: {
        planName: 'Upedge Technology',
        price: '91',
      },
    });
    console.log(`✅ Pro Product Created: ${proProduct.id}`);

    // Create monthly price for Pro
    const proMonthlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 9100, // 91 KWD in cents
      currency: 'kwd',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      metadata: {
        interval: 'monthly',
      },
    });
    console.log(`✅ Pro Monthly Price: ${proMonthlyPrice.id}`);

    // Create yearly price for Pro
    const proYearlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 109200, // ~1092 KWD (91*12) in cents
      currency: 'kwd',
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      metadata: {
        interval: 'yearly',
      },
    });
    console.log(`✅ Pro Yearly Price: ${proYearlyPrice.id}\n`);

    // ============ CREATE BUSINESS PLAN (Optional - if you want) ============
    console.log('📦 Creating BUSINESS Plan...');
    const businessProduct = await stripe.products.create({
      name: 'Upedge Business',
      description: 'Everything in Pro + Team Members & Advanced Features',
      type: 'service',
      metadata: {
        planName: 'Upedge Technology Business',
        price: '200',
      },
    });
    console.log(`✅ Business Product Created: ${businessProduct.id}`);

    // Create monthly price for Business
    const businessMonthlyPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 20000, // 200 KWD in cents
      currency: 'kwd',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      metadata: {
        interval: 'monthly',
      },
    });
    console.log(`✅ Business Monthly Price: ${businessMonthlyPrice.id}`);

    // Create yearly price for Business
    const businessYearlyPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 240000, // 2400 KWD (200*12) in cents
      currency: 'kwd',
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      metadata: {
        interval: 'yearly',
      },
    });
    console.log(`✅ Business Yearly Price: ${businessYearlyPrice.id}\n`);

    // ============ OUTPUT RESULTS ============
    console.log('======================================');
    console.log('📋 COPY THESE PRICES TO MONGODB:');
    console.log('======================================\n');

    console.log('PRO PLAN (6984957966ee608f9c95bec4):');
    console.log(`  stripeMonthlyPriceId: "${proMonthlyPrice.id}"`);
    console.log(`  stripeYearlyPriceId: "${proYearlyPrice.id}"\n`);

    console.log('BUSINESS PLAN (Create new or use existing):');
    console.log(`  stripeMonthlyPriceId: "${businessMonthlyPrice.id}"`);
    console.log(`  stripeYearlyPriceId: "${businessYearlyPrice.id}"\n`);

    console.log('======================================');
    console.log('✨ Next steps:');
    console.log('1. Copy the price IDs above');
    console.log('2. Update MongoDB plans with these IDs');
    console.log('3. Test checkout in Swagger');
    console.log('======================================\n');

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    process.exit(1);
  }
}

createStripeProducts();
