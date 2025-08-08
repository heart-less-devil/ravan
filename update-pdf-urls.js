// Script to update PDF URLs with your actual domain
// Run this script and replace placeholder domains with your actual domains

const fs = require('fs');
const path = require('path');

// Replace these with your actual domains
const RENDER_DOMAIN = 'your-render-domain.onrender.com'; // Change this to your Render domain
const GODADDY_DOMAIN = 'your-godaddy-domain.com'; // Change this to your GoDaddy domain
const NETLIFY_DOMAIN = 'your-domain.netlify.app'; // Change this to your Netlify domain

const quickGuidePath = path.join(__dirname, 'src', 'pages', 'QuickGuide.js');

try {
  let content = fs.readFileSync(quickGuidePath, 'utf8');
  
  // Replace all placeholder domains with actual domains
  content = content.replace(/your-render-domain\.onrender\.com/g, RENDER_DOMAIN);
  content = content.replace(/your-godaddy-domain\.com/g, GODADDY_DOMAIN);
  content = content.replace(/your-domain\.netlify\.app/g, NETLIFY_DOMAIN);
  
  fs.writeFileSync(quickGuidePath, content, 'utf8');
  
  console.log('✅ PDF URLs updated successfully!');
  console.log(`📝 Render domain: ${RENDER_DOMAIN}`);
  console.log(`📝 GoDaddy domain: ${GODADDY_DOMAIN}`);
  console.log(`📝 Netlify domain: ${NETLIFY_DOMAIN}`);
  console.log('🚀 Deploy your app now and the PDF should work on live server');
  
} catch (error) {
  console.error('❌ Error updating PDF URLs:', error.message);
} 