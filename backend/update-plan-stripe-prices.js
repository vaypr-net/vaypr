/**
 * Update billing plan with Stripe prices
 * 
 * Usage: node update-plan-stripe-prices.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function updateStripePrices() {
  try {
    console.log('🔧 Updating Stripe Prices on "new one" Plan...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection;
    const plansCollection = db.collection('billingplans');

    // Find the "new one" plan
    const plan = await plansCollection.findOne({ name: "new one" });
    
    if (!plan) {
      console.log('❌ Plan "new one" not found!');
      process.exit(1);
    }

    console.log('📋 Found plan:', plan.name);
    console.log('📋 Current stripePrices:', plan.stripePrices || 'Not set');

    // Update with Stripe prices
    // Using AED prices created by create-stripe-products.js
    const stripePrices = {
      'AED-monthly': 'price_1T0MDaIIR6aBzb6c71GzvEbk', // 100 AED monthly
      'AED-yearly': 'price_1T0MDaIIR6aBzb6cWOEbyvjc',  // 1000 AED yearly
    };

    const result = await plansCollection.updateOne(
      { _id: plan._id },
      { 
        $set: { stripePrices } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log('\n✅ Successfully updated plan with Stripe prices!');
      console.log('📦 stripePrices:', stripePrices);
    } else {
      console.log('\n⚠️  No changes made (prices might already be set)');
    }

    // Verify the update
    const updatedPlan = await plansCollection.findOne({ _id: plan._id });
    console.log('\n✅ Verified update:');
    console.log('   Plan:', updatedPlan.name);
    console.log('   stripePrices:', updatedPlan.stripePrices);

    await mongoose.connection.close();
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateStripePrices();
