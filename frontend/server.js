const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  
  // Route pour la page d'accueil
  if (urlPath === '/' || urlPath === '') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const indexPath = path.join(__dirname, 'public', 'index.html');
    try {
      res.end(fs.readFileSync(indexPath));
    } catch (e) {
      res.writeHead(404);
      res.end('index.html not found');
    }
    return;
  }
  
  // Route pour la réservation
  if (urlPath === '/reservation' || urlPath === '/reservation/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const reservationPath = path.join(__dirname, 'public', 'reservation', 'index.html');
    try {
      res.end(fs.readFileSync(reservationPath));
    } catch (e) {
      res.writeHead(404);
      res.end('reservation/index.html not found');
    }
    return;
  }
  
  // Route pour admin login
  if (urlPath === '/admin/login' || urlPath === '/admin/login/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const adminLoginPath = path.join(__dirname, 'pages', 'admin', 'login.html');
    try {
      res.end(fs.readFileSync(adminLoginPath));
    } catch (e) {
      res.writeHead(404);
      res.end('admin/login.html not found');
    }
    return;
  }
  
  // Route pour admin dashboard
  if (urlPath === '/admin/dashboard' || urlPath === '/admin/dashboard/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const adminDashboardPath = path.join(__dirname, 'pages', 'admin', 'dashboard.html');
    try {
      res.end(fs.readFileSync(adminDashboardPath));
    } catch (e) {
      res.writeHead(404);
      res.end('admin/dashboard.html not found');
    }
    return;
  }
  
  // Route pour admin (redirige vers login)
  if (urlPath === '/admin' || urlPath === '/admin/') {
    res.writeHead(301, { 'Location': '/admin/login' });
    res.end();
    return;
  }
  
  // Servir les fichiers statiques
  const filePath = path.join(__dirname, 'public', urlPath);
  
  // Vérifier que le fichier existe et ne sort pas du répertoire public
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    
    // Déterminer le type de contenu
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'text/plain';
    
    if (ext === '.html') contentType = 'text/html; charset=utf-8';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('✅ Frontend running on http://0.0.0.0:3000');
});
