// Run this to see which plan your user is subscribed to
// node check-user-plan.js

const mongoose = require('mongoose');

async function checkUserPlan() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/vayper'); // Update if different
    
    // Define schemas
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'BillingPlan' },
      subscriptionStatus: String
    }), 'users');
    
    const BillingPlan = mongoose.model('BillingPlan', new mongoose.Schema({
      name: String,
      price: Number,
      currency: String,
      features: [String],
      limits: Object,
      status: String
    }), 'billing_plans');
    
    // Find your user and populate plan
    const user = await User.findOne({ email: 'saadhaneil443@gmail.com' }) // Update with your email
      .populate('planId');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('\n✅ USER SUBSCRIPTION INFO:');
    console.log('==========================');
    console.log('User Email:', user.email);
    console.log('Subscription Status:', user.subscriptionStatus);
    console.log('\n📋 SUBSCRIBED TO PLAN:');
    console.log('Plan ID:', user.planId?._id);
    console.log('Plan Name:', user.planId?.name);
    console.log('Plan Price:', user.planId?.price, user.planId?.currency);
    console.log('Plan Status:', user.planId?.status);
    console.log('Plan Features:', JSON.stringify(user.planId?.features, null, 2));
    console.log('Plan Limits:', JSON.stringify(user.planId?.limits, null, 2));
    
    // Find all available plans
    console.log('\n\n📦 ALL AVAILABLE PLANS:');
    console.log('======================');
    const allPlans = await BillingPlan.find();
    allPlans.forEach(plan => {
      const isCurrentPlan = user.planId?._id?.toString() === plan._id.toString();
      console.log(`\n${isCurrentPlan ? '🟢 CURRENT → ' : '⚪ '}Plan: ${plan.name}`);
      console.log(`   ID: ${plan._id}`);
      console.log(`   Price: ${plan.price} ${plan.currency}`);
      console.log(`   Status: ${plan.status}`);
      console.log(`   Features: ${plan.features?.length || 0} items`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserPlan();
