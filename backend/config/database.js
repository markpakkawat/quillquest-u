const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    console.log('Starting MongoDB connection attempt...');
    console.log('MongoDB URI exists:', !!process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 60000,
    });
    
    console.log('Initial MongoDB Connection Successful');
    console.log('Connected to database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);

    // Get current connection state
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log('Connection state:', states[mongoose.connection.readyState]);

    mongoose.connection.on('connected', () => {
      console.log(`Mongoose connected to DB: ${mongoose.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

    // Add ping test
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.ping();
    console.log('MongoDB server ping successful:', serverStatus);

  } catch (error) {
    console.error('MongoDB connection failed:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    if (error.name === 'MongoServerSelectionError') {
      console.error([
        'Could not connect to MongoDB server.',
        'Common causes:',
        '1. MongoDB URI is incorrect',
        '2. MongoDB server is not running',
        '3. IP address is not whitelisted in MongoDB Atlas',
        '4. Network connectivity issues'
      ].join('\n'));
      
      // Log the actual URI (but mask credentials)
      const maskedUri = process.env.MONGO_URI?.replace(
        /:\/\/(.[^@]+)@/,
        '://*****:*****@'
      );
      console.log('Attempted connection with URI:', maskedUri);
    }
    throw error;
  }
};

module.exports = connectDB;