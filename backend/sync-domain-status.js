/**
 * Quick script to re-sync domain status from Brevo API
 * This will update the database with the REAL verified status from Brevo
 */

const axios = require('axios');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vayperdb';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';

async function syncDomainStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Get BrevoDomain model
    const BrevoDomain = mongoose.model('BrevoDomain', new mongoose.Schema({}, { strict: false }), 'brevodomains');

    // Get all domains
    const domains = await BrevoDomain.find({});
    console.log(`\nFound ${domains.length} domain(s) to check:\n`);

    for (const domain of domains) {
      console.log(`\n🔍 Checking: ${domain.domain}`);
      
      try {
        // Call Brevo API
        const response = await axios.get(
          `${BREVO_API_URL}/senders/domains/${domain.domain}`,
          {
            headers: {
              'api-key': BREVO_API_KEY,
            },
          }
        );

        const brevoData = response.data;
        console.log(`   Brevo API says: verified=${brevoData.verified}, authenticated=${brevoData.authenticated}`);

        // Determine REAL status based on Brevo's response
        let realStatus = 'DNS_PENDING';
        let errorMessage = null;

        if (brevoData.verified === true || brevoData.authenticated === true) {
          realStatus = 'VERIFIED';
          console.log(`   ✅ Domain is ACTUALLY VERIFIED by Brevo`);
        } else {
          // Check DNS records
          const dnsRecords = brevoData.dns_records || {};
          const brevoCodeOk = dnsRecords.brevo_code?.status === true;
          const dkimOk = dnsRecords.dkim1Record?.status === true && dnsRecords.dkim2Record?.status === true;
          
          if (brevoCodeOk && dkimOk) {
            realStatus = 'DNS_PENDING';
            errorMessage = 'DNS records configured correctly. Waiting for Brevo to authenticate domain (this can take a few minutes to 48 hours).';
            console.log(`   ⏳ DNS is OK, but Brevo hasn't verified yet. Status: ${realStatus}`);
          } else {
            realStatus = 'FAILED';
            errorMessage = 'Some DNS records are not configured correctly.';
            console.log(`   ❌ DNS records have issues. Status: ${realStatus}`);
          }
        }

        // Update database with REAL status
        if (domain.status !== realStatus) {
          await BrevoDomain.updateOne(
            { _id: domain._id },
            { 
              $set: { 
                status: realStatus,
                errorMessage: errorMessage,
                lastCheckedAt: new Date()
              }
            }
          );
          console.log(`   🔄 Updated database: ${domain.status} → ${realStatus}`);
        } else {
          console.log(`   ✓ Status already correct: ${realStatus}`);
        }

      } catch (error) {
        console.error(`   ❌ Error checking domain: ${error.message}`);
      }
    }

    console.log('\n✅ Domain sync completed!\n');
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

syncDomainStatus();
