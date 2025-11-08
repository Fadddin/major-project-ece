const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/majorProject');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixIndexes = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    console.log('Dropping existing indexes...');
    
    // Drop existing indexes except _id
    const indexes = await collection.indexes();
    for (const index of indexes) {
      if (index.name !== '_id_') {
        console.log(`Dropping index: ${index.name}`);
        await collection.dropIndex(index.name);
      }
    }
    
    console.log('Creating new indexes...');
    
    // Create new indexes with proper sparse configuration
    await collection.createIndex({ rfid: 1 }, { unique: true });
    await collection.createIndex({ employeeId: 1 }, { unique: true, sparse: true });
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    
    console.log('Indexes created successfully!');
    
    // Verify the indexes
    const newIndexes = await collection.indexes();
    console.log('Current indexes:');
    newIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} (sparse: ${index.sparse || false})`);
    });
    
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

fixIndexes();
