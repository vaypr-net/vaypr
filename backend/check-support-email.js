const mongoose = require('mongoose');

const uri = 'mongodb://vayprnet_db_user:E2R4QuhuVjGKC4ro@ac-8dzruq3-shard-00-00.jmjgsut.mongodb.net:27017,ac-8dzruq3-shard-00-01.jmjgsut.mongodb.net:27017,ac-8dzruq3-shard-00-02.jmjgsut.mongodb.net:27017/vaypr?ssl=true&replicaSet=atlas-6v1nq1-shard-0&authSource=admin&appName=Cluster0';

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const docs = await db.collection('superadminsettings')
    .find({}, { projection: { supportEmail: 1, userId: 1 } })
    .toArray();

  console.log('\n=== superadminsettings.supportEmail in DB ===');
  docs.forEach(d => console.log(`_id: ${d._id} | userId: ${d.userId} | supportEmail: ${d.supportEmail}`));
  console.log('==============================================\n');

  await mongoose.disconnect();
}

main().catch(console.error);
