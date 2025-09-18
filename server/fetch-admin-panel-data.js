const mongoose = require('mongoose');
const User = require('./models/User');
const BDTracker = require('./models/BDTracker');
require('dotenv').config();

// Connect to MongoDB with fresh data
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`🔗 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}\n`);
    
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
    minute: '2-digit'
  });
};

// Calculate days since registration
const getDaysSinceRegistration = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get trial status
const getTrialStatus = (user) => {
  if (user.currentPlan === 'test') return 'Test Account';
  if (user.currentPlan === 'free' && !user.paymentCompleted) return 'Free Trial';
  if (user.paymentCompleted) return 'Paid Customer';
  return 'Inactive';
};

// Get suspension status
const getSuspensionStatus = (user) => {
  if (!user.suspended) return null;
  
  const now = new Date();
  const suspendUntil = new Date(user.suspended.suspendedUntil);
  
  if (now < suspendUntil) {
    return {
      status: 'suspended',
      timeRemaining: Math.ceil((suspendUntil - now) / (24 * 60 * 60 * 1000))
    };
  } else {
    return {
      status: 'expired',
      timeRemaining: 0
    };
  }
};

// Main function to fetch admin panel data
const fetchAdminPanelData = async () => {
  try {
    console.log('🔍 Fetching Admin Panel Data from MongoDB...\n');
    
    // Fetch all data
    const users = await User.find({}).lean().sort({ createdAt: -1 });
    const bdTrackers = await BDTracker.find({}).lean();
    
    console.log(`📊 Total Users Found: ${users.length}`);
    console.log(`📋 Total BD Tracker Projects: ${bdTrackers.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // ========================================
    // 📈 USER STATISTICS (Stats Cards)
    // ========================================
    console.log('📈 USER STATISTICS (Admin Panel Stats Cards):');
    console.log('=' .repeat(80));
    
    const activeUsers = users.filter(u => u.isActive);
    const verifiedUsers = users.filter(u => u.isVerified);
    const paidUsers = users.filter(u => u.paymentCompleted);
    const testUsers = users.filter(u => u.currentPlan === 'test');
    
    console.log(`   • Total Records: ${users.length} users`);
    console.log(`   • Total Companies: ${new Set(users.map(u => u.company)).size} unique companies`);
    console.log(`   • Total Contacts: ${users.length} contact records`);
    console.log(`   • Total Revenue: $${users.length * 99} (estimated)`);
    console.log(`   • Registered Users: ${users.length}`);
    console.log(`   • Active Users: ${activeUsers.length}`);
    console.log(`   • Verified Users: ${verifiedUsers.length}`);
    console.log(`   • Paid Customers: ${paidUsers.length}`);
    console.log(`   • Test Accounts: ${testUsers.length}\n`);

    // ========================================
    // 👥 REGISTERED USERS (Users Tab)
    // ========================================
    console.log('👥 REGISTERED USERS (Users Tab):');
    console.log('=' .repeat(80));
    
    users.forEach((user, index) => {
      const daysSinceReg = getDaysSinceRegistration(user.createdAt);
      const trialStatus = getTrialStatus(user);
      const lastLogin = user.lastLogin ? formatDate(user.lastLogin) : 'Never';
      const updatedAt = user.updatedAt ? formatDate(user.updatedAt) : 'N/A';
      
      console.log(`\n${index + 1}. USER: ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔐 Password: ${user.password || 'N/A'}`);
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
      
      console.log('   ' + '-'.repeat(60));
    });

    // ========================================
    // 👤 USER MANAGEMENT (User Management Tab)
    // ========================================
    console.log('\n👤 USER MANAGEMENT (User Management Tab):');
    console.log('=' .repeat(80));
    
    users.forEach((user, index) => {
      const suspensionStatus = getSuspensionStatus(user);
      
      console.log(`\n${index + 1}. USER: ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user._id}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   📊 Status: ${suspensionStatus ? 
        `Suspended (${suspensionStatus.timeRemaining} days left)` : 
        'Active'}`);
      console.log(`   💰 Credits: ${user.currentCredits || 0} credits`);
      console.log(`   📅 Created: ${formatDate(user.createdAt)}`);
      console.log(`   🔄 Last Updated: ${formatDate(user.updatedAt)}`);
      
      if (suspensionStatus) {
        console.log(`   ⚠️  Suspension: ${suspensionStatus.status} until ${formatDate(user.suspended?.suspendedUntil)}`);
      }
      
      console.log('   ' + '-'.repeat(60));
    });

    // ========================================
    // 📊 SUBSCRIPTION BREAKDOWN
    // ========================================
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

    // ========================================
    // 🕒 RECENT ACTIVITY (Last 30 days)
    // ========================================
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

    // ========================================
    // 📋 BD TRACKER PROJECTS
    // ========================================
    console.log('\n📋 BD TRACKER PROJECTS:');
    console.log('=' .repeat(50));
    
    if (bdTrackers.length > 0) {
      bdTrackers.forEach((track, index) => {
        console.log(`\n${index + 1}. PROJECT: ${track.projectName}`);
        console.log(`   🏢 Company: ${track.company}`);
        console.log(`   👤 User ID: ${track.userId}`);
        console.log(`   📊 Status: ${track.status}`);
        console.log(`   ⚡ Priority: ${track.priority}`);
        console.log(`   👨‍💼 Contact: ${track.contactPerson}`);
        console.log(`   🎯 Function: ${track.contactFunction}`);
        console.log(`   📅 Created: ${formatDate(track.createdAt)}`);
        console.log(`   🔄 Updated: ${formatDate(track.updatedAt)}`);
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
        totalBDProjects: bdTrackers.length,
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
        suspensionStatus: getSuspensionStatus(user),
        bdTrackerProjects: bdTrackers.filter(track => track.userId === user.email).length
      })),
      bdTrackers: bdTrackers,
      adminPanelData: {
        stats: {
          totalRecords: users.length,
          totalCompanies: new Set(users.map(u => u.company)).size,
          totalContacts: users.length,
          totalRevenue: users.length * 99
        },
        userManagement: users.map(user => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          status: getSuspensionStatus(user) ? 'Suspended' : 'Active',
          credits: user.currentCredits || 0,
          suspensionStatus: getSuspensionStatus(user)
        })),
        subscriptions: users.map(user => ({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          plan: user.currentPlan,
          status: user.paymentCompleted ? 'Active' : 'Inactive',
          credits: user.currentCredits || 0,
          nextRenewal: user.nextCreditRenewal,
          subscriptionId: user.subscriptionId,
          subscriptionEnd: user.subscriptionEndAt
        }))
      }
    };

    const fs = require('fs');
    const fileName = `admin-panel-data-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Admin Panel Data exported to: ${fileName}`);

  } catch (error) {
    console.error('❌ Error fetching admin panel data:', error.message);
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
    fetchAdminPanelData();
  });
}

module.exports = { fetchAdminPanelData, connectDB };
