// Test script for RFID Dashboard API endpoints
// Run this with: node test-api.js

const BASE_URL = 'http://localhost:3002';

async function testAPI() {
  console.log('🧪 Testing RFID Dashboard API...\n');

  try {
    // Test 1: Register a user
    console.log('1. Testing user registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rfid: 'RFID123456',
        name: 'John Doe',
        employeeId: 'EMP001'
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ User registered successfully:', registerData.user.name);
    } else {
      const error = await registerResponse.json();
      console.log('❌ Registration failed:', error.error);
    }

    // Test 2: Record attendance for registered user
    console.log('\n2. Testing attendance recording for registered user...');
    const attendanceResponse = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rfid: 'RFID123456'
      })
    });

    if (attendanceResponse.ok) {
      const attendanceData = await attendanceResponse.json();
      console.log('✅ Attendance recorded:', attendanceData.user.name, '- Count:', attendanceData.user.attendance);
    } else {
      const error = await attendanceResponse.json();
      console.log('❌ Attendance recording failed:', error.error);
    }

    // Test 3: Record attendance for unregistered user
    console.log('\n3. Testing attendance recording for unregistered user...');
    const unregisteredResponse = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rfid: 'RFID789012'
      })
    });

    if (unregisteredResponse.ok) {
      const unregisteredData = await unregisteredResponse.json();
      console.log('✅ Unregistered user scanned:', unregisteredData.unregisteredUser.rfid);
    } else {
      const error = await unregisteredResponse.json();
      console.log('❌ Unregistered user scan failed:', error.error);
    }

    // Test 4: Get dashboard stats
    console.log('\n4. Testing dashboard stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/dashboard/stats`);

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Dashboard stats retrieved:');
      console.log('   - Total Users:', statsData.data.overview.totalUsers);
      console.log('   - Total Unregistered:', statsData.data.overview.totalUnregisteredUsers);
      console.log('   - Today\'s Attendance:', statsData.data.attendance.today);
    } else {
      const error = await statsResponse.json();
      console.log('❌ Dashboard stats failed:', error.error);
    }

    // Test 5: Get users list
    console.log('\n5. Testing users list...');
    const usersResponse = await fetch(`${BASE_URL}/api/users`);

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users list retrieved:', usersData.data.users.data.length, 'users');
    } else {
      const error = await usersResponse.json();
      console.log('❌ Users list failed:', error.error);
    }

    // Test 6: Get unregistered users
    console.log('\n6. Testing unregistered users list...');
    const unregisteredListResponse = await fetch(`${BASE_URL}/api/unregistered`);

    if (unregisteredListResponse.ok) {
      const unregisteredListData = await unregisteredListResponse.json();
      console.log('✅ Unregistered users list retrieved:', unregisteredListData.data.unregisteredUsers.length, 'users');
    } else {
      const error = await unregisteredListResponse.json();
      console.log('❌ Unregistered users list failed:', error.error);
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. MongoDB is running');
    console.log('   2. Next.js dev server is running (npm run dev)');
    console.log('   3. Environment variables are set correctly');
  }
}

// Run the tests
testAPI();
