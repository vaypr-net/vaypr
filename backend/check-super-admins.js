const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://softwareforgeteam2_db_user:M8Gbq5CssbupvyZq@cluster0.bi0zshe.mongodb.net/';

async function main() {
  await mongoose.connect(MONGO_URI);

  const UserModel = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

  console.log('\n=== ALL SUPER ADMINS IN DB ===');
  const superAdmins = await UserModel.find({ isSuperAdmin: true }).select('email fullName isSuperAdmin').lean();
  console.log(JSON.stringify(superAdmins, null, 2));

  console.log('\n=== admin@vaypr.net ===');
  const newAdmin = await UserModel.findOne({ email: 'admin@vaypr.net' }).select('email fullName isSuperAdmin').lean();
  console.log(JSON.stringify(newAdmin, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
