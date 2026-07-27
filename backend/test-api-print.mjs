const http = await import('http');
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/impresion/probar',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const result = await new Promise((resolve, reject) => {
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => resolve({ status: res.statusCode, body: data }));
  });
  req.on('error', (e) => reject(e.message));
  req.setTimeout(10000, () => { req.destroy(); reject('timeout'); });
  req.end();
});

console.log('Status:', result.status);
console.log('Body:', result.body);
