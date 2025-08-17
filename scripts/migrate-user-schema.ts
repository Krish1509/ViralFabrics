import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface User {
  _id: mongoose.Types.ObjectId;
  username: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  isActive?: boolean;
  role?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

interface UpdateResult {
  modifiedCount: number;
}

async function migrateUserSchema(): Promise<void> {
  try {
    console.log('🔄 Starting User schema migration...');
    
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Step 1: Add missing fields with defaults
    console.log('📝 Step 1: Adding missing fields...');
    const updateResult: UpdateResult = await usersCollection.updateMany(
      { 
        $or: [
          { isActive: { $exists: false } },
          { email: { $exists: false } }
        ]
      },
      {
        $set: {
          isActive: true,
          email: null
        }
      }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} documents with missing fields`);
    
    // Step 2: Normalize usernames to lowercase
    console.log('📝 Step 2: Normalizing usernames...');
    const usersWithUpperCaseUsernames: User[] = await usersCollection.find({
      username: { $regex: /[A-Z]/ }
    }).toArray();
    
    for (const user of usersWithUpperCaseUsernames) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { username: user.username.toLowerCase() } }
      );
    }
    console.log(`✅ Normalized ${usersWithUpperCaseUsernames.length} usernames`);
    
    // Step 3: Trim string fields
    console.log('📝 Step 3: Trimming string fields...');
    const stringFields: (keyof User)[] = ['name', 'username', 'email', 'phoneNumber', 'address'];
    
    for (const field of stringFields) {
      const usersWithWhitespace: User[] = await usersCollection.find({
        [field]: { $regex: /^\s|\s$/ }
      }).toArray();
      
      for (const user of usersWithWhitespace) {
        const fieldValue = user[field];
        if (fieldValue && typeof fieldValue === 'string') {
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { [field]: fieldValue.trim() } }
          );
        }
      }
      console.log(`✅ Trimmed ${usersWithWhitespace.length} ${field} fields`);
    }
    
    // Step 4: Create indexes for performance
    console.log('📝 Step 4: Creating performance indexes...');
    
    // Drop existing indexes (except _id)
    const existingIndexes = await usersCollection.indexes();
    for (const index of existingIndexes) {
      if (index.name !== '_id_') {
        await usersCollection.dropIndex(index.name);
      }
    }
    
    // Create new optimized indexes
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 }, { sparse: true });
    await usersCollection.createIndex({ role: 1 });
    await usersCollection.createIndex({ isActive: 1 });
    await usersCollection.createIndex({ createdAt: -1 });
    await usersCollection.createIndex({ lastLogin: -1 });
    await usersCollection.createIndex({ name: 1 });
    
    // Compound indexes
    await usersCollection.createIndex({ username: 1, isActive: 1 });
    await usersCollection.createIndex({ role: 1, isActive: 1 });
    await usersCollection.createIndex({ createdAt: -1, isActive: 1 });
    await usersCollection.createIndex({ lastLogin: -1, isActive: 1 });
    await usersCollection.createIndex({ name: 1, isActive: 1 });
    await usersCollection.createIndex({ email: 1, isActive: 1 });
    
    // Text index for search
    await usersCollection.createIndex({
      name: "text",
      username: "text", 
      email: "text"
    }, {
      weights: {
        name: 3,
        username: 2,
        email: 1
      }
    });
    
    console.log('✅ Created all performance indexes');
    
    // Step 5: Generate migration report
    console.log('📝 Step 5: Generating migration report...');
    const totalUsers = await usersCollection.countDocuments();
    const activeUsers = await usersCollection.countDocuments({ isActive: true });
    const superadmins = await usersCollection.countDocuments({ role: 'superadmin' });
    const regularUsers = await usersCollection.countDocuments({ role: 'user' });
    
    console.log('\n📊 Migration Report:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Active users: ${activeUsers}`);
    console.log(`   Superadmins: ${superadmins}`);
    console.log(`   Regular users: ${regularUsers}`);
    console.log(`   Inactive users: ${totalUsers - activeUsers}`);
    
    console.log('\n✅ User schema migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUserSchema()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateUserSchema };
