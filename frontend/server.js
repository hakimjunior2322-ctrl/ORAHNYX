const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const indexPath = path.join(__dirname, 'public', 'index.html');
    try {
      res.end(fs.readFileSync(indexPath));
    } catch (e) {
      res.writeHead(404);
      res.end('index.html not found');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('✅ Frontend running on http://0.0.0.0:3000');
});
