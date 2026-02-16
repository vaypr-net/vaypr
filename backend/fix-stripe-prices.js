/**
 * Fix Stripe Prices Script
 * 
 * This script:
 * 1. Lists all current plans in the database
 * 2. Shows their current Stripe prices (old/incorrect rates)
 * 3. Deletes old incorrect prices
 * 4. Creates new prices with correct 11.97 KWD→AED rate
 * 
 * Run: node fix-stripe-prices.js
 */

const mongoose = require('mongoose');
const Stripe = require('stripe');
require('dotenv').config();

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(STRIPE_KEY);

async function fixStripePrices() {
  try {
    console.log('\n🔧 STRIPE PRICES FIX SCRIPT\n');
    console.log('='.repeat(60));

    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/vayper';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected!\n');

    // Define schemas
    const billingPlanSchema = new mongoose.Schema({
      name: String,
      price: Number,
      currency: String,
      stripeProductId: String,
      stripePrices: mongoose.Schema.Types.Mixed,
      stripeMonthlyPriceId: String,
      stripeYearlyPriceId: String,
    }, { collection: 'billing_plans' });

    const BillingPlan = mongoose.model('BillingPlan', billingPlanSchema);

    // Fetch all plans
    const plans = await BillingPlan.find();
    console.log(`📋 Found ${plans.length} billing plans\n`);

    if (plans.length === 0) {
      console.log('No plans found!');
      await mongoose.disconnect();
      return;
    }

    // New conversion rate
    const KWD_TO_AED_RATE = 11.97;

    console.log('PLAN ANALYSIS:');
    console.log('='.repeat(60));

    for (const plan of plans) {
      console.log(`\n📌 Plan: ${plan.name}`);
      console.log(`   Price: ${plan.price} KWD`);
      console.log(`   Stripe Product: ${plan.stripeProductId || 'NONE'}`);

      // Check current prices
      if (plan.stripeMonthlyPriceId) {
        console.log(`   Current Monthly Price ID: ${plan.stripeMonthlyPriceId}`);
        try {
          const monthlyPrice = await stripe.prices.retrieve(plan.stripeMonthlyPriceId);
          console.log(`     Amount: ${monthlyPrice.unit_amount} cents = ${monthlyPrice.unit_amount / 100} ${monthlyPrice.currency.toUpperCase()}`);
          console.log(`     ❌ OLD RATE: 30 KWD × 3.31 = 99 AED`);
        } catch (e) {
          console.log(`     ⚠️  Price not found or deleted`);
        }
      }

      if (plan.stripeYearlyPriceId) {
        console.log(`   Current Yearly Price ID: ${plan.stripeYearlyPriceId}`);
        try {
          const yearlyPrice = await stripe.prices.retrieve(plan.stripeYearlyPriceId);
          console.log(`     Amount: ${yearlyPrice.unit_amount} cents = ${yearlyPrice.unit_amount / 100} ${yearlyPrice.currency.toUpperCase()}`);
        } catch (e) {
          console.log(`     ⚠️  Price not found or deleted`);
        }
      }

      // Show what NEW prices should be
      console.log(`\n   ✅ NEW CORRECT PRICES (11.97 rate):`);
      const monthlyAED = Math.round(plan.price * KWD_TO_AED_RATE);
      const yearlyAED = Math.round(monthlyAED * 12 * 0.9); // 10% discount
      console.log(`     Monthly: ${plan.price} KWD → ${monthlyAED} AED (${monthlyAED * 100} cents)`);
      console.log(`     Yearly (10% discount): ${yearlyAED} AED (${yearlyAED * 100} cents)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Backup your current Stripe prices (save the IDs above)');
    console.log('2. Delete old incorrect prices from Stripe Dashboard');
    console.log('3. Clear stripePrices from billing plans in database');
    console.log('4. Restart backend server');
    console.log('5. Create a new test plan (it will auto-sync to Stripe)');
    console.log('\n💡 Or run: npm run start:dev (and the next plan creation will use 11.97!)');

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixStripePrices();
