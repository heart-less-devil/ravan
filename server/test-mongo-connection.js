const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB Connection...\n');
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`🔗 Connecting to: ${mongoURI.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Collections found:`);
    collections.forEach(col => {
      console.log(`   • ${col.name}`);
    });
    
    // Check users collection specifically
    const usersCollection = mongoose.connection.db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`\n👥 Users collection: ${userCount} documents`);
    
    if (userCount > 0) {
      // Show a sample user
      const sampleUser = await usersCollection.findOne({});
      console.log(`\n📋 Sample user data:`);
      console.log(`   Email: ${sampleUser.email}`);
      console.log(`   Created: ${sampleUser.createdAt}`);
      console.log(`   Updated: ${sampleUser.updatedAt}`);
      console.log(`   Company: ${sampleUser.company}`);
    }
    
    // Check BDTracker collection
    const bdCollection = mongoose.connection.db.collection('bdtrackers');
    const bdCount = await bdCollection.countDocuments();
    console.log(`\n📋 BD Tracker collection: ${bdCount} documents`);
    
    console.log(`\n🕒 Query Time: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
      console.log('\n🔌 Connection closed');
    }
  }
};

testConnection();
