import { verifySessionToken } from '../server/auth.js';
import { verifySessionToken as verifyEmailSessionToken } from '../server/emailAuth.js';

async function testAuthToken() {
  // Your auth_token from the cookie
  const token = '431c5ed8166266cd3bf0edc581315f9b2114c8eb57104208dc58a40534f07043';

  console.log('🔐 Testing auth token:', token);
  console.log('');

  // Try OAuth verification
  console.log('Testing OAuth verification...');
  const oauthUser = await verifySessionToken(token);
  if (oauthUser) {
    console.log('✅ OAuth verification succeeded');
    console.log('   User:', oauthUser);
  } else {
    console.log('❌ OAuth verification failed');
  }
  console.log('');

  // Try Email verification
  console.log('Testing Email verification...');
  const emailUser = await verifyEmailSessionToken(token);
  if (emailUser) {
    console.log('✅ Email verification succeeded');
    console.log('   User:', emailUser);
  } else {
    console.log('❌ Email verification failed');
  }
  console.log('');

  if (!oauthUser && !emailUser) {
    console.log('❌ Token is not valid with either auth method');
  }

  process.exit(0);
}

testAuthToken().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
