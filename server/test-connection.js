const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🔧 Testing MongoDB Atlas connection...');
    
    const mongoURI = 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log('🌐 Database: bioping');
    console.log('🔗 Cluster: cluster0.f2z1iic.mongodb.net');
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.length);
    
    console.log('🎉 Connection test passed!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
};

testConnection(); 