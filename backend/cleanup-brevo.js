const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://vaypr:vaypr123@cluster0.tgs9pdu.mongodb.net/vaypr?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('[Cleanup] Connected to MongoDB');
  
  // Delete all Brevo domains
  const result = await mongoose.connection.collection('brevodomains').deleteMany({});
  console.log(`[Cleanup] Deleted ${result.deletedCount} Brevo domain records`);
  
  // Verify
  const count = await mongoose.connection.collection('brevodomains').countDocuments();
  console.log(`[Cleanup] Remaining records: ${count}`);
  
  await mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error('[Cleanup] Error:', err.message);
  process.exit(1);
});
