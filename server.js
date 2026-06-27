// server.js - Simple local web server to host Movana using native Node.js CommonJS
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Strip query parameters
  const cleanUrl = req.url.split('?')[0];
  
  // Handle serverless function execution under /api/
  if (cleanUrl.startsWith('/api/')) {
    const apiFilePath = path.join(__dirname, cleanUrl + '.js');
    if (fs.existsSync(apiFilePath)) {
      try {
        console.log(`Routing API request locally to: ${apiFilePath}`);
        
        // Mock request context
        const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
        req.query = Object.fromEntries(parsedUrl.searchParams);
        
        // Read body if POST/PUT
        let bodyBuffer = [];
        req.on('data', chunk => {
          bodyBuffer.push(chunk);
        }).on('end', async () => {
          const bodyString = Buffer.concat(bodyBuffer).toString();
          req.body = {};
          if (bodyString) {
            if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
              req.body = Object.fromEntries(new URLSearchParams(bodyString));
            } else if (req.headers['content-type']?.includes('application/json')) {
              try { req.body = JSON.parse(bodyString); } catch (e) {}
            } else {
              try { req.body = JSON.parse(bodyString); } catch (e) {
                try { req.body = Object.fromEntries(new URLSearchParams(bodyString)); } catch (e2) {}
              }
            }
          }

          // Mock response context
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
            return res;
          };
          res.send = (data) => {
            res.writeHead(res.statusCode || 200, { 'Content-Type': 'text/plain' });
            res.end(data);
            return res;
          };
          res.redirect = (url) => {
            res.writeHead(302, { 'Location': url });
            res.end();
            return res;
          };

          try {
            // Decache module to allow hot-reloading for local API changes
            delete require.cache[require.resolve(apiFilePath)];
            // Require and run the function
            const handler = require(apiFilePath);
            await handler(req, res);
          } catch (handlerErr) {
            console.error("API handler execution failed:", handlerErr);
            res.status(500).json({ error: handlerErr.message });
          }
        });
        return;
      } catch (err) {
        console.error("API route setup failed:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }
  }
  
  // Resolve path
  let filePath = path.join(__dirname, cleanUrl === '/' ? 'index.html' : cleanUrl);
  
  // Get file extension
  let ext = path.extname(filePath);
  
  // If there is no file extension, serve index.html (SPA route fallback)
  if (!ext) {
    filePath = path.join(__dirname, 'index.html');
    ext = '.html';
  }
  
  let contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`Movana local server is running!`);
  console.log(`Open your browser and visit: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
