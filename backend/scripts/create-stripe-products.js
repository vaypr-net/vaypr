/**
 * Create Stripe Products & Prices for local testing
 * 
 * Usage: node scripts/create-stripe-products.js
 * 
 * This script creates test products in your Stripe account in AED currency.
 * AED is used because it's supported by Stripe and available for Middle Eastern users.
 * 
 * Outputs the price IDs so you can update your MongoDB plans.
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  try {
    console.log('🚀 Creating Stripe Products & Prices (AED)...\n');

    // ============ CREATE PREMIUM/PRO PLAN ============
    console.log('📦 Creating PREMIUM Plan...');
    const premiumProduct = await stripe.products.create({
      name: 'Premium Plan',
      description: 'Unlimited access to all features',
      type: 'service',
      metadata: {
        planName: 'Premium',
        price: '100',
      },
    });
    console.log(`✅ Premium Product Created: ${premiumProduct.id}`);

    // Create monthly price for Premium (100 AED)
    const premiumMonthlyPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 10000, // 100 AED in cents
      currency: 'aed',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      metadata: {
        interval: 'monthly',
      },
    });
    console.log(`✅ Premium Monthly Price: ${premiumMonthlyPrice.id}`);

    // Create yearly price for Premium (1000 AED)
    const premiumYearlyPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 100000, // 1000 AED in cents
      currency: 'aed',
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      metadata: {
        interval: 'yearly',
      },
    });
    console.log(`✅ Premium Yearly Price: ${premiumYearlyPrice.id}\n`);

    // ============ CREATE BUSINESS PLAN ============
    console.log('📦 Creating BUSINESS Plan...');
    const businessProduct = await stripe.products.create({
      name: 'Business Plan',
      description: 'Advanced features for businesses',
      type: 'service',
      metadata: {
        planName: 'Business',
        price: '300',
      },
    });
    console.log(`✅ Business Product Created: ${businessProduct.id}`);

    // Create monthly price for Business (300 AED)
    const businessMonthlyPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 30000, // 300 AED in cents
      currency: 'aed',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      metadata: {
        interval: 'monthly',
      },
    });
    console.log(`✅ Business Monthly Price: ${businessMonthlyPrice.id}`);

    // Create yearly price for Business (3000 AED)
    const businessYearlyPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 300000, // 3000 AED in cents
      currency: 'aed',
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

    console.log('PREMIUM PLAN:');
    console.log(`  AED-monthly: "${premiumMonthlyPrice.id}"`);
    console.log(`  AED-yearly: "${premiumYearlyPrice.id}"\n`);

    console.log('BUSINESS PLAN:');
    console.log(`  AED-monthly: "${businessMonthlyPrice.id}"`);
    console.log(`  AED-yearly: "${businessYearlyPrice.id}"\n`);

    console.log('======================================');
    console.log('✨ Next steps:');
    console.log('1. Copy the price IDs above');
    console.log('2. Run: node scripts/setup-multi-currency-prices.js');
    console.log('3. Select each plan and configure AED prices');
    console.log('4. Test checkout in Swagger');
    console.log('======================================\n');

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    process.exit(1);
  }
}

createStripeProducts();
