/**
 * Script: Update Pro Plan with Stripe Price IDs
 * 
 * Purpose: Sets the Stripe price IDs for the Pro plan in MongoDB
 * 
 * Usage:
 *   npx ts-node scripts/update-pro-plan-stripe-ids.ts
 * 
 * Environment Variables Required:
 *   MONGODB_URI - MongoDB connection string
 *   STRIPE_MONTHLY_PRICE_ID - Stripe monthly price ID (e.g., price_1SzBwYIIR6aBzb6cHwxsYfNk)
 *   STRIPE_YEARLY_PRICE_ID - Stripe yearly price ID (e.g., price_1SzByUIIR6aBzb6cgyhBh5av)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Define BillingPlan schema inline
const billingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'KWD' },
  interval: { type: String, enum: ['monthly', 'yearly'], required: true },
  status: { type: String, enum: ['active', 'hidden', 'archived'], default: 'active' },
  features: [String],
  limits: {
    invoices: Number,
    quotes: Number,
    clients: Number,
    teamMembers: Number,
    storage: String,
    receipts: Number,
    recurringInvoices: Number,
    expenseTracking: Boolean,
    invoiceTemplates: String,
  },
  isPopular: { type: Boolean, default: false },
  subscriberCount: { type: Number, default: 0 },
  stripeMonthlyPriceId: String,
  stripeYearlyPriceId: String,
  createdAt: Date,
  updatedAt: Date,
});

const BillingPlan = mongoose.model('BillingPlan', billingPlanSchema);

async function updateProPlanStripeIds() {
  try {
    // Validate environment variables
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1SzBwYIIR6aBzb6cHwxsYfNk';
    const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID || 'price_1SzByUIIR6aBzb6cgyhBh5av';

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find pro plan by price (91 KWD)
    console.log('🔍 Looking for Pro plan (91 KWD)...');
    const proPlan = await BillingPlan.findOne({
      price: 91,
    });

    if (!proPlan) {
      console.warn('⚠️  Pro plan (91 KWD) not found in database');
      console.log('📋 Available plans:');
      const allPlans = await BillingPlan.find({}, 'name price');
      allPlans.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.price} ${plan.currency || 'KWD'})`);
      });
      process.exit(1);
    }

    console.log(`\n📝 Updating Pro plan with Stripe price IDs:`);
    console.log(`   Plan ID: ${proPlan._id}`);
    console.log(`   Current Monthly Price ID: ${proPlan.stripeMonthlyPriceId || 'NOT SET'}`);
    console.log(`   Current Yearly Price ID: ${proPlan.stripeYearlyPriceId || 'NOT SET'}`);

    // Update the plan
    proPlan.stripeMonthlyPriceId = monthlyPriceId;
    proPlan.stripeYearlyPriceId = yearlyPriceId;
    await proPlan.save();

    console.log(`\n✅ Pro plan updated successfully!`);
    console.log(`   New Monthly Price ID: ${monthlyPriceId}`);
    console.log(`   New Yearly Price ID: ${yearlyPriceId}`);

    // Verify other plans (if any paid plans exist)
    console.log('\n📋 All billing plans in database:');
    const allPlans = await BillingPlan.find({}, 'name price stripeMonthlyPriceId stripeYearlyPriceId');
    allPlans.forEach(plan => {
      const monthly = plan.stripeMonthlyPriceId ? '✅' : '❌';
      const yearly = plan.stripeYearlyPriceId ? '✅' : '❌';
      console.log(
        `   - ${plan.name.padEnd(15)} (${plan.price} KWD) | Monthly: ${monthly} | Yearly: ${yearly}`
      );
    });

    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
updateProPlanStripeIds();
