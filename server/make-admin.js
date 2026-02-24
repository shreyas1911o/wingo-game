/**
 * make-admin.js
 * Run once to promote a user to admin:
 *   node make-admin.js YOUR_MOBILE_NUMBER
 */

const mongoose = require('mongoose');
require('dotenv').config();

const mobile = process.argv[2];

if (!mobile) {
    console.error('Usage: node make-admin.js YOUR_MOBILE_NUMBER');
    process.exit(1);
}

const userSchema = new mongoose.Schema({ mobile: String, isAdmin: Boolean }, { strict: false });
const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const result = await User.updateOne({ mobile }, { $set: { isAdmin: true } });
    if (result.matchedCount === 0) {
        console.log(`✗ No user found with mobile: ${mobile}`);
        console.log('  → Register first at http://localhost:3000/register, then run this script.');
    } else {
        console.log(`✓ ${mobile} is now an admin!`);
        console.log('  → Log out and log back in at http://localhost:3000/login');
        console.log('  → You will see a red ADMIN badge on the dashboard.');
    }
    mongoose.disconnect();
});
