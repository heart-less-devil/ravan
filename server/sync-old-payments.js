const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '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');
const fs = require('fs');
const path = require('path');

// Load existing data
const loadData = () => {
  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    if (fs.existsSync(usersPath)) {
      return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading users data:', error);
  }
  return [];
};

// Save data
const saveData = (data) => {
  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
    console.log('✅ Data saved successfully');
  } catch (error) {
    console.error('❌ Error saving data:', error);
  }
};

// Sync old payments from Stripe
const syncOldPayments = async () => {
  console.log('🔄 Starting sync of old Stripe payments...');
  
  try {
    // Load existing users
    const users = loadData();
    console.log(`📊 Found ${users.length} users in database`);

    // Get all customers from Stripe
    console.log('🔍 Fetching all customers from Stripe...');
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

    // Process each customer
    for (const customer of allCustomers) {
      if (!customer.email) continue;

      console.log(`\n👤 Processing customer: ${customer.email}`);

      // Find user in local database
      const userIndex = users.findIndex(u => u.email === customer.email);
      if (userIndex === -1) {
        console.log(`⚠️ User not found in local database: ${customer.email}`);
        continue;
      }

      // Initialize invoices array if it doesn't exist
      if (!users[userIndex].invoices) {
        users[userIndex].invoices = [];
      }

      // Get all invoices for this customer
      console.log(`📄 Fetching invoices for ${customer.email}...`);
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

      console.log(`📊 Found ${allInvoices.length} invoices for ${customer.email}`);

      // Process each invoice
      for (const invoice of allInvoices) {
        // Check if invoice already exists in local database
        const existingInvoice = users[userIndex].invoices.find(
          inv => inv.id === invoice.id || inv.stripeInvoiceId === invoice.id
        );

        if (existingInvoice) {
          console.log(`✅ Invoice already exists: ${invoice.id}`);
          continue;
        }

        // Create invoice object
        const invoiceData = {
          id: invoice.id,
          stripeInvoiceId: invoice.id,
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
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          customerEmail: customer.email,
          syncedAt: new Date().toISOString()
        };

        // Add to user's invoices
        users[userIndex].invoices.push(invoiceData);
        console.log(`✅ Added invoice: ${invoice.id} - $${invoiceData.amount} ${invoiceData.currency}`);

        // Update user's payment status if invoice is paid
        if (invoice.paid && invoice.status === 'paid') {
          users[userIndex].paymentCompleted = true;
          users[userIndex].paymentUpdatedAt = new Date().toISOString();
          console.log(`✅ Updated payment status for ${customer.email}`);
        }
      }

      // Also get payment intents for this customer
      console.log(`💳 Fetching payment intents for ${customer.email}...`);
      let allPaymentIntents = [];
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

        const paymentIntents = await stripe.paymentIntents.list(params);
        allPaymentIntents = allPaymentIntents.concat(paymentIntents.data);
        
        hasMore = paymentIntents.has_more;
        if (hasMore && paymentIntents.data.length > 0) {
          startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
        }
      }

      console.log(`💳 Found ${allPaymentIntents.length} payment intents for ${customer.email}`);

      // Process successful payment intents
      for (const paymentIntent of allPaymentIntents) {
        if (paymentIntent.status !== 'succeeded') continue;

        // Check if this payment intent already has an invoice
        const hasInvoice = users[userIndex].invoices.find(
          inv => inv.paymentIntentId === paymentIntent.id
        );

        if (hasInvoice) {
          console.log(`✅ Payment intent already has invoice: ${paymentIntent.id}`);
          continue;
        }

        // Create invoice from payment intent
        const invoiceData = {
          id: `PI-${paymentIntent.id}`,
          paymentIntentId: paymentIntent.id,
          number: `PI-${paymentIntent.id}`,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: 'paid',
          created: new Date(paymentIntent.created * 1000).toISOString(),
          paid: true,
          description: paymentIntent.description || 'BioPing Payment',
          customerEmail: customer.email,
          syncedAt: new Date().toISOString()
        };

        users[userIndex].invoices.push(invoiceData);
        console.log(`✅ Added payment intent as invoice: ${paymentIntent.id} - $${invoiceData.amount} ${invoiceData.currency}`);

        // Update user's payment status
        users[userIndex].paymentCompleted = true;
        users[userIndex].paymentUpdatedAt = new Date().toISOString();
      }
    }

    // Save updated data
    saveData(users);

    console.log('\n🎉 Sync completed successfully!');
    console.log(`📊 Processed ${allCustomers.length} customers`);
    
    // Show summary
    let totalInvoices = 0;
    let paidUsers = 0;
    users.forEach(user => {
      if (user.invoices) {
        totalInvoices += user.invoices.length;
      }
      if (user.paymentCompleted) {
        paidUsers++;
      }
    });

    console.log(`📄 Total invoices: ${totalInvoices}`);
    console.log(`✅ Users with payments: ${paidUsers}`);

  } catch (error) {
    console.error('❌ Error syncing payments:', error);
  }
};

// Run the sync
if (require.main === module) {
  syncOldPayments()
    .then(() => {
      console.log('✅ Sync script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sync script failed:', error);
      process.exit(1);
    });
}

module.exports = { syncOldPayments };
