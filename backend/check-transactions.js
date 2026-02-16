// Script to check transactions in database
// Run: node check-transactions.js

const mongoose = require('mongoose');
require('dotenv').config();

async function checkTransactions() {
  try {
    console.log('\n🔍 Checking Transactions in Database...\n');
    
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/vayper';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB\n');
    
    // Define Transaction schema
    const transactionSchema = new mongoose.Schema({
      transactionId: String,
      userId: mongoose.Schema.Types.ObjectId,
      subscriberEmail: String,
      subscriberName: String,
      amount: Number,
      currency: String,
      type: String,
      provider: String,
      status: String,
      plan: String,
      transactionDate: Date,
      stripeEventId: String,
      stripeCheckoutSessionId: String,
      stripeSubscriptionId: String,
      billingCycle: String,
    }, { collection: 'transactions' });
    
    const Transaction = mongoose.model('Transaction', transactionSchema);
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      fullName: String,
      subscriptionStatus: String,
    }), 'users');
    
    // Count total transactions
    const totalTransactions = await Transaction.countDocuments();
    console.log(`📊 Total Transactions in Database: ${totalTransactions}\n`);
    
    if (totalTransactions === 0) {
      console.log('⚠️  No transactions found in database yet.\n');
      console.log('This could mean:');
      console.log('  1. No one has completed a subscription purchase');
      console.log('  2. Stripe webhook is not being received');
      console.log('  3. Transaction creation is failing\n');
      
      // Check if any users have active subscriptions
      const usersWithSubscriptions = await User.find({
        subscriptionStatus: { $in: ['active', 'trialing', 'past_due'] }
      }).limit(5);
      
      if (usersWithSubscriptions.length > 0) {
        console.log('⚠️  But found users with active subscriptions:');
        usersWithSubscriptions.forEach(user => {
          console.log(`   - ${user.email} (${user.subscriptionStatus})`);
        });
        console.log('\n📝 This suggests webhooks are working but transactions not being recorded.');
      }
    } else {
      console.log('📋 Recent Transactions:\n');
      
      const recentTransactions = await Transaction.find()
        .sort({ transactionDate: -1 })
        .limit(10);
      
      recentTransactions.forEach((tx, idx) => {
        console.log(`${idx + 1}. Transaction ID: ${tx.transactionId}`);
        console.log(`   Email: ${tx.subscriberEmail}`);
        console.log(`   Amount: ${tx.amount} ${tx.currency}`);
        console.log(`   Plan: ${tx.plan}`);
        console.log(`   Type: ${tx.type}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Date: ${new Date(tx.transactionDate).toLocaleString()}`);
        console.log(`   Billing Cycle: ${tx.billingCycle}`);
        console.log(`   Stripe Subscription: ${tx.stripeSubscriptionId}`);
        console.log('');
      });
      
      // Summary by status
      console.log('\n📈 Transaction Summary:\n');
      const statusSummary = await Transaction.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
      ]);
      
      statusSummary.forEach(summary => {
        console.log(`  ${summary._id.toUpperCase()}: ${summary.count} transactions (${summary.totalAmount} total)`);
      });
      
      // Summary by plan
      console.log('\n📦 Transactions by Plan:\n');
      const planSummary = await Transaction.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ]);
      
      planSummary.forEach(summary => {
        console.log(`  ${summary._id}: ${summary.count} transactions`);
      });
    }
    
    console.log('\n✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkTransactions();
