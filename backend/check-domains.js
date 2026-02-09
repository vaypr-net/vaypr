const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

const brevoDomainSchema = new mongoose.Schema({}, { strict: false });
const BrevoDomain = mongoose.model('BrevoDomain', brevoDomainSchema, 'brevo_domains');

async function checkDomains() {
  try {
    const domains = await BrevoDomain.find();
    
    console.log('📋 Brevo Domains in Database:');
    console.log('================================');
    
    if (domains.length === 0) {
      console.log('❌ No domains found in local database!');
    } else {
      domains.forEach(d => {
        console.log(`\nDomain: ${d.domain}`);
        console.log(`Status: ${d.status}`);
        console.log(`Created: ${d.createdAt}`);
      });
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

checkDomains();
