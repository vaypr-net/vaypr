const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB using the cloud URI from env
mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function updateUserDomain() {
  try {
    const emails = ['saadmustafa@softwareforge.tech', 'ali@softwareforge.tech'];
    
    for (const email of emails) {
      console.log(`Updating user: ${email}`);

      // Update the user with the specific email
      const result = await User.findOneAndUpdate(
        { email: email },
        { $set: { brandingDomain: 'softwareforge.tech' } },
        { new: true }
      );

      if (result) {
        console.log(`✓ ${email} updated - brandingDomain: ${result.brandingDomain}`);
      } else {
        console.log(`✗ ${email} not found`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Set timeout to exit after 15 seconds if the operation hangs
setTimeout(() => {
  console.error('Operation timeout');
  process.exit(1);
}, 15000);

updateUserDomain();
