// Simple script to test the API
import fetch from 'node-fetch';

// These URLs are from the SST deployment
const CREATE_COMPLAINT_URL = 'https://pkybygq5kg7msc7sj2et6w3t5q0opopn.lambda-url.us-east-2.on.aws/';
const LIST_COMPLAINTS_URL = 'https://2a3alk3tnm43ynovqqqlapp6cy0oxsxc.lambda-url.us-east-2.on.aws/';
const GET_COMPLAINT_URL = 'https://bv7ziippwfdm3eoapbzbaxlt4a0jhagf.lambda-url.us-east-2.on.aws/';

async function testCreateComplaint() {
  console.log('Testing POST to CreateComplaint function...');
  
  const response = await fetch(CREATE_COMPLAINT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Test Complaint',
      description: 'This is a test complaint submitted via script',
      customerEmail: 'test@example.com',
      urgency: 'NORMAL',
    }),
  });
  
  const data = await response.json();
  console.log('Response:', data);
  
  return data.complaint?.id;
}

async function testListComplaints() {
  console.log('\nTesting GET to ListComplaints function...');
  
  const response = await fetch(LIST_COMPLAINTS_URL);
  const data = await response.json();
  
  console.log('Response:', data);
}

async function testGetComplaint(id) {
  console.log(`\nTesting GET to GetComplaint function with ID ${id}...`);
  
  // For the GetComplaint function, we pass the ID as a query parameter
  const response = await fetch(`${GET_COMPLAINT_URL}?id=${id}`);
  const data = await response.json();
  
  console.log('Response:', data);
}

async function runTests() {
  try {
    // Test creating a complaint
    const complaintId = await testCreateComplaint();
    
    // Test listing all complaints
    await testListComplaints();
    
    // Test getting a specific complaint
    if (complaintId) {
      await testGetComplaint(complaintId);
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();