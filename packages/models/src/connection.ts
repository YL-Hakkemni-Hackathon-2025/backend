import mongoose from 'mongoose';

let isConnected = false;

export interface DatabaseConfig {
  uri: string;
  dbName?: string;
}

export async function connectToDatabase(config: DatabaseConfig): Promise<typeof mongoose> {
  if (isConnected) {
    console.log('Using existing database connection');
    return mongoose;
  }

  try {
    const connection = await mongoose.connect(config.uri, {
      dbName: config.dbName || 'hakkemni'
    });

    isConnected = true;
    console.log('Successfully connected to MongoDB');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
  console.log('Disconnected from MongoDB');
}

export function isDatabaseConnected(): boolean {
  return isConnected;
}
