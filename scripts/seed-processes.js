const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Process schema (simplified version for seeding)
const processSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Process = mongoose.model('Process', processSchema);

// Default process priorities based on your requirements
const DEFAULT_PROCESS_PRIORITIES = {
  'Lot No Greigh': 1,
  'Charkha': 2,
  'Drum': 3,
  'Soflina WR': 4,
  'long jet': 5,
  'setting': 6,
  'In Dyeing': 7,
  'jigar': 8,
  'in printing': 9,
  'loop': 10,
  'washing': 11,
  'Finish': 12,
  'folding': 13,
  'ready to dispatch': 14
};

// Function to get default processes for seeding
function getDefaultProcessesForSeeding() {
  return Object.entries(DEFAULT_PROCESS_PRIORITIES).map(([name, priority]) => ({
    name,
    priority,
    description: `Default process: ${name} with priority ${priority}`
  }));
}

async function seedProcesses() {
  try {
    console.log('🌱 Starting process seeding...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get default processes
    const defaultProcesses = getDefaultProcessesForSeeding();
    console.log(`📋 Found ${defaultProcesses.length} default processes to seed`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    // Seed each process
    for (const processData of defaultProcesses) {
      try {
        // Check if process already exists
        const existingProcess = await Process.findOne({ 
          name: { $regex: processData.name, $options: 'i' } 
        });
        
        if (existingProcess) {
          console.log(`⏭️  Skipping "${processData.name}" - already exists`);
          skippedCount++;
          continue;
        }
        
        // Create new process
        const process = new Process(processData);
        await process.save();
        console.log(`✅ Created process: "${processData.name}" (Priority: ${processData.priority})`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Error creating process "${processData.name}":`, error.message);
      }
    }
    
    console.log('\n📊 Seeding Summary:');
    console.log(`✅ Created: ${createdCount} processes`);
    console.log(`⏭️  Skipped: ${skippedCount} processes`);
    console.log(`📋 Total: ${defaultProcesses.length} processes`);
    
    // Display all processes sorted by priority
    console.log('\n📋 All Processes (sorted by priority):');
    const allProcesses = await Process.find({ isActive: true })
      .sort({ priority: -1, name: 1 })
      .select('name priority description');
    
    allProcesses.forEach((process, index) => {
      console.log(`${index + 1}. ${process.name} (Priority: ${process.priority})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding processes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding
if (require.main === module) {
  seedProcesses()
    .then(() => {
      console.log('🎉 Process seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Process seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProcesses };
