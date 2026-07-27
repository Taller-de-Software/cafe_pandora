import jwt from 'jsonwebtoken';

const JWT_SECRET = 'una-clave-secreta-muy-segura-cambiar-en-produccion';
const token = jwt.sign({ id: 1, rol: 'administrador' }, JWT_SECRET, { expiresIn: '1h' });

const http = await import('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', (chunk) => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', (e) => reject(e.message));
    req.setTimeout(20000, () => { req.destroy(); reject('timeout'); });
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Testing printer connection...');
  const testResult = await post('/api/impresion/probar');
  console.log('Test result:', testResult.status, testResult.body);

  console.log('\nTrying kitchen print for pedido 1...');
  const printResult = await post('/api/impresion/cocina/1');
  console.log('Print result:', printResult.status, printResult.body);
}

main().catch(e => console.error('Error:', e));
