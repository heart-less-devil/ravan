const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_ATLAS_URI = 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';

// Test MongoDB Atlas connection
const testMongoDBAtlas = async () => {
  try {
    console.log('🔍 Testing MongoDB Atlas Connection...\n');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log(`🔗 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    console.log(`📊 Collection: bioping/users\n`);
    
    // Test query
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    
    console.log(`👥 Total users found: ${userCount}`);
    
    if (userCount > 0) {
      // Show sample user
      const sampleUser = await usersCollection.findOne({});
      console.log(`\n📋 Sample user data:`);
      console.log(`   Email: ${sampleUser.email}`);
      console.log(`   Name: ${sampleUser.firstName} ${sampleUser.lastName}`);
      console.log(`   Company: ${sampleUser.company}`);
      console.log(`   Plan: ${sampleUser.currentPlan}`);
      console.log(`   Created: ${sampleUser.createdAt}`);
    }
    
    // Test BDTracker collection
    const bdCollection = db.collection('bdtrackers');
    const bdCount = await bdCollection.countDocuments();
    console.log(`\n📋 BD Tracker projects: ${bdCount}`);
    
    console.log(`\n🕒 Test completed at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Connection closed');
    }
    process.exit(0);
  }
};

// Run the test
testMongoDBAtlas();
