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

// Calculate trial status and days remaining
const getTrialData = (user) => {
  if (user.currentPlan === 'test') {
    return {
      status: 'Test Account',
      daysRemaining: 'N/A',
      trialStart: user.createdAt,
      trialEnd: null
    };
  }
  
  if (user.currentPlan === 'free' && !user.paymentCompleted) {
    // Free trial: 5 days from registration
    const trialStart = new Date(user.createdAt);
    const trialEnd = new Date(trialStart.getTime() + (5 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const daysRemaining = Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000));
    
    return {
      status: daysRemaining > 0 ? 'Active' : 'Expired',
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      trialStart: trialStart,
      trialEnd: trialEnd
    };
  }
  
  if (user.paymentCompleted) {
    return {
      status: 'Paid Customer',
      daysRemaining: 'N/A',
      trialStart: user.createdAt,
      trialEnd: null
    };
  }
  
  return {
    status: 'Inactive',
    daysRemaining: 0,
    trialStart: user.createdAt,
    trialEnd: null
  };
};

// Get potential customer data
const getPotentialCustomerData = (user) => {
  const lastActivity = user.lastLogin || user.updatedAt || user.createdAt;
  const daysSinceLastActivity = Math.ceil((new Date() - new Date(lastActivity)) / (24 * 60 * 60 * 1000));
  
  let priority = 'Low';
  if (daysSinceLastActivity <= 7) priority = 'High';
  else if (daysSinceLastActivity <= 30) priority = 'Medium';
  
  return {
    priority,
    daysSinceLastActivity,
    lastActivity,
    isHotLead: daysSinceLastActivity <= 7 && !user.paymentCompleted
  };
};

// Fetch and display complete admin panel data
const fetchCompleteAdminData = async () => {
  try {
    console.log('🔍 Fetching Complete Admin Panel Data from MongoDB Atlas...\n');
    
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
    // 👥 REGISTERED USERS (Users Tab)
    // ========================================
    console.log('👥 REGISTERED USERS (Users Tab):');
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
    // 🕒 USER ACTIVITY & REGISTRATION
    // ========================================
    console.log('\n🕒 USER ACTIVITY & REGISTRATION:');
    console.log('=' .repeat(80));
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = users.filter(user => 
      new Date(user.createdAt) > thirtyDaysAgo || 
      (user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo) ||
      (user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo)
    );
    
    if (recentUsers.length > 0) {
      recentUsers.forEach((user, index) => {
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
        
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   📊 Activity: ${activity.join(', ')}`);
        console.log(`   📅 Registration: ${formatAdminDate(user.createdAt)}`);
        console.log(`   🕒 Last Login: ${user.lastLogin ? formatAdminDate(user.lastLogin) : 'Never'}`);
        console.log(`   🔄 Last Update: ${formatAdminDate(user.updatedAt)}`);
        console.log(`   🏢 Company: ${user.company}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log('   ' + '-'.repeat(60));
      });
    } else {
      console.log('   No recent activity found');
    }

    // ========================================
    // 🧪 TRIAL MANAGEMENT
    // ========================================
    console.log('\n🧪 TRIAL MANAGEMENT:');
    console.log('=' .repeat(80));
    
    const trialUsers = users.filter(user => 
      user.currentPlan === 'free' || user.currentPlan === 'test'
    );
    
    if (trialUsers.length > 0) {
      trialUsers.forEach((user, index) => {
        const trialData = getTrialData(user);
        
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🧪 Trial Start: ${formatAdminDate(trialData.trialStart)}`);
        console.log(`   ⏰ Trial End: ${trialData.trialEnd ? formatAdminDate(trialData.trialEnd) : 'N/A'}`);
        console.log(`   📊 Status: ${trialData.status}`);
        console.log(`   ⏳ Days Remaining: ${trialData.daysRemaining}`);
        console.log(`   💳 Current Plan: ${user.currentPlan}`);
        console.log(`   💰 Payment Status: ${user.paymentCompleted ? 'Completed' : 'Pending'}`);
        console.log(`   🏢 Company: ${user.company}`);
        console.log('   ' + '-'.repeat(60));
      });
    } else {
      console.log('   No trial users found');
    }

    // ========================================
    // 🎯 POTENTIAL CUSTOMERS
    // ========================================
    console.log('\n🎯 POTENTIAL CUSTOMERS:');
    console.log('=' .repeat(80));
    
    const potentialCustomers = users.filter(user => 
      !user.paymentCompleted && user.currentPlan !== 'test'
    );
    
    if (potentialCustomers.length > 0) {
      potentialCustomers.forEach((user, index) => {
        const customerData = getPotentialCustomerData(user);
        
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🏢 Company: ${user.company}`);
        console.log(`   📱 Phone: ${user.phone || 'N/A'}`);
        console.log(`   📅 Registration Date: ${formatAdminDate(user.createdAt)}`);
        console.log(`   🕒 Last Activity: ${formatAdminDate(customerData.lastActivity)}`);
        console.log(`   ⏳ Days Since Last Activity: ${customerData.daysSinceLastActivity}`);
        console.log(`   🎯 Priority: ${customerData.priority}`);
        console.log(`   🔥 Hot Lead: ${customerData.isHotLead ? 'YES' : 'No'}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   💳 Plan: ${user.currentPlan}`);
        console.log('   ' + '-'.repeat(60));
      });
    } else {
      console.log('   No potential customers found');
    }

    // ========================================
    // 💳 SUBSCRIPTION DETAILS
    // ========================================
    console.log('\n💳 SUBSCRIPTION DETAILS:');
    console.log('=' .repeat(80));
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   💳 Plan: ${user.currentPlan.toUpperCase()}`);
        console.log(`   📊 Status: ${user.paymentCompleted ? 'Active' : 'Inactive'}`);
        console.log(`   💰 Credits: ${user.currentCredits || 0}`);
        console.log(`   🔄 Next Renewal: ${user.nextCreditRenewal ? formatAdminDate(user.nextCreditRenewal) : 'N/A'}`);
        console.log(`   🆔 Subscription ID: ${user.subscriptionId || 'N/A'}`);
        console.log(`   ⏰ Subscription End: ${user.subscriptionEndAt ? formatAdminDate(user.subscriptionEndAt) : 'N/A'}`);
        console.log(`   ⏸️ On Hold: ${user.subscriptionOnHold ? 'Yes' : 'No'}`);
        console.log(`   📅 Created: ${formatAdminDate(user.createdAt)}`);
        console.log(`   🏢 Company: ${user.company}`);
        console.log('   ' + '-'.repeat(60));
      });
    } else {
      console.log('   No subscription details found');
    }

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
    const trialUsersCount = users.filter(u => u.currentPlan === 'free' && !u.paymentCompleted).length;
    const potentialCustomersCount = users.filter(u => !u.paymentCompleted && u.currentPlan !== 'test').length;
    
    console.log(`   • Total Users: ${users.length}`);
    console.log(`   • Active Users: ${activeUsers.length}`);
    console.log(`   • Verified Users: ${verifiedUsers.length}`);
    console.log(`   • Paid Customers: ${paidUsers.length}`);
    console.log(`   • Test Accounts: ${testUsers.length}`);
    console.log(`   • Trial Users: ${trialUsersCount}`);
    console.log(`   • Potential Customers: ${potentialCustomersCount}`);
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
    // 💾 EXPORT COMPLETE DATA
    // ========================================
    const exportData = {
      summary: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        verifiedUsers: verifiedUsers.length,
        paidUsers: paidUsers.length,
        testUsers: testUsers.length,
        trialUsers: trialUsersCount,
        potentialCustomers: potentialCustomersCount,
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
      userActivity: recentUsers.map(user => ({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        activities: [
          ...(new Date(user.createdAt) > thirtyDaysAgo ? ['New Registration'] : []),
          ...(user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo ? ['Recent Login'] : []),
          ...(user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo ? ['Profile Updated'] : [])
        ],
        registrationDate: user.createdAt,
        lastLogin: user.lastLogin,
        lastUpdate: user.updatedAt,
        company: user.company,
        role: user.role
      })),
      trialData: trialUsers.map(user => {
        const trialData = getTrialData(user);
        return {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          trialStart: trialData.trialStart,
          trialEnd: trialData.trialEnd,
          status: trialData.status,
          daysRemaining: trialData.daysRemaining,
          currentPlan: user.currentPlan,
          paymentStatus: user.paymentCompleted,
          company: user.company
        };
      }),
      potentialCustomers: potentialCustomers.map(user => {
        const customerData = getPotentialCustomerData(user);
        return {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          company: user.company,
          phone: user.phone,
          registrationDate: user.createdAt,
          lastActivity: customerData.lastActivity,
          daysSinceLastActivity: customerData.daysSinceLastActivity,
          priority: customerData.priority,
          isHotLead: customerData.isHotLead,
          role: user.role,
          plan: user.currentPlan
        };
      }),
      subscriptions: users.map(user => ({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        plan: user.currentPlan,
        status: user.paymentCompleted ? 'Active' : 'Inactive',
        credits: user.currentCredits || 0,
        nextRenewal: user.nextCreditRenewal,
        subscriptionId: user.subscriptionId,
        subscriptionEnd: user.subscriptionEndAt,
        onHold: user.subscriptionOnHold,
        created: user.createdAt,
        company: user.company
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
    const fileName = `complete-admin-panel-data-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Complete Admin Panel Data exported to: ${fileName}`);

  } catch (error) {
    console.error('❌ Error fetching complete admin panel data:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Continuous fetching function
const startContinuousFetching = async (intervalMinutes = 5) => {
  console.log(`🚀 Starting continuous data fetching every ${intervalMinutes} minutes...\n`);
  
  // Initial fetch
  await fetchCompleteAdminData();
  
  // Set up continuous fetching
  setInterval(async () => {
    console.log(`\n🔄 Auto-fetching complete data at ${new Date().toLocaleString()}...`);
    await fetchCompleteAdminData();
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
      await fetchCompleteAdminData();
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

module.exports = { fetchCompleteAdminData, connectDB, startContinuousFetching };
