import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Define the User schema to match your current model
const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, required: true },
  password: String,
  phoneNumber: { type: String, required: false },
  address: { type: String, required: false },
  role: { type: String, enum: ["superadmin", "user"], default: "user" }
}, { timestamps: true });

// Define TypeScript interface
interface IUser {
  name: string;
  username: string;
  password: string;
  phoneNumber?: string;
  address?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

async function setupUsers(): Promise<void> {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Create superadmin
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Super Admin',
        username: 'admin',
        password: adminPassword,
        phoneNumber: '+1234567890',
        address: '123 Admin Street, Admin City, AC 12345',
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
        phoneNumber: '+1987654321',
        address: '456 Test Avenue, Test Town, TT 54321',
        role: 'user'
      });
      console.log('✅ Test user created: testuser / test123');
    } else {
      console.log('👤 Test user already exists: testuser / test123');
    }

    // List all users
    const allUsers = await User.find({}, 'username role name phoneNumber address');
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - ${user.name}`);
      if (user.phoneNumber) {
        console.log(`    📞 Phone: ${user.phoneNumber}`);
      }
      if (user.address) {
        console.log(`    📍 Address: ${user.address}`);
      }
    });

    console.log('\n🎉 Setup complete! You can now test your login page.');
    console.log('🌐 Start your server: npm run dev');
    console.log('🔗 Visit: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.name === 'MongooseServerSelectionError') {
      console.error('🔧 Make sure your IP is whitelisted in MongoDB Atlas');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setupUsers();
