require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, required: true },
  password: String,
  role: { type: String, enum: ["superadmin", "user"], default: "user" }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function setupUsers() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create superadmin
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Super Admin',
        username: 'admin',
        password: adminPassword,
        role: 'superadmin'
      });
      console.log('✅ Superadmin created: admin / admin123');
    } else {
      console.log('👑 Superadmin already exists: admin / admin123');
    }

    // Create test user
    const userExists = await User.findOne({ username: 'testuser' });
    if (!userExists) {
      const userPassword = await bcrypt.hash('test123', 10);
      await User.create({
        name: 'Test User',
        username: 'testuser',
        password: userPassword,
        role: 'user'
      });
      console.log('✅ Test user created: testuser / test123');
    } else {
      console.log('👤 Test user already exists: testuser / test123');
    }

    // List all users
    const allUsers = await User.find({}, 'username role name');
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - ${user.name}`);
    });

    console.log('\n🎉 Setup complete! You can now test your login page.');
    console.log('🌐 Start your server: npm run dev');
    console.log('🔗 Visit: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('🔧 Make sure your IP is whitelisted in MongoDB Atlas');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setupUsers();
