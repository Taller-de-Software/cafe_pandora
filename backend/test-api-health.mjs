const http = await import('http');

async function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => reject(e.message));
    req.setTimeout(10000, () => { req.destroy(); reject('timeout'); });
  });
}

const health = await get('/api/health');
console.log('Health:', health.status, health.body);

// Get pedidos to see available ones
const pedidos = await get('/api/pedidos');
console.log('Pedidos:', pedidos.status, pedidos.body?.substring(0, 200));
