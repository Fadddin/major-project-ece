import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const db = connectDB.connection?.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const collection = db.collection('users');
    
    console.log('Dropping existing indexes...');
    
    // Drop existing indexes except _id
    const indexes = await collection.indexes();
    for (const index of indexes) {
      if (index.name !== '_id_') {
        console.log(`Dropping index: ${index.name}`);
        try {
          await collection.dropIndex(index.name);
        } catch (error) {
          console.log(`Could not drop index ${index.name}:`, error);
        }
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
    
    return NextResponse.json({
      success: true,
      message: 'Indexes fixed successfully',
      indexes: newIndexes.map(index => ({
        name: index.name,
        key: index.key,
        sparse: index.sparse || false
      }))
    });
  } catch (error) {
    console.error('Error fixing indexes:', error);
    return NextResponse.json(
      { error: 'Failed to fix indexes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
