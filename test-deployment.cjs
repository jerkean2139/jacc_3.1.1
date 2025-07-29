/**
 * Simple deployment test script
 */
const { execSync } = require('child_process');

async function testDeployment() {
  console.log('🚀 JACC Deployment Test');
  console.log('=======================');
  
  // Test 1: Database schema push
  console.log('\n🔍 Testing database schema...');
  try {
    execSync('npm run db:push', { stdio: 'inherit' });
    console.log('✅ Database schema test passed');
  } catch (error) {
    console.error('❌ Database schema test failed:', error.message);
  }
  
  // Test 2: TypeScript compilation
  console.log('\n🔍 Testing TypeScript compilation...');
  try {
    execSync('npm run check', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation test passed');
  } catch (error) {
    console.error('❌ TypeScript compilation test failed:', error.message);
  }
  
  // Test 3: Application build
  console.log('\n🔍 Testing application build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Application build test passed');
  } catch (error) {
    console.error('❌ Application build test failed:', error.message);
  }
  
  console.log('\n📊 Deployment readiness check completed');
  console.log('🔗 Next steps: Contact Replit support if deployment still fails');
}

testDeployment().catch(console.error);