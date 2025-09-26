#!/usr/bin/env node

/**
 * Database optimization script for Users collection
 * Run this script to create indexes for faster user queries
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function optimizeUsersDatabase() {
  try {
    console.log('🔧 Optimizing Users database...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-admin');
    console.log('✅ Connected to database');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Create indexes for faster queries
    const indexes = [
      // Index for sorting by createdAt (most important for users page)
      { key: { createdAt: -1 }, name: 'createdAt_-1' },
      
      // Index for username lookups
      { key: { username: 1 }, name: 'username_1', unique: true },
      
      // Index for role filtering
      { key: { role: 1 }, name: 'role_1' },
      
      // Index for active status filtering
      { key: { isActive: 1 }, name: 'isActive_1' },
      
      // Compound index for common queries
      { key: { isActive: 1, createdAt: -1 }, name: 'isActive_1_createdAt_-1' }
    ];
    
    console.log('📊 Creating indexes...');
    
    for (const index of indexes) {
      try {
        await usersCollection.createIndex(index.key, { 
          name: index.name,
          background: true // Create index in background to avoid blocking
        });
        console.log(`✅ Created index: ${index.name}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`ℹ️  Index already exists: ${index.name}`);
        } else {
          console.log(`⚠️  Error creating index ${index.name}:`, error.message);
        }
      }
    }
    
    // Get index information
    const indexList = await usersCollection.indexes();
    console.log('\n📋 Current indexes on users collection:');
    indexList.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n🚀 Database optimization complete!');
    console.log('💡 Users page should now load much faster.');
    
  } catch (error) {
    console.error('❌ Error optimizing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the optimization
optimizeUsersDatabase();
