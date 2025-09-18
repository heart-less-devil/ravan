# 🔧 PDF Hosting Fix - Render & GoDaddy

## Problem
PDF works on localhost but fails on Render/GoDaddy live server

## ✅ Solutions Applied

### 1. **Render Configuration (render.yaml)**
```yaml
# PDF specific headers for Render
- path: "*.pdf"
  name: X-Frame-Options
  value: "SAMEORIGIN"
- path: "*.pdf"
  name: Content-Type
  value: "application/pdf"
- path: "*.pdf"
  name: Access-Control-Allow-Origin
  value: "*"
- path: "/pdf/*"
  name: Cache-Control
  value: "public, max-age=3600"
```

### 2. **Express Server PDF Routes**
```javascript
// Enhanced PDF serving middleware
app.use('/pdf', (req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Direct PDF serving route
app.get('/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join(__dirname, '../public/pdf', filename);
  
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const stream = fs.createReadStream(pdfPath);
  stream.pipe(res);
});
```

### 3. **GoDaddy .htaccess Configuration**
```apache
# Enable CORS for PDF files
<IfModule mod_headers.c>
    <FilesMatch "\.pdf$">
        Header set Access-Control-Allow-Origin "*"
        Header set X-Frame-Options "SAMEORIGIN"
        Header set Content-Type "application/pdf"
    </FilesMatch>
</IfModule>
```

### 4. **Enhanced PDF URLs**
The component now tries these URLs in order:
1. `/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0`
2. `/pdf/BioPing%20Training%20Manual.pdf#toolbar=0&navpanes=0&scrollbar=0`
3. `https://your-render-domain.onrender.com/pdf/BioPing Training Manual.pdf`
4. `https://your-godaddy-domain.com/pdf/BioPing Training Manual.pdf`
5. `/api/pdf/BioPing Training Manual.pdf`
6. `/pdf/BioPing Training Manual.pdf`

## 🚀 Deployment Steps

### Step 1: Update Domains
1. Open `update-pdf-urls.js`
2. Update your actual domains:
   ```javascript
   const RENDER_DOMAIN = 'your-actual-render-domain.onrender.com';
   const GODADDY_DOMAIN = 'your-actual-godaddy-domain.com';
   ```
3. Run: `node update-pdf-urls.js`

### Step 2: Deploy to Render
```bash
git add .
git commit -m "PDF hosting fixes for Render/GoDaddy"
git push origin main
```

### Step 3: Deploy to GoDaddy
1. Upload all files to GoDaddy hosting
2. Ensure `.htaccess` file is in root directory
3. Verify PDF files are in `public/pdf/` folder

## 🔍 Troubleshooting

### Render Issues:
1. **Check Build Logs** - Look for PDF file errors
2. **Verify File Path** - Ensure PDF is in `public/pdf/`
3. **Test Direct URL** - Try accessing PDF directly

### GoDaddy Issues:
1. **Check .htaccess** - Ensure file is uploaded
2. **File Permissions** - Set PDF files to 644
3. **Apache Modules** - Ensure mod_headers is enabled

### Common Solutions:

#### 1. **Direct PDF Test**
```
https://your-domain.com/pdf/BioPing Training Manual.pdf
```

#### 2. **API Route Test**
```
https://your-domain.com/api/pdf/BioPing Training Manual.pdf
```

#### 3. **CORS Test**
Check browser console for CORS errors

## 📋 Files Modified

1. **`render.yaml`** - Render PDF headers
2. **`server/index.js`** - Express PDF routes
3. **`src/pages/QuickGuide.js`** - Enhanced PDF URLs
4. **`public/.htaccess`** - GoDaddy PDF configuration
5. **`update-pdf-urls.js`** - Multi-domain support

## 🎯 Expected Result

After deployment:
- ✅ PDF loads on Render
- ✅ PDF loads on GoDaddy
- ✅ Navigation buttons work
- ✅ Error handling shows fallback options
- ✅ Download option available

## 🔄 Alternative Solutions

### If PDF Still Doesn't Work:

1. **External Hosting**
   - Upload PDF to Google Drive
   - Use Dropbox or OneDrive
   - Host on AWS S3

2. **PDF.js Integration**
   - Use PDF.js for better compatibility
   - Embed PDF viewer component

3. **Direct Download**
   - Provide direct download link
   - Skip iframe embedding

## 🚨 Emergency Fix

If PDF still fails:
1. Check browser console for errors
2. Try incognito mode
3. Test on different browser
4. Use direct download link

---

**Note:** These solutions are specifically designed for Render and GoDaddy hosting platforms. 