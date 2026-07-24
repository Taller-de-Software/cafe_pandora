import { testConnection, printTest } from './src/services/printer/index.js';

async function main() {
  console.log('=== Test de conexión ===');
  try {
    const result = await testConnection();
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error en testConnection:', err.message);
  }

  console.log('\n=== Test de impresión ===');
  try {
    const result = await printTest();
    console.log('Resultado:', result);
  } catch (err) {
    console.error('Error en printTest:', err.message);
  }
}

main().finally(() => process.exit());