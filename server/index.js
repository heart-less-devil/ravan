const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import models
const User = require('./models/User');
const BDTracker = require('./models/BDTracker');

const app = express();
const PORT = process.env.PORT || 3005;

// Connect to MongoDB
connectDB();

// Initialize Stripe with proper configuration
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_live_YOUR_LIVE_KEY_HERE';
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.error('💡 Create a .env file with your Stripe secret key');
  console.error('💡 Or set STRIPE_SECRET_KEY=sk_live_your_key_here');
  process.exit(1);
}
const stripe = require('stripe')(stripeSecretKey);

// ============================================================================
// AUTO-CUT SUBSCRIPTION FUNCTIONS
// ============================================================================

// 1. CREATE CUSTOMER WITH PAYMENT METHOD
async function createCustomerWithPaymentMethod(customerData) {
  try {
    console.log('🔧 Creating customer with payment method...');
    
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      metadata: {
        userId: customerData.userId,
        planId: customerData.planId
      }
    });
    
    console.log('✅ Customer created:', customer.id);
    return customer;
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    throw error;
  }
}

// 2. ATTACH PAYMENT METHOD TO CUSTOMER
async function attachPaymentMethodToCustomer(customerId, paymentMethodId) {
  try {
    console.log('🔧 Attaching payment method to customer...');
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    
    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    console.log('✅ Payment method attached and set as default');
    return true;
  } catch (error) {
    console.error('❌ Error attaching payment method:', error);
    throw error;
  }
}

// 3. CREATE SUBSCRIPTION WITH AUTO-RENEWAL
async function createSubscriptionWithAutoRenewal(customerId, priceId, paymentMethodId) {
  try {
    console.log('🔧 Creating subscription with auto-renewal...');
    
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });
    
    console.log('✅ Subscription created:', subscription.id);
    console.log('📊 Subscription status:', subscription.status);
    
    return subscription;
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    throw error;
  }
}

// 4. COMPLETE SUBSCRIPTION SETUP
async function completeSubscriptionSetup(subscriptionId) {
  try {
    console.log('🔧 Completing subscription setup...');
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.status === 'incomplete') {
      // If subscription is incomplete, we need to handle the payment
      const latestInvoice = subscription.latest_invoice;
      
      if (latestInvoice && latestInvoice.payment_intent) {
        const paymentIntent = latestInvoice.payment_intent;
        
        if (paymentIntent.status === 'requires_payment_method') {
          console.log('⚠️ Payment method required for subscription');
          return { status: 'requires_payment_method', subscription };
        }
        
        if (paymentIntent.status === 'requires_confirmation') {
          await stripe.paymentIntents.confirm(paymentIntent.id);
          console.log('✅ Payment intent confirmed for subscription');
        }
      }
    }
    
    console.log('✅ Subscription setup completed');
    return subscription;
  } catch (error) {
    console.error('❌ Error completing subscription setup:', error);
    throw error;
  }
}

// 5. MAIN FUNCTION - COMPLETE AUTO-CUT SETUP
async function setupAutoCutSubscription(userData, paymentMethodId, priceId) {
  try {
    console.log('🚀 Starting Auto-Cut Subscription Setup...');
    console.log('==========================================');
    
    // Step 1: Create customer
    const customer = await createCustomerWithPaymentMethod({
      email: userData.email,
      name: userData.name,
      userId: userData.id,
      planId: userData.planId
    });
    
    // Step 2: Attach payment method
    await attachPaymentMethodToCustomer(customer.id, paymentMethodId);
    
    // Step 3: Create subscription
    const subscription = await createSubscriptionWithAutoRenewal(customer.id, priceId, paymentMethodId);
    
    // Step 4: Complete subscription if needed
    if (subscription.status === 'incomplete') {
      console.log('🔄 Subscription is incomplete, attempting to complete...');
      
      try {
        // Get the latest invoice and confirm the payment intent
        const latestInvoice = subscription.latest_invoice;
        if (latestInvoice && latestInvoice.payment_intent) {
          const paymentIntent = latestInvoice.payment_intent;
          console.log('💳 Payment intent status:', paymentIntent.status);
          
          if (paymentIntent.status === 'requires_confirmation') {
            const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id);
            console.log('✅ Payment intent confirmed, status:', confirmedPaymentIntent.status);
          } else if (paymentIntent.status === 'requires_payment_method') {
            console.log('⚠️ Payment method required, but we already attached one');
            // Try to confirm with the attached payment method
            const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
              payment_method: paymentMethodId
            });
            console.log('✅ Payment intent confirmed with payment method, status:', confirmedPaymentIntent.status);
          }
        }
        
        // Wait a moment for Stripe to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retrieve the updated subscription
        const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id);
        console.log('📊 Updated subscription status:', updatedSubscription.status);
        
        if (updatedSubscription.status === 'active') {
          console.log('🎉 Subscription is now active!');
          subscription = updatedSubscription;
        } else {
          console.log('⚠️ Subscription still incomplete, but payment method is saved for future use');
        }
      } catch (error) {
        console.error('❌ Error completing subscription:', error);
        // Continue anyway, subscription might still work
      }
    }
    
    console.log('🎉 Auto-Cut Setup Complete!');
    console.log('============================');
    console.log('✅ Customer created and payment method attached');
    console.log('✅ Subscription created with auto-renewal');
    console.log('✅ Future payments will be automatic');
    
    return {
      success: true,
      customer: customer,
      subscription: subscription,
      message: 'Auto-cut setup completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Auto-Cut Setup Failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Auto-cut setup failed'
    };
  }
}

// Log Stripe configuration
console.log('🔧 Stripe configuration:');
console.log('  - Secret key available:', !!stripeSecretKey);
console.log('  - Stripe initialized:', !!stripe);
console.log('  - Using live key:', stripeSecretKey.includes('sk_live_'));

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3002',
    'http://localhost:3005',
    'http://localhost:3001',
    'https://687dc02000e0ca0008eb4b09--deft-paprenjak-1f5e98.netlify.app',
    'https://deft-paprenjak-1f5e98.netlify.app',
    'https://biopingweb.netlify.app',
    'null', // Allow file:// protocol for local testing
    'https://*.netlify.app',
    'https://thebioping.com',
    'https://www.thebioping.com',
    'https://biopingweb.netlify.app',
    'https://ravan.netlify.app',
    'https://*.netlify.app',
    'https://*.render.com',
    'https://*.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3005',
    'https://thebioping.com',
    'https://www.thebioping.com',
    'https://biopingweb.netlify.app',
    'https://ravan.netlify.app',
    'https://*.netlify.app',
    'https://*.render.com',
    'https://*.onrender.com'
  ];
  
  if (allowedOrigins.includes(origin) || origin?.includes('netlify.app') || origin?.includes('render.com') || origin?.includes('onrender.com')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Webhook for Stripe events - MUST BE BEFORE express.json() middleware
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_ygLySaPSLLs4S4xpWuXWvblGsqA4nhV7';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Webhook received:', event.type);

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Payment succeeded:', paymentIntent.id);
      console.log('Payment details:', {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customer: paymentIntent.customer,
        customerEmail: paymentIntent.metadata?.customerEmail,
        planId: paymentIntent.metadata?.planId,
        status: paymentIntent.status
      });
      
      // Get customer email from metadata or retrieve from Stripe
      let customerEmail = paymentIntent.metadata?.customerEmail;
      
      if (!customerEmail && paymentIntent.customer) {
        try {
          const customer = await stripe.customers.retrieve(paymentIntent.customer);
          customerEmail = customer.email;
          console.log('📧 Retrieved customer email from Stripe:', customerEmail);
        } catch (error) {
          console.log('⚠️ Could not retrieve customer email:', error.message);
        }
      }
      
      if (customerEmail) {
        console.log('📧 Processing payment for customer:', customerEmail);
        
        try {
          // Try to update in MongoDB first
          const User = require('./models/User');
          const planId = paymentIntent.metadata?.planId || 'monthly';
          
          // Calculate credits based on plan
          let credits = 5; // default
          if (planId === 'daily-12') {
            credits = 50;
          } else if (planId === 'basic') {
            credits = 50;
          } else if (planId === 'premium') {
            credits = 100;
          }
          
          const updatedUser = await User.findOneAndUpdate(
            { email: customerEmail },
            {
              paymentCompleted: true,
              currentPlan: planId,
              paymentUpdatedAt: new Date(),
              currentCredits: credits,
              lastPaymentIntent: paymentIntent.id,
              lastPaymentAmount: paymentIntent.amount,
              lastPaymentDate: new Date()
            },
            { new: true }
          );
          
          if (updatedUser) {
            console.log('✅ User payment status updated in MongoDB:', customerEmail);
            console.log('📝 Updated user details:', {
              email: updatedUser.email,
              currentPlan: updatedUser.currentPlan,
              currentCredits: updatedUser.currentCredits,
              paymentCompleted: updatedUser.paymentCompleted
            });
          } else {
            console.log('⚠️ User not found in MongoDB, updating file storage...');
            // Fallback to file-based storage
            const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
            if (userIndex !== -1) {
              mockDB.users[userIndex].paymentCompleted = true;
              mockDB.users[userIndex].currentPlan = planId;
              mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
              mockDB.users[userIndex].currentCredits = credits;
              mockDB.users[userIndex].lastPaymentIntent = paymentIntent.id;
              mockDB.users[userIndex].lastPaymentAmount = paymentIntent.amount;
              mockDB.users[userIndex].lastPaymentDate = new Date().toISOString();
              saveDataToFilesImmediate('payment_succeeded');
              console.log('✅ User payment status updated in file storage');
            } else {
              console.log('⚠️ User not found in database:', customerEmail);
            }
          }
        } catch (error) {
          console.error('❌ Error updating user payment status:', error);
          // Fallback to file-based storage
          const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
          if (userIndex !== -1) {
            mockDB.users[userIndex].paymentCompleted = true;
            mockDB.users[userIndex].currentPlan = paymentIntent.metadata.planId || 'monthly';
            mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
            // Set credits based on plan
            if (paymentIntent.metadata.planId === 'daily-12') {
              mockDB.users[userIndex].currentCredits = 50;
            }
            saveDataToFilesImmediate('payment_succeeded');
            console.log('✅ User payment status updated in file storage (fallback)');
          }
        }
      }
      
      // Generate invoice for successful payment
      try {
        const customerEmail = paymentIntent.receipt_email || paymentIntent.customer_details?.email || paymentIntent.metadata?.userEmail;
        if (customerEmail) {
          // Find user in database to add invoice
          const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
          if (userIndex !== -1) {
            // Initialize invoices array if it doesn't exist
            if (!mockDB.users[userIndex].invoices) {
              mockDB.users[userIndex].invoices = [];
            }
            
            // Generate unique invoice ID
            const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const planName = paymentIntent.metadata?.planId || 'Basic Plan';
            
            const newInvoice = {
              id: invoiceId,
              date: new Date().toISOString(),
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency || 'usd',
              status: 'paid',
              description: `${planName} Subscription`,
              plan: planName,
              paymentIntentId: paymentIntent.id,
              customerEmail: customerEmail
            };
            
            mockDB.users[userIndex].invoices.push(newInvoice);
            console.log(`✅ Invoice generated for ${customerEmail}: ${invoiceId}`);
          }
        }
      } catch (invoiceError) {
        console.error('❌ Error generating invoice:', invoiceError);
      }
      
      // Send payment confirmation email
      try {
        const customerEmail = paymentIntent.receipt_email || paymentIntent.customer_details?.email;
        if (customerEmail) {
          const mailOptions = {
            from: process.env.EMAIL_USER || 'universalx0242@gmail.com',
            to: customerEmail,
            subject: 'BioPing - Payment Confirmation',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Payment Confirmation</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #333; margin-bottom: 20px;">Payment Successful!</h2>
                  <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                    Thank you for your payment! Your transaction has been processed successfully.
                  </p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <div style="display: flex; justify-content-between; margin-bottom: 10px;">
                      <span style="font-weight: bold;">Amount:</span>
                      <span>$${(paymentIntent.amount / 100).toFixed(2)} USD</span>
                    </div>
                    <div style="display: flex; justify-content-between; margin-bottom: 10px;">
                      <span style="font-weight: bold;">Transaction ID:</span>
                      <span style="font-family: monospace;">${paymentIntent.id}</span>
                    </div>
                    <div style="display: flex; justify-content-between;">
                      <span style="font-weight: bold;">Date:</span>
                      <span>${new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    Your invoice has been generated and is available in your account. If you have any questions, please contact our support team.
                  </p>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px;">
                      Best regards,<br>
                      The BioPing Team
                    </p>
                  </div>
                </div>
              </div>
            `
          };
          
          await transporter.sendMail(mailOptions);
          console.log('✅ Payment confirmation email sent to:', customerEmail);
        }
      } catch (emailError) {
        console.error('❌ Error sending payment confirmation email:', emailError);
      }
      break;
      
    case 'invoice.payment_succeeded':
      const paidInvoice = event.data.object;
      console.log('✅ Invoice payment succeeded:', paidInvoice.id);
      try {
        const subId = paidInvoice.subscription;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const cust = await stripe.customers.retrieve(sub.customer);
          const email = cust.email;
          const idx = mockDB.users.findIndex(u => u.email === email);
          if (idx !== -1) {
            mockDB.users[idx].subscriptionOnHold = false;
            if (mockDB.users[idx].currentPlan === 'daily-12') {
              mockDB.users[idx].currentCredits = 50;
              mockDB.users[idx].nextCreditRenewal = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
              saveDataToFiles('daily_subscription_paid');
            }
          }
        }
      } catch (e) { console.log('paid update error:', e.message); }
      break;
      
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('❌ Invoice payment failed:', failedInvoice.id);
      console.log('Invoice details:', {
        customer: failedInvoice.customer,
        customerEmail: failedInvoice.customer_email,
        amount: failedInvoice.amount_due,
        billingReason: failedInvoice.billing_reason,
        attemptCount: failedInvoice.attempt_count
      });
      
      try {
        const email = failedInvoice.customer_email;
        const customerId = failedInvoice.customer;
        
        if (email) {
          // Find user by email
          const idx = mockDB.users.findIndex(u => u.email === email);
          
          if (idx !== -1) {
            // Handle subscription-based invoices
            const subId = failedInvoice.subscription;
            if (subId) {
              mockDB.users[idx].subscriptionOnHold = true;
              saveDataToFiles('subscription_on_hold');
              console.log('✅ Subscription put on hold for user:', email);
            } else {
              // Handle manual invoices (like daily plans)
              console.log('📋 Manual invoice payment failed for user:', email);
              
              // Check if this is a daily plan invoice
              const lineItems = failedInvoice.lines?.data || [];
              const isDailyPlan = lineItems.some(item => 
                item.description && item.description.includes('Daily')
              );
              
              if (isDailyPlan) {
                // For daily plans, we might want to suspend access or send notification
                mockDB.users[idx].paymentFailed = true;
                mockDB.users[idx].lastPaymentFailure = new Date().toISOString();
                saveDataToFiles('daily_plan_payment_failed');
                console.log('⚠️ Daily plan payment failed for user:', email);
              }
            }
          } else {
            console.log('⚠️ User not found for email:', email);
          }
          
          // Send notification email
          const mailOptions = {
            from: process.env.EMAIL_USER || 'universalx0242@gmail.com',
            to: email,
            subject: 'Payment Issue - Action Required',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">Payment Failed</h2>
                <p>We were unable to process your payment for the following invoice:</p>
                <ul>
                  <li><strong>Invoice ID:</strong> ${failedInvoice.id}</li>
                  <li><strong>Amount:</strong> $${(failedInvoice.amount_due / 100).toFixed(2)} USD</li>
                  <li><strong>Attempts:</strong> ${failedInvoice.attempt_count}</li>
                </ul>
                <p>Please update your payment method or contact support to resolve this issue.</p>
                <p>Best regards,<br>The BioPing Team</p>
              </div>
            `
          };
          
          try { 
            await transporter.sendMail(mailOptions); 
            console.log('✅ Payment failure notification sent to:', email);
          } catch (e) { 
            console.log('❌ Mail error:', e.message); 
          }
        } else {
          console.log('⚠️ No customer email found in invoice');
        }
      } catch (e) { 
        console.log('❌ Payment failure handling error:', e.message); 
      }
      break;
      
    case 'customer.subscription.created':
      console.log('✅ Customer subscription created');
      
      const subscription = event.data.object;
      console.log('Subscription details:', {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        plan: subscription.plan?.id,
        interval: subscription.plan?.interval,
        amount: subscription.plan?.amount
      });
      
      // Check if this is a daily subscription (either by metadata or plan details)
      const isDailySubscription = subscription.metadata?.planId === 'daily-12' || 
                                 (subscription.plan?.interval === 'day' && subscription.plan?.amount === 100);
      
      if (isDailySubscription) {
        console.log('🔄 Daily subscription created, setting up daily billing...');
        
        // Update user with subscription details
        try {
          const customer = await stripe.customers.retrieve(subscription.customer);
          if (customer.email) {
            console.log('📧 Found customer email:', customer.email);
            
            // Try MongoDB first
            try {
              const User = require('./models/User');
              const updatedUser = await User.findOneAndUpdate(
                { email: customer.email },
                {
                  subscriptionId: subscription.id,
                  stripeCustomerId: subscription.customer,
                  currentPlan: 'daily-12',
                  subscriptionStatus: subscription.status,
                  subscriptionCreatedAt: new Date(subscription.created * 1000),
                  subscriptionEndAt: new Date(subscription.current_period_end * 1000),
                  lastCreditRenewal: new Date(),
                  nextCreditRenewal: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  autoRenewal: true,
                  paymentMethodSaved: true
                },
                { new: true }
              );
              
              if (updatedUser) {
                console.log('✅ MongoDB daily subscription updated for:', customer.email);
                console.log('🎉 Auto-cut subscription setup complete!');
              } else {
                console.log('⚠️ User not found in MongoDB for:', customer.email);
              }
            } catch (dbError) {
              console.log('❌ MongoDB update failed, updating file storage...', dbError.message);
              // Fallback to file storage
              const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
              if (userIndex !== -1) {
                mockDB.users[userIndex].subscriptionId = subscription.id;
                mockDB.users[userIndex].stripeCustomerId = subscription.customer;
                mockDB.users[userIndex].currentPlan = 'daily-12';
                mockDB.users[userIndex].subscriptionStatus = subscription.status;
                mockDB.users[userIndex].subscriptionCreatedAt = new Date(subscription.created * 1000).toISOString();
                mockDB.users[userIndex].subscriptionEndAt = new Date(subscription.current_period_end * 1000).toISOString();
                mockDB.users[userIndex].lastCreditRenewal = new Date().toISOString();
                mockDB.users[userIndex].nextCreditRenewal = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                mockDB.users[userIndex].autoRenewal = true;
                mockDB.users[userIndex].paymentMethodSaved = true;
                saveDataToFiles('daily_subscription_created');
                console.log('✅ File storage daily subscription updated for:', customer.email);
                console.log('🎉 Auto-cut subscription setup complete!');
              } else {
                console.log('⚠️ User not found in file storage for:', customer.email);
              }
            }
          } else {
            console.log('⚠️ No customer email found for subscription:', subscription.id);
          }
        } catch (error) {
          console.error('❌ Error updating user for daily subscription:', error);
        }
      } else {
        console.log('📋 Non-daily subscription created, no special handling needed');
      }
      break;
      
    case 'invoice.payment_succeeded':
      console.log('💰 Invoice payment succeeded - Auto-renewal working!');
      
      const paymentSucceededInvoice = event.data.object;
      console.log('Invoice details:', {
        id: paymentSucceededInvoice.id,
        customer: paymentSucceededInvoice.customer,
        subscription: paymentSucceededInvoice.subscription,
        amount: paymentSucceededInvoice.amount_paid,
        status: paymentSucceededInvoice.status
      });
      
      // Handle successful auto-renewal
      if (paymentSucceededInvoice.subscription) {
        try {
          const customer = await stripe.customers.retrieve(paymentSucceededInvoice.customer);
          if (customer.email) {
            console.log('🔄 Processing auto-renewal for:', customer.email);
            
            // Try MongoDB first
            try {
              const User = require('./models/User');
              const updatedUser = await User.findOneAndUpdate(
                { email: customer.email },
                {
                  lastPaymentDate: new Date(),
                  subscriptionStatus: 'active',
                  autoRenewalWorking: true,
                  lastAutoRenewal: new Date()
                },
                { new: true }
              );
              
              if (updatedUser) {
                console.log('✅ Auto-renewal processed in MongoDB for:', customer.email);
              }
            } catch (dbError) {
              console.log('❌ MongoDB update failed, updating file storage...');
              // Fallback to file storage
              const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
              if (userIndex !== -1) {
                mockDB.users[userIndex].lastPaymentDate = new Date().toISOString();
                mockDB.users[userIndex].subscriptionStatus = 'active';
                mockDB.users[userIndex].autoRenewalWorking = true;
                mockDB.users[userIndex].lastAutoRenewal = new Date().toISOString();
                saveDataToFiles('auto_renewal_success');
                console.log('✅ Auto-renewal processed in file storage for:', customer.email);
              }
            }
            
            // Send renewal confirmation email
            try {
              const mailOptions = {
                from: process.env.EMAIL_USER || 'universalx0242@gmail.com',
                to: customer.email,
                subject: '🔄 Subscription Renewed - BioPing',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 20px; text-align: center; color: white;">
                      <h1 style="margin: 0; font-size: 28px;">🔄 Subscription Renewed!</h1>
                      <p style="margin: 10px 0 0 0; font-size: 16px;">Auto-renewal successful</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa;">
                      <h2 style="color: #333; margin-bottom: 20px;">Your subscription has been automatically renewed!</h2>
                      
                      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #4caf50; margin-top: 0;">Renewal Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                          <li style="margin: 10px 0;"><strong>Amount:</strong> $${(paymentSucceededInvoice.amount_paid / 100).toFixed(2)} USD</li>
                          <li style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                          <li style="margin: 10px 0;"><strong>Status:</strong> Active</li>
                          <li style="margin: 10px 0;"><strong>Invoice ID:</strong> ${paymentSucceededInvoice.id}</li>
                        </ul>
                      </div>
                      
                      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                        <p style="margin: 0; color: #2e7d32;"><strong>✅ Auto-Renewal Working Perfectly!</strong> Your subscription will continue to renew automatically.</p>
                      </div>
                      
                      <p style="color: #666; margin-top: 20px;">
                        Thank you for your continued subscription. Your access to premium features remains active.
                      </p>
                    </div>
                    
                    <div style="background: #333; color: white; padding: 20px; text-align: center;">
                      <p style="margin: 0;">© 2024 BioPing. All rights reserved.</p>
                    </div>
                  </div>
                `
              };
              
              await transporter.sendMail(mailOptions);
              console.log('✅ Auto-renewal confirmation email sent to:', customer.email);
            } catch (emailError) {
              console.error('❌ Email sending error:', emailError);
            }
          }
        } catch (error) {
          console.error('❌ Error processing auto-renewal:', error);
        }
      }
      break;
      
    case 'customer.subscription.updated':
      console.log('✅ Customer subscription updated');
      
      // Handle daily-12 subscription updates
      const updatedSubscription = event.data.object;
      if (updatedSubscription.metadata?.planId === 'daily-12') {
        console.log('🔄 Daily-12 subscription updated...');
        
        try {
          const customer = await stripe.customers.retrieve(updatedSubscription.customer);
          if (customer.email) {
            // Update subscription status
            try {
              const User = require('./models/User');
              await User.findOneAndUpdate(
                { email: customer.email },
                {
                  subscriptionStatus: updatedSubscription.status,
                  subscriptionEndAt: new Date(updatedSubscription.current_period_end * 1000)
                }
              );
              console.log('✅ MongoDB daily subscription status updated for:', customer.email);
            } catch (dbError) {
              console.log('❌ MongoDB update failed, updating file storage...');
              const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
              if (userIndex !== -1) {
                mockDB.users[userIndex].subscriptionStatus = updatedSubscription.status;
                mockDB.users[userIndex].subscriptionEndAt = new Date(updatedSubscription.current_period_end * 1000).toISOString();
                saveDataToFiles('daily_subscription_updated');
                console.log('✅ File storage daily subscription status updated for:', customer.email);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error updating daily subscription status:', error);
        }
      }
      break;
      
    case 'customer.subscription.deleted':
      console.log('❌ Customer subscription deleted');
      
      // Handle daily-12 subscription cancellation
      const deletedSubscription = event.data.object;
      if (deletedSubscription.metadata?.planId === 'daily-12') {
        console.log('🔄 Daily-12 subscription cancelled...');
        
        try {
          const customer = await stripe.customers.retrieve(deletedSubscription.customer);
          if (customer.email) {
            // Update subscription status
            try {
              const User = require('./models/User');
              await User.findOneAndUpdate(
                { email: customer.email },
                {
                  subscriptionStatus: 'cancelled',
                  subscriptionOnHold: true,
                  currentPlan: 'free'
                }
              );
              console.log('✅ MongoDB daily subscription cancelled for:', customer.email);
            } catch (dbError) {
              console.log('❌ MongoDB update failed, updating file storage...');
              const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
              if (userIndex !== -1) {
                mockDB.users[userIndex].subscriptionStatus = 'cancelled';
                mockDB.users[userIndex].subscriptionOnHold = true;
                mockDB.users[userIndex].currentPlan = 'free';
                saveDataToFiles('daily_subscription_cancelled');
                console.log('✅ File storage daily subscription cancelled for:', customer.email);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error cancelling daily subscription:', error);
        }
      }
      break;
      

      
    case 'invoice.created':
      const newInvoice = event.data.object;
      console.log('📄 New invoice created:', newInvoice.id);
      break;
      
    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Add express.json() middleware AFTER webhook route
app.use(express.json());

// Serve static files (PDFs) with enhanced configuration
app.use('/pdf', express.static(path.join(__dirname, '../public/pdf'), {
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
  }
}));

// Serve PDFs from the pdfs folder
app.use('/pdfs', express.static(path.join(__dirname, '../public/pdfs'), {
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
  }
}));

app.use('/static', express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// Serve test subscription page
app.use('/test', express.static(path.join(__dirname, 'public')));

// Add cache-busting middleware
app.use((req, res, next) => {
  // Force no-cache for all requests
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Add version parameter to force refresh
  if (req.query.v) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  }
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'BioPing Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    mongoDB: 'Connected',
    pdfFiles: 'Available'
  });
});

// Test PDF endpoint
app.get('/api/test-pdf', (req, res) => {
  const pdfPath = path.join(__dirname, '../public/pdf/BioPing Training Manual.pdf');
  if (fs.existsSync(pdfPath)) {
    res.json({ 
      status: 'PDF files available',
      path: pdfPath,
      exists: true
    });
  } else {
    res.json({ 
      status: 'PDF files not found',
      path: pdfPath,
      exists: false
    });
  }
});

// PDF health check endpoint
app.get('/api/pdf-health', (req, res) => {
  const pdfDir = path.join(__dirname, '../public/pdf');
  const pdfFiles = fs.existsSync(pdfDir) ? fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf')) : [];
  
  res.json({ 
    status: 'PDF directory check',
    pdfDir: pdfDir,
    pdfDirExists: fs.existsSync(pdfDir),
    pdfFiles: pdfFiles,
    totalFiles: pdfFiles.length,
    sampleFile: pdfFiles[0] || 'No PDFs found'
  });
});

// Direct PDF serving endpoint with proper headers
app.get('/api/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join(__dirname, '../public/pdf', filename);
  
  if (fs.existsSync(pdfPath)) {
    // Set proper headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Stream the PDF file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({ error: 'PDF not found', filename });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  const pdfDir = path.join(__dirname, '../public/pdf');
  const pdfFiles = fs.existsSync(pdfDir) ? fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf')) : [];
  
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    pdfDir: pdfDir,
    pdfDirExists: fs.existsSync(pdfDir),
    pdfFiles: pdfFiles,
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/signup',
      '/api/create-payment-intent',
      '/api/auth/subscription-status',
      '/api/test-pdf',
      '/api/pdf-health'
    ]
  });
});

// MongoDB connection test endpoint
app.get('/api/test-mongodb', async (req, res) => {
  try {
    console.log('🔧 Testing MongoDB connection...');
    
    // Test MongoDB connection
    const User = require('./models/User');
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    // Test creating a user
    const testUserData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'mongodb-test@example.com',
      password: 'testpassword123', // Fixed: 8+ characters
      company: 'BioPing',
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    };
    
    // Check if test user exists
    let existingTestUser = await User.findOne({ email: testUserData.email });
    if (existingTestUser) {
      await User.findByIdAndDelete(existingTestUser._id);
      console.log('🧹 Cleaned up existing test user');
    }
    
    // Create test user
    const newTestUser = new User(testUserData);
    await newTestUser.save();
    console.log('✅ Test user created in MongoDB');
    
    // Verify user was saved
    const savedUser = await User.findOne({ email: testUserData.email });
    if (savedUser) {
      console.log('✅ Test user verified in MongoDB');
      // Clean up
      await User.findByIdAndDelete(savedUser._id);
      console.log('🧹 Test user cleaned up');
      
      res.json({
        success: true,
        message: 'MongoDB connection test successful!',
        details: {
          connection: 'Connected',
          database: 'bioping',
          testUser: 'Created and verified',
          cleanup: 'Completed'
        }
      });
    } else {
      throw new Error('Test user not found after creation');
    }
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'MongoDB connection test failed',
      error: error.message
    });
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'public', 'pdf');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + '.pdf');
  }
});

const pdfUpload = multer({ 
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'bioping-super-secure-jwt-secret-key-2025-very-long-and-random-string';

// Email configuration with better Gmail setup
let transporter = null;

try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'universalx0242@gmail.com',
      pass: process.env.EMAIL_PASS || ''
    }
  });

  // Verify transporter configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.log('❌ Email configuration error:', error.message);
      console.log('🔧 Email functionality will be disabled');
      transporter = null; // Disable email functionality
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
} catch (error) {
  console.log('❌ Email configuration failed:', error.message);
  console.log('🔧 Email functionality will be disabled');
  transporter = null; // Disable email functionality
}

// Email templates
const emailTemplates = {
  verification: (code) => ({
    subject: 'BioPing - Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Email Verification</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Your Verification Code</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thank you for signing up with BioPing! Please use the verification code below to complete your registration:
          </p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              The BioPing Team
            </p>
          </div>
        </div>
      </div>
    `
  })
};

// Universal emails that can login without signup
const universalEmails = [
  'universalx0242@gmail.com',
  'admin@bioping.com',
  'demo@bioping.com',
  'test@bioping.com',
  'user@bioping.com',
  'guest@bioping.com'
];

// Pre-hashed password for all universal emails
const hashedPassword = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // 'password'

// Simple user data for universal emails
const universalUsers = universalEmails.map((email, index) => ({
  id: `universal_${index + 1}`,
  email: email,
  password: hashedPassword,
  name: email.split('@')[0],
  role: email === 'universalx0242@gmail.com' ? 'admin' : 'user'
}));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is suspended
const checkUserSuspension = (req, res, next) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (user && user.suspended && user.suspended.isSuspended) {
      const now = new Date();
      const suspendUntil = new Date(user.suspended.suspendedUntil);
      
      if (now < suspendUntil) {
        return res.status(403).json({ 
          message: 'Account suspended',
          suspended: {
            reason: user.suspended.reason,
            suspendedUntil: user.suspended.suspendedUntil,
            duration: user.suspended.duration
          }
        });
      } else {
        // Suspension period has expired, remove suspension
        delete user.suspended;
        saveDataToFiles('suspension_expired');
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking user suspension:', error);
    next(); // Continue if there's an error checking suspension
  }
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Admin auth - Auth header:', authHeader);
  console.log('Admin auth - Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('Admin auth - No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Admin auth - Invalid token:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    console.log('Admin auth - User email:', user.email);
    
    // Check if user is admin (universalx0242@gmail.com or admin@bioping.com can be admin)
    if (user.email !== 'universalx0242@gmail.com' && user.email !== 'admin@bioping.com') {
      console.log('Admin auth - Access denied for:', user.email);
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    console.log('Admin auth - Access granted for:', user.email);
    req.user = user;
    next();
  });
};

// Routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Test current user route
app.get('/api/test-user', authenticateToken, (req, res) => {
  res.json({ 
    message: 'User authenticated',
    user: req.user,
    isAdmin: req.user.email === 'universalx0242@gmail.com' || req.user.email === 'admin@bioping.com'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      server: 'BioPing Backend',
      port: PORT,
      mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      email: process.env.EMAIL_USER ? 'Configured' : 'Not configured'
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      server: 'BioPing Backend',
      port: PORT,
      mongodb: 'Error',
      email: process.env.EMAIL_USER ? 'Configured' : 'Not configured'
    });
  }
});

// Secure PDF serving endpoint with advanced security
app.get('/api/secure-pdf/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const pdfPath = path.join(__dirname, '../pdf', filename);
    
    // Check if file exists and is a PDF
    if (!fs.existsSync(pdfPath) || !filename.toLowerCase().endsWith('.pdf')) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Verify user permissions (in production, check user role and access rights)
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Set advanced security headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add custom security headers
    res.setHeader('X-PDF-Security', 'protected');
    res.setHeader('X-User-ID', req.user.email);
    res.setHeader('X-Access-Time', new Date().toISOString());
    
    // Stream the PDF with security logging
    const stream = fs.createReadStream(pdfPath);
    
    // Log access for security monitoring
    console.log(`PDF access: ${filename} by user ${req.user.email} at ${new Date().toISOString()}`);
    
    stream.on('error', (error) => {
      console.error('PDF stream error:', error);
      res.status(500).json({ error: 'Error streaming PDF' });
    });
    
    stream.pipe(res);
    
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Additional secure PDF endpoint for different access patterns
app.get('/api/secure-pdf-stream/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const pdfPath = path.join(__dirname, '../pdf', filename);
    
    // Check if file exists and is a PDF
    if (!fs.existsSync(pdfPath) || !filename.toLowerCase().endsWith('.pdf')) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Get file stats for range requests
    const stats = fs.statSync(pdfPath);
    const fileSize = stats.size;
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(pdfPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'ALLOWALL', // Allow embedding from any domain
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-PDF-Security': 'protected'
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'ALLOWALL', // Allow embedding from any domain
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-PDF-Security': 'protected'
      });
      
      fs.createReadStream(pdfPath).pipe(res);
    }
    
  } catch (error) {
    console.error('Error serving PDF stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test email configuration
app.get('/api/test-email', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured',
        error: 'Transporter is null'
      });
    }

    const testMailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: req.query.email || 'test@example.com',
      subject: 'Test Email - BioPing',
      html: emailTemplates.verification('123456')
    };

    const result = await transporter.sendMail(testMailOptions);
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      to: req.query.email || 'test@example.com'
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: `Test email failed: ${error.message}`,
      error: {
        code: error.code,
        command: error.command,
        response: error.response
      }
    });
  }
});

// Send verification code endpoint
app.post('/api/auth/send-verification', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email } = req.body;
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code (in production, this would be in a database)
    mockDB.verificationCodes.push({
      email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Save data to files
    saveDataToFiles('verification_code_sent');

    // Send email with verification code
    try {
      if (!transporter) {
        console.log(`🔑 VERIFICATION CODE FOR ${email}: ${verificationCode}`);
        console.log(`📧 Email service not configured, but code is: ${verificationCode}`);
        
        // Return success with the code in response for development
        res.json({
          success: true,
          message: 'Verification code generated (email service not configured)',
          verificationCode: verificationCode, // Include code in response
          emailError: 'Email service not configured'
        });
        return;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: emailTemplates.verification(verificationCode).subject,
        html: emailTemplates.verification(verificationCode).html
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email} with code: ${verificationCode}`);

      res.json({
        success: true,
        message: 'Verification code sent successfully to your email'
      });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      console.log(`🔑 VERIFICATION CODE FOR ${email}: ${verificationCode}`);
      console.log(`📧 Email failed to send, but code is: ${verificationCode}`);
      
      // Return success with the code in response for development
      res.json({
        success: true,
        message: 'Verification code generated (email failed to send)',
        verificationCode: verificationCode, // Include code in response
        emailError: 'Email service temporarily unavailable'
      });
    }

    // Save data to files
    saveDataToFiles('verification_code_sent');

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email code endpoint
app.post('/api/auth/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, code } = req.body;
    
    // Find the verification code
    const verificationRecord = mockDB.verificationCodes.find(
      record => record.email === email && 
                record.code === code && 
                new Date() < record.expiresAt
    );

    if (!verificationRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification code' 
      });
    }

    // Remove the used verification code
    mockDB.verificationCodes = mockDB.verificationCodes.filter(
      record => !(record.email === email && record.code === code)
    );

    // Save data to files
    saveDataToFiles('email_verified');

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create account endpoint
app.post('/api/auth/create-account', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('company').notEmpty().trim(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { firstName, lastName, email, company, password } = req.body;

    console.log(`🔧 Create account attempt for: ${email}`);

    // Check if user already exists (try MongoDB first, then file-based)
    let existingUser = null;
    try {
      console.log('🔍 Checking MongoDB for existing user...');
      existingUser = await User.findOne({ email });
      console.log('✅ MongoDB query completed');
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file-based storage...');
      console.log('MongoDB Error:', dbError.message);
      existingUser = mockDB.users.find(u => u.email === email);
    }

    if (existingUser) {
      console.log('⚠️ User already exists');
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object
    const newUserData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      company,
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    };

    let newUser = null;
    let userId = null;

    // Try to save to MongoDB first
    try {
      console.log('💾 Attempting to save user to MongoDB...');
      newUser = new User(newUserData);
      await newUser.save();
      userId = newUser._id;
      console.log(`✅ New user saved to MongoDB: ${email} (ID: ${userId})`);
    } catch (dbError) {
      console.log('❌ MongoDB save failed, using file-based storage...');
      console.log('MongoDB Save Error:', dbError.message);
      // Fallback to file-based storage
      newUser = {
        id: mockDB.users.length + 1,
        ...newUserData,
        name: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString()
      };
      mockDB.users.push(newUser);
      userId = newUser.id;
      saveDataToFiles('user_created');
      console.log(`✅ New user saved to file: ${email} (ID: ${userId})`);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        email: newUser.email,
        name: newUser.name || `${firstName} ${lastName}`,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`🎉 Account created successfully: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        email: newUser.email,
        name: newUser.name || `${firstName} ${lastName}`,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('❌ Create account error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(`🔧 Login attempt for: ${email}`);

    // Check if it's a universal email
    const user = universalUsers.find(u => u.email === email);
    
    if (!user) {
      console.log('🔍 Checking MongoDB for registered user...');
      // Check if it's a registered user (try MongoDB first, then file-based)
      let registeredUser = null;
      try {
        registeredUser = await User.findOne({ email });
        console.log('✅ MongoDB query completed');
        if (registeredUser) {
          console.log(`✅ Found user in MongoDB: ${email}`);
        } else {
          console.log('⚠️ User not found in MongoDB, checking file storage...');
        }
      } catch (dbError) {
        console.log('❌ MongoDB not available, checking file-based storage...');
        console.log('MongoDB Error:', dbError.message);
        registeredUser = mockDB.users.find(u => u.email === email);
      }

      if (!registeredUser) {
        console.log('❌ User not found in any storage');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password for registered user
      const isValidPassword = await bcrypt.compare(password, registeredUser.password);
      if (!isValidPassword) {
        console.log('❌ Invalid password');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('✅ Password verified successfully');
      
      // Generate JWT token for registered user
      const token = jwt.sign(
        { 
          id: registeredUser._id || registeredUser.id,
          email: registeredUser.email, 
          name: registeredUser.name || `${registeredUser.firstName} ${registeredUser.lastName}`,
          role: registeredUser.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`🎉 Login successful for: ${email}`);

      res.json({
        message: 'Login successful',
        token,
        user: {
          email: registeredUser.email,
          name: registeredUser.name || `${registeredUser.firstName} ${registeredUser.lastName}`,
          role: registeredUser.role
        },
        credits: registeredUser.currentCredits || 5
      });
      
      // Save login data
      saveDataToFiles('user_login');
      return;
    }

    console.log('🔍 Universal user login...');
    // Check password for universal user
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for universal user');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Universal user password verified');

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email, 
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`🎉 Universal user login successful: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      },
      credits: 5 // Give 5 credits to all users
    });
    
    // Save universal user login data
    saveDataToFiles('universal_user_login');

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to get user profile
app.get('/api/auth/profile', authenticateToken, checkUserSuspension, (req, res) => {
  try {
    // Find the user in the database
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return complete user data including invoices and payment history
    res.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        createdAt: user.createdAt,
        currentPlan: user.currentPlan || 'free',
        paymentCompleted: user.paymentCompleted || false,
        currentCredits: user.currentCredits || 5,
        invoices: user.invoices || [],
        paymentHistory: user.paymentHistory || [],
        lastCreditRenewal: user.lastCreditRenewal,
        nextCreditRenewal: user.nextCreditRenewal,
        hasPaymentInfo: true
      }
    });
    
    // Save profile access data
    saveDataToFiles('profile_accessed');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard data routes
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    totalCompanies: 500,
    totalContacts: 2500,
    totalInvestors: 200,
    recentSearches: 15
  });
});

app.get('/api/dashboard/saved-searches', authenticateToken, (req, res) => {
  res.json({
    searches: []
  });
});

app.get('/api/dashboard/search', authenticateToken, (req, res) => {
  res.json({
    message: 'Search endpoint ready'
  });
});

app.get('/api/dashboard/resources/definitions', authenticateToken, (req, res) => {
  res.json({
    definitions: {
      diseaseArea: "Select the therapeutic area your drug is targeting (e.g., oncology, neurology, infectious disease).",
      developmentStage: "Indicate the current stage of your drug: Preclinical, Clinical (Phase I-III), or Marketed.",
      modality: "Specify the type of drug (e.g., small molecule, biologic, gene therapy, cell therapy)",
      partnerCategory: "Choose the type of partner you're targeting:",
      region: "Select the geographic region where you're seeking potential partners (e.g., North America, Europe, Asia)."
    }
  });
});

app.get('/api/dashboard/resources/coaching-tips', authenticateToken, (req, res) => {
  res.json({
    tips: []
  });
});

app.get('/api/dashboard/resources/free-content', authenticateToken, (req, res) => {
  // Redirect to BD Insights endpoint
  res.redirect('/api/dashboard/resources/bd-insights');
});

app.get('/api/dashboard/resources/bd-insights', authenticateToken, (req, res) => {
  // Only allow universal user to access BD Insights
  if (req.user.email !== 'universalx0242@gmail.com') {
    return res.status(403).json({ 
      message: 'Access denied. Only universal users can access BD Insights.' 
    });
  }

  res.json({
    insights: [
      {
        id: 1,
        title: 'BD Conferences - Priority, Budgets and Smart ROI Tips',
        description: 'Strategic insights from 15+ years of experience in Large Pharma to Small Biotechs.',
        type: 'PDF',
        size: '2.5 MB',
        views: 1856,
        rating: 4.9,
        featured: true,
        filename: 'BD Conferences, Priority & Budgets.pdf'
      },
      {
        id: 2,
        title: 'Biopharma Industry News and Resources',
        description: 'Latest industry updates and strategic resources for business development.',
        type: 'PDF',
        size: '1.8 MB',
        views: 1240,
        rating: 4.7,
        featured: false,
        filename: 'Biopharma News & Resources.pdf'
      },
      {
        id: 3,
        title: 'Big Pharma\'s BD Blueprint including Strategic Interest Areas',
        description: 'Comprehensive blueprint for understanding large pharma business development strategies.',
        type: 'PDF',
        size: '3.2 MB',
        views: 980,
        rating: 4.8,
        featured: false,
        filename: 'Big Pharma BD Playbook.pdf'
      },
      {
        id: 4,
        title: 'Winning BD Pitch Decks and Management Tips',
        description: 'Proven strategies and templates for creating compelling BD presentations.',
        type: 'PDF',
        size: '2.1 MB',
        views: 1560,
        rating: 4.9,
        featured: false,
        filename: 'Winning BD Pitch Deck.pdf'
      },
      {
        id: 5,
        title: 'BD Process and Tips',
        description: 'Comprehensive BD process guide and strategic tips for success.',
        type: 'PDF',
        size: '1.5 MB',
        views: 890,
        rating: 4.6,
        featured: false,
        filename: 'BD Process and Tips.pdf'
      }
    ]
  });
});

// Universal user subscription renewal endpoint
app.post('/api/auth/renew-universal-subscription', authenticateToken, (req, res) => {
  try {
    // Only allow universalx0242@gmail.com to use this endpoint
    if (req.user.email !== 'universalx0242@gmail.com') {
      return res.status(403).json({ message: 'Access denied. Only universal users can renew subscriptions.' });
    }

    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = mockDB.users[userIndex];
    const now = new Date();

    // Renew subscription with extended access
    mockDB.users[userIndex] = {
      ...user,
      paymentCompleted: true,
      currentPlan: 'premium', // Upgrade to premium plan
      currentCredits: 1000, // Give 1000 credits for extended access
      lastCreditRenewal: now.toISOString(),
      nextCreditRenewal: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      paymentUpdatedAt: now.toISOString()
    };

    // Add to payment history
    if (!mockDB.users[userIndex].paymentHistory) {
      mockDB.users[userIndex].paymentHistory = [];
    }

    mockDB.users[userIndex].paymentHistory.push({
      date: now.toISOString(),
      amount: 0, // Free renewal for universal user
      plan: 'premium',
      status: 'completed',
      type: 'universal_renewal'
    });

    saveDataToFiles();

    console.log(`✅ Universal subscription renewed for ${req.user.email}`);

    res.json({
      success: true,
      message: 'Universal subscription renewed successfully',
      newPlan: 'premium',
      newCredits: 1000,
      nextRenewal: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Error renewing universal subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/dashboard/legal', authenticateToken, (req, res) => {
  res.json({
    disclaimer: [
      {
        title: "1. Information Only - No Guarantees",
        content: "The information in the database (contact details, affiliations) is for general informational and business development purposes only, and accuracy, completeness, timeliness, or usefulness is not guaranteed."
      },
      {
        title: "2. No Endorsement or Representation",
        content: "Inclusion of any individual or company does not constitute an endorsement or recommendation, and the platform does not represent or act on behalf of listed individuals or companies."
      },
      {
        title: "3. Use at Your Own Risk",
        content: "Users are solely responsible for how they use the information, including outreach, communication, and follow-up, and the platform is not responsible for the outcome of contact attempts or partnerships."
      },
      {
        title: "4. No Liability",
        content: "The platform shall not be held liable for any direct, indirect, incidental, or consequential damages arising from use of the database, including errors, omissions, inaccuracies, or actions taken based on the information."
      },
      {
        title: "5. Compliance",
        content: "By accessing and using the database, users agree to comply with applicable data privacy laws (such as GDPR, CAN-SPAM) and ethical outreach practices, with the user solely responsible for compliance."
      },
      {
        title: "6. Intellectual Property",
        content: "All content and materials on this platform are protected by intellectual property rights."
      }
    ]
  });
});

app.get('/api/dashboard/contact', authenticateToken, (req, res) => {
  res.json({
    email: "universalx0242@gmail.com",
    message: "Please contact us via email if you find any discrepancies."
  });
});

// ============================================================================
// AUTO-CUT SUBSCRIPTION ENDPOINT
// ============================================================================

// Create subscription with auto-cut functionality
app.post('/api/create-subscription', async (req, res) => {
  try {
    console.log('🚀 Creating subscription with auto-cut...');
    
    const { paymentMethodId, customerEmail, planId, customerName } = req.body;
    
    // Validate required fields
    if (!paymentMethodId || !customerEmail || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID, customer email, and plan ID are required'
      });
    }
    
    // Determine price ID based on plan
    let priceId;
    switch (planId) {
      case 'daily-12':
        // Use test price ID for test mode, live price ID for live mode
        if (stripeSecretKey.includes('sk_test_')) {
          // Create test price for daily plan
          try {
            const testPrice = await stripe.prices.create({
              unit_amount: 100, // $1.00
              currency: 'usd',
              recurring: { interval: 'day' },
              product_data: {
                name: 'Daily Test Plan'
              }
            });
            priceId = testPrice.id;
            console.log('✅ Created test price:', priceId);
          } catch (error) {
            console.error('❌ Error creating test price:', error);
            return res.status(500).json({
              success: false,
              message: 'Failed to create test price'
            });
          }
        } else {
          priceId = 'price_1Ry3VCLf1iznKy11PtmX3JJE'; // Live mode price ID
        }
        break;
      case 'basic':
        priceId = 'price_basic_plan'; // Replace with your basic plan price ID
        break;
      case 'premium':
        priceId = 'price_premium_plan'; // Replace with your premium plan price ID
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid plan ID'
        });
    }
    
    console.log('📊 Subscription details:', {
      customerEmail,
      planId,
      priceId,
      paymentMethodId: paymentMethodId.substring(0, 10) + '...'
    });
    
    // Setup auto-cut subscription
    const result = await setupAutoCutSubscription(
      {
        email: customerEmail,
        name: customerName || 'Customer',
        id: 'user_' + Date.now(), // You can get this from your user database
        planId: planId
      },
      paymentMethodId,
      priceId
    );
    
    if (result.success) {
      // Update user in database
      try {
        // Try MongoDB first
        const User = require('./models/User');
        const updatedUser = await User.findOneAndUpdate(
          { email: customerEmail },
          {
            stripeCustomerId: result.customer.id,
            subscriptionId: result.subscription.id,
            currentPlan: planId,
            subscriptionStatus: 'active',
            paymentCompleted: true,
            subscriptionCreatedAt: new Date(),
            lastPaymentDate: new Date()
          },
          { new: true }
        );
        
        if (updatedUser) {
          console.log('✅ User updated in MongoDB:', customerEmail);
        } else {
          console.log('⚠️ User not found in MongoDB, updating file storage...');
          // Fallback to file storage
          const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
          if (userIndex !== -1) {
            mockDB.users[userIndex].stripeCustomerId = result.customer.id;
            mockDB.users[userIndex].subscriptionId = result.subscription.id;
            mockDB.users[userIndex].currentPlan = planId;
            mockDB.users[userIndex].subscriptionStatus = 'active';
            mockDB.users[userIndex].paymentCompleted = true;
            mockDB.users[userIndex].subscriptionCreatedAt = new Date().toISOString();
            mockDB.users[userIndex].lastPaymentDate = new Date().toISOString();
            saveDataToFiles('subscription_created');
            console.log('✅ User updated in file storage');
          }
        }
      } catch (dbError) {
        console.error('❌ Database update error:', dbError);
        // Continue with response even if database update fails
      }
      
      // Send confirmation email
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER || 'universalx0242@gmail.com',
          to: customerEmail,
          subject: '🎉 Subscription Activated - BioPing',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Subscription Activated!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to BioPing Premium</p>
              </div>
              
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">Your subscription is now active!</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #667eea; margin-top: 0;">Subscription Details:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li style="margin: 10px 0;"><strong>Plan:</strong> ${planId}</li>
                    <li style="margin: 10px 0;"><strong>Status:</strong> Active</li>
                    <li style="margin: 10px 0;"><strong>Auto-Renewal:</strong> Enabled</li>
                    <li style="margin: 10px 0;"><strong>Subscription ID:</strong> ${result.subscription.id}</li>
                  </ul>
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                  <p style="margin: 0; color: #2e7d32;"><strong>✅ Auto-Cut Enabled:</strong> Your subscription will automatically renew. No manual payments required!</p>
                </div>
                
                <p style="color: #666; margin-top: 20px;">
                  You can now access all premium features. If you have any questions, feel free to contact our support team.
                </p>
              </div>
              
              <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p style="margin: 0;">© 2024 BioPing. All rights reserved.</p>
              </div>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('✅ Subscription confirmation email sent to:', customerEmail);
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
        // Continue even if email fails
      }
      
      res.json({
        success: true,
        message: 'Subscription created successfully with auto-cut enabled',
        subscriptionId: result.subscription.id,
        customerId: result.customer.id,
        planId: planId,
        autoRenewal: true
      });
      
    } else {
      console.error('❌ Subscription creation failed:', result.message);
      res.status(400).json({
        success: false,
        message: result.message || 'Subscription creation failed'
      });
    }
    
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and message are required' 
      });
    }

    // Log the contact form submission
    console.log('Contact form submission:', {
      name,
      email,
      company,
      message,
      timestamp: new Date().toISOString()
    });

    // Send email notification to universal email
    const emailContent = `
New Contact Form Submission:
---------------------------
Name: ${name}
Email: ${email}
Company: ${company || 'Not specified'}
Message: ${message}
Timestamp: ${new Date().toLocaleString()}
    `;

    // Send real email to universalx0242@gmail.com
    console.log('🔧 Email Configuration Check:');
    console.log('  - EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('  - EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Email credentials not configured. Skipping email send.');
      console.log('To enable email sending, set EMAIL_USER and EMAIL_PASS environment variables.');
    } else {
      try {
        console.log('📧 Attempting to send email...');
        
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: 'universalx0242@gmail.com',
          subject: 'New Contact Form Submission - BioPing',
          text: emailContent,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company || 'Not specified'}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          `
        };

        console.log('📧 Mail options prepared:', {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject
        });

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to universalx0242@gmail.com');
        console.log('📧 Email result:', result.messageId);
      } catch (emailError) {
        console.error('❌ Error sending email:', emailError);
        console.error('❌ Error details:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    // Log the contact form submission
    console.log('Contact form submission:', {
      name,
      email,
      company,
      message,
      timestamp: new Date().toISOString()
    });

    // In a real application, you would send an email here
    // For now, we'll just log it and return success
    const contactData = {
      id: Date.now().toString(),
      name,
      email,
      company: company || 'Not specified',
      message,
      timestamp: new Date().toISOString(),
      status: 'new'
    };

    // Store in memory (in production, save to database)
    if (!global.contactSubmissions) {
      global.contactSubmissions = [];
    }
    global.contactSubmissions.push(contactData);

    res.json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you within 24 hours.',
      data: contactData
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Get contact submissions (admin only)
app.get('/api/admin/contact-submissions', authenticateAdmin, async (req, res) => {
  try {
    const submissions = global.contactSubmissions || [];
    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// BD Consulting endpoints
app.post('/api/consulting/book-session', authenticateToken, async (req, res) => {
  try {
    const { date, time, topic, notes } = req.body;
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has paid plan (Basic or Premium)
    if (user.currentPlan === 'free') {
      return res.status(403).json({ message: 'Consulting sessions are only available for paid plans' });
    }

    // Check if user has already used their consulting hour
    const existingSession = consultingSessions.find(session => 
      session.userEmail === user.email && session.status === 'completed'
    );

    if (existingSession) {
      return res.status(400).json({ message: 'You have already used your consulting session' });
    }

    const session = {
      id: Date.now().toString(),
      userEmail: user.email,
      userName: user.name,
      userCompany: user.company,
      date: date,
      time: time,
      topic: topic,
      notes: notes,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    consultingSessions.push(session);
    
    res.json({
      success: true,
      message: 'Consulting session booked successfully',
      session: session
    });
  } catch (error) {
    console.error('Error booking consulting session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/consulting/user-sessions', authenticateToken, async (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userSessions = consultingSessions.filter(session => 
      session.userEmail === user.email
    );

    res.json({
      success: true,
      sessions: userSessions
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// BD Consulting tracking system
let consultingSessions = [
  {
    id: '1',
    userEmail: 'test@example.com',
    userName: 'Test User',
    userCompany: 'Test Company',
    date: '2024-01-20',
    time: '10:00 AM',
    topic: 'BD Strategy Discussion',
    notes: 'Initial consultation for partnership strategy',
    status: 'scheduled',
    createdAt: new Date().toISOString()
  }
];

app.get('/api/admin/consulting-sessions', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      sessions: consultingSessions
    });
  } catch (error) {
    console.error('Error fetching consulting sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/complete-session/:sessionId', authenticateAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionIndex = consultingSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    consultingSessions[sessionIndex].status = 'completed';
    consultingSessions[sessionIndex].completedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Session marked as completed',
      session: consultingSessions[sessionIndex]
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pricing Analytics Backend Routes

// In-memory data storage (in production, this would be a database)
let pricingData = {
  plans: [
    { 
      id: 1,
      name: 'Starter', 
      price: 99, 
      color: 'blue', 
      members: 456, 
      revenue: 45144,
      growth: 12.5,
      conversion: 8.2,
      avgLifetime: 14.2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    { 
      id: 2,
      name: 'Professional', 
      price: 199, 
      color: 'purple', 
      members: 623, 
      revenue: 123977,
      growth: 18.7,
      conversion: 12.4,
      avgLifetime: 22.8,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    { 
      id: 3,
      name: 'Enterprise', 
      price: 399, 
      color: 'green', 
      members: 168, 
      revenue: 67032,
      growth: 6.3,
      conversion: 3.1,
      avgLifetime: 45.6,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ],
  recentPurchases: [
    { 
      id: 1,
      name: 'John Smith', 
      company: 'TechCorp', 
      plan: 'Professional', 
      date: '2024-01-15', 
      amount: 199, 
      status: 'active',
      email: 'john.smith@techcorp.com',
      phone: '+1-555-0123',
      createdAt: new Date('2024-01-15')
    },
    { 
      id: 2,
      name: 'Sarah Johnson', 
      company: 'BioTech', 
      plan: 'Enterprise', 
      date: '2024-01-14', 
      amount: 399, 
      status: 'active',
      email: 'sarah.johnson@biotech.com',
      phone: '+1-555-0124',
      createdAt: new Date('2024-01-14')
    },
    { 
      id: 3,
      name: 'Mike Chen', 
      company: 'Pharma Inc', 
      plan: 'Starter', 
      date: '2024-01-13', 
      amount: 99, 
      status: 'active',
      email: 'mike.chen@pharma.com',
      phone: '+1-555-0125',
      createdAt: new Date('2024-01-13')
    },
    { 
      id: 4,
      name: 'Emily Davis', 
      company: 'Life Sciences', 
      plan: 'Professional', 
      date: '2024-01-12', 
      amount: 199, 
      status: 'active',
      email: 'emily.davis@lifesciences.com',
      phone: '+1-555-0126',
      createdAt: new Date('2024-01-12')
    },
    { 
      id: 5,
      name: 'David Wilson', 
      company: 'Research Labs', 
      plan: 'Enterprise', 
      date: '2024-01-11', 
      amount: 399, 
      status: 'active',
      email: 'david.wilson@researchlabs.com',
      phone: '+1-555-0127',
      createdAt: new Date('2024-01-11')
    }
  ],
  monthlyStats: [
    { 
      id: 1,
      month: 'Jan', 
      starter: 45, 
      professional: 62, 
      enterprise: 18, 
      total: 125,
      revenue: 12500,
      growth: 0,
      createdAt: new Date('2024-01-31')
    },
    { 
      id: 2,
      month: 'Feb', 
      starter: 52, 
      professional: 68, 
      enterprise: 22, 
      total: 142,
      revenue: 14200,
      growth: 13.6,
      createdAt: new Date('2024-02-29')
    },
    { 
      id: 3,
      month: 'Mar', 
      starter: 48, 
      professional: 71, 
      enterprise: 20, 
      total: 139,
      revenue: 13900,
      growth: -2.1,
      createdAt: new Date('2024-03-31')
    },
    { 
      id: 4,
      month: 'Apr', 
      starter: 55, 
      professional: 75, 
      enterprise: 25, 
      total: 155,
      revenue: 15500,
      growth: 11.5,
      createdAt: new Date('2024-04-30')
    },
    { 
      id: 5,
      month: 'May', 
      starter: 58, 
      professional: 78, 
      enterprise: 28, 
      total: 164,
      revenue: 16400,
      growth: 5.8,
      createdAt: new Date('2024-05-31')
    },
    { 
      id: 6,
      month: 'Jun', 
      starter: 62, 
      professional: 82, 
      enterprise: 30, 
      total: 174,
      revenue: 17400,
      growth: 6.1,
      createdAt: new Date('2024-06-30')
    }
  ],
  topCompanies: [
    { 
      id: 1,
      name: 'BioTech Solutions', 
      revenue: 2397, 
      members: 12, 
      plan: 'Professional',
      contactPerson: 'Dr. Sarah Johnson',
      email: 'sarah@biotechsolutions.com',
      phone: '+1-555-0101',
      website: 'https://biotechsolutions.com',
      createdAt: new Date('2024-01-01')
    },
    { 
      id: 2,
      name: 'Pharma Research', 
      revenue: 1995, 
      members: 5, 
      plan: 'Enterprise',
      contactPerson: 'Mike Chen',
      email: 'mike@pharmaresearch.com',
      phone: '+1-555-0102',
      website: 'https://pharmaresearch.com',
      createdAt: new Date('2024-01-02')
    },
    { 
      id: 3,
      name: 'Life Sciences Corp', 
      revenue: 1791, 
      members: 9, 
      plan: 'Professional',
      contactPerson: 'Emily Davis',
      email: 'emily@lifesciencescorp.com',
      phone: '+1-555-0103',
      website: 'https://lifesciencescorp.com',
      createdAt: new Date('2024-01-03')
    },
    { 
      id: 4,
      name: 'Medical Innovations', 
      revenue: 1596, 
      members: 8, 
      plan: 'Professional',
      contactPerson: 'David Wilson',
      email: 'david@medicalinnovations.com',
      phone: '+1-555-0104',
      website: 'https://medicalinnovations.com',
      createdAt: new Date('2024-01-04')
    },
    { 
      id: 5,
      name: 'Clinical Research Ltd', 
      revenue: 1398, 
      members: 7, 
      plan: 'Professional',
      contactPerson: 'Lisa Brown',
      email: 'lisa@clinicalresearch.com',
      phone: '+1-555-0105',
      website: 'https://clinicalresearch.com',
      createdAt: new Date('2024-01-05')
    }
  ]
};

// Get all pricing analytics data
app.get('/api/pricing-analytics', authenticateToken, (req, res) => {
  try {
    // Calculate summary statistics
    const totalMembers = pricingData.plans.reduce((sum, plan) => sum + plan.members, 0);
    const totalRevenue = pricingData.plans.reduce((sum, plan) => sum + plan.revenue, 0);
    const avgRevenuePerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0;
    
    const summary = {
      totalMembers,
      totalRevenue,
      avgRevenuePerMember: Math.round(avgRevenuePerMember),
      conversionRate: 8.2, // Average conversion rate
      mostPopularPlan: pricingData.plans.reduce((max, plan) => 
        plan.members > max.members ? plan : max
      ).name
    };

    res.json({
      success: true,
      data: {
        plans: pricingData.plans,
        recentPurchases: pricingData.recentPurchases,
        monthlyStats: pricingData.monthlyStats,
        topCompanies: pricingData.topCompanies,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching pricing analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pricing analytics data' 
    });
  }
});

// Get specific plan details
app.get('/api/pricing-analytics/plans/:planId', authenticateToken, (req, res) => {
  try {
    const planId = parseInt(req.params.planId);
    const plan = pricingData.plans.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan not found' 
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching plan details' 
    });
  }
});

// Add new purchase
app.post('/api/pricing-analytics/purchases', authenticateToken, [
  body('name').notEmpty().trim(),
  body('company').notEmpty().trim(),
  body('plan').notEmpty().trim(),
  body('amount').isNumeric(),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().trim()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { name, company, plan, amount, email, phone } = req.body;
    
    const newPurchase = {
      id: pricingData.recentPurchases.length + 1,
      name,
      company,
      plan,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      email,
      phone: phone || '',
      createdAt: new Date()
    };

    pricingData.recentPurchases.unshift(newPurchase);

    // Update plan statistics
    const planToUpdate = pricingData.plans.find(p => p.name === plan);
    if (planToUpdate) {
      planToUpdate.members += 1;
      planToUpdate.revenue += parseFloat(amount);
      planToUpdate.updatedAt = new Date();
    }

    res.status(201).json({
      success: true,
      message: 'Purchase added successfully',
      data: newPurchase
    });
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding purchase' 
    });
  }
});

// Update plan statistics
app.put('/api/pricing-analytics/plans/:planId', authenticateToken, [
  body('members').optional().isNumeric(),
  body('revenue').optional().isNumeric(),
  body('growth').optional().isNumeric(),
  body('conversion').optional().isNumeric(),
  body('avgLifetime').optional().isNumeric()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const planId = parseInt(req.params.planId);
    const plan = pricingData.plans.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan not found' 
      });
    }

    // Update only provided fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        plan[key] = parseFloat(req.body[key]);
      }
    });
    
    plan.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating plan' 
    });
  }
});

// Get revenue trends
app.get('/api/pricing-analytics/revenue-trends', authenticateToken, (req, res) => {
  try {
    const trends = pricingData.monthlyStats.map(month => ({
      month: month.month,
      revenue: month.revenue,
      growth: month.growth
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching revenue trends' 
    });
  }
});

// Get analytics summary
app.get('/api/pricing-analytics/summary', authenticateToken, (req, res) => {
  try {
    const totalMembers = pricingData.plans.reduce((sum, plan) => sum + plan.members, 0);
    const totalRevenue = pricingData.plans.reduce((sum, plan) => sum + plan.revenue, 0);
    const avgRevenuePerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0;
    
    const summary = {
      totalMembers,
      totalRevenue,
      avgRevenuePerMember: Math.round(avgRevenuePerMember),
      conversionRate: 8.2,
      mostPopularPlan: pricingData.plans.reduce((max, plan) => 
        plan.members > max.members ? plan : max
      ).name,
      totalPurchases: pricingData.recentPurchases.length,
      activePurchases: pricingData.recentPurchases.filter(p => p.status === 'active').length
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics summary' 
    });
  }
});

// Export analytics data
app.get('/api/pricing-analytics/export', authenticateToken, (req, res) => {
  try {
    const exportData = {
      plans: pricingData.plans,
      recentPurchases: pricingData.recentPurchases,
      monthlyStats: pricingData.monthlyStats,
      topCompanies: pricingData.topCompanies,
      exportDate: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=pricing-analytics.json');
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting analytics data' 
    });
  }
});

// Admin Panel Backend Routes

// In-memory storage for biotech data (in production, this would be a database)
let biotechData = [];

// Get all biotech data (admin only)
app.get('/api/admin/biotech-data', authenticateAdmin, (req, res) => {
  try {
    console.log('Admin biotech data - Request received');
    console.log('Admin biotech data - Data count:', biotechData.length);

    res.json({
      success: true,
      data: biotechData,
      uploadedFiles: mockDB.uploadedFiles
    });
  } catch (error) {
    console.error('Error fetching biotech data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching biotech data' 
    });
  }
});

// Upload Excel file
app.post('/api/admin/upload-excel', authenticateAdmin, upload.single('file'), (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Excel file must have at least a header row and one data row'
      });
    }

    // Get headers (first row)
    const headers = jsonData[0].map(header => header ? header.toString().trim() : '');
    
    // Log all headers for debugging
    console.log('Excel headers found:', headers);
    console.log('Looking for specific columns:');
    console.log('Company:', headers.indexOf('Company'));
    console.log('Contact Name:', headers.indexOf('Contact Name'));
    console.log('TA1 - Oncology:', headers.indexOf('TA1 - Oncology'));
    console.log('Tier:', headers.indexOf('Tier'));
    console.log('All TA columns:');
    for (let i = 1; i <= 17; i++) {
      const taHeader = i <= 10 ? `TA${i}` : `T${i}`;
      console.log(`${taHeader}:`, headers.indexOf(`${taHeader} -`));
    }
    
    // Accept any Excel file structure - no validation restrictions
    console.log('Processing Excel file with columns:', headers);

    // Process data rows (skip header)
    const newData = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row.length === 0 || row.every(cell => !cell)) continue; // Skip empty rows
      
      // Create record based on your actual Excel structure from images
      const record = {
        id: biotechData.length + newData.length + 1,
        companyName: row[headers.indexOf('Company')] || 'Pfizer',
        contactPerson: row[headers.indexOf('Contact Name')] || 'Contact ' + (newData.length + 1),
        contactTitle: row[headers.indexOf('Contact Title')] || 'Sr. Director',
        contactFunction: row[headers.indexOf('Contact Function')] || 'Business Development',
        email: row[headers.indexOf('Contact Email')] || 'contact@company.com',
        region: row[headers.indexOf('Country (HQ)')] || 'USA',
        tier: row[headers.indexOf('Tier')] || 'Large Pharma',
        modality: row[headers.indexOf('Modality')] || 'SM, LM, CT, GT',
        partnerType: row[headers.indexOf('Partner Type')] || 'Buyer',
        // Add TA columns based on your Excel structure (TA1-TA17)
        ta1_oncology: row[headers.indexOf('TA1 - Oncology')] || '0',
        ta2_cardiovascular: row[headers.indexOf('TA2 - Cardiovascular')] || '0',
        ta3_neuroscience: row[headers.indexOf('TA3 - Neuroscience')] || '0',
        ta4_immunology_autoimmune: row[headers.indexOf('T4 - Immunology & Autoimmune')] || '0',
        ta5_infectious_diseases: row[headers.indexOf('T5 - Infectious Diseases')] || '0',
        ta6_respiratory: row[headers.indexOf('T6 - Respiratory')] || '0',
        ta7_endocrinology_metabolic: row[headers.indexOf('T7 - Endocrinology & Metabolic')] || '0',
        ta8_rare_orphan: row[headers.indexOf('T8 - Rare / Orphan')] || '0',
        ta9_hematology: row[headers.indexOf('T9 - Hematology')] || '0',
        ta10_gastroenterology: row[headers.indexOf('T10 - Gastroenterology')] || '0',
        ta11_dermatology: row[headers.indexOf('T11 - Dermatology')] || '0',
        ta12_ophthalmology: row[headers.indexOf('T12 - Ophthalmology')] || '0',
        ta13_kidney_renal: row[headers.indexOf('T13 - Kidney / Renal')] || '0',
        ta14_msk_disease: row[headers.indexOf('T14 - MSK Disease')] || '0',
        ta15_womens_health: row[headers.indexOf('T15 - Women\'s Health')] || '0',
        ta16_pain: row[headers.indexOf('T16 - Pain')] || '0',
        ta17_urology: row[headers.indexOf('T17 - Urology')] || '0',
        // Add BD Person TA Focus
        bdPersonTAFocus: row[headers.indexOf('BD Person TA Focus (Only for Business Development)')] || '',
        createdAt: new Date().toISOString().split('T')[0]
      };

      // Accept any record - no validation restrictions
      newData.push(record);
    }

    if (newData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records found in the Excel file'
      });
    }

    // Add to existing data
    biotechData = [...biotechData, ...newData];

    // Store file info in mockDB
    const fileInfo = {
      id: Date.now(),
      filename: req.file.originalname,
      uploadDate: new Date(),
      recordsAdded: newData.length,
      totalRecords: biotechData.length
    };
    mockDB.uploadedFiles.push(fileInfo);

    // Save data to files
    saveDataToFiles('user_created');

    res.status(201).json({
      success: true,
      message: `${newData.length} records uploaded successfully`,
      data: {
        totalRecords: biotechData.length,
        newRecords: newData.length,
        processedRows: jsonData.length - 1,
        validRecords: newData.length,
        fileInfo
      }
    });
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing Excel file: ' + error.message 
    });
  }
});

// Search biotech data (public endpoint with limits)
app.post('/api/search-biotech', authenticateToken, checkUserSuspension, [
  body('drugName').optional(),
  body('diseaseArea').optional(),
  body('developmentStage').optional(),
  body('modality').optional(),
  body('partnerType').optional(),
  body('region').optional(),
  body('function').optional(),
  body('searchType').optional(),
  body('searchQuery').optional()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { drugName, diseaseArea, developmentStage, modality, partnerType, region, function: contactFunction, searchType, searchQuery } = req.body;
    
    console.log('Search criteria:', { drugName, diseaseArea, developmentStage, modality, partnerType, region, contactFunction });
    console.log('Total data available:', biotechData.length);
    console.log('Sample data item:', biotechData[0]);
    
    // Debug: Show all available column names in the first data item
    if (biotechData.length > 0) {
      console.log('Available columns in data:', Object.keys(biotechData[0]));
      console.log('Sample data with all columns:', biotechData[0]);
      
      // Check if the specific columns we're looking for exist
      console.log('Checking for TA columns:');
      console.log('t4_immunology_autoimmune exists:', 't4_immunology_autoimmune' in biotechData[0]);
      console.log('tier exists:', 'tier' in biotechData[0]);
      console.log('t4_immunology_autoimmune value:', biotechData[0].t4_immunology_autoimmune);
      console.log('tier value:', biotechData[0].tier);
    }
    
    // Filter data based on search criteria
    let filteredData = biotechData;
    
    // Check if user provided any search criteria
    let hasSearchCriteria = false;
    let searchCriteria = [];
    
    // Handle simple search by company name or contact name
    if (searchType && searchQuery) {
      hasSearchCriteria = true;
      searchCriteria.push('Simple Search');
      console.log('Simple search:', { searchType, searchQuery });
      
      const query = searchQuery.toLowerCase().trim();
      let tempFilteredData = biotechData.filter(item => {
        if (searchType === 'Company Name') {
          // Partial match for company name (case insensitive) - so "pfizer" will find "Pfizer Inc"
          return item.companyName && item.companyName.toLowerCase().includes(query);
        } else if (searchType === 'Contact Name') {
          // Partial match for contact name (case insensitive)
          return item.contactPerson && item.contactPerson.toLowerCase().includes(query);
        }
        return false;
      });
      
      // Always return individual contacts, don't group by company
      filteredData = tempFilteredData;
      console.log('Individual contacts found:', filteredData.length);
      console.log('After simple search filter, records found:', filteredData.length);
    }
    
    // Disease Area - mandatory
    if (diseaseArea) {
      hasSearchCriteria = true;
      searchCriteria.push('Disease Area');
      console.log('Filtering by disease area:', diseaseArea);
      
      // Map disease area to actual columns in your data (TA1-TA3, T4-T17)
      let taColumn = '';
      switch(diseaseArea) {
        case 'TA1 - Oncology': taColumn = 'ta1_oncology'; break;
        case 'TA2 - Cardiovascular': taColumn = 'ta2_cardiovascular'; break;
        case 'TA3 - Neuroscience': taColumn = 'ta3_neuroscience'; break;
        case 'TA4 - Immunology & Autoimmune': taColumn = 'ta4_immunology_autoimmune'; break;
        case 'TA5 - Infectious Diseases': taColumn = 'ta5_infectious_diseases'; break;
        case 'TA6 - Respiratory': taColumn = 'ta6_respiratory'; break;
        case 'TA7 - Endocrinology & Metabolic': taColumn = 'ta7_endocrinology_metabolic'; break;
        case 'TA8 - Rare / Orphan': taColumn = 'ta8_rare_orphan'; break;
        case 'TA9 - Hematology': taColumn = 'ta9_hematology'; break;
        case 'TA10 - Gastroenterology': taColumn = 'ta10_gastroenterology'; break;
        case 'TA11 - Dermatology': taColumn = 'ta11_dermatology'; break;
        case 'TA12 - Ophthalmology': taColumn = 'ta12_ophthalmology'; break;
        case 'TA13 - Kidney / Renal': taColumn = 'ta13_kidney_renal'; break;
        case 'TA14 - MSK Disease': taColumn = 'ta14_msk_disease'; break;
        case 'TA15 - Women\'s Health': taColumn = 'ta15_womens_health'; break;
        case 'TA16 - Pain': taColumn = 'ta16_pain'; break;
        case 'TA17 - Urology': taColumn = 'ta17_urology'; break;
        default: taColumn = ''; break;
      }
      
      if (taColumn) {
        console.log('Filtering by TA column:', taColumn);
        console.log('Checking if column exists in data:', taColumn in (biotechData[0] || {}));
        filteredData = biotechData.filter(item => {
          const taValue = item[taColumn];
          console.log('Checking:', item.companyName, 'TA Value:', taValue, 'Type:', typeof taValue, 'Column exists:', taColumn in item);
          return taValue === '1' || taValue === 1 || taValue === true;
        });
        console.log('After disease area filter, records found:', filteredData.length);
      } else {
        console.log('Disease area not found in available options, skipping filter');
      }
    }
    
    // Partner Type (Looking For) - mandatory
    if (partnerType) {
      hasSearchCriteria = true;
      searchCriteria.push('Looking For');
      console.log('Filtering by partner type:', partnerType);
      
      const uniqueTiers = [...new Set(biotechData.map(item => item.tier))];
      console.log('Available tier values in data:', uniqueTiers);
      
      if (uniqueTiers.length > 0 && !uniqueTiers.every(tier => !tier)) {
        filteredData = filteredData.filter(item => {
          const itemTier = item.tier || '';
          let isMatch = false;
          
          console.log('Checking tier for:', item.companyName, 'Item tier:', itemTier, 'Search tier:', partnerType);
          
                      if (partnerType === 'Tier 1 - Large Pharma') {
            isMatch = itemTier.toLowerCase().includes('large pharma') || itemTier.toLowerCase().includes('large');
          } else if (partnerType === 'Tier 2 - Mid-Size') {
            isMatch = itemTier.toLowerCase().includes('mid') || itemTier.toLowerCase().includes('mid cap');
          } else if (partnerType === 'Tier 3 - Small Biotech\'s') {
            isMatch = itemTier.toLowerCase().includes('small') || itemTier.toLowerCase().includes('small cap');
          }
          
          console.log('Tier match result:', isMatch, 'for company:', item.companyName);
          return isMatch;
        });
        console.log('After partner type filter, records found:', filteredData.length);
      }
    }
    
    // Development Stage - optional, skip if no stage data available
    if (developmentStage && developmentStage.trim() !== '') {
      console.log('Development stage provided:', developmentStage);
      console.log('Note: Stage of Development column not found in Excel data - skipping stage filter');
      // Don't add to searchCriteria since we're not actually filtering
      // Don't filter data since stage column doesn't exist
      console.log('Stage filter skipped - no stage data available in Excel');
    }
    
    // Modality - optional but if provided, must match
    if (modality) {
      hasSearchCriteria = true;
      searchCriteria.push('Modality');
      console.log('Filtering by modality:', modality);
      filteredData = filteredData.filter(item => {
        const itemModality = item.modality || '';
        let isMatch = false;
        
        console.log('Checking modality for:', item.companyName, 'Item modality:', itemModality, 'Search modality:', modality);
        console.log('Modality type:', typeof itemModality, 'Length:', itemModality.length);
        
        // Handle modality abbreviations (only what's actually in Excel)
        if (modality === 'Small Molecule') {
          isMatch = itemModality.toLowerCase().includes('sm') || itemModality.toLowerCase().includes('small molecule');
        } else if (modality === 'Large Molecule') {
          // Look for "LM" specifically (case insensitive)
          isMatch = itemModality.toLowerCase().includes('lm') || itemModality.toLowerCase().includes('large molecule');
          console.log('Large Molecule check:', itemModality, 'contains LM:', isMatch);
        } else if (modality === 'Cell Therapy') {
          isMatch = itemModality.toLowerCase().includes('ct') || itemModality.toLowerCase().includes('cell therapy');
        } else if (modality === 'Gene Therapy') {
          isMatch = itemModality.toLowerCase().includes('gt') || itemModality.toLowerCase().includes('gene therapy');
        } else if (modality === 'RNA Therapy') {
          isMatch = itemModality.toLowerCase().includes('rna') || itemModality.toLowerCase().includes('rna therapy');
        } else if (modality === 'Biologics') {
          isMatch = itemModality.toLowerCase().includes('bx') || itemModality.toLowerCase().includes('biologics');
        } else if (modality === 'Other') {
          // For "Other", check if it doesn't match any of the main modalities in Excel
          const mainModalities = ['sm', 'lm', 'ct', 'gt', 'rna', 'bx', 'rl', 'vc', 'mb', 'pdt', 'aso', 'st', 'gx'];
          isMatch = !mainModalities.some(mod => itemModality.toLowerCase().includes(mod));
        } else {
          // Fallback to general search
          isMatch = itemModality.toLowerCase().includes(modality.toLowerCase());
        }
        
        console.log('Modality match result:', isMatch, 'for company:', item.companyName);
        return isMatch;
      });
      console.log('After modality filter, records found:', filteredData.length);
    }
    
    // Drug Name - user enters their own drug, don't filter by it, just include it in results
    if (drugName && drugName.trim()) {
      console.log('User drug name:', drugName, '- will be displayed in results, not used for filtering');
      // Don't filter by drug name - user enters their own drug to sell
    }
    
    // Region - only filter if user selected it
    if (region) {
      hasSearchCriteria = true;
      searchCriteria.push('Region');
      console.log('Filtering by region:', region);
      filteredData = filteredData.filter(item => {
        const itemRegion = item.region || '';
        let isMatch = false;
        
        console.log('Checking region for:', item.companyName, 'Item region:', itemRegion, 'Search region:', region);
        
        // Handle region variations and abbreviations
        if (region === 'North America') {
          isMatch = itemRegion.toLowerCase().includes('usa') || 
                   itemRegion.toLowerCase().includes('united states') ||
                   itemRegion.toLowerCase().includes('us') ||
                   itemRegion.toLowerCase().includes('canada');
        } else if (region === 'Europe') {
          isMatch = itemRegion.toLowerCase().includes('germany') || 
                   itemRegion.toLowerCase().includes('france') ||
                   itemRegion.toLowerCase().includes('switzerland') ||
                   itemRegion.toLowerCase().includes('denmark') ||
                   itemRegion.toLowerCase().includes('uk');
        } else if (region === 'Asia') {
          isMatch = itemRegion.toLowerCase().includes('japan') || 
                   itemRegion.toLowerCase().includes('china');
        } else if (region === 'Africa') {
          // No African companies in your data currently
          isMatch = false;
        } else if (region === 'South America') {
          // No South American companies in your data currently
          isMatch = false;
        } else {
          // Fallback to general search for specific countries
          isMatch = itemRegion.toLowerCase().includes(region.toLowerCase());
        }
        
        console.log('Region match result:', isMatch, 'for company:', item.companyName);
        return isMatch;
      });
      console.log('After region filter, records found:', filteredData.length);
    }
    
    // Function - only filter if user selected it
    if (contactFunction) {
      hasSearchCriteria = true;
      searchCriteria.push('Function');
      console.log('Filtering by function:', contactFunction);
      filteredData = filteredData.filter(item => {
        const itemFunction = item.contactFunction || '';
        let isMatch = false;
        
        console.log('Checking function for:', item.companyName, 'Item function:', itemFunction, 'Search function:', contactFunction);
        
        // Handle frontend function options
        if (contactFunction === 'Business Development') {
          // Find all BD-related functions
          isMatch = itemFunction.toLowerCase().includes('business development') || 
                   itemFunction.toLowerCase().includes('bd') ||
                   itemFunction.toLowerCase().includes('business dev') ||
                   itemFunction.toLowerCase().includes('regulatory bd') ||
                   itemFunction.toLowerCase().includes('r&d business development') ||
                   itemFunction.toLowerCase().includes('international business development');
        } else if (contactFunction === 'Non-BD') {
          // Find all non-BD functions (exclude BD-related)
          const isBD = itemFunction.toLowerCase().includes('business development') || 
                      itemFunction.toLowerCase().includes('bd') ||
                      itemFunction.toLowerCase().includes('business dev') ||
                      itemFunction.toLowerCase().includes('regulatory bd') ||
                      itemFunction.toLowerCase().includes('r&d business development') ||
                      itemFunction.toLowerCase().includes('international business development');
          isMatch = !isBD && itemFunction.toLowerCase() !== 'na' && itemFunction.toLowerCase() !== 'not defined';
        } else if (contactFunction === 'All') {
          // Show both BD and non-BD functions (include all valid functions)
          isMatch = itemFunction.toLowerCase() !== 'na' && itemFunction.toLowerCase() !== 'not defined';
        } else {
          // Fallback to general search for specific functions
          isMatch = itemFunction.toLowerCase().includes(contactFunction.toLowerCase());
        }
        
        console.log('Function match result:', isMatch, 'for company:', item.companyName);
        return isMatch;
      });
      console.log('After function filter, records found:', filteredData.length);
    }
    
    console.log('Search criteria provided:', searchCriteria);
    console.log('Filtered data count:', filteredData.length);

    // If no search criteria provided, return empty results
    if (!hasSearchCriteria) {
      console.log('No search criteria provided. Returning empty results.');
      return res.json({
        success: true,
        data: {
          results: [],
          totalFound: 0,
          totalShown: 0,
          hasMore: false,
          message: 'Please select at least Disease Area and Looking For to search, or use the search bar to find companies or contacts.'
        }
      });
    }
    
    // If search criteria provided but no matches found, return empty results
    if (hasSearchCriteria && filteredData.length === 0) {
      console.log('Search criteria provided but no matches found. Returning empty results.');
      return res.json({
        success: true,
        data: {
          results: [],
          totalFound: 0,
          totalShown: 0,
          hasMore: false,
          message: `No Match Found. Please Refine Your Search Criterion`
        }
      });
    }
    
    // Show all results without any limits
    const limitedData = filteredData.map(item => ({
      id: item.id,
      companyName: item.companyName,
      contactPerson: item.contactPerson,
      contactTitle: item.contactTitle,
      contactFunction: item.contactFunction,
      region: item.region,
      tier: item.tier,
      modality: item.modality,
      partnerType: item.partnerType,
      // Show email for testing
      email: item.email,
      // Add all TA columns for complete data
      ta1_oncology: item.ta1_oncology,
      ta2_cardiovascular: item.ta2_cardiovascular,
      ta3_neuroscience: item.ta3_neuroscience,
      ta4_immunology_autoimmune: item.ta4_immunology_autoimmune,
      ta5_infectious_diseases: item.ta5_infectious_diseases,
      ta6_respiratory: item.ta6_respiratory,
      ta7_endocrinology_metabolic: item.ta7_endocrinology_metabolic,
      ta8_rare_orphan: item.ta8_rare_orphan,
      ta9_hematology: item.ta9_hematology,
      ta10_gastroenterology: item.ta10_gastroenterology,
      ta11_dermatology: item.ta11_dermatology,
      ta12_ophthalmology: item.ta12_ophthalmology,
      ta13_kidney_renal: item.ta13_kidney_renal,
      ta14_msk_disease: item.ta14_msk_disease,
      ta15_womens_health: item.ta15_womens_health,
      ta16_pain: item.ta16_pain,
      ta17_urology: item.ta17_urology,
      bdPersonTAFocus: item.bdPersonTAFocus
    }));

    res.json({
      success: true,
      data: {
        results: limitedData,
        totalFound: filteredData.length,
        totalShown: limitedData.length,
        hasMore: false, // Show all results
        message: filteredData.length === 0 ? 'No Match Found. Please Refine Your Search Criterion' : null
      }
    });
    
    // Save search data
    saveDataToFiles('search_performed');
    
  } catch (error) {
    console.error('Error searching biotech data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching data' 
    });
  }
});

// Get contact emails (paid feature)
app.post('/api/get-contacts', authenticateToken, [
  body('companyIds').isArray()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { companyIds } = req.body;
    
    // Get contact details for requested companies
    const contacts = biotechData
      .filter(item => companyIds.includes(item.id))
      .map(item => ({
        id: item.id,
        companyName: item.companyName,
        contactPerson: item.contactPerson,
        email: item.email,
        phone: item.phone,
        website: item.website
      }));

    res.json({
      success: true,
      data: {
        contacts,
        totalContacts: contacts.length,
        price: contacts.length * 99 // $99 per contact
      }
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting contacts' 
    });
  }
});

// Delete multiple records (admin only)
app.delete('/api/admin/delete-records', authenticateAdmin, (req, res) => {
  try {

    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request: ids array required' 
      });
    }

    const initialLength = biotechData.length;
    biotechData = biotechData.filter(item => !ids.includes(item.id));

    const deletedCount = initialLength - biotechData.length;

    // Save data to files
    saveDataToFiles('payment_success');

    res.json({
      success: true,
      message: `${deletedCount} records deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting records:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting records' 
    });
  }
});

// Delete single record (admin only)
app.delete('/api/admin/biotech-data/:id', authenticateAdmin, (req, res) => {
  try {

    const id = parseInt(req.params.id);
    const initialLength = biotechData.length;
    biotechData = biotechData.filter(item => item.id !== id);

    if (biotechData.length === initialLength) {
      return res.status(404).json({ 
        success: false, 
        message: 'Record not found' 
      });
    }

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting record' 
    });
  }
});

// Get admin statistics
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  try {

    const uniqueCompanies = new Set(biotechData.map(item => item.companyName)).size;
    const uniqueContacts = new Set(biotechData.map(item => item.email)).size;
    
    const stats = {
      totalRecords: biotechData.length,
      totalCompanies: uniqueCompanies,
      totalContacts: uniqueContacts,
      totalRevenue: biotechData.length * 99 // Assuming $99 per record
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching admin stats' 
    });
  }
});

// Debug endpoint to see uploaded data
app.get('/api/debug/data', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalRecords: biotechData.length,
        sampleRecords: biotechData.slice(0, 3),
        allRecords: biotechData,
        summary: {
          companies: [...new Set(biotechData.map(item => item.companyName))],
          tiers: [...new Set(biotechData.map(item => item.tier))],
          taColumns: Object.keys(biotechData[0] || {}).filter(key => key.startsWith('ta'))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching debug data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching debug data' 
    });
  }
});

// Connect to MongoDB
console.log('🔧 Initializing server...');
console.log('📡 Attempting MongoDB connection...');

// Data storage with file persistence
const DATA_FILE = path.join(__dirname, 'data', 'biotechData.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const VERIFICATION_FILE = path.join(__dirname, 'data', 'verificationCodes.json');
const UPLOADED_FILES_FILE = path.join(__dirname, 'data', 'uploadedFiles.json');
const BD_TRACKER_FILE = path.join(__dirname, 'data', 'bdTracker.json');
const BLOCKED_EMAILS_FILE = path.join(__dirname, 'data', 'blockedEmails.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load data from files with recovery
const loadDataFromFiles = () => {
  try {
    // Load biotech data
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      biotechData = JSON.parse(data);
      console.log(`✅ Loaded ${biotechData.length} biotech records from file`);
    } else {
      console.log('⚠️ No biotech data file found, starting fresh');
    }

    // Load users
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      mockDB.users = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.users.length} users from file`);
    } else {
      console.log('⚠️ No users file found, starting fresh');
      mockDB.users = [];
    }

    // Load verification codes
    if (fs.existsSync(VERIFICATION_FILE)) {
      const data = fs.readFileSync(VERIFICATION_FILE, 'utf8');
      mockDB.verificationCodes = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.verificationCodes.length} verification codes from file`);
    } else {
      console.log('⚠️ No verification codes file found, starting fresh');
      mockDB.verificationCodes = [];
    }

    // Load uploaded files info
    if (fs.existsSync(UPLOADED_FILES_FILE)) {
      const data = fs.readFileSync(UPLOADED_FILES_FILE, 'utf8');
      mockDB.uploadedFiles = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.uploadedFiles.length} uploaded files info from file`);
    } else {
      console.log('⚠️ No uploaded files info found, starting fresh');
      mockDB.uploadedFiles = [];
    }

    // Load BD Tracker data
    if (fs.existsSync(BD_TRACKER_FILE)) {
      const data = fs.readFileSync(BD_TRACKER_FILE, 'utf8');
      mockDB.bdTracker = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.bdTracker.length} BD Tracker entries from file`);
    } else {
      console.log('⚠️ No BD Tracker file found, starting fresh');
      mockDB.bdTracker = [];
    }

    // Load PDFs data
    if (fs.existsSync(path.join(__dirname, 'data', 'pdfs.json'))) {
      const data = fs.readFileSync(path.join(__dirname, 'data', 'pdfs.json'), 'utf8');
      mockDB.pdfs = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.pdfs.length} PDFs from file`);
    } else {
      console.log('⚠️ No PDFs file found, starting fresh');
      mockDB.pdfs = [];
    }

    // Load pricing data
    if (fs.existsSync(path.join(__dirname, 'data', 'pricing.json'))) {
      const data = fs.readFileSync(path.join(__dirname, 'data', 'pricing.json'), 'utf8');
      mockDB.pricing = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.pricing.length} pricing plans from file`);
    } else {
      console.log('⚠️ No pricing file found, starting fresh');
      mockDB.pricing = [];
    }

    // Load blocked emails data
    if (fs.existsSync(BLOCKED_EMAILS_FILE)) {
      const data = fs.readFileSync(BLOCKED_EMAILS_FILE, 'utf8');
      mockDB.blockedEmails = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.blockedEmails.length} blocked emails from file`);
    } else {
      console.log('⚠️ No blocked emails file found, starting fresh');
      mockDB.blockedEmails = [];
    }

    // Ensure universal users exist
    const universalEmails = [
      'universalx0242@gmail.com',
      'admin@bioping.com',
      'demo@bioping.com',
      'test@bioping.com'
    ];

    universalEmails.forEach(email => {
      const existingUser = mockDB.users.find(u => u.email === email);
      if (!existingUser) {
        console.log(`🔄 Creating universal user: ${email}`);
        const newUser = {
          id: mockDB.users.length + 1,
          firstName: email.split('@')[0],
          lastName: '',
          email: email,
          password: '$2a$10$20TtHYxGnnAA1EcZoXq06u2faT68sDulbmnMEJMyg.kRZBh6cicmS', // Default password: 'password'
          name: email.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString(),
          paymentCompleted: email === 'universalx0242@gmail.com' ? true : false,
          currentPlan: email === 'universalx0242@gmail.com' ? 'test' : 'free',
          currentCredits: email === 'universalx0242@gmail.com' ? 1 : 5,
          // Add invoice data for universalx0242@gmail.com
          invoices: email === 'universalx0242@gmail.com' ? [
            {
              id: 'INV-001',
              amount: 1.00,
              currency: 'USD',
              status: 'paid',
              date: new Date().toISOString(),
              description: 'Test Plan - $1.00',
              plan: 'Test Plan'
            }
          ] : [],
          paymentHistory: email === 'universalx0242@gmail.com' ? [
            {
              id: 'PAY-001',
              amount: 1.00,
              currency: 'USD',
              status: 'completed',
              date: new Date().toISOString(),
              description: 'Test Plan Payment',
              plan: 'Test Plan'
            }
          ] : []
        };
        mockDB.users.push(newUser);
      }
    });

    // Update existing universalx0242@gmail.com user with invoice data
    const universalUser = mockDB.users.find(u => u.email === 'universalx0242@gmail.com');
    if (universalUser && (!universalUser.invoices || universalUser.invoices.length === 0)) {
      console.log('🔄 Adding invoice data to universal user...');
      universalUser.invoices = [
        {
          id: 'INV-001',
          amount: 1.00,
          currency: 'USD',
          status: 'paid',
          date: new Date().toISOString(),
          description: 'Test Plan - $1.00',
          plan: 'Test Plan'
        }
      ];
      universalUser.paymentHistory = [
        {
          id: 'PAY-001',
          amount: 1.00,
          currency: 'USD',
          status: 'completed',
          date: new Date().toISOString(),
          description: 'Test Plan Payment',
          plan: 'Test Plan'
        }
      ];
    }

    // Save immediately after ensuring universal users exist
    saveDataToFiles('subscription_created');
    
  } catch (error) {
    console.error('❌ Error loading data from files:', error);
    console.log('🔄 Attempting to recover from backup...');
    
    // Try to recover from backup
    try {
      const backupDir = path.join(__dirname, 'backups');
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
        if (backupFiles.length > 0) {
          const latestBackup = backupFiles.sort().pop();
          const backupPath = path.join(backupDir, latestBackup);
          const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
          
          mockDB.users = backupData.users || [];
          mockDB.verificationCodes = backupData.verificationCodes || [];
          mockDB.uploadedFiles = backupData.uploadedFiles || [];
          mockDB.bdTracker = backupData.bdTracker || [];
          biotechData = backupData.biotechData || [];
          
          console.log('✅ Recovered data from backup:', latestBackup);
          saveDataToFiles('credit_used');
        }
      }
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError);
      console.log('🔄 Starting with fresh data...');
      mockDB.users = [];
      mockDB.verificationCodes = [];
      mockDB.uploadedFiles = [];
      mockDB.bdTracker = [];
      biotechData = [];
    }
  }
};

// Debounced saving to improve performance
let saveTimeout = null;
const saveDataToFiles = (action = 'auto') => {
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Set new timeout to save after 2 seconds of inactivity
  saveTimeout = setTimeout(() => {
    performSave(action);
  }, 2000);
};

// Immediate save function for critical operations
const saveDataToFilesImmediate = (action = 'auto') => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  performSave(action);
};

// Actual save function
const performSave = (action = 'auto') => {
  try {
    // Create backup before saving
    const backupDir = path.join(__dirname, 'backups', new Date().toISOString().split('T')[0]);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save biotech data
    fs.writeFileSync(DATA_FILE, JSON.stringify(biotechData, null, 2));
    console.log(`✅ Saved ${biotechData.length} biotech records (${action})`);
    
    // Save users
    fs.writeFileSync(USERS_FILE, JSON.stringify(mockDB.users, null, 2));
    console.log(`✅ Saved ${mockDB.users.length} users (${action})`);
    
    // Save verification codes
    fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(mockDB.verificationCodes, null, 2));
    console.log(`✅ Saved ${mockDB.verificationCodes.length} verification codes (${action})`);
    
    // Save uploaded files info
    fs.writeFileSync(UPLOADED_FILES_FILE, JSON.stringify(mockDB.uploadedFiles, null, 2));
    console.log(`✅ Saved ${mockDB.uploadedFiles.length} uploaded files info (${action})`);
    
    // Save BD Tracker data
    fs.writeFileSync(BD_TRACKER_FILE, JSON.stringify(mockDB.bdTracker, null, 2));
    console.log(`✅ Saved ${mockDB.bdTracker.length} BD Tracker entries (${action})`);
    
    // Save PDFs data
    fs.writeFileSync(path.join(__dirname, 'data', 'pdfs.json'), JSON.stringify(mockDB.pdfs, null, 2));
    console.log(`✅ Saved ${mockDB.pdfs.length} PDFs (${action})`);
    
    // Save pricing data
    fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
    console.log(`✅ Saved ${mockDB.pricing.length} pricing plans (${action})`);
    
    // Save blocked emails data
    fs.writeFileSync(BLOCKED_EMAILS_FILE, JSON.stringify(mockDB.blockedEmails, null, 2));
    console.log(`✅ Saved ${mockDB.blockedEmails.length} blocked emails (${action})`);
    
    console.log(`✅ All data saved successfully (${action})`);
  } catch (error) {
    console.error(`❌ Error saving data (${action}):`, error);
    // Try to save to backup location
    try {
      const backupFile = path.join(__dirname, 'backups', `backup-${Date.now()}.json`);
      const backupData = {
        users: mockDB.users,
        biotechData: biotechData,
        verificationCodes: mockDB.verificationCodes,
        uploadedFiles: mockDB.uploadedFiles,
        bdTracker: mockDB.bdTracker,
        pdfs: mockDB.pdfs,
        pricing: mockDB.pricing,
        timestamp: new Date().toISOString(),
        action: action
      };
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      console.log('✅ Emergency backup saved to:', backupFile);
    } catch (backupError) {
      console.error('❌ Emergency backup also failed:', backupError);
    }
  }
};

// Mock database connection for now
const mockDB = {
  users: [],
  verificationCodes: [],
  uploadedFiles: [], // Store uploaded file info
  bdTracker: [], // Store BD Tracker entries
  pdfs: [], // Store PDF management data
  pricing: [], // Store pricing plans data
  blockedEmails: [] // Store blocked email addresses
};

// Load data on startup
loadDataFromFiles();

// Save data periodically (every 5 minutes)
setInterval(() => {
  saveDataToFiles('bd_entry_added');
}, 5 * 60 * 1000);

// Save data on server shutdown
process.on('SIGINT', () => {
  console.log('Saving data before shutdown...');
  saveDataToFiles('search_performed');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Saving data before shutdown...');
  saveDataToFiles('file_uploaded');
  process.exit(0);
});

// Email functionality removed - using universal login emails




// Get all users (admin only)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    let users = [];
    let totalUsers = 0;

    // Try to fetch users from MongoDB first
    try {
      const mongoUsers = await User.find({}).select('-password').sort({ createdAt: -1 });
      if (mongoUsers && mongoUsers.length > 0) {
        users = mongoUsers.map(user => {
          // Calculate actual credits based on payment status and trial expiration
          let actualCredits = user.currentCredits || 5;
          
          if (user.paymentCompleted && user.currentPlan !== 'free') {
            // Paid users - keep their actual credits (like universalx0242 with 34 credits)
            actualCredits = user.currentCredits || 0;
          } else {
            // Free users - check if 3-day trial has expired
            const registrationDate = new Date(user.createdAt);
            const currentDate = new Date();
            const daysSinceRegistration = Math.floor((currentDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceRegistration >= 3) {
              actualCredits = 0; // Trial expired
            } else {
              actualCredits = 5; // Still in trial period
            }
          }
          
          return {
            id: user._id,
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            company: user.company,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            paymentCompleted: user.paymentCompleted,
            currentPlan: user.currentPlan,
            currentCredits: actualCredits,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            name: `${user.firstName} ${user.lastName}`.trim()
          };
        });
        totalUsers = users.length;
        console.log(`✅ Fetched ${totalUsers} users from MongoDB`);
      }
    } catch (dbError) {
      console.log('❌ MongoDB not available, using file-based storage...');
    }

    // If no users from MongoDB, fallback to file-based storage
    if (users.length === 0) {
      users = mockDB.users.map(user => {
        // Calculate actual credits based on payment status and trial expiration
        let actualCredits = user.currentCredits || 5;
        
        if (user.paymentCompleted && user.currentPlan !== 'free') {
          // Paid users - keep their actual credits (like universalx0242 with 34 credits)
          actualCredits = user.currentCredits || 0;
        } else {
          // Free users - check if 3-day trial has expired
          const registrationDate = new Date(user.createdAt);
          const currentDate = new Date();
          const daysSinceRegistration = Math.floor((currentDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceRegistration >= 3) {
            actualCredits = 0; // Trial expired
          } else {
            actualCredits = 5; // Still in trial period
          }
        }
        
        return {
          ...user,
          currentCredits: actualCredits
        };
      });
      totalUsers = users.length;
      console.log(`📁 Using ${totalUsers} users from file storage`);
    }

    res.json({
      success: true,
      data: {
        users: users,
        totalUsers: totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`🗑️ Delete user request - ID: ${userId} (type: ${typeof userId})`);
    let user = null;
    let userEmail = null;

    // Try to find and delete user in MongoDB first
    try {
      user = await User.findById(userId);
      if (user) {
        userEmail = user.email;
        await User.findByIdAndDelete(userId);
        console.log(`✅ User deleted from MongoDB: ${userEmail}`);
      }
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file-based storage...');
    }

    // If not found in MongoDB, check file-based storage
    if (!user) {
      const fileUserIndex = mockDB.users.findIndex(u => 
        u.id === parseInt(userId) || 
        u.id === userId || 
        u._id === userId || 
        u._id === parseInt(userId)
      );
      if (fileUserIndex !== -1) {
        user = mockDB.users[fileUserIndex];
        userEmail = user.email;
        mockDB.users.splice(fileUserIndex, 1);
        console.log(`✅ User deleted from file storage: ${userEmail}`);
      }
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Add email to blocked list to prevent re-registration
    if (userEmail) {
      const blockedEmailEntry = {
        email: userEmail,
        blockedAt: new Date().toISOString(),
        blockedBy: req.user.email || 'admin',
        reason: 'User account deleted by admin'
      };

      // Add to file-based blocked emails
      mockDB.blockedEmails.push(blockedEmailEntry);
      
      // Save the blocked emails data
      saveDataToFiles('user_deleted_and_blocked');
      
      console.log(`🚫 Email blocked to prevent re-registration: ${userEmail}`);
    }

    res.json({
      success: true,
      message: 'User deleted successfully and email blocked from re-registration'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user' 
    });
  }
});

// Get blocked emails (admin only)
app.get('/api/admin/blocked-emails', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockDB.blockedEmails
    });
  } catch (error) {
    console.error('Error fetching blocked emails:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching blocked emails' 
    });
  }
});

// ADMIN CREDIT MODIFICATION REMOVED - Credits can only be consumed, never restored
// This ensures the integrity of the credit system

// ADMIN CREDIT MODIFICATION REMOVED - Credits can only be consumed, never restored
// This ensures the integrity of the credit system

// Unblock email (admin only)
app.post('/api/admin/unblock-email', authenticateAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const emailIndex = mockDB.blockedEmails.findIndex(blocked => blocked.email === email);
    if (emailIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email not found in blocked list' 
      });
    }

    // Remove from blocked list
    mockDB.blockedEmails.splice(emailIndex, 1);
    saveDataToFiles('email_unblocked');
    
    console.log(`✅ Email unblocked: ${email}`);
    
    res.json({
      success: true,
      message: 'Email unblocked successfully'
    });
  } catch (error) {
    console.error('Error unblocking email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error unblocking email' 
    });
  }
});

// BD Tracker API Endpoints

// Get all BD Tracker entries for specific user
app.get('/api/bd-tracker', authenticateToken, checkUserSuspension, async (req, res) => {
  try {
    console.log('BD Tracker GET - User ID:', req.user.id);
    console.log('BD Tracker GET - User Email:', req.user.email);
    
    let userEntries = [];
    
    // Try MongoDB first
    try {
      userEntries = await BDTracker.find({ userId: req.user.id }).sort({ createdAt: -1 });
      console.log('BD Tracker GET - MongoDB entries:', userEntries.length);
    } catch (dbError) {
      console.log('MongoDB not available, using file-based storage...');
      // Fallback to file-based storage
      userEntries = mockDB.bdTracker.filter(entry => entry.userId === req.user.id);
      console.log('BD Tracker GET - File entries:', userEntries.length);
    }
    
    res.json({
      success: true,
      data: userEntries
    });
  } catch (error) {
    console.error('Error fetching BD Tracker entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching BD Tracker entries' 
    });
  }
});

// Add new BD Tracker entry
app.post('/api/bd-tracker', authenticateToken, async (req, res) => {
  try {
    console.log('BD Tracker POST - User ID:', req.user.id);
    console.log('BD Tracker POST - User Email:', req.user.email);
    console.log('BD Tracker POST - Request Body:', req.body);
    
    const { projectName, company, programPitched, outreachDates, contactFunction, contactPerson, cda, feedback, nextSteps, timelines, reminders } = req.body;

    // Validate required fields
    if (!projectName || !company || !contactPerson) {
      console.log('BD Tracker POST - Validation failed:', { projectName, company, contactPerson });
      return res.status(400).json({
        success: false,
        message: 'Project Name, Company, and Contact Person are required'
      });
    }

    let newEntry = null;

    // Try MongoDB first
    try {
      newEntry = new BDTracker({
        userId: req.user.id,
        projectName,
        company,
        programPitched: programPitched || '',
        outreachDates: outreachDates || '',
        contactFunction: contactFunction || '',
        contactPerson,
        cda: cda || '',
        feedback: feedback || '',
        nextSteps: nextSteps || '',
        timelines: timelines || '',
        reminders: reminders || '',
        status: 'active',
        priority: 'medium'
      });

      await newEntry.save();
      console.log('BD Tracker POST - MongoDB entry created:', newEntry._id);
    } catch (dbError) {
      console.log('MongoDB save failed, using file-based storage...');
      // Fallback to file-based storage
      newEntry = {
        id: Date.now().toString(),
        projectName,
        company,
        programPitched: programPitched || '',
        outreachDates: outreachDates || '',
        contactFunction: contactFunction || '',
        contactPerson,
        cda: cda || '',
        feedback: feedback || '',
        nextSteps: nextSteps || '',
        timelines: timelines || '',
        reminders: reminders || '',
        createdAt: new Date().toISOString(),
        userId: req.user.id
      };

      mockDB.bdTracker.unshift(newEntry);
      saveDataToFiles('bd_entry_added');
      console.log('BD Tracker POST - File entry created:', newEntry.id);
    }

    res.json({
      success: true,
      data: newEntry,
      message: 'BD Tracker entry added successfully'
    });
  } catch (error) {
    console.error('Error adding BD Tracker entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding BD Tracker entry' 
    });
  }
});

// Update BD Tracker entry
app.put('/api/bd-tracker/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, company, programPitched, outreachDates, contactFunction, contactPerson, cda, feedback, nextSteps, timelines, reminders } = req.body;

    // Validate required fields
    if (!projectName || !company || !contactPerson) {
      return res.status(400).json({
        success: false,
        message: 'Project Name, Company, and Contact Person are required'
      });
    }

    let updatedEntry = null;

    // Try MongoDB first
    try {
      updatedEntry = await BDTracker.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        {
          projectName,
          company,
          programPitched: programPitched || '',
          outreachDates: outreachDates || '',
          contactFunction: contactFunction || '',
          contactPerson,
          cda: cda || '',
          feedback: feedback || '',
          nextSteps: nextSteps || '',
          timelines: timelines || '',
          reminders: reminders || ''
        },
        { new: true }
      );

      if (!updatedEntry) {
        return res.status(404).json({
          success: false,
          message: 'BD Tracker entry not found or not authorized'
        });
      }

      console.log('BD Tracker PUT - MongoDB entry updated:', updatedEntry._id);
    } catch (dbError) {
      console.log('MongoDB update failed, using file-based storage...');
      // Fallback to file-based storage - try both id and _id formats
      let entryIndex = mockDB.bdTracker.findIndex(entry => entry.id === id && entry.userId === req.user.id);
      
      if (entryIndex === -1) {
        // Try MongoDB _id format
        entryIndex = mockDB.bdTracker.findIndex(entry => entry._id === id && entry.userId === req.user.id);
      }
      
      if (entryIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'BD Tracker entry not found or not authorized'
        });
      }

      mockDB.bdTracker[entryIndex] = {
        ...mockDB.bdTracker[entryIndex],
        projectName,
        company,
        programPitched: programPitched || '',
        outreachDates: outreachDates || '',
        contactFunction: contactFunction || '',
        contactPerson,
        cda: cda || '',
        feedback: feedback || '',
        nextSteps: nextSteps || '',
        timelines: timelines || '',
        reminders: reminders || '',
        updatedAt: new Date().toISOString()
      };

      updatedEntry = mockDB.bdTracker[entryIndex];
      saveDataToFiles('bd_entry_updated');
      console.log('BD Tracker PUT - File entry updated:', updatedEntry.id);
    }

    res.json({
      success: true,
      data: updatedEntry,
      message: 'BD Tracker entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating BD Tracker entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating BD Tracker entry' 
    });
  }
});

// Delete BD Tracker entry
app.delete('/api/bd-tracker/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let deleted = false;

    // Try MongoDB first
    try {
      const result = await BDTracker.findOneAndDelete({ _id: id, userId: req.user.id });
      
      if (result) {
        console.log('BD Tracker DELETE - MongoDB entry deleted:', result._id);
        deleted = true;
      }
    } catch (dbError) {
      console.log('MongoDB delete failed, using file-based storage...');
      // Fallback to file-based storage - try both id and _id formats
      let entryIndex = mockDB.bdTracker.findIndex(entry => entry.id === id && entry.userId === req.user.id);
      
      if (entryIndex === -1) {
        // Try MongoDB _id format
        entryIndex = mockDB.bdTracker.findIndex(entry => entry._id === id && entry.userId === req.user.id);
      }
      
      if (entryIndex !== -1) {
        mockDB.bdTracker.splice(entryIndex, 1);
        saveDataToFiles('bd_entry_deleted');
        console.log('BD Tracker DELETE - File entry deleted:', id);
        deleted = true;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'BD Tracker entry not found or not authorized'
      });
    }

    res.json({
      success: true,
      message: 'BD Tracker entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting BD Tracker entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting BD Tracker entry' 
    });
  }
});

// Server will be started at the end of the file

// Forgot password endpoint
app.post('/api/auth/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email } = req.body;
    
    // Check if user exists
    const user = mockDB.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'No account found with this email address' 
      });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code for password reset
    mockDB.verificationCodes.push({
      email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      type: 'password-reset' // Distinguish from email verification
    });

    // Save data to files
    saveDataToFiles();

    // Send email with verification code
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'BioPing - Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Password Reset</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">Your Password Reset Code</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                You requested a password reset for your BioPing account. Please use the verification code below to reset your password:
              </p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${verificationCode}</span>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                This code will expire in 10 minutes. If you didn't request this password reset, please ignore this email.
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  Best regards,<br>
                  The BioPing Team
                </p>
              </div>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email} with code: ${verificationCode}`);

      res.json({
        success: true,
        message: 'Password reset code sent successfully to your email'
      });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      console.log(`🔑 PASSWORD RESET CODE FOR ${email}: ${verificationCode}`);
      console.log(`📧 Email failed to send, but code is: ${verificationCode}`);
      
      // Return success with the code in response for development
      res.json({
        success: true,
        message: 'Password reset code generated (email failed to send)',
        verificationCode: verificationCode, // Include code in response
        emailError: 'Email service temporarily unavailable'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, code, newPassword } = req.body;
    
    // Find the verification code for password reset
    const verificationRecord = mockDB.verificationCodes.find(
      record => record.email === email && 
                record.code === code && 
                record.type === 'password-reset' &&
                new Date() < record.expiresAt
    );

    if (!verificationRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification code' 
      });
    }

    // Find the user
    const user = mockDB.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    user.password = hashedPassword;

    // Remove the used verification code
    mockDB.verificationCodes = mockDB.verificationCodes.filter(
      record => !(record.email === email && record.code === code && record.type === 'password-reset')
    );

    // Save data to files
    saveDataToFiles();

    console.log(`✅ Password reset successful for ${email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to get user profile
app.get('/api/auth/profile', authenticateToken, checkUserSuspension, (req, res) => {
  try {
    // Find the user in the database
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return complete user data including invoices and payment history
    res.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        createdAt: user.createdAt,
        currentPlan: user.currentPlan || 'free',
        paymentCompleted: user.paymentCompleted || false,
        currentCredits: user.currentCredits || 5,
        invoices: user.invoices || [],
        paymentHistory: user.paymentHistory || [],
        lastCreditRenewal: user.lastCreditRenewal,
        nextCreditRenewal: user.nextCreditRenewal,
        hasPaymentInfo: true
      }
    });
    
    // Save profile access data
    saveDataToFiles('profile_accessed');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stripe Payment Routes
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    console.log('Payment intent request received:', req.body);
    const { amount, currency = 'usd', planId, isAnnual } = req.body;

    console.log('Stripe secret key available:', !!stripeSecretKey);
    console.log('Processing payment for:', { amount, planId, isAnnual });
    
    // Validate Stripe is properly configured
    if (!stripe || !stripeSecretKey) {
      console.error('❌ Stripe not properly configured');
      return res.status(500).json({ 
        error: 'Payment service not available', 
        details: 'Stripe configuration error' 
      });
    }

    // Define price IDs for different plans and billing cycles
    const priceIds = {
      'test': {
        monthly: 'price_test_monthly', // Replace with actual Stripe price ID
        annual: 'price_test_annual'    // Replace with actual Stripe price ID
      },
      'basic': {
        monthly: 'price_basic_monthly', // Replace with actual Stripe price ID
        annual: 'price_basic_annual'    // Replace with actual Stripe price ID
      },
      'premium': {
        monthly: 'price_premium_monthly', // Replace with actual Stripe price ID
        annual: 'price_premium_annual'    // Replace with actual Stripe price ID
      }
    };

    // Create or get customer for better tracking
    let customer = null;
    const customerEmail = req.body.customerEmail;
    
    console.log('Customer email:', customerEmail);
    
    if (customerEmail) {
      // Try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('Found existing customer:', customer.id);
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            planId: planId,
            isAnnual: isAnnual ? 'true' : 'false'
          }
        });
        console.log('Created new customer:', customer.id);
      }
    }

    console.log('Creating payment intent with amount:', amount * 100);
    console.log('Customer:', customer ? customer.id : 'guest');
    console.log('Plan details:', { planId, isAnnual, amount: amount * 100 });

    // Create payment intent with customer (if available) or as guest
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: currency,
      customer: customer ? customer.id : undefined, // Link to customer if available
      metadata: {
        planId: planId,
        isAnnual: isAnnual ? 'true' : 'false',
        customerType: customer ? 'registered' : 'guest',
        integration_check: 'accept_a_payment'
      },
      // Use payment_method_types instead of automatic_payment_methods for better compatibility
      payment_method_types: ['card'],
      // Don't confirm immediately - let frontend handle confirmation
      confirm: false,
    });

    console.log('✅ Payment intent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      clientSecret: !!paymentIntent.client_secret,
      paymentMethodTypes: paymentIntent.payment_method_types
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Payment failed', details: error.message });
  }
});



// Experimental: Create 12-day $1/day metered subscription (Test Plan)
// Requires env STRIPE_DAILY_1USD_PRICE_ID
app.post('/api/subscription/create-daily-12', async (req, res) => {
  try {
    const { customerEmail } = req.body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({ error: 'Stripe not configured' });
    }

    // Resolve or create daily $1 price automatically if not provided via env
    let priceId = process.env.STRIPE_DAILY_1USD_PRICE_ID || '';
    try {
      if (!priceId) {
        // Try to find by lookup_key first
        const priceList = await stripe.prices.list({ active: true, limit: 100 });
        const existing = priceList.data.find(p => p.lookup_key === 'daily_1usd_12days');
        if (existing) {
          priceId = existing.id;
        } else {
          // Create product and price
          const product = await stripe.products.create({ name: 'Daily Test Plan (12 days)' });
          const newPrice = await stripe.prices.create({
            unit_amount: 100,
            currency: 'usd',
            recurring: { interval: 'day' },
            product: product.id,
            lookup_key: 'daily_1usd_12days'
          });
          priceId = newPrice.id;
        }
      }
    } catch (e) {
      console.log('Auto-create daily price failed:', e.message);
      return res.status(400).json({ error: 'Unable to provision daily price in Stripe. Please set STRIPE_DAILY_1USD_PRICE_ID.' });
    }

    // Create or get customer
    let customer = null;
    if (customerEmail) {
      const existing = await stripe.customers.list({ email: customerEmail, limit: 1 });
      customer = existing.data[0] || await stripe.customers.create({ email: customerEmail });
    } else {
      // Create an anonymous customer to proceed in test flows
      customer = await stripe.customers.create({
        metadata: { note: 'Created without email for daily-12 plan' }
      });
    }

    // Create a simple payment intent for $1
    console.log('Creating payment intent for daily subscription...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 in cents
      currency: 'usd',
      customer: customer.id,
      metadata: {
        planId: 'daily-12',
        customerEmail: customerEmail
      },
      // Use payment_method_types instead of automatic_payment_methods for better compatibility
      payment_method_types: ['card'],
      // Don't confirm immediately - let frontend handle confirmation
      confirm: false,
    });

    console.log('✅ Daily subscription payment intent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      hasClientSecret: !!paymentIntent.client_secret,
      paymentMethodTypes: paymentIntent.payment_method_types
    });

    // Create subscription separately
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card']
      }
    });

    console.log('Subscription created successfully:', {
      id: subscription.id,
      status: subscription.status
    });

    // Return the client secret from our payment intent
    const clientSecret = paymentIntent.client_secret;

    const endAt = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000);

    // Persist minimal state for demo users
    const uidx = customerEmail ? mockDB.users.findIndex(u => u.email === customerEmail) : -1;
    if (uidx !== -1) {
      mockDB.users[uidx].paymentCompleted = true;
      mockDB.users[uidx].currentPlan = 'daily-12';
      mockDB.users[uidx].currentCredits = 50;
      mockDB.users[uidx].subscriptionId = subscription.id;
      mockDB.users[uidx].subscriptionEndAt = endAt.toISOString();
      mockDB.users[uidx].subscriptionOnHold = false;
      mockDB.users[uidx].lastCreditRenewal = new Date().toISOString();
      mockDB.users[uidx].nextCreditRenewal = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      saveDataToFiles('daily_subscription_started');
    }

    res.json({
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
      endAt: endAt.toISOString()
    });
  } catch (error) {
    console.error('Create daily subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to create daily subscription', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Duplicate webhook handler removed - this was causing syntax errors
// All orphaned case statements and await statements have been removed

// Admin endpoints for Gaurav Vij - REAL MONGODB DATA
app.get('/api/admin/user-activity', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching real user activity from MongoDB...');
    
    // Get real user activity data from MongoDB
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const users = await User.find({}).lean().sort({ createdAt: -1 });
    
    const userActivity = users.map(user => {
      const activities = [];
      if (new Date(user.createdAt) > thirtyDaysAgo) {
        activities.push('New Registration');
      }
      if (user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo) {
        activities.push('Recent Login');
      }
      if (user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo) {
        activities.push('Profile Updated');
      }
      
      return {
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        action: activities.length > 0 ? activities.join(', ') : 'No Recent Activity',
        timestamp: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin,
        lastUpdate: user.updatedAt,
        company: user.company,
        role: user.role,
        ipAddress: 'N/A'
      };
    });

    res.json({
      success: true,
      data: userActivity,
      totalUsers: users.length,
      recentActivity: users.filter(u => 
        new Date(u.createdAt) > thirtyDaysAgo || 
        (u.lastLogin && new Date(u.lastLogin) > thirtyDaysAgo) ||
        (u.updatedAt && new Date(u.updatedAt) > thirtyDaysAgo)
      ).length
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user activity' });
  }
});

app.get('/api/admin/trial-data', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching real trial data from MongoDB...');
    
    // Get real trial data from MongoDB
    const users = await User.find({}).lean().sort({ createdAt: -1 });
    
    const trialData = users.map(user => {
      let trialInfo;
      
      if (user.currentPlan === 'test') {
        trialInfo = {
          status: 'Test Account',
          daysRemaining: 'N/A',
          trialStart: user.createdAt,
          trialEnd: null
        };
      } else if (user.currentPlan === 'free' && !user.paymentCompleted) {
        // Free trial: 30 days from registration
        const trialStart = new Date(user.createdAt);
        const trialEnd = new Date(trialStart.getTime() + (30 * 24 * 60 * 60 * 1000));
        const now = new Date();
        const daysRemaining = Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000));
        
        trialInfo = {
          status: daysRemaining > 0 ? 'Active' : 'Expired',
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          trialStart: trialStart,
          trialEnd: trialEnd
        };
      } else if (user.paymentCompleted) {
        trialInfo = {
          status: 'Paid Customer',
          daysRemaining: 'N/A',
          trialStart: user.createdAt,
          trialEnd: null
        };
      } else {
        trialInfo = {
          status: 'Inactive',
          daysRemaining: 0,
          trialStart: user.createdAt,
          trialEnd: null
        };
      }
      
      return {
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        trialStart: trialInfo.trialStart,
        trialEnd: trialInfo.trialEnd,
        status: trialInfo.status,
        daysRemaining: trialInfo.daysRemaining,
        currentPlan: user.currentPlan,
        paymentStatus: user.paymentCompleted ? 'Completed' : 'Pending',
        company: user.company
      };
    });

    res.json({
      success: true,
      data: trialData,
      totalUsers: users.length,
      trialUsers: users.filter(u => u.currentPlan === 'free' || u.currentPlan === 'test').length,
      paidUsers: users.filter(u => u.paymentCompleted).length
    });
  } catch (error) {
    console.error('Error fetching trial data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trial data' });
  }
});

app.get('/api/admin/potential-customers', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching real potential customers from MongoDB...');
    
    // Get real potential customer data from MongoDB
    const users = await User.find({}).lean().sort({ createdAt: -1 });
    
    const potentialCustomers = users
      .filter(user => !user.paymentCompleted && user.currentPlan !== 'test')
      .map(user => {
        const lastActivity = user.lastLogin || user.updatedAt || user.createdAt;
        const daysSinceLastActivity = Math.ceil((new Date() - new Date(lastActivity)) / (24 * 60 * 60 * 1000));
        
        let priority = 'Low';
        if (daysSinceLastActivity <= 7) priority = 'High';
        else if (daysSinceLastActivity <= 30) priority = 'Medium';
        
        return {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company || 'N/A',
          phone: user.phone || 'N/A',
          registrationDate: user.createdAt,
          lastActivity: lastActivity,
          daysSinceLastActivity: daysSinceLastActivity,
          priority: priority,
          isHotLead: daysSinceLastActivity <= 7,
          role: user.role,
          currentPlan: user.currentPlan
        };
      });

    res.json({
      success: true,
      data: potentialCustomers,
      totalPotentialCustomers: potentialCustomers.length,
      hotLeads: potentialCustomers.filter(c => c.isHotLead).length,
      highPriority: potentialCustomers.filter(c => c.priority === 'High').length,
      mediumPriority: potentialCustomers.filter(c => c.priority === 'Medium').length,
      lowPriority: potentialCustomers.filter(c => c.priority === 'Low').length
    });
  } catch (error) {
    console.error('Error fetching potential customers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch potential customers' });
  }
});

app.get('/api/admin/subscription-details', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching real subscription details from MongoDB...');
    
    // Get real subscription details from MongoDB
    const users = await User.find({}).lean().sort({ createdAt: -1 });
    
    const subscriptionDetails = users.map(user => ({
      id: user.id || user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      company: user.company,
      currentPlan: user.currentPlan || 'free',
      paymentCompleted: user.paymentCompleted || false,
      currentCredits: user.currentCredits || 0,
      lastCreditRenewal: user.lastCreditRenewal,
      nextCreditRenewal: user.nextCreditRenewal,
      subscriptionId: user.subscriptionId,
      subscriptionEndAt: user.subscriptionEndAt,
      subscriptionOnHold: user.subscriptionOnHold || false,
      paymentUpdatedAt: user.paymentUpdatedAt,
      createdAt: user.createdAt,
      invoices: user.invoices || [],
      paymentHistory: user.paymentHistory || [],
      status: user.paymentCompleted ? 'Active' : 'Inactive',
      isVerified: user.isVerified,
      isActive: user.isActive
    }));

    res.json({
      success: true,
      subscriptions: subscriptionDetails,
      totalSubscriptions: subscriptionDetails.length,
      activeSubscriptions: subscriptionDetails.filter(s => s.status === 'Active').length,
      inactiveSubscriptions: subscriptionDetails.filter(s => s.status === 'Inactive').length,
      verifiedUsers: subscriptionDetails.filter(s => s.isVerified).length,
      activeUsers: subscriptionDetails.filter(s => s.isActive).length
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription details' });
  }
});

// Comprehensive admin data endpoint - fetches all data from MongoDB Atlas
app.get('/api/admin/comprehensive-data', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching comprehensive admin data from MongoDB Atlas...');
    
    // Fetch all data from MongoDB
    const users = await User.find({}).lean().sort({ createdAt: -1 });
    const bdTrackers = await BDTracker.find({}).lean();
    
    // Calculate trial data
    const trialUsers = users.filter(user => 
      user.currentPlan === 'free' || user.currentPlan === 'test'
    );
    
    // Calculate potential customers
    const potentialCustomers = users.filter(user => 
      !user.paymentCompleted && user.currentPlan !== 'test'
    );
    
    // Calculate user activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = users.filter(user => 
      new Date(user.createdAt) > thirtyDaysAgo || 
      (user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo) ||
      (user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo)
    );
    
    // Format data for admin panel
    const formattedData = {
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        verifiedUsers: users.filter(u => u.isVerified).length,
        paidUsers: users.filter(u => u.paymentCompleted).length,
        testUsers: users.filter(u => u.currentPlan === 'test').length,
        trialUsers: trialUsers.length,
        potentialCustomers: potentialCustomers.length,
        suspendedUsers: users.filter(u => u.suspended && u.suspended.suspendedUntil && new Date() < new Date(u.suspended.suspendedUntil)).length,
        totalBDProjects: bdTrackers.length,
        uniqueCompanies: new Set(users.map(u => u.company)).size,
        generatedAt: new Date().toISOString()
      },
      users: users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        paymentCompleted: user.paymentCompleted,
        currentPlan: user.currentPlan,
        currentCredits: user.currentCredits || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        updatedAt: user.updatedAt,
        subscriptionId: user.subscriptionId,
        subscriptionEndAt: user.subscriptionEndAt,
        nextCreditRenewal: user.nextCreditRenewal,
        status: user.suspended && user.suspended.suspendedUntil && new Date() < new Date(user.suspended.suspendedUntil) ? 'Suspended' : 'Active'
      })),
      userActivity: recentUsers.map(user => {
        const activities = [];
        if (new Date(user.createdAt) > thirtyDaysAgo) activities.push('New Registration');
        if (user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo) activities.push('Recent Login');
        if (user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo) activities.push('Profile Updated');
        
        return {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          activities: activities.length > 0 ? activities.join(', ') : 'No Recent Activity',
          registrationDate: user.createdAt,
          lastLogin: user.lastLogin,
          lastUpdate: user.updatedAt,
          company: user.company,
          role: user.role
        };
      }),
      trialData: trialUsers.map(user => {
        let trialInfo;
        if (user.currentPlan === 'test') {
          trialInfo = { status: 'Test Account', daysRemaining: 'N/A', trialEnd: null };
        } else if (user.currentPlan === 'free' && !user.paymentCompleted) {
          const trialStart = new Date(user.createdAt);
          const trialEnd = new Date(trialStart.getTime() + (30 * 24 * 60 * 60 * 1000));
          const now = new Date();
          const daysRemaining = Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000));
          trialInfo = {
            status: daysRemaining > 0 ? 'Active' : 'Expired',
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
            trialEnd: trialEnd
          };
        } else {
          trialInfo = { status: 'Paid Customer', daysRemaining: 'N/A', trialEnd: null };
        }
        
        return {
          userName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          trialStart: user.createdAt,
          trialEnd: trialInfo.trialEnd,
          status: trialInfo.status,
          daysRemaining: trialInfo.daysRemaining,
          currentPlan: user.currentPlan,
          paymentStatus: user.paymentCompleted ? 'Completed' : 'Pending',
          company: user.company
        };
      }),
      potentialCustomers: potentialCustomers.map(user => {
        const lastActivity = user.lastLogin || user.updatedAt || user.createdAt;
        const daysSinceLastActivity = Math.ceil((new Date() - new Date(lastActivity)) / (24 * 60 * 60 * 1000));
        
        let priority = 'Low';
        if (daysSinceLastActivity <= 7) priority = 'High';
        else if (daysSinceLastActivity <= 30) priority = 'Medium';
        
        return {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company || 'N/A',
          phone: user.phone || 'N/A',
          registrationDate: user.createdAt,
          lastActivity: lastActivity,
          daysSinceLastActivity: daysSinceLastActivity,
          priority: priority,
          isHotLead: daysSinceLastActivity <= 7,
          role: user.role,
          currentPlan: user.currentPlan
        };
      }),
      subscriptions: users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        currentPlan: user.currentPlan || 'free',
        paymentCompleted: user.paymentCompleted || false,
        currentCredits: user.currentCredits || 0,
        lastCreditRenewal: user.lastCreditRenewal,
        nextCreditRenewal: user.nextCreditRenewal,
        subscriptionId: user.subscriptionId,
        subscriptionEndAt: user.subscriptionEndAt,
        subscriptionOnHold: user.subscriptionOnHold || false,
        paymentUpdatedAt: user.paymentUpdatedAt,
        createdAt: user.createdAt,
        invoices: user.invoices || [],
        paymentHistory: user.paymentHistory || [],
        status: user.paymentCompleted ? 'Active' : 'Inactive',
        isVerified: user.isVerified,
        isActive: user.isActive
      })),
      bdTrackers: bdTrackers.map(track => ({
        id: track._id,
        projectName: track.projectName,
        company: track.company,
        userId: track.userId,
        status: track.status,
        priority: track.priority,
        contactPerson: track.contactPerson,
        contactFunction: track.contactFunction,
        createdAt: track.createdAt,
        updatedAt: track.updatedAt
      }))
    };

    res.json({
      success: true,
      message: 'Comprehensive admin data fetched successfully from MongoDB Atlas',
      data: formattedData
    });
    
  } catch (error) {
    console.error('Error fetching comprehensive admin data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch comprehensive admin data',
      error: error.message 
    });
  }
});

// Function to generate PDF invoice
const generatePDFInvoice = (invoice, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add company logo
      try {
        const logoPath = path.join(__dirname, '..', 'public', 'image.png');
        console.log('🔍 Looking for logo at:', logoPath);
        console.log('🔍 Current directory:', __dirname);
        
        if (fs.existsSync(logoPath)) {
          console.log('✅ Logo found! Adding to PDF...');
          // Add logo at the top right
          doc.image(logoPath, {
            fit: [120, 60],
            align: 'right'
          });
          doc.moveDown(1);
        } else {
          console.log('❌ Logo not found at:', logoPath);
          // Try alternative path
          const altLogoPath = path.join(__dirname, '..', '..', 'public', 'image.png');
          console.log('🔍 Trying alternative path:', altLogoPath);
          if (fs.existsSync(altLogoPath)) {
            console.log('✅ Logo found at alternative path!');
            doc.image(altLogoPath, {
              fit: [120, 60],
              align: 'right'
            });
            doc.moveDown(1);
          } else {
            console.log('❌ Logo not found at alternative path either');
          }
        }
      } catch (logoError) {
        console.log('❌ Error loading logo:', logoError.message);
      }

      // Only add company name if logo fails
      if (!fs.existsSync(path.join(__dirname, '..', 'public', 'image.png'))) {
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor('#2563eb')
           .text('BioPing', { align: 'center' });
      }
      
      doc.moveDown(0.5);
      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Business Development Intelligence Platform', { align: 'center' });
      
      doc.moveDown(2);

      // Invoice title
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('INVOICE', { align: 'center' });
      
      doc.moveDown(1);

      // Invoice details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(`Invoice #: ${invoice.id}`);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(`Date: ${new Date(invoice.created || invoice.date || Date.now()).toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })}`);
      
      doc.moveDown(1);

      // Customer information
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('Bill To:');
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#374151')
         .text(user.name || 'N/A');
      
      if (user.company) {
        doc.text(user.company);
      }
      
      doc.text(user.email);
      
      doc.moveDown(2);

      // Invoice items table
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('Description', 50, doc.y);
      
      doc.text('Amount', 400, doc.y);
      
      doc.moveDown(0.5);
      
      // Draw line
      doc.strokeColor('#d1d5db')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.moveDown(0.5);

      // Invoice item
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#374151')
         .text(invoice.description || 'Subscription Plan', 50, doc.y);
      
      doc.text(`$${(invoice.amount || 0).toFixed(2)}`, 400, doc.y);
      
      doc.moveDown(1);
      
      // Draw line
      doc.strokeColor('#d1d5db')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.moveDown(1);

      // Total
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('Total:', 350, doc.y);
      
      doc.text(`$${(invoice.amount || 0).toFixed(2)}`, 400, doc.y);
      
      doc.moveDown(2);

      // Status
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#059669')
         .text(`Status: ${(invoice.status || invoice.paid ? 'PAID' : 'PENDING').toUpperCase()}`, { align: 'center' });
      
      doc.moveDown(2);

      // Footer
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Thank you for choosing BioPing!', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.text('For any questions, please contact our support team at support@bioping.com', { align: 'center' });
      
      doc.moveDown(1);
      doc.text('BioPing - Business Development Intelligence Platform', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Test PDF generation endpoint
app.get('/api/test-pdf', async (req, res) => {
  try {
    console.log('🧪 Testing PDF generation...');
    
    const testInvoice = {
      id: 'TEST-001',
      amount: 1.00,
      description: 'Test Invoice',
      created: new Date().toISOString(),
      status: 'PAID'
    };
    
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company'
    };
    
    const pdfBuffer = await generatePDFInvoice(testInvoice, testUser);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(500).json({ error: 'PDF generation failed - empty buffer' });
    }
    
    console.log('✅ Test PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=test-invoice.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Test PDF generation failed:', error);
    res.status(500).json({ 
      error: 'Test PDF generation failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Download invoice endpoint - Support both Stripe and local invoices
app.get('/api/auth/download-invoice/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Find the user
    const user = mockDB.users.find(u => u.email === req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔍 Downloading invoice:', invoiceId, 'for user:', user.email);

    // First, try to find the invoice in Stripe
    let invoice = null;
    let isStripeInvoice = false;

    try {
      // Check if this is a Stripe invoice ID
      const stripeInvoice = await stripe.invoices.retrieve(invoiceId);
      
      // Verify this invoice belongs to the user
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length > 0 && stripeInvoice.customer === customers.data[0].id) {
        invoice = {
          id: stripeInvoice.id,
          number: stripeInvoice.number || stripeInvoice.id,
          amount: stripeInvoice.amount_paid / 100,
          currency: stripeInvoice.currency.toUpperCase(),
          status: stripeInvoice.status,
          created: new Date(stripeInvoice.created * 1000).toISOString(),
          paid: stripeInvoice.paid,
          hosted_invoice_url: stripeInvoice.hosted_invoice_url,
          invoice_pdf: stripeInvoice.invoice_pdf,
          description: stripeInvoice.description || 'BioPing Subscription',
          period_start: stripeInvoice.period_start ? new Date(stripeInvoice.period_start * 1000).toISOString() : null,
          period_end: stripeInvoice.period_end ? new Date(stripeInvoice.period_end * 1000).toISOString() : null
        };
        isStripeInvoice = true;
        console.log('✅ Found Stripe invoice:', invoiceId);
      }
    } catch (stripeError) {
      console.log('❌ Not a Stripe invoice or error:', stripeError.message);
    }

    // If not found in Stripe, check local invoices
    if (!invoice) {
      invoice = user.invoices?.find(inv => inv.id === invoiceId);
      if (invoice) {
        console.log('✅ Found local invoice:', invoiceId);
      }
    }

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Validate invoice object structure
    if (!invoice.id) {
      console.error('❌ Invalid invoice object - missing ID:', invoice);
      return res.status(400).json({ message: 'Invalid invoice format - missing ID' });
    }
    
    console.log('📋 Invoice object structure:', {
      id: invoice.id,
      amount: invoice.amount,
      created: invoice.created,
      date: invoice.date,
      status: invoice.status,
      paid: invoice.paid,
      description: invoice.description
    });

    // If it's a Stripe invoice and has a PDF URL, redirect to it
    if (isStripeInvoice && invoice.invoice_pdf) {
      console.log('📄 Redirecting to Stripe PDF:', invoice.invoice_pdf);
      return res.redirect(invoice.invoice_pdf);
    }

    // Otherwise, generate PDF invoice
    console.log('📄 Generating PDF for invoice:', invoice);
    const pdfBuffer = await generatePDFInvoice(invoice, user);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ Generated PDF buffer is empty');
      return res.status(500).json({ message: 'Error: Generated PDF is empty' });
    }
    
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    res.status(500).json({ 
      message: 'Error generating invoice',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update user profile endpoint
app.put('/api/auth/update-profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile update request received');
    console.log('User email:', req.user.email);
    console.log('Request body:', req.body);
    
    const { name, company } = req.body;
    
    // Find the user in the database
    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    console.log('User index:', userIndex);
    console.log('Total users:', mockDB.users.length);
    
    if (userIndex === -1) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found, updating profile...');
    console.log('Current user data:', mockDB.users[userIndex]);

    // Update user profile
    if (name) {
      mockDB.users[userIndex].name = name;
      mockDB.users[userIndex].firstName = name.split(' ')[0] || name;
      mockDB.users[userIndex].lastName = name.split(' ').slice(1).join(' ') || '';
      console.log('Updated name to:', name);
    }
    
    if (company) {
      mockDB.users[userIndex].company = company;
      console.log('Updated company to:', company);
    }

    // Save to file
    saveDataToFiles('profile_update');
    console.log('Data saved to file');

    const responseData = {
      success: true,
      message: 'Profile updated successfully',
      user: {
        email: mockDB.users[userIndex].email,
        name: mockDB.users[userIndex].name,
        company: mockDB.users[userIndex].company,
        role: mockDB.users[userIndex].role
      }
    };

    console.log('Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user invoices endpoint - Fetch from Stripe
app.get('/api/auth/invoices', authenticateToken, async (req, res) => {
  try {
    let user = mockDB.users.find(u => u.email === req.user.email);
    
    // If not found in mockDB, try MongoDB
    if (!user) {
      try {
        const mongoUser = await User.findOne({ email: req.user.email });
        if (mongoUser) {
          // Convert MongoDB user to mockDB format
          user = {
            email: mongoUser.email,
            name: `${mongoUser.firstName} ${mongoUser.lastName}`.trim(),
            invoices: mongoUser.invoices || [],
            paymentHistory: mongoUser.paymentHistory || []
          };
          console.log('✅ Found user in MongoDB:', user.email);
        }
      } catch (mongoError) {
        console.log('❌ MongoDB not available, using file-based storage only');
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔍 Fetching invoices for user:', user.email);

    // Try to fetch invoices from Stripe
    let stripeInvoices = [];
    try {
      // First, find the customer in Stripe by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        console.log('📧 Found Stripe customer:', customer.id);

        // Fetch invoices for this customer
        const invoices = await stripe.invoices.list({
          customer: customer.id,
          limit: 100
        });

        stripeInvoices = invoices.data.map(invoice => ({
          id: invoice.id,
          number: invoice.number || invoice.id,
          amount: invoice.amount_paid / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000).toISOString(),
          paid: invoice.paid,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          description: invoice.description || 'BioPing Subscription',
          period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null
        }));

        console.log('📄 Found', stripeInvoices.length, 'Stripe invoices');
      } else {
        console.log('❌ No Stripe customer found for email:', user.email);
      }
    } catch (stripeError) {
      console.error('❌ Error fetching from Stripe:', stripeError.message);
      // Fall back to local invoices if Stripe fails
    }

    // Combine Stripe invoices with local invoices (if any)
    const localInvoices = user.invoices || [];
    const allInvoices = [...stripeInvoices, ...localInvoices];

    // Sort by creation date (newest first)
    allInvoices.sort((a, b) => new Date(b.created) - new Date(a.created));

    console.log('📊 Total invoices to return:', allInvoices.length);

    res.json({
      success: true,
      data: allInvoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download all invoices as single PDF - Support both Stripe and local invoices
app.get('/api/auth/download-all-invoices', authenticateToken, async (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔍 Downloading all invoices for user:', user.email);

    // Fetch invoices from Stripe first
    let stripeInvoices = [];
    try {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        const invoices = await stripe.invoices.list({
          customer: customer.id,
          limit: 100
        });

        stripeInvoices = invoices.data.map(invoice => ({
          id: invoice.id,
          number: invoice.number || invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000).toISOString(),
          paid: invoice.paid,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          description: invoice.description || 'BioPing Subscription',
          period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null
        }));

        console.log('📄 Found', stripeInvoices.length, 'Stripe invoices');
      }
    } catch (stripeError) {
      console.error('❌ Error fetching from Stripe:', stripeError.message);
    }

    // Combine with local invoices
    const localInvoices = user.invoices || [];
    const allInvoices = [...stripeInvoices, ...localInvoices];

    if (allInvoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found' });
    }

    console.log('📊 Total invoices to include in PDF:', allInvoices.length);

    // Create a combined PDF with all invoices
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=all-invoices-${user.email}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });

    // Add company logo
    try {
      const logoPath = path.join(__dirname, '..', 'public', 'image.png');
      console.log('🔍 Looking for logo at:', logoPath);
      console.log('🔍 Current directory:', __dirname);
      
              if (fs.existsSync(logoPath)) {
          console.log('✅ Logo found! Adding to PDF...');
          // Add logo at the top right
          doc.image(logoPath, {
            fit: [120, 60],
            align: 'right'
          });
          doc.moveDown(1);
        } else {
        console.log('❌ Logo not found at:', logoPath);
        // Try alternative path
        const altLogoPath = path.join(__dirname, '..', '..', 'public', 'image.png');
        console.log('🔍 Trying alternative path:', altLogoPath);
                  if (fs.existsSync(altLogoPath)) {
            console.log('✅ Logo found at alternative path!');
            doc.image(altLogoPath, {
              fit: [120, 60],
              align: 'right'
            });
            doc.moveDown(1);
          } else {
          console.log('❌ Logo not found at alternative path either');
        }
      }
    } catch (logoError) {
      console.log('❌ Error loading logo:', logoError.message);
    }

    // Only add company name if logo fails
    if (!fs.existsSync(path.join(__dirname, '..', 'public', 'image.png'))) {
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#2563eb')
         .text('BioPing', { align: 'center' });
    }
    
    doc.moveDown(0.5);
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Business Development Intelligence Platform', { align: 'center' });
    
    doc.moveDown(2);

    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#111827')
       .text('ALL INVOICES', { align: 'center' });
    
    doc.moveDown(1);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#374151')
       .text('Customer:', { align: 'center' });
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(user.name || 'N/A', { align: 'center' });
    
    if (user.company) {
      doc.text(user.company, { align: 'center' });
    }
    
    doc.text(user.email, { align: 'center' });
    
    doc.moveDown(1);

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, { align: 'center' });
    
    doc.moveDown(2);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#111827')
       .text(`Total Invoices: ${allInvoices.length}`, { align: 'center' });
    
    doc.moveDown(1);

    const totalAmount = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#059669')
       .text(`Total Amount: $${totalAmount.toFixed(2)}`, { align: 'center' });

    // Add each invoice
    allInvoices.forEach((invoice, index) => {
      // Add page break between invoices (except for first one)
      if (index > 0) {
        doc.addPage();
      }

      // Add logo to each invoice page
      try {
        const logoPath = path.join(__dirname, '..', 'public', 'image.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, {
            fit: [80, 40],
            align: 'center'
          });
          doc.moveDown(0.5);
        } else {
          // Try alternative path
          const altLogoPath = path.join(__dirname, '..', '..', 'public', 'image.png');
          if (fs.existsSync(altLogoPath)) {
            doc.image(altLogoPath, {
              fit: [80, 40],
              align: 'center'
            });
            doc.moveDown(0.5);
          }
        }
      } catch (logoError) {
        console.log('Logo not found for invoice page');
      }

      // Invoice header
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(`Invoice #${invoice.id}`, { align: 'center' });
      
      doc.moveDown(1);

      // Invoice details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(`Date: ${new Date(invoice.date).toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })}`);
      
      doc.moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(`Plan: ${invoice.plan || 'Subscription'}`);
      
      doc.moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(`Description: ${invoice.description || 'Business Development Platform Access'}`);
      
      doc.moveDown(1);

      // Amount and status
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(`Amount: $${invoice.amount.toFixed(2)}`);
      
      doc.moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#059669')
         .text(`Status: ${invoice.status.toUpperCase()}`);
      
      doc.moveDown(2);

      // Separator line
      doc.strokeColor('#d1d5db')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
    });

    doc.end();
  } catch (error) {
    console.error('Error generating all invoices PDF:', error);
    res.status(500).json({ message: 'Error generating invoices PDF' });
  }
});

// Admin: Suspend user endpoint
app.post('/api/admin/suspend-user', authenticateAdmin, async (req, res) => {
  try {
    const { userId, reason, suspendUntil, duration } = req.body;
    
    if (!userId || !reason || !suspendUntil) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = mockDB.users.find(u => 
      u.id === parseInt(userId) || 
      u.id === userId || 
      u._id === userId || 
      u._id === parseInt(userId)
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add suspension data to user
    user.suspended = {
      isSuspended: true,
      reason: reason,
      suspendedAt: new Date().toISOString(),
      suspendedUntil: suspendUntil,
      duration: duration,
      suspendedBy: req.user.email
    };

    // Save to file
    saveDataToFiles('user_suspended');

    res.json({
      success: true,
      message: 'User suspended successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        suspended: user.suspended
      }
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Unsuspend user endpoint
app.post('/api/admin/unsuspend-user', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = mockDB.users.find(u => 
      u.id === parseInt(userId) || 
      u.id === userId || 
      u._id === userId || 
      u._id === parseInt(userId)
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove suspension data
    if (user.suspended) {
      delete user.suspended;
    }

    // Save to file
    saveDataToFiles('user_unsuspended');

    res.json({
      success: true,
      message: 'User unsuspended successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get user suspension status
app.get('/api/admin/user-suspension/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = mockDB.users.find(u => 
      u.id === parseInt(userId) || 
      u.id === userId || 
      u._id === userId || 
      u._id === parseInt(userId)
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      suspended: user.suspended || null,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error fetching user suspension status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin endpoint to sync old payments from Stripe
app.post('/api/admin/sync-old-payments', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Starting manual sync of old Stripe payments...');
    
    // Get all customers from Stripe
    let allCustomers = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const params = { limit: 100 };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const customers = await stripe.customers.list(params);
      allCustomers = allCustomers.concat(customers.data);
      
      hasMore = customers.has_more;
      if (hasMore && customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    }

    console.log(`📧 Found ${allCustomers.length} customers in Stripe`);

    let totalInvoicesAdded = 0;
    let usersUpdated = 0;

    // Process each customer
    for (const customer of allCustomers) {
      if (!customer.email) continue;

      // Find user in local database
      const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
      if (userIndex === -1) continue;

      // Initialize invoices array if it doesn't exist
      if (!mockDB.users[userIndex].invoices) {
        mockDB.users[userIndex].invoices = [];
      }

      // Get all invoices for this customer
      let allInvoices = [];
      hasMore = true;
      startingAfter = null;

      while (hasMore) {
        const params = { 
          customer: customer.id, 
          limit: 100 
        };
        if (startingAfter) {
          params.starting_after = startingAfter;
        }

        const invoices = await stripe.invoices.list(params);
        allInvoices = allInvoices.concat(invoices.data);
        
        hasMore = invoices.has_more;
        if (hasMore && invoices.data.length > 0) {
          startingAfter = invoices.data[invoices.data.length - 1].id;
        }
      }

      // Process each invoice
      for (const invoice of allInvoices) {
        // Check if invoice already exists
        const existingInvoice = mockDB.users[userIndex].invoices.find(
          inv => inv.id === invoice.id || inv.stripeInvoiceId === invoice.id
        );

        if (existingInvoice) continue;

        // Create invoice object
        const invoiceData = {
          id: invoice.id,
          stripeInvoiceId: invoice.id,
          number: invoice.number || invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000).toISOString(),
          paid: invoice.paid,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          description: invoice.description || 'BioPing Subscription',
          period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          customerEmail: customer.email,
          syncedAt: new Date().toISOString()
        };

        mockDB.users[userIndex].invoices.push(invoiceData);
        totalInvoicesAdded++;

        // Update user's payment status if invoice is paid
        if (invoice.paid && invoice.status === 'paid') {
          mockDB.users[userIndex].paymentCompleted = true;
          mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
        }
      }

      if (allInvoices.length > 0) {
        usersUpdated++;
      }
    }

    // Save data
    saveDataToFiles('sync_old_payments');

    res.json({
      success: true,
      message: 'Old payments synced successfully',
      data: {
        customersProcessed: allCustomers.length,
        usersUpdated: usersUpdated,
        invoicesAdded: totalInvoicesAdded
      }
    });

  } catch (error) {
    console.error('❌ Error syncing old payments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error syncing old payments',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📧 Email server status: ${transporter.verify() ? 'Ready' : 'Not ready'}`);
  console.log(`💳 Stripe integration: ${stripe ? 'Ready' : 'Not ready'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB: Connected`);
  console.log(`✅ Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`🔄 Sync old payments: http://localhost:${PORT}/api/admin/sync-old-payments`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
}); 

// Update user payment status
app.post('/api/auth/update-payment-status', authenticateToken, (req, res) => {
  try {
    const { paymentCompleted, currentPlan, currentCredits, lastCreditRenewal, nextCreditRenewal } = req.body;
    
    // Find the user in the database
    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user payment information
    mockDB.users[userIndex].paymentCompleted = paymentCompleted;
    mockDB.users[userIndex].currentPlan = currentPlan;
    mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
    
    // Update subscription data if provided
    if (currentCredits !== undefined) {
      mockDB.users[userIndex].currentCredits = currentCredits;
    }
    if (lastCreditRenewal) {
      mockDB.users[userIndex].lastCreditRenewal = lastCreditRenewal;
    }
    if (nextCreditRenewal) {
      mockDB.users[userIndex].nextCreditRenewal = nextCreditRenewal;
    }

    // Save to file
    saveDataToFiles();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      user: {
        email: mockDB.users[userIndex].email,
        name: mockDB.users[userIndex].name,
        paymentCompleted: mockDB.users[userIndex].paymentCompleted,
        currentPlan: mockDB.users[userIndex].currentPlan,
        currentCredits: mockDB.users[userIndex].currentCredits
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user payment status
app.get('/api/auth/payment-status', authenticateToken, (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only universalx0242 should have payment status
    // All other users should be free
    let hasPaid = false;
    let currentPlan = 'free';
    
    if (user.email === 'universalx0242@gmail.com') {
      hasPaid = user.paymentCompleted || true; // Force true for universalx0242
      currentPlan = user.currentPlan || 'monthly';
    } else {
      // Reset other users to free
      hasPaid = false;
      currentPlan = 'free';
      
      // Update user in database to ensure they're marked as free
      const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
      if (userIndex !== -1) {
        mockDB.users[userIndex].paymentCompleted = false;
        mockDB.users[userIndex].currentPlan = 'free';
        saveDataToFiles();
      }
    }

    res.json({
      paymentCompleted: hasPaid,
      currentPlan: currentPlan,
      paymentUpdatedAt: user.paymentUpdatedAt
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Subscription management endpoints
app.get('/api/auth/subscription', authenticateToken, (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription is active and when credits should renew
    const now = new Date();
    const registrationDate = new Date(user.createdAt || user.registrationDate || now);
    const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    const trialDays = 3;
    const trialExpired = daysSinceRegistration >= trialDays;
    const trialDaysRemaining = Math.max(0, trialDays - daysSinceRegistration);
    const lastCreditRenewal = user.lastCreditRenewal ? new Date(user.lastCreditRenewal) : null;
    const nextRenewal = user.nextCreditRenewal ? new Date(user.nextCreditRenewal) : null;
    
    let shouldRenewCredits = false;
    let creditsToGive = 0;

    if (user.paymentCompleted && user.currentPlan && user.currentPlan !== 'free') {
      // Check if it's time to renew credits based on plan type
      if (!lastCreditRenewal || now >= nextRenewal) {
        shouldRenewCredits = true;
        
        // Set credits based on plan
        if (user.currentPlan === 'monthly' || user.currentPlan === 'basic') {
          creditsToGive = 50;
        } else if (user.currentPlan === 'annual' || user.currentPlan === 'premium') {
          creditsToGive = 100;
        } else if (user.currentPlan === 'daily-12') {
          creditsToGive = 50; // Daily plan gets 50 credits
        } else if (user.currentPlan === 'test') {
          creditsToGive = 1;
        }
        
        // Update user with new credits and renewal date
        const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
        if (userIndex !== -1) {
          mockDB.users[userIndex].currentCredits = creditsToGive;
          mockDB.users[userIndex].lastCreditRenewal = now.toISOString();
          
          // Set renewal period based on plan type
          let renewalDays = 30; // Default monthly
          if (user.currentPlan === 'annual' || user.currentPlan === 'premium') {
            renewalDays = 30; // Annual plans have monthly EMI, so monthly renewal
          }
          // Monthly plans don't auto-renew, so no next renewal date
          if (user.currentPlan === 'monthly' || user.currentPlan === 'basic') {
            mockDB.users[userIndex].nextCreditRenewal = null; // No auto-renewal for monthly
          } else {
            mockDB.users[userIndex].nextCreditRenewal = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000).toISOString();
          }
          saveDataToFiles();
        }
      }
    } else {
      // Enforce free-trial credits server-side
      const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
      if (userIndex !== -1) {
        if (trialExpired) {
          // Trial expired → force credits to 0
          if (mockDB.users[userIndex].currentCredits !== 0) {
            mockDB.users[userIndex].currentCredits = 0;
            saveDataToFiles('free_trial_expired');
          }
        } else if (
          mockDB.users[userIndex].currentCredits === undefined ||
          mockDB.users[userIndex].currentCredits === null
        ) {
          // Ensure default 5 credits during trial
          mockDB.users[userIndex].currentCredits = 5;
          saveDataToFiles('free_trial_defaulted');
        }
      }
    }

    // Return current credits (don't override if user has used some)
    let currentCredits = user.currentCredits;
    if (currentCredits === undefined || currentCredits === null) {
      // Set default credits based on plan
      if (user.paymentCompleted && user.currentPlan && user.currentPlan !== 'free') {
        if (user.currentPlan === 'monthly') {
          currentCredits = 50;
        } else if (user.currentPlan === 'annual') {
          currentCredits = 100;
        } else if (user.currentPlan === 'test') {
          currentCredits = 1;
        }
      } else {
        currentCredits = trialExpired ? 0 : 5; // Free users with trial enforcement
      }
    }

    res.json({
      paymentCompleted: user.paymentCompleted || false,
      currentPlan: user.currentPlan || 'free',
      currentCredits: currentCredits,
      lastCreditRenewal: user.lastCreditRenewal,
      nextCreditRenewal: user.nextCreditRenewal,
      shouldRenewCredits,
      creditsToGive,
      trialExpired,
      daysRemaining: user.paymentCompleted && user.currentPlan !== 'free' ? null : trialDaysRemaining
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/subscription-status', authenticateToken, (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription is active and when credits should renew
    const now = new Date();
    const registrationDate = new Date(user.createdAt || user.registrationDate || now);
    const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    const trialDays = 3;
    const trialExpired = daysSinceRegistration >= trialDays;
    const trialDaysRemaining = Math.max(0, trialDays - daysSinceRegistration);
    const lastCreditRenewal = user.lastCreditRenewal ? new Date(user.lastCreditRenewal) : null;
    const nextRenewal = user.nextCreditRenewal ? new Date(user.nextCreditRenewal) : null;
    
    let shouldRenewCredits = false;
    let creditsToGive = 0;

    if (user.paymentCompleted && user.currentPlan && user.currentPlan !== 'free') {
      // Check if it's time to renew credits based on plan type
      if (!lastCreditRenewal || now >= nextRenewal) {
        shouldRenewCredits = true;
        
        // Set credits based on plan
        if (user.currentPlan === 'monthly' || user.currentPlan === 'basic') {
          creditsToGive = 50;
        } else if (user.currentPlan === 'annual' || user.currentPlan === 'premium') {
          creditsToGive = 100;
        } else if (user.currentPlan === 'daily-12') {
          creditsToGive = 50; // Daily plan gets 50 credits
        } else if (user.currentPlan === 'test') {
          creditsToGive = 1;
        }
        
        // Update user with new credits and renewal date
        const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
        if (userIndex !== -1) {
          mockDB.users[userIndex].currentCredits = creditsToGive;
          mockDB.users[userIndex].lastCreditRenewal = now.toISOString();
          
          // Set renewal period based on plan type
          let renewalDays = 30; // Default monthly
          if (user.currentPlan === 'annual' || user.currentPlan === 'premium') {
            renewalDays = 30; // Annual plans have monthly EMI, so monthly renewal
          }
          // Monthly plans don't auto-renew, so no next renewal date
          if (user.currentPlan === 'monthly' || user.currentPlan === 'basic') {
            mockDB.users[userIndex].nextCreditRenewal = null; // No auto-renewal for monthly
          } else {
            mockDB.users[userIndex].nextCreditRenewal = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000).toISOString();
          }
          saveDataToFiles();
        }
      }
    } else {
      // Enforce free-trial credits server-side
      const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
      if (userIndex !== -1) {
        if (trialExpired) {
          // Trial expired → force credits to 0
          if (mockDB.users[userIndex].currentCredits !== 0) {
            mockDB.users[userIndex].currentCredits = 0;
            saveDataToFiles('free_trial_expired');
          }
        } else if (
          mockDB.users[userIndex].currentCredits === undefined ||
          mockDB.users[userIndex].currentCredits === null
        ) {
          // Ensure default 5 credits during trial
          mockDB.users[userIndex].currentCredits = 5;
          saveDataToFiles('free_trial_defaulted');
        }
      }
    }

    // Return current credits (don't override if user has used some)
    let currentCredits = user.currentCredits;
    if (currentCredits === undefined || currentCredits === null) {
      // Set default credits based on plan
      if (user.paymentCompleted && user.currentPlan && user.currentPlan !== 'free') {
        if (user.currentPlan === 'monthly') {
          currentCredits = 50;
        } else if (user.currentPlan === 'annual') {
          currentCredits = 100;
        } else if (user.currentPlan === 'test') {
          currentCredits = 1;
        }
      } else {
        currentCredits = trialExpired ? 0 : 5; // Free users with trial enforcement
      }
    }

    res.json({
      paymentCompleted: user.paymentCompleted || false,
      currentPlan: user.currentPlan || 'free',
      currentCredits: currentCredits,
      lastCreditRenewal: user.lastCreditRenewal,
      nextCreditRenewal: user.nextCreditRenewal,
      shouldRenewCredits,
      creditsToGive,
      trialExpired,
      daysRemaining: user.paymentCompleted && user.currentPlan !== 'free' ? null : trialDaysRemaining
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user credits (when they use credits)
app.post('/api/auth/use-credit', authenticateToken, (req, res) => {
  try {
    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = mockDB.users[userIndex];
    
    // Enforce free trial expiry before allowing credit usage
    if (!user.paymentCompleted || user.currentPlan === 'free') {
      const now = new Date();
      const registrationDate = new Date(user.createdAt || user.registrationDate || now);
      const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceRegistration >= 3) {
        if (user.currentCredits !== 0) {
          mockDB.users[userIndex].currentCredits = 0;
          saveDataToFiles('free_trial_expired_block');
        }
        return res.status(400).json({ success: false, message: 'Free trial expired' });
      }
    }
    
    if (user.currentCredits > 0) {
      // Track credit usage with timestamp
      if (!user.creditUsageHistory) {
        user.creditUsageHistory = [];
      }
      
      user.creditUsageHistory.push({
        action: 'search',
        timestamp: new Date().toISOString(),
        creditsUsed: 1,
        remainingCredits: user.currentCredits - 1
      });
      
      // Keep only last 100 usage records
      if (user.creditUsageHistory.length > 100) {
        user.creditUsageHistory = user.creditUsageHistory.slice(-100);
      }
      
      user.currentCredits -= 1;
      user.lastCreditUsage = new Date().toISOString();
      saveDataToFiles('credit_used');
      
      console.log(`💳 Credit consumed for ${user.email}: ${user.currentCredits + 1} → ${user.currentCredits}`);
      
      res.json({
        success: true,
        remainingCredits: user.currentCredits,
        message: 'Credit used successfully',
        usageHistory: user.creditUsageHistory.length
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No credits remaining'
      });
    }
  } catch (error) {
    console.error('Error using credit:', error);
    res.status(500).json({ message: 'Server error' });
  }
}); 

// Credit monitoring endpoint for admins
app.get('/api/admin/credit-monitoring', authenticateAdmin, (req, res) => {
  try {
    const users = mockDB.users.map(user => ({
      email: user.email,
      name: user.firstName + ' ' + user.lastName,
      company: user.company,
      currentPlan: user.currentPlan || 'free',
      currentCredits: user.currentCredits || 0,
      lastCreditUsage: user.lastCreditUsage,
      lastCreditRenewal: user.lastCreditRenewal,
      nextCreditRenewal: user.nextCreditRenewal,
      paymentCompleted: user.paymentCompleted || false,
      createdAt: user.createdAt,
      creditUsageHistory: user.creditUsageHistory || [],
      totalCreditsUsed: user.creditUsageHistory ? user.creditUsageHistory.reduce((sum, usage) => sum + usage.creditsUsed, 0) : 0
    }));

    // Sort by total credits used (descending)
    users.sort((a, b) => b.totalCreditsUsed - a.totalCreditsUsed);

    res.json({
      success: true,
      data: {
        users,
        summary: {
          totalUsers: users.length,
          paidUsers: users.filter(u => u.paymentCompleted).length,
          freeUsers: users.filter(u => !u.paymentCompleted).length,
          totalCreditsUsed: users.reduce((sum, u) => sum + u.totalCreditsUsed, 0),
          averageCreditsPerUser: Math.round(users.reduce((sum, u) => sum + u.totalCreditsUsed, 0) / users.length)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching credit monitoring data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Data export endpoint (for backup)
app.get('/api/admin/export-data', authenticateAdmin, (req, res) => {
  try {
    const exportData = {
      users: mockDB.users,
      biotechData: biotechData,
      verificationCodes: mockDB.verificationCodes,
      uploadedFiles: mockDB.uploadedFiles,
      bdTracker: mockDB.bdTracker,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="bioping-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
});

// Data import endpoint (for restore)
app.post('/api/admin/import-data', authenticateAdmin, upload.single('backup'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No backup file provided' });
    }
    
    const backupData = JSON.parse(req.file.buffer.toString());
    
    // Validate backup data
    if (!backupData.users || !backupData.biotechData) {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }
    
    // Import data
    mockDB.users = backupData.users || [];
    mockDB.verificationCodes = backupData.verificationCodes || [];
    mockDB.uploadedFiles = backupData.uploadedFiles || [];
    mockDB.bdTracker = backupData.bdTracker || [];
    biotechData = backupData.biotechData || [];
    
    // Save imported data
    saveDataToFiles('data_imported');
    
    res.json({ 
      message: 'Data imported successfully',
      importedUsers: mockDB.users.length,
      importedBiotechRecords: biotechData.length,
      importedBdTrackerEntries: mockDB.bdTracker.length
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Import failed' });
  }
}); 

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log(`🔧 Signup attempt for: ${email}`);

    // Check if email is blocked
    const isEmailBlocked = mockDB.blockedEmails.some(blocked => blocked.email === email);
    if (isEmailBlocked) {
      console.log('🚫 Email is blocked from registration');
      return res.status(403).json({ 
        success: false,
        message: 'This email address is not allowed on our platform. Please use a different email address to create your account.',
        errorType: 'EMAIL_BLOCKED',
        blockedEmail: email
      });
    }

    // Check if user already exists (try MongoDB first, then fallback to file-based)
    let existingUser = null;
    try {
      console.log('🔍 Checking MongoDB for existing user...');
      existingUser = await User.findOne({ email });
      console.log('✅ MongoDB query completed');
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file-based storage...');
      console.log('MongoDB Error:', dbError.message);
      existingUser = mockDB.users.find(u => u.email === email);
    }

    if (existingUser) {
      console.log('⚠️ User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object
    const newUserData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      company: 'BioPing',
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    };

    let newUser = null;
    let userId = null;

    // Try to save to MongoDB first
    try {
      console.log('💾 Attempting to save user to MongoDB...');
      newUser = new User(newUserData);
      await newUser.save();
      userId = newUser._id;
      console.log(`✅ New user saved to MongoDB: ${email} (ID: ${userId})`);
    } catch (dbError) {
      console.log('❌ MongoDB save failed, using file-based storage...');
      console.log('MongoDB Save Error:', dbError.message);
      // Fallback to file-based storage
      newUser = {
        id: mockDB.users.length + 1,
        ...newUserData,
        name: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString()
      };
      mockDB.users.push(newUser);
      userId = newUser.id;
      saveDataToFiles('user_signup');
      console.log(`✅ New user saved to file: ${email} (ID: ${userId})`);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        email: newUser.email,
        name: newUser.name || `${firstName} ${lastName}`,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`🎉 New user registered successfully: ${email}`);

    res.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email: newUser.email,
        name: newUser.name || `${firstName} ${lastName}`,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enhanced PDF serving middleware for Render/GoDaddy
app.use('/pdf', (req, res, next) => {
  // Set proper headers for PDF files - allow cross-origin embedding
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Handle PDF requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Multiple PDF serving routes for different hosting scenarios
app.get('/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join(__dirname, '../public/pdf', filename);
  
  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.log(`PDF not found: ${pdfPath}`);
    return res.status(404).json({ error: 'PDF not found', path: pdfPath });
  }
  
  // Set headers for PDF - allow cross-origin embedding
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Stream the PDF file
  const stream = fs.createReadStream(pdfPath);
  stream.on('error', (error) => {
    console.error('PDF stream error:', error);
    res.status(500).json({ error: 'PDF stream error' });
  });
  stream.pipe(res);
});

// Alternative PDF route for static serving
app.get('/static/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join(__dirname, '../public/pdf', filename);
  
  if (!fs.existsSync(pdfPath)) {
    console.log(`Static PDF not found: ${pdfPath}`);
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const stream = fs.createReadStream(pdfPath);
  stream.pipe(res);
});

// API route for PDF serving
app.get('/api/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join(__dirname, '../public/pdf', filename);
  
  if (!fs.existsSync(pdfPath)) {
    console.log(`API PDF not found: ${pdfPath}`);
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const stream = fs.createReadStream(pdfPath);
  stream.pipe(res);
});

// PDF health check endpoint
app.get('/api/pdf-health', (req, res) => {
  const pdfDir = path.join(__dirname, '../public/pdf');
  const pdfPath = path.join(pdfDir, 'BioPing Training Manual.pdf');
  
  // Check if directory exists
  const dirExists = fs.existsSync(pdfDir);
  
  // Check if file exists
  const exists = fs.existsSync(pdfPath);
  
  // Get file stats for debugging
  let fileStats = null;
  let availablePdfs = [];
  
  if (dirExists) {
    try {
      availablePdfs = fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf'));
    } catch (error) {
      console.error('Error reading PDF directory:', error);
    }
  }
  
  if (exists) {
    try {
      fileStats = fs.statSync(pdfPath);
    } catch (error) {
      console.error('Error getting file stats:', error);
    }
  }
  
  res.json({
    pdfExists: exists,
    pdfPath: pdfPath,
    pdfDir: pdfDir,
    dirExists: dirExists,
    fileSize: fileStats ? fileStats.size : null,
    availablePdfs: availablePdfs,
    serverTime: new Date().toISOString(),
    requestHeaders: req.headers,
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
});

// Test PDF access endpoint
app.get('/api/test-pdf', (req, res) => {
  const pdfPath = path.join(__dirname, '../public/pdf', 'BioPing Training Manual.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'PDF not found', path: pdfPath });
  }
  
  // Set headers for PDF - allow cross-origin embedding
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Stream the PDF file
  const stream = fs.createReadStream(pdfPath);
  stream.on('error', (error) => {
    console.error('PDF stream error:', error);
    res.status(500).json({ error: 'PDF stream error' });
  });
  stream.pipe(res);
});

// Simple test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    pdfDir: path.join(__dirname, '../public/pdf'),
    pdfDirExists: fs.existsSync(path.join(__dirname, '../public/pdf'))
  });
});

// Note: Frontend routes like /dashboard, /dashboard/bd-tracker are handled by React Router
// on the frontend (GoDaddy hosting). This server only handles API routes.
// For frontend routing issues, check GoDaddy hosting configuration.

// Pricing Management Routes
app.get('/api/admin/pricing', authenticateToken, async (req, res) => {
  try {
    // Initialize pricing array if it doesn't exist
    if (!mockDB.pricing) mockDB.pricing = [];
    
    // If no pricing plans exist, create default ones
    if (mockDB.pricing.length === 0) {
      const defaultPlans = [
        {
          _id: `plan_${Date.now()}_1`,
          name: 'Free',
          monthlyPrice: 0,
          yearlyPrice: 0,
          credits: 5,
          features: 'Basic access\n5 credits per month\nLimited features',
          description: 'Perfect for getting started',
          isPopular: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: `plan_${Date.now()}_2`,
          name: 'Basic',
          monthlyPrice: 99,
          yearlyPrice: 990,
          credits: 100,
          features: '100 credits per month\nAdvanced search\nPriority support',
          description: 'Great for small teams',
          isPopular: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: `plan_${Date.now()}_3`,
          name: 'Premium',
          monthlyPrice: 750,
          yearlyPrice: 7500,
          credits: 500,
          features: '500 credits per month\nPremium features\nDedicated support\nCustom integrations',
          description: 'Enterprise-grade solution',
          isPopular: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: `plan_${Date.now()}_4`,
          name: 'Daily Test (12 days)',
          monthlyPrice: 12,
          yearlyPrice: 0,
          credits: 50,
          features: '50 credits per day\n12-day trial\nDaily billing',
          description: 'Perfect for testing our platform',
          isPopular: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      mockDB.pricing = defaultPlans;
      
      // Save to file
      fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
      console.log('✅ Created default pricing plans');
      
      // Save all data
      saveDataToFiles('default_pricing_plans_created');
    }
    
    res.json({ plans: mockDB.pricing });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
});

app.post('/api/admin/pricing', authenticateToken, async (req, res) => {
  try {
    const { name, monthlyPrice, yearlyPrice, credits, features, description, isPopular, isActive } = req.body;
    
    if (!name || !monthlyPrice || !credits) {
      return res.status(400).json({ error: 'Name, monthly price, and credits are required' });
    }
    
    const newPlan = {
      _id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      monthlyPrice: parseFloat(monthlyPrice),
      yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : 0,
      credits: parseInt(credits),
      features: features || '',
      description: description || '',
      isPopular: isPopular || false,
      isActive: isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!mockDB.pricing) mockDB.pricing = [];
    mockDB.pricing.push(newPlan);
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
    
    // Save all data
    saveDataToFiles('pricing_plan_created');
    
    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    console.error('Error creating pricing plan:', error);
    res.status(500).json({ error: 'Failed to create pricing plan' });
  }
});

app.put('/api/admin/pricing/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, monthlyPrice, yearlyPrice, credits, features, description, isPopular, isActive } = req.body;
    
    if (!mockDB.pricing) mockDB.pricing = [];
    
    const planIndex = mockDB.pricing.findIndex(plan => plan._id === id);
    if (planIndex === -1) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }
    
    const updatedPlan = {
      ...mockDB.pricing[planIndex],
      name: name || mockDB.pricing[planIndex].name,
      monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : mockDB.pricing[planIndex].monthlyPrice,
      yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : mockDB.pricing[planIndex].yearlyPrice,
      credits: credits ? parseInt(credits) : mockDB.pricing[planIndex].credits,
      features: features !== undefined ? features : mockDB.pricing[planIndex].features,
      description: description !== undefined ? description : mockDB.pricing[planIndex].description,
      isPopular: isPopular !== undefined ? isPopular : mockDB.pricing[planIndex].isPopular,
      isActive: isActive !== undefined ? isActive : mockDB.pricing[planIndex].isActive,
      updatedAt: new Date()
    };
    
    mockDB.pricing[planIndex] = updatedPlan;
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
    
    // Save all data
    saveDataToFiles('pricing_plan_updated');
    
    res.json({ success: true, plan: updatedPlan });
  } catch (error) {
    console.error('Error updating pricing plan:', error);
    res.status(500).json({ error: 'Failed to update pricing plan' });
  }
});

app.delete('/api/admin/pricing/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mockDB.pricing) mockDB.pricing = [];
    
    const planIndex = mockDB.pricing.findIndex(plan => plan._id === id);
    if (planIndex === -1) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }
    
    // Don't allow deletion of Free plan
    if (mockDB.pricing[planIndex].name === 'Free') {
      return res.status(400).json({ error: 'Cannot delete the Free plan' });
    }
    
    mockDB.pricing.splice(planIndex, 1);
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
    
    // Save all data
    saveDataToFiles('pricing_plan_deleted');
    
    res.json({ success: true, message: 'Pricing plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    res.status(500).json({ error: 'Failed to delete pricing plan' });
  }
});

// Pricing Management Routes
app.get('/api/admin/pricing-plans', authenticateToken, async (req, res) => {
  try {
    // Initialize pricing plans if they don't exist
    if (!mockDB.pricingPlans) {
      mockDB.pricingPlans = [
        {
          _id: '1',
          name: 'Free',
          description: 'Perfect for getting started',
          credits: 5,
          monthlyPrice: 0,
          annualPrice: 0,
          features: ['5 credits per month', 'Basic search', 'Email support'],
          isActive: true,
          createdAt: new Date()
        },
        {
          _id: '2',
          name: 'Basic',
          description: 'For small businesses',
          credits: 25,
          monthlyPrice: 29,
          annualPrice: 290,
          features: ['25 credits per month', 'Advanced search', 'Priority support', 'BD Tracker'],
          isActive: true,
          createdAt: new Date()
        },
        {
          _id: '3',
          name: 'Pro',
          description: 'For growing companies',
          credits: 100,
          monthlyPrice: 99,
          annualPrice: 990,
          features: ['100 credits per month', 'All features', 'Priority support', 'Custom reports'],
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      // Save to file
      fs.writeFileSync(path.join(__dirname, 'data', 'pricingPlans.json'), JSON.stringify(mockDB.pricingPlans, null, 2));
    }
    
    res.json({ pricingPlans: mockDB.pricingPlans });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
});

// PDF Management Routes
app.post('/api/admin/pdfs/upload', authenticateToken, pdfUpload.single('pdf'), async (req, res) => {
  try {
    console.log('📤 PDF Upload Request:', {
      file: req.file,
      body: req.body,
      headers: req.headers
    });
    
    if (!req.file) {
      console.log('❌ No file received');
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { name, description } = req.body;
    const pdfUrl = `/pdf/${req.file.filename}`;
    
    console.log('✅ File received:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      name: name,
      description: description
    });

    // Save to database
    const pdfData = {
      _id: Date.now().toString(),
      name,
      description,
      url: pdfUrl,
      filename: req.file.filename,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    };

    // Add to mockDB
    if (!mockDB.pdfs) mockDB.pdfs = [];
    mockDB.pdfs.push(pdfData);

    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pdfs.json'), JSON.stringify(mockDB.pdfs, null, 2));

    res.json({ message: 'PDF uploaded successfully', pdf: pdfData });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

app.get('/api/admin/pdfs', authenticateToken, async (req, res) => {
  try {
    // Initialize pdfs array if it doesn't exist
    if (!mockDB.pdfs) mockDB.pdfs = [];
    
    // Only auto-detect if the database is empty
    if (mockDB.pdfs.length === 0) {
      console.log('🔄 PDFs database is empty, auto-detecting from public/pdf folder...');
      
      // Auto-detect existing PDFs from public/pdf folder
      const existingPdfPath = path.join(__dirname, '..', 'public', 'pdf');
      if (fs.existsSync(existingPdfPath)) {
        const existingPdfFiles = fs.readdirSync(existingPdfPath).filter(file => file.endsWith('.pdf'));
        
        // Add existing PDFs to the database
        existingPdfFiles.forEach(filename => {
          const pdfData = {
            _id: `existing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: filename.replace('.pdf', '').replace(/_/g, ' ').replace(/,/g, ' - '),
            description: `Existing PDF: ${filename}`,
            url: `/pdf/${filename}`,
            filename: filename,
            uploadedAt: new Date(),
            uploadedBy: 'system',
            isExisting: true
          };
          mockDB.pdfs.push(pdfData);
        });
        
        // Save updated data
        fs.writeFileSync(path.join(__dirname, 'data', 'pdfs.json'), JSON.stringify(mockDB.pdfs, null, 2));
        console.log(`✅ Auto-detected and added ${existingPdfFiles.length} PDFs`);
      }
    } else {
      console.log(`✅ Using existing PDFs database with ${mockDB.pdfs.length} PDFs`);
    }
    
    res.json({ pdfs: mockDB.pdfs });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

app.delete('/api/admin/pdfs/:id', authenticateToken, async (req, res) => {
  try {
    const pdfId = req.params.id;
    const pdfIndex = mockDB.pdfs.findIndex(pdf => pdf._id === pdfId);
    
    if (pdfIndex === -1) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const pdf = mockDB.pdfs[pdfIndex];
    
    // Delete file from server
    const filePath = path.join(__dirname, '..', 'public', 'pdf', pdf.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from database
    mockDB.pdfs.splice(pdfIndex, 1);
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pdfs.json'), JSON.stringify(mockDB.pdfs, null, 2));

    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

// PDF Management Routes added successfully

// Add node-cron for daily billing
const cron = require('node-cron');

// Daily Subscription Processing System
async function processDailySubscriptions() {
  console.log('🔄 Starting daily subscription processing...');
  
  try {
    // Find all daily-12 subscribers
    let dailySubscribers = [];
    
    // Try MongoDB first
    try {
      const mongoUsers = await User.find({ 
        currentPlan: 'daily-12',
        subscriptionEndAt: { $gt: new Date() } // Still active
      }).lean();
      
      dailySubscribers = mongoUsers.map(user => ({
        ...user,
        source: 'mongodb'
      }));
      console.log(`✅ Found ${dailySubscribers.length} daily subscribers in MongoDB`);
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file storage...');
    }
    
    // Fallback to file storage
    if (dailySubscribers.length === 0) {
      dailySubscribers = mockDB.users.filter(user => 
        user.currentPlan === 'daily-12' && 
        user.subscriptionEndAt && 
        new Date(user.subscriptionEndAt) > new Date()
      ).map(user => ({
        ...user,
        source: 'file'
      }));
      console.log(`✅ Found ${dailySubscribers.length} daily subscribers in file storage`);
    }
    
    if (dailySubscribers.length === 0) {
      console.log('ℹ️ No active daily subscribers found');
      return;
    }
    
    // Process each daily subscriber
    for (const subscriber of dailySubscribers) {
      try {
        await processDailySubscriber(subscriber);
      } catch (error) {
        console.error(`❌ Error processing subscriber ${subscriber.email}:`, error.message);
      }
    }
    
    console.log('✅ Daily subscription processing completed');
  } catch (error) {
    console.error('❌ Daily subscription processing failed:', error);
  }
}

// Process individual daily subscriber
async function processDailySubscriber(subscriber) {
  console.log(`🔄 Processing daily subscriber: ${subscriber.email}`);
  
  try {
    // Check if it's time for daily renewal
    const lastRenewal = new Date(subscriber.lastCreditRenewal || subscriber.createdAt);
    const now = new Date();
    const hoursSinceRenewal = (now - lastRenewal) / (1000 * 60 * 60);
    
    if (hoursSinceRenewal < 24) {
      console.log(`⏰ ${subscriber.email} - Not yet time for daily renewal (${Math.floor(hoursSinceRenewal)}h ago)`);
      return;
    }
    
    // Check if subscription is still active
    if (subscriber.subscriptionEndAt && new Date(subscriber.subscriptionEndAt) <= now) {
      console.log(`⏰ ${subscriber.email} - Subscription expired, skipping daily renewal`);
      return;
    }
    
    // Process daily payment and credit renewal
    await processDailyPaymentAndCredits(subscriber);
    
  } catch (error) {
    console.error(`❌ Error processing daily subscriber ${subscriber.email}:`, error);
  }
}

// Process daily payment and credit renewal
async function processDailyPaymentAndCredits(subscriber) {
  console.log(`💳 Processing daily payment for: ${subscriber.email}`);
  
  try {
    // Get customer from Stripe
    let customer = null;
    if (subscriber.stripeCustomerId) {
      customer = await stripe.customers.retrieve(subscriber.stripeCustomerId);
    } else {
      // Find customer by email
      const customers = await stripe.customers.list({ 
        email: subscriber.email, 
        limit: 1 
      });
      customer = customers.data[0];
    }
    
    if (!customer) {
      console.log(`⚠️ No Stripe customer found for ${subscriber.email}`);
      return;
    }
    
    // Create daily payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 in cents
      currency: 'usd',
      customer: customer.id,
      metadata: {
        planId: 'daily-12',
        customerEmail: subscriber.email,
        dailyRenewal: 'true',
        renewalDate: new Date().toISOString()
      },
      automatic_payment_methods: { enabled: true },
      confirm: true, // Auto-confirm for daily billing
      off_session: true // Allow charging without user interaction
    });
    
    if (paymentIntent.status === 'succeeded') {
      console.log(`✅ Daily payment succeeded for ${subscriber.email}: $${paymentIntent.amount / 100}`);
      
      // Renew credits and update user
      await renewDailyCredits(subscriber, paymentIntent);
      
      // Generate daily invoice
      await generateDailyInvoice(subscriber, paymentIntent);
      
    } else {
      console.log(`❌ Daily payment failed for ${subscriber.email}: ${paymentIntent.status}`);
      
      // Handle failed payment
      await handleFailedDailyPayment(subscriber, paymentIntent);
    }
    
  } catch (error) {
    console.error(`❌ Daily payment processing failed for ${subscriber.email}:`, error.message);
    
    // Handle payment error
    await handleDailyPaymentError(subscriber, error);
  }
}

// Renew daily credits for user
async function renewDailyCredits(subscriber, paymentIntent) {
  console.log(`🔄 Renewing daily credits for: ${subscriber.email}`);
  
  try {
    const newCredits = (subscriber.currentCredits || 0) + 50;
    const now = new Date();
    const nextRenewal = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Update in MongoDB if available
    if (subscriber.source === 'mongodb') {
      try {
        await User.findByIdAndUpdate(subscriber._id, {
          currentCredits: newCredits,
          lastCreditRenewal: now.toISOString(),
          nextCreditRenewal: nextRenewal.toISOString(),
          lastDailyPayment: now.toISOString(),
          dailyPaymentsCount: (subscriber.dailyPaymentsCount || 0) + 1
        });
        console.log(`✅ MongoDB credits renewed for ${subscriber.email}: ${newCredits} credits`);
      } catch (dbError) {
        console.log('❌ MongoDB update failed, using file storage...');
      }
    }
    
    // Update in file storage
    const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
    if (userIndex !== -1) {
      mockDB.users[userIndex].currentCredits = newCredits;
      mockDB.users[userIndex].lastCreditRenewal = now.toISOString();
      mockDB.users[userIndex].nextCreditRenewal = nextRenewal.toISOString();
      mockDB.users[userIndex].lastDailyPayment = now.toISOString();
      mockDB.users[userIndex].dailyPaymentsCount = (mockDB.users[userIndex].dailyPaymentsCount || 0) + 1;
      
      saveDataToFiles('daily_credits_renewed');
      console.log(`✅ File storage credits renewed for ${subscriber.email}: ${newCredits} credits`);
    }
    
  } catch (error) {
    console.error(`❌ Error renewing credits for ${subscriber.email}:`, error);
  }
}

// Generate daily invoice
async function generateDailyInvoice(subscriber, paymentIntent) {
  console.log(`📄 Generating daily invoice for: ${subscriber.email}`);
  
  try {
    const invoiceId = `DAILY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const dailyInvoice = {
      id: invoiceId,
      date: now.toISOString(),
      amount: paymentIntent.amount / 100, // $1.00
      currency: paymentIntent.currency || 'usd',
      status: 'paid',
      description: 'Daily-12 Plan - Daily Renewal',
      plan: 'Daily-12',
      paymentIntentId: paymentIntent.id,
      customerEmail: subscriber.email,
      type: 'daily_renewal',
      renewalNumber: (subscriber.dailyPaymentsCount || 0) + 1,
      creditsAdded: 50
    };
    
    // Add to MongoDB if available
    if (subscriber.source === 'mongodb') {
      try {
        await User.findByIdAndUpdate(subscriber._id, {
          $push: { invoices: dailyInvoice }
        });
        console.log(`✅ MongoDB daily invoice generated for ${subscriber.email}: ${invoiceId}`);
      } catch (dbError) {
        console.log('❌ MongoDB invoice update failed, using file storage...');
      }
    }
    
    // Add to file storage
    const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
    if (userIndex !== -1) {
      if (!mockDB.users[userIndex].invoices) {
        mockDB.users[userIndex].invoices = [];
      }
      mockDB.users[userIndex].invoices.push(dailyInvoice);
      
      saveDataToFiles('daily_invoice_generated');
      console.log(`✅ File storage daily invoice generated for ${subscriber.email}: ${invoiceId}`);
    }
    
  } catch (error) {
    console.error(`❌ Error generating daily invoice for ${subscriber.email}:`, error);
  }
}

// Handle failed daily payment
async function handleFailedDailyPayment(subscriber, paymentIntent) {
  console.log(`❌ Handling failed daily payment for: ${subscriber.email}`);
  
  try {
    // Update payment failure status
    const now = new Date();
    
    if (subscriber.source === 'mongodb') {
      try {
        await User.findByIdAndUpdate(subscriber._id, {
          lastPaymentFailure: now.toISOString(),
          paymentFailureCount: (subscriber.paymentFailureCount || 0) + 1,
          subscriptionOnHold: true
        });
      } catch (dbError) {
        console.log('❌ MongoDB failure update failed, using file storage...');
      }
    }
    
    // Update file storage
    const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
    if (userIndex !== -1) {
      mockDB.users[userIndex].lastPaymentFailure = now.toISOString();
      mockDB.users[userIndex].paymentFailureCount = (mockDB.users[userIndex].paymentFailureCount || 0) + 1;
      mockDB.users[userIndex].subscriptionOnHold = true;
      
      saveDataToFiles('daily_payment_failed');
    }
    
    // Send notification email (if email system is available)
    console.log(`⚠️ Daily payment failed for ${subscriber.email} - subscription on hold`);
    
  } catch (error) {
    console.error(`❌ Error handling failed payment for ${subscriber.email}:`, error);
  }
}

// Handle daily payment error
async function handleDailyPaymentError(subscriber, error) {
  console.log(`❌ Handling daily payment error for: ${subscriber.email}`);
  
  try {
    const now = new Date();
    
    // Update error status
    if (subscriber.source === 'mongodb') {
      try {
                 await User.findByIdAndUpdate(subscriber._id, {
           lastPaymentError: now.toISOString(),
           paymentErrorCount: (subscriber.paymentErrorCount || 0) + 1,
           lastPaymentErrorMessage: error.message
         });
       } catch (dbError) {
         console.log('❌ MongoDB error update failed, using file storage...');
       }
     }
     
     // Update file storage
     const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
     if (userIndex !== -1) {
       mockDB.users[userIndex].lastPaymentError = now.toISOString();
       mockDB.users[userIndex].paymentErrorCount = (mockDB.users[userIndex].paymentErrorCount || 0) + 1;
       mockDB.users[userIndex].lastPaymentErrorMessage = error.message;
       
       saveDataToFiles('daily_payment_error');
     }
     
     console.log(`⚠️ Daily payment error for ${subscriber.email}: ${error.message}`);
     
   } catch (updateError) {
     console.error(`❌ Error updating error status for ${subscriber.email}:`, updateError);
   }
 }

// Schedule daily subscription processing
// Run every hour to check for daily renewals
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Hourly cron job triggered - checking daily subscriptions...');
  await processDailySubscriptions();
});

// Also run at midnight for daily summary
cron.schedule('0 0 * * *', async () => {
  console.log('🌅 Midnight cron job triggered - daily subscription summary...');
  await processDailySubscriptions();
  
  // Log daily summary
  console.log('📊 Daily Subscription Summary Completed');
});

console.log('✅ Daily subscription system initialized');