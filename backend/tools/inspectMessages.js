require('dotenv').config();
const connectDB = require('../config/db');

async function run(a, b) {
  if (!a || !b) {
    console.error('Usage: node inspectMessages.js <idA> <idB>');
    process.exit(1);
  }
  const db = await connectDB();
  const msgs = await db.collection('messages').find({
    $or: [
      { senderId: String(a), receiverId: String(b) },
      { senderId: String(b), receiverId: String(a) },
    ],
  }).sort({ timestamp: 1 }).toArray();

  console.log('Found', msgs.length, 'messages');
  console.dir(msgs, { depth: null });
  process.exit(0);
}

run(process.argv[2], process.argv[3]).catch(err => { console.error(err); process.exit(2); });
