/**
 * Check if domain limits are configured on billing plans
 * 
 * Usage: node check-domain-limits.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function checkDomainLimits() {
  try {
    console.log('📊 Checking Domain Limits Configuration...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the BillingPlan collection
    const db = mongoose.connection;
    const plans = await db.collection('billingplans').find({}).toArray();

    if (plans.length === 0) {
      console.log('❌ No billing plans found in database');
      console.log('   You need to create plans first');
      process.exit(1);
    }

    console.log(`📋 Found ${plans.length} billing plans:\n`);
    console.log('='.repeat(100));
    
    let hasDomainsConfigured = false;

    plans.forEach((plan, index) => {
      const domains = plan.limits?.domains;
      const customEmailDomain = plan.limits?.customEmailDomain;
      const hasConfig = domains !== undefined && customEmailDomain !== undefined;
      
      if (hasConfig) hasDomainsConfigured = true;

      console.log(`\n${index + 1}. Plan: ${plan.name}`);
      console.log(`   Price: ${plan.price} ${plan.currency} (${plan.interval})`);
      console.log(`   Status: ${plan.status}`);
      console.log(`   Limits:`);
      
      if (plan.limits) {
        console.log(`   - Invoices: ${plan.limits.invoices === -1 ? 'Unlimited' : plan.limits.invoices}`);
        console.log(`   - Quotes: ${plan.limits.quotes === -1 ? 'Unlimited' : plan.limits.quotes}`);
        console.log(`   - Clients: ${plan.limits.clients === -1 ? 'Unlimited' : plan.limits.clients}`);
        
        // Domain limits
        if (domains !== undefined) {
          const domainText = domains === -1 ? 'Unlimited' : (domains === 0 ? 'Not allowed' : `${domains} domains`);
          console.log(`   - Domains: ${domainText} ✅`);
        } else {
          console.log(`   - Domains: NOT SET ❌`);
        }
        
        if (customEmailDomain !== undefined) {
          console.log(`   - Custom Email Domain: ${customEmailDomain ? 'Enabled' : 'Disabled'} ✅`);
        } else {
          console.log(`   - Custom Email Domain: NOT SET ❌`);
        }
      } else {
        console.log(`   ❌ NO LIMITS CONFIGURED`);
      }
    });

    console.log('\n' + '='.repeat(100));
    
    if (!hasDomainsConfigured) {
      console.log('\n⚠️  Domain limits are NOT configured on any plans');
      console.log('\nTo fix this, you need to update your plans with domain limits.');
      console.log('Example domain limit configurations:');
      console.log('  - Free plan: domains: 0 (not allowed)');
      console.log('  - Basic plan: domains: 1');
      console.log('  - Pro plan: domains: 5');
      console.log('  - Enterprise: domains: -1 (unlimited)');
    } else {
      console.log('\n✅ Domain limits are properly configured!');
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDomainLimits();
