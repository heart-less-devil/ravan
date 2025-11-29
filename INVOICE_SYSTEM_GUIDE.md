# 🧾 BioPing Invoice System Guide

## Overview
The BioPing Invoice System automatically generates professional PDF invoices for all payments and provides users with easy access to download individual invoices or all invoices as a single PDF file.

## ✨ Features

### 🔄 Automatic Invoice Generation
- **Real-time Generation**: Invoices are automatically created when payments succeed
- **Stripe Integration**: Seamlessly integrated with Stripe payment processing
- **Unique IDs**: Each invoice gets a unique identifier (e.g., `INV-1234567890-abc123def`)

### 📄 PDF Format
- **Professional Design**: Clean, branded PDF layout with BioPing colors
- **Complete Information**: Invoice details, customer info, payment status
- **High Quality**: Vector-based PDF generation using PDFKit

### 📱 User Interface
- **Invoice List**: View all invoices in CustomerProfile page
- **Individual Download**: Download single invoices as PDF
- **Bulk Download**: Download all invoices as a single PDF file
- **Status Indicators**: Clear payment status display

## 🏗️ Technical Implementation

### Backend (Node.js + Express)

#### Dependencies
```json
{
  "pdfkit": "^0.17.1",
  "stripe": "^18.3.0"
}
```

#### Key Functions

##### 1. PDF Invoice Generation
```javascript
const generatePDFInvoice = (invoice, user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    // Professional formatting with BioPing branding
    // Customer information, invoice details, styling
  });
};
```

##### 2. Combined PDF Generation
```javascript
app.get('/api/auth/download-all-invoices', authenticateToken, async (req, res) => {
  // Creates single PDF with cover page and all invoices
  // Each invoice on separate page
});
```

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/invoices` | GET | Get user's invoice list |
| `/api/auth/download-invoice/:id` | GET | Download single invoice PDF |
| `/api/auth/download-all-invoices` | GET | Download all invoices as single PDF |

### Frontend (React)

#### Components
- **CustomerProfile.js**: Main invoice management interface
- **Invoice Display**: List view with download options
- **Download Buttons**: Individual and bulk download functionality

#### Key Functions
```javascript
const handleDownloadInvoice = async (invoice) => {
  // Downloads single invoice as PDF
};

const handleDownloadAllInvoices = async () => {
  // Downloads all invoices as single PDF
};
```

## 🎨 Invoice Design

### Logo Integration
- **Logo File**: `public/image.png` (15KB PNG file)
- **Logo Placement**: Top center of every invoice page
- **Logo Sizing**: 
  - Individual invoices: 120x60 pixels
  - Combined PDF cover: 120x60 pixels
  - Combined PDF invoices: 80x40 pixels
- **Fallback**: Text header if logo file is missing
- **Format**: PNG for high quality and transparency support

### Layout Structure
1. **Header**: BioPing logo (image.png) and company name
2. **Title**: "INVOICE" centered
3. **Invoice Details**: ID, date, customer info
4. **Item Table**: Description and amount
5. **Total**: Payment amount and status
6. **Footer**: Contact information and branding

### Styling Features
- **Logo**: BioPing logo (image.png) prominently displayed
- **Colors**: BioPing brand colors (#2563eb, #059669)
- **Typography**: Professional font hierarchy
- **Spacing**: Clean, readable layout
- **Branding**: Consistent BioPing identity with visual logo

## 🔄 Workflow

### 1. Payment Processing
```
User Payment → Stripe Webhook → Invoice Generation → Database Storage
```

### 2. Invoice Access
```
User Login → CustomerProfile → View Invoices → Download Options
```

### 3. Download Process
```
Download Request → PDF Generation → File Download → User Receives PDF
```

## 📊 Data Structure

### Invoice Object
```javascript
{
  id: "INV-1234567890-abc123def",
  date: "2025-01-27T10:30:00.000Z",
  amount: 99.99,
  currency: "usd",
  status: "paid",
  description: "Premium Plan Subscription",
  plan: "Premium Plan",
  paymentIntentId: "pi_1234567890",
  customerEmail: "user@example.com"
}
```

### User Object (with invoices)
```javascript
{
  email: "user@example.com",
  name: "John Doe",
  company: "Company Inc.",
  invoices: [/* array of invoice objects */]
}
```

## 🚀 Usage Instructions

### For Users
1. **Access Invoices**: Go to CustomerProfile → Invoices tab
2. **View Details**: See invoice ID, date, amount, status
3. **Download Single**: Click download button on individual invoice
4. **Download All**: Use "Download All" button for complete set

### For Developers
1. **Test Payment**: Make test payment through Stripe
2. **Verify Generation**: Check invoice creation in webhook
3. **Test Downloads**: Verify PDF generation and download
4. **Check Formatting**: Ensure professional appearance

## 🧪 Testing

### Test Script
Run `node test-invoice-system.js` to verify system functionality.

### Test Scenarios
1. **Payment Success**: Verify invoice generation
2. **PDF Download**: Test individual invoice download
3. **Bulk Download**: Test all invoices download
4. **Format Validation**: Check PDF quality and content

## 🔧 Configuration

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_USER=your-email@gmail.com
```

### PDF Settings
- **Page Size**: A4
- **Margins**: 50px on all sides
- **Fonts**: Helvetica (Bold, Regular)
- **Colors**: Brand colors with fallbacks

## 📈 Future Enhancements

### Planned Features
- **Email Attachments**: Send invoices via email
- **Invoice Templates**: Multiple design options
- **Tax Calculation**: Automatic tax computation
- **Multi-currency**: Support for various currencies
- **Invoice History**: Extended payment tracking

### Integration Opportunities
- **Accounting Software**: QuickBooks, Xero integration
- **Cloud Storage**: Google Drive, Dropbox sync
- **API Access**: External invoice retrieval
- **Webhook Notifications**: Real-time invoice alerts

## 🐛 Troubleshooting

### Common Issues

#### PDF Generation Fails
- Check PDFKit installation
- Verify file permissions
- Check memory allocation

#### Download Not Working
- Verify authentication token
- Check API endpoint availability
- Validate invoice data structure

#### Invoice Not Generated
- Check Stripe webhook configuration
- Verify payment success status
- Check database connection

### Debug Steps
1. Check server logs for errors
2. Verify webhook payload
3. Test API endpoints manually
4. Validate PDF generation function

## 📞 Support

For technical support or questions about the invoice system:
- **Email**: support@bioping.com
- **Documentation**: This guide and inline code comments
- **Logs**: Check server console for detailed information

---

**Last Updated**: January 27, 2025  
**Version**: 1.0.0  
**Maintainer**: BioPing Development Team
