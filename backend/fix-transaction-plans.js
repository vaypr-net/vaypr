/**
 * Migration script to fix transaction plan names
 * Converts ObjectId plan references to plan names
 * Also updates refund status from pending to refunded
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vayper';

async function migrateTransactionPlans() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const transactionsCollection = db.collection('transactions');
    const billingPlansCollection = db.collection('billingplans');
    
    // Find all transactions where plan looks like an ObjectId (24 hex characters)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const transactionsToFix = await transactionsCollection.find({
      plan: { $regex: objectIdPattern }
    }).toArray();
    
    console.log(`Found ${transactionsToFix.length} transactions with ObjectId plan references`);
    
    let updated = 0;
    let failed = 0;
    
    for (const transaction of transactionsToFix) {
      try {
        // Look up the plan name
        const plan = await billingPlansCollection.findOne({
          _id: new mongoose.Types.ObjectId(transaction.plan)
        });
        
        if (plan && plan.name) {
          // Update the transaction with plan name
          const updateFields = {
            plan: plan.name
          };
          
          // Also update refund status from pending to refunded
          if (transaction.type === 'refund' && transaction.status === 'pending') {
            updateFields.status = 'refunded';
          }
          
          await transactionsCollection.updateOne(
            { _id: transaction._id },
            { $set: updateFields }
          );
          
          console.log(`✓ Updated transaction ${transaction.transactionId}: plan "${transaction.plan}" → "${plan.name}"${updateFields.status ? ' | status: refunded' : ''}`);
          updated++;
        } else {
          console.warn(`✗ Plan not found for ID ${transaction.plan} (transaction ${transaction.transactionId})`);
          failed++;
        }
      } catch (error) {
        console.error(`✗ Error updating transaction ${transaction.transactionId}:`, error.message);
        failed++;
      }
    }
    
    console.log('\n=== Migration Complete ===');
    console.log(`Total transactions processed: ${transactionsToFix.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateTransactionPlans()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script error:', error);
    process.exit(1);
  });
