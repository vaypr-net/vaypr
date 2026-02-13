#!/usr/bin/env node

/**
 * Script to set USD Stripe prices for Premium plan
 * 
 * Usage: node scripts/set-premium-prices.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Billing Plan Schema
const BillingPlanSchema = new mongoose.Schema({
  name: String,
  price: Number,
  currency: { type: String, default: 'KWD' },
  interval: String,
  status: { type: String, enum: ['active', 'hidden', 'archived'], default: 'active' },
  features: [String],
  limits: mongoose.Schema.Types.Mixed,
  isPopular: Boolean,
  subscriberCount: Number,
  stripePrices: { type: Map, of: String, default: new Map() },
  stripeMonthlyPriceId: String,
  stripeYearlyPriceId: String,
  createdAt: Date,
  updatedAt: Date,
});

const BillingPlan = mongoose.model('BillingPlan', BillingPlanSchema);

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Premium plan
    const premiumPlan = await BillingPlan.findOne({ name: 'Premium' });
    
    if (!premiumPlan) {
      console.log('❌ Premium plan not found');
      console.log('📝 Available plans:');
      const plans = await BillingPlan.find().select('name');
      plans.forEach(p => console.log(`  - ${p.name}`));
      process.exit(1);
    }

    console.log(`📌 Found Premium Plan: ${premiumPlan._id}`);
    
    // Set USD prices
    const stripePrices = {
      'USD-monthly': 'price_1T0Js6IIR6aBzb6cUdm8m542',
      'USD-yearly': 'price_1T0Js6IIR6aBzb6cAPuJRkVm',
    };

    const updated = await BillingPlan.findByIdAndUpdate(
      premiumPlan._id,
      { stripePrices },
      { new: true }
    );

    console.log('\n✅ Premium plan updated!\n');
    console.log('📊 Configured Stripe Prices:');
    Object.entries(updated.stripePrices).forEach(([key, priceId]) => {
      console.log(`  - ${key}: ${priceId}`);
    });

    // Also set Business plan if it exists
    const businessPlan = await BillingPlan.findOne({ name: 'Business' });
    
    if (businessPlan) {
      console.log(`\n📌 Found Business Plan: ${businessPlan._id}`);
      
      const businessPrices = {
        'USD-monthly': 'price_1T0Js8IIR6aBzb6cCl3la8tF',
        'USD-yearly': 'price_1T0Js8IIR6aBzb6c3baMINi4',
      };

      const updatedBusiness = await BillingPlan.findByIdAndUpdate(
        businessPlan._id,
        { stripePrices: businessPrices },
        { new: true }
      );

      console.log('✅ Business plan updated!\n');
      console.log('📊 Configured Stripe Prices:');
      Object.entries(updatedBusiness.stripePrices).forEach(([key, priceId]) => {
        console.log(`  - ${key}: ${priceId}`);
      });
    }

    console.log('\n✨ All done! You can now test checkout with KWD currency.');
    console.log('💡 The system will use USD prices and convert to KWD for display.\n');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
