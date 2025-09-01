const mongoose = require('mongoose');
const User = require('./models/User');
const BDTracker = require('./models/BDTracker');
require('dotenv').config();

// MongoDB Atlas connection string
const MONGODB_ATLAS_URI = 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`🔗 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    console.log(`📊 Collection: bioping/users\n`);
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    process.exit(1);
  }
};

// Format date exactly like admin panel
const formatAdminDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

// Get user status
const getUserStatus = (user) => {
  if (user.suspended && user.suspended.suspendedUntil) {
    const now = new Date();
    const suspendUntil = new Date(user.suspended.suspendedUntil);
    if (now < suspendUntil) {
      return 'Suspended';
    }
  }
  return 'Active';
};

// Fetch and display admin panel data
const fetchAdminPanelData = async () => {
  try {
    console.log('🔍 Fetching Admin Panel Data from MongoDB Atlas...\n');
    
    // Fetch all users sorted by creation date (newest first)
    const users = await User.find({}).lean().sort({ createdAt: -1 });
    const bdTrackers = await BDTracker.find({}).lean();
    
    console.log(`📊 Total Users Found: ${users.length}`);
    console.log(`📋 Total BD Tracker Projects: ${bdTrackers.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // ========================================
    // 👥 REGISTERED USERS (Exact Admin Panel Format)
    // ========================================
    console.log('👥 REGISTERED USERS (Exact Admin Panel Format):');
    console.log('=' .repeat(100));
    
    users.forEach((user, index) => {
      const status = getUserStatus(user);
      const joinDate = formatAdminDate(user.createdAt);
      
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   ${user.email}\t${user.password ? user.password : 'N/A📋'}\t${user.company}\t${user.role}\t${joinDate}\t${status}`);
      
      // Additional details
      console.log(`   📅 Created: ${user.createdAt}`);
      console.log(`   🔄 Updated: ${user.updatedAt}`);
      console.log(`   ✅ Verified: ${user.isVerified ? 'Yes' : 'No'}`);
      console.log(`   🟢 Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   💳 Plan: ${user.currentPlan}`);
      console.log(`   💰 Credits: ${user.currentCredits || 0}`);
      console.log(`   💳 Payment: ${user.paymentCompleted ? 'Completed' : 'Pending'}`);
      
      if (user.subscriptionId) {
        console.log(`   🆔 Subscription ID: ${user.subscriptionId}`);
      }
      
      if (user.subscriptionEndAt) {
        console.log(`   ⏰ Expires: ${formatAdminDate(user.subscriptionEndAt)}`);
      }
      
      if (user.nextCreditRenewal) {
        console.log(`   🔄 Next Renewal: ${formatAdminDate(user.nextCreditRenewal)}`);
      }
      
      // BD Tracker projects for this user
      const userBDTracks = bdTrackers.filter(track => track.userId === user.email);
      if (userBDTracks.length > 0) {
        console.log(`   📋 BD Projects: ${userBDTracks.length}`);
        userBDTracks.forEach((track, trackIndex) => {
          console.log(`      ${trackIndex + 1}. ${track.projectName} - ${track.company} (${track.status})`);
        });
      }
      
      console.log('   ' + '-'.repeat(80));
    });

    // ========================================
    // 📊 SUMMARY STATISTICS
    // ========================================
    console.log('\n📊 SUMMARY STATISTICS:');
    console.log('=' .repeat(50));
    
    const activeUsers = users.filter(u => u.isActive);
    const verifiedUsers = users.filter(u => u.isVerified);
    const paidUsers = users.filter(u => u.paymentCompleted);
    const testUsers = users.filter(u => u.currentPlan === 'test');
    const suspendedUsers = users.filter(u => getUserStatus(u) === 'Suspended');
    
    console.log(`   • Total Users: ${users.length}`);
    console.log(`   • Active Users: ${activeUsers.length}`);
    console.log(`   • Verified Users: ${verifiedUsers.length}`);
    console.log(`   • Paid Customers: ${paidUsers.length}`);
    console.log(`   • Test Accounts: ${testUsers.length}`);
    console.log(`   • Suspended Users: ${suspendedUsers.length}`);
    console.log(`   • Unique Companies: ${new Set(users.map(u => u.company)).size}`);

    // ========================================
    // 📋 BD TRACKER PROJECTS
    // ========================================
    console.log('\n📋 BD TRACKER PROJECTS:');
    console.log('=' .repeat(50));
    
    if (bdTrackers.length > 0) {
      bdTrackers.forEach((track, index) => {
        console.log(`\n${index + 1}. PROJECT: ${track.projectName}`);
        console.log(`   🏢 Company: ${track.company}`);
        console.log(`   👤 User: ${track.userId}`);
        console.log(`   📊 Status: ${track.status}`);
        console.log(`   ⚡ Priority: ${track.priority}`);
        console.log(`   👨‍💼 Contact: ${track.contactPerson}`);
        console.log(`   🎯 Function: ${track.contactFunction}`);
        console.log(`   📅 Created: ${formatAdminDate(track.createdAt)}`);
        console.log(`   🔄 Updated: ${formatAdminDate(track.updatedAt)}`);
        console.log('   ' + '-'.repeat(40));
      });
    } else {
      console.log('   No BD Tracker projects found');
    }

    // ========================================
    // 🔗 DATABASE INFO
    // ========================================
    console.log('\n🔗 DATABASE INFO:');
    console.log('=' .repeat(50));
    console.log(`   • Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   • Collection: bioping/users`);
    console.log(`   • Connection: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`   • Host: ${mongoose.connection.host}`);
    console.log(`   • Port: ${mongoose.connection.port}`);
    console.log(`   • Query Time: ${new Date().toISOString()}`);

    // ========================================
    // 💾 EXPORT DATA
    // ========================================
    const exportData = {
      summary: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        verifiedUsers: verifiedUsers.length,
        paidUsers: paidUsers.length,
        testUsers: testUsers.length,
        suspendedUsers: suspendedUsers.length,
        totalBDProjects: bdTrackers.length,
        generatedAt: new Date().toISOString(),
        databaseInfo: {
          name: mongoose.connection.db.databaseName,
          collection: 'bioping/users',
          host: mongoose.connection.host,
          port: mongoose.connection.port
        }
      },
      users: users.map(user => ({
        ...user,
        status: getUserStatus(user),
        joinDate: formatAdminDate(user.createdAt),
        bdTrackerProjects: bdTrackers.filter(track => track.userId === user.email).length
      })),
      bdTrackers: bdTrackers,
      adminPanelFormat: users.map(user => ({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        password: user.password || 'N/A📋',
        company: user.company,
        role: user.role,
        joinDate: formatAdminDate(user.createdAt),
        status: getUserStatus(user)
      }))
    };

    const fs = require('fs');
    const fileName = `admin-panel-exact-data-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Admin Panel Data exported to: ${fileName}`);

  } catch (error) {
    console.error('❌ Error fetching admin panel data:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Continuous fetching function
const startContinuousFetching = async (intervalMinutes = 5) => {
  console.log(`🚀 Starting continuous data fetching every ${intervalMinutes} minutes...\n`);
  
  // Initial fetch
  await fetchAdminPanelData();
  
  // Set up continuous fetching
  setInterval(async () => {
    console.log(`\n🔄 Auto-fetching data at ${new Date().toLocaleString()}...`);
    await fetchAdminPanelData();
  }, intervalMinutes * 60 * 1000);
  
  console.log(`✅ Continuous fetching active. Next fetch in ${intervalMinutes} minutes.`);
  console.log('Press Ctrl+C to stop.\n');
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--continuous') || args.includes('-c')) {
      const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 5;
      await startContinuousFetching(interval);
    } else {
      // Single fetch
      await fetchAdminPanelData();
      mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
    
  } catch (error) {
    console.error('❌ Main execution error:', error.message);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fetchAdminPanelData, connectDB, startContinuousFetching };
