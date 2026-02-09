const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

const brevoDomainSchema = new mongoose.Schema({}, { strict: false });
const BrevoDomain = mongoose.model('BrevoDomain', brevoDomainSchema, 'brevo_domains');

async function addDomain() {
  try {
    const domain = 'softwareforge.tech';
    
    // Check if domain already exists
    const existing = await BrevoDomain.findOne({ domain });
    
    if (existing) {
      console.log(`✓ Domain already exists. Updating status to VERIFIED...`);
      const updated = await BrevoDomain.findOneAndUpdate(
        { domain },
        { status: 'VERIFIED' },
        { new: true }
      );
      console.log(`✓ Updated:`, updated);
    } else {
      console.log(`Creating domain: ${domain}`);
      const newDomain = new BrevoDomain({
        domain: domain,
        status: 'VERIFIED',
        createdAt: new Date(),
      });
      
      const saved = await newDomain.save();
      console.log(`✓ Domain added:`, saved);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setTimeout(() => {
  console.error('Operation timeout');
  process.exit(1);
}, 15000);

addDomain();
