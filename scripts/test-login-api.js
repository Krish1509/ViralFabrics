const fetch = require('node-fetch');

async function testLoginAPI() {
  console.log('🧪 Testing Login API with superadmin credentials...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'superadmin',
        password: 'superadmin',
        rememberMe: false
      })
    });
    
    const data = await response.json();
    
    console.log('📊 Login API Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.ok}`);
    console.log(`   Message: ${data.message || 'No message'}`);
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log(`   Token: ${data.token ? 'Present' : 'Missing'}`);
      console.log(`   User: ${data.user ? data.user.username : 'Missing'}`);
    } else {
      console.log('❌ Login failed!');
      console.log(`   Error: ${data.message}`);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    console.log('\n💡 Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

// Wait a moment for server to start
setTimeout(testLoginAPI, 3000);
