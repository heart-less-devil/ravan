const mongoose = require('mongoose');
const User = require('./models/User');
const BDTracker = require('./models/BDTracker');
require('dotenv').config();

// Connect to MongoDB with fresh data
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    
    // Force fresh connection and disable caching
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`🔗 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`📊 Collections: ${(await mongoose.connection.db.listCollections().toArray()).map(c => c.name).join(', ')}\n`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Format date for display
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Calculate trial status
const getTrialStatus = (user) => {
  if (user.currentPlan === 'test') return 'Test Account';
  if (user.currentPlan === 'free' && !user.paymentCompleted) return 'Free Trial';
  if (user.paymentCompleted) return 'Paid Customer';
  return 'Inactive';
};

// Calculate days since registration
const getDaysSinceRegistration = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Main function to fetch and display user data
const fetchUserData = async () => {
  try {
    console.log('🔍 Fetching FRESH user data from MongoDB...\n');
    
    // Force fresh data by clearing any cached queries
    mongoose.connection.db.collection('users').stats().then(stats => {
      console.log(`📊 Users Collection Stats:`);
      console.log(`   • Total Documents: ${stats.count}`);
      console.log(`   • Storage Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   • Index Size: ${(stats.totalIndexSize / 1024).toFixed(2)} KB\n`);
    });
    
    // Fetch all users with no caching
    const users = await User.find({}).lean().sort({ createdAt: -1 });
    const bdTrackers = await BDTracker.find({}).lean();
    
    console.log(`📊 Total Users Found: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // Group users by status
    const activeUsers = users.filter(u => u.isActive);
    const verifiedUsers = users.filter(u => u.isVerified);
    const paidUsers = users.filter(u => u.paymentCompleted);
    const testUsers = users.filter(u => u.currentPlan === 'test');
    
    console.log('📈 USER STATISTICS:');
    console.log(`   • Total Users: ${users.length}`);
    console.log(`   • Active Users: ${activeUsers.length}`);
    console.log(`   • Verified Users: ${verifiedUsers.length}`);
    console.log(`   • Paid Customers: ${paidUsers.length}`);
    console.log(`   • Test Accounts: ${testUsers.length}\n`);

    // Display detailed user information
    console.log('👥 REGISTERED USERS DETAILS:');
    console.log('=' .repeat(120));
    
    users.forEach((user, index) => {
      const daysSinceReg = getDaysSinceRegistration(user.createdAt);
      const trialStatus = getTrialStatus(user);
      const lastLogin = user.lastLogin ? formatDate(user.lastLogin) : 'Never';
      const updatedAt = user.updatedAt ? formatDate(user.updatedAt) : 'N/A';
      
      console.log(`\n${index + 1}. USER: ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏢 Company: ${user.company}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   📅 Created: ${formatDate(user.createdAt)} (${daysSinceReg} days ago)`);
      console.log(`   🔄 Last Updated: ${updatedAt}`);
      console.log(`   ✅ Verified: ${user.isVerified ? 'Yes' : 'No'}`);
      console.log(`   🟢 Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   🕒 Last Login: ${lastLogin}`);
      
      // Subscription details
      console.log(`   💳 SUBSCRIPTION:`);
      console.log(`      • Plan: ${user.currentPlan.toUpperCase()}`);
      console.log(`      • Status: ${trialStatus}`);
      console.log(`      • Payment Completed: ${user.paymentCompleted ? 'Yes' : 'No'}`);
      console.log(`      • Credits: ${user.currentCredits}`);
      
      if (user.subscriptionId) {
        console.log(`      • Subscription ID: ${user.subscriptionId}`);
      }
      
      if (user.subscriptionEndAt) {
        console.log(`      • Expires: ${formatDate(user.subscriptionEndAt)}`);
      }
      
      if (user.nextCreditRenewal) {
        console.log(`      • Next Renewal: ${formatDate(user.nextCreditRenewal)}`);
      }
      
      // BD Tracker data for this user
      const userBDTracks = bdTrackers.filter(track => track.userId === user.email);
      if (userBDTracks.length > 0) {
        console.log(`   📋 BD TRACKER PROJECTS: ${userBDTracks.length}`);
        userBDTracks.forEach((track, trackIndex) => {
          console.log(`      ${trackIndex + 1}. ${track.projectName} - ${track.company}`);
          console.log(`         Status: ${track.status}, Priority: ${track.priority}`);
          console.log(`         Contact: ${track.contactPerson} (${track.contactFunction})`);
          console.log(`         Created: ${formatDate(track.createdAt)}`);
        });
      }
      
      console.log('   ' + '-'.repeat(80));
    });

    // Summary by plan type
    console.log('\n📊 SUBSCRIPTION BREAKDOWN:');
    console.log('=' .repeat(50));
    
    const planCounts = {};
    users.forEach(user => {
      const plan = user.currentPlan;
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });
    
    Object.entries(planCounts).forEach(([plan, count]) => {
      console.log(`   ${plan.toUpperCase()}: ${count} users`);
    });

    // Recent activity (last 30 days)
    console.log('\n🕒 RECENT ACTIVITY (Last 30 days):');
    console.log('=' .repeat(50));
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = users.filter(user => 
      new Date(user.createdAt) > thirtyDaysAgo || 
      (user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo) ||
      (user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo)
    );
    
    if (recentUsers.length > 0) {
      recentUsers.forEach(user => {
        const activity = [];
        if (new Date(user.createdAt) > thirtyDaysAgo) {
          activity.push('New Registration');
        }
        if (user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo) {
          activity.push('Recent Login');
        }
        if (user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo) {
          activity.push('Profile Updated');
        }
        console.log(`   ${user.email}: ${activity.join(', ')}`);
      });
    } else {
      console.log('   No recent activity found');
    }

    // Show database connection info
    console.log('\n🔗 DATABASE INFO:');
    console.log('=' .repeat(50));
    console.log(`   • Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   • Connection: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`   • Host: ${mongoose.connection.host}`);
    console.log(`   • Port: ${mongoose.connection.port}`);
    console.log(`   • Query Time: ${new Date().toISOString()}`);

    // Export data to JSON file
    const exportData = {
      summary: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        verifiedUsers: verifiedUsers.length,
        paidUsers: paidUsers.length,
        testUsers: testUsers.length,
        generatedAt: new Date().toISOString(),
        databaseInfo: {
          name: mongoose.connection.db.databaseName,
          host: mongoose.connection.host,
          port: mongoose.connection.port
        }
      },
      users: users.map(user => ({
        ...user,
        daysSinceRegistration: getDaysSinceRegistration(user.createdAt),
        trialStatus: getTrialStatus(user),
        bdTrackerProjects: bdTrackers.filter(track => track.userId === user.email).length
      }))
    };

    const fs = require('fs');
    const fileName = `user-data-export-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Data exported to: ${fileName}`);

  } catch (error) {
    console.error('❌ Error fetching user data:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
};

// Run the script
if (require.main === module) {
  connectDB().then(() => {
    fetchUserData();
  });
}

module.exports = { fetchUserData, connectDB };
