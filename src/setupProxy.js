const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to backend server
  // This will forward all /api/* requests to the backend server
  const backendUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3005';
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying request:', req.method, req.url, '->', backendUrl + req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
        console.error('❌ Backend URL:', backendUrl);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Proxy error', 
            message: `Could not connect to backend server at ${backendUrl}. Please ensure the server is running.` 
          });
        }
      }
    })
  );
};

