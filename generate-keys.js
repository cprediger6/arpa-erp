const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

console.log('=== CLAVES PARA .env.local ===');
console.log(NEXTAUTH_SECRET=" + generateSecret() + ");
console.log(JWT_SECRET=" + generateSecret() + ");
console.log('');
console.log('📌 Guarda estas claves en un lugar seguro');
console.log('📌 Nunca las compartas ni las subas a GitHub');
