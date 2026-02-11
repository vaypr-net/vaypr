/**
 * Update billing plans with domain limits
 * 
 * Usage: node update-domain-limits.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function updateDomainLimits() {
  try {
    console.log('🔧 Updating Domain Limits on Plans...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection;
    const plansCollection = db.collection('billingplans');

    // Get all plans
    const plans = await plansCollection.find({}).toArray();

    console.log(`📋 Found ${plans.length} plans. Updating...\n`);

    for (const plan of plans) {
      let domainLimit = 0;
      let customEmailDomain = false;

      // Determine domain limits based on plan price
      if (plan.price === 0) {
        // Free plan
        domainLimit = 0; // Not allowed
        customEmailDomain = false;
        console.log(`📌 ${plan.name} (Free) → domains: 0, customEmailDomain: false`);
      } else if (plan.price === 91) {
        // Pro plan (based on your current price)
        domainLimit = 5; // 5 domains
        customEmailDomain = true;
        console.log(`📌 ${plan.name} (${plan.price} KWD) → domains: 5, customEmailDomain: true`);
      } else {
        // Generic pricing - adjust as needed
        domainLimit = 3;
        customEmailDomain = true;
        console.log(`📌 ${plan.name} (${plan.price} KWD) → domains: 3, customEmailDomain: true`);
      }

      // Update the plan
      const result = await plansCollection.updateOne(
        { _id: plan._id },
        {
          $set: {
            'limits.domains': domainLimit,
            'limits.customEmailDomain': customEmailDomain,
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`   ✅ Successfully updated\n`);
      } else {
        console.log(`   ⚠️  No changes made (already configured?)\n`);
      }
    }

    console.log('✅ All plans updated with domain limits!\n');

    // Show updated plans
    console.log('='.repeat(80));
    console.log('Updated Plans:\n');
    const updatedPlans = await plansCollection.find({}).toArray();
    updatedPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   Domains: ${plan.limits?.domains === -1 ? 'Unlimited' : (plan.limits?.domains === 0 ? 'Not allowed' : `${plan.limits?.domains} domains`)}`);
      console.log(`   Custom Email Domain: ${plan.limits?.customEmailDomain ? 'Enabled' : 'Disabled'}\n`);
    });

    await mongoose.connection.close();
    console.log('✅ Update complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateDomainLimits();
