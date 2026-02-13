const mongoose = require('mongoose');
require('dotenv').config();

const BillingPlanSchema = new mongoose.Schema({}, { strict: false });
const BillingPlan = mongoose.model('BillingPlan', BillingPlanSchema, 'billingplans');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Update Premium plan (ID: 698eeed082623fcad28ce2b5) with AED prices
    const result = await BillingPlan.findByIdAndUpdate(
      '698eeed082623fcad28ce2b5',
      {
        stripePrices: {
          'AED-monthly': 'price_1T0K2pIIR6aBzb6c0tNqIKco',
          'AED-yearly': 'price_1T0K2qIIR6aBzb6cFC7CKo5g',
        }
      },
      { new: true }
    );
    
    if (result) {
      console.log('✅ Premium plan updated with AED prices!');
      console.log('📊 Stripe Prices:', result.stripePrices);
    } else {
      console.log('❌ Plan not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
