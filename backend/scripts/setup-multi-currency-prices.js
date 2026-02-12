#!/usr/bin/env node

/**
 * Script to set up Stripe prices for multiple currencies
 * 
 * Usage:
 * node scripts/setup-multi-currency-prices.js
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Lists all billing plans
 * 3. Allows you to configure Stripe price IDs for different currencies and billing cycles
 * 
 * Example Stripe price IDs:
 * - USD Monthly: price_1SQkQtIIR6aBzb6clBXnJqSk
 * - USD Yearly: price_1SQkQtIIR6aBzb6ctYZ1a2Bc
 * - AED Monthly: price_1SQkQtIIR6aBzb6cAED3m0Np
 * - AED Yearly: price_1SQkQtIIR6aBzb6cAED5xYqK
 */

const mongoose = require('mongoose');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

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
  stripeMonthlyPriceId: String, // Backward compatibility
  stripeYearlyPriceId: String, // Backward compatibility
  createdAt: Date,
  updatedAt: Date,
});

const BillingPlan = mongoose.model('BillingPlan', BillingPlanSchema);

const SUPPORTED_CURRENCIES = ['USD', 'AED', 'QAR', 'EGP', 'SAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP'];
const BILLING_CYCLES = ['monthly', 'yearly'];

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // List all plans
    const plans = await BillingPlan.find().sort({ price: 1 });
    
    if (plans.length === 0) {
      console.log('❌ No billing plans found');
      rl.close();
      process.exit(1);
    }

    console.log('📋 Available Billing Plans:');
    plans.forEach((plan, index) => {
      console.log(` ${index + 1}. ${plan.name} - $${plan.price}/${plan.interval}`);
    });

    const planIndex = await question('\nSelect plan number (or "exit" to quit): ');
    
    if (planIndex.toLowerCase() === 'exit') {
      rl.close();
      process.exit(0);
    }

    const selectedPlan = plans[parseInt(planIndex) - 1];
    
    if (!selectedPlan) {
      console.log('❌ Invalid selection');
      rl.close();
      process.exit(1);
    }

    console.log(`\n📌 Selected Plan: ${selectedPlan.name}`);
    console.log(`💰 Current Stripe Prices:`);
    
    if (selectedPlan.stripePrices && Object.keys(selectedPlan.stripePrices).length > 0) {
      Object.entries(selectedPlan.stripePrices).forEach(([key, priceId]) => {
        console.log(`  - ${key}: ${priceId}`);
      });
    } else {
      console.log('  (none configured)');
    }

    console.log(`\n🌍 Configure prices for currencies:\n`);

    const stripePrices = selectedPlan.stripePrices ? new Map(Object.entries(selectedPlan.stripePrices)) : new Map();

    for (const currency of SUPPORTED_CURRENCIES) {
      console.log(`\n💱 ${currency}`);
      
      for (const cycle of BILLING_CYCLES) {
        const key = `${currency}-${cycle}`;
        const current = stripePrices.get(key);
        const prompt = current 
          ? `  ${cycle} price ID (current: ${current}): ` 
          : `  ${cycle} price ID: `;
        
        const priceId = await question(prompt);
        
        if (priceId && priceId.trim()) {
          stripePrices.set(key, priceId.trim());
        }
      }
    }

    // Convert Map to Object for MongoDB
    const stripePricesObj = Object.fromEntries(stripePrices);

    console.log('\n✏️  Updating plan...');
    const updated = await BillingPlan.findByIdAndUpdate(
      selectedPlan._id,
      { stripePrices: stripePricesObj },
      { new: true },
    );

    console.log('\n✅ Plan updated successfully!\n');
    console.log('📊 Updated Stripe Prices:');
    Object.entries(updated.stripePrices).forEach(([key, priceId]) => {
      console.log(`  - ${key}: ${priceId}`);
    });

    const another = await question('\n🔄 Configure another plan? (yes/no): ');
    
    if (another.toLowerCase().startsWith('y')) {
      rl.close();
      main(); // Restart
    } else {
      rl.close();
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
