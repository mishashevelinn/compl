// Test script for the basic complaint workflow
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

// API URLs from the SST deployment
const CREATE_COMPLAINT_URL = 'https://pkybygq5kg7msc7sj2et6w3t5q0opopn.lambda-url.us-east-2.on.aws/';
const LIST_COMPLAINTS_URL = 'https://2a3alk3tnm43ynovqqqlapp6cy0oxsxc.lambda-url.us-east-2.on.aws/';
const GET_COMPLAINT_URL = 'https://bv7ziippwfdm3eoapbzbaxlt4a0jhagf.lambda-url.us-east-2.on.aws/';

// Test data
const testComplaint = {
  title: "Slow Website Performance",
  description: "The website is extremely slow when browsing product pages.",
  customerEmail: "customer1@example.com",
  urgency: "NORMAL"
};

// Create a complaint
async function createComplaint(complaintData) {
  console.log(`Creating complaint: ${complaintData.title}`);
  
  try {
    const response = await fetch(CREATE_COMPLAINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(complaintData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create complaint: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Complaint created successfully with ID: ${data.complaint.id}`);
    return data.complaint;
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw error;
  }
}

// List all complaints
async function listComplaints() {
  console.log('Listing all complaints...');
  
  try {
    const response = await fetch(LIST_COMPLAINTS_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to list complaints: ${response.status} ${response.statusText}`);
    }
    
    const complaints = await response.json();
    console.log(`Found ${complaints.length} complaints:`);
    complaints.forEach(complaint => {
      console.log(`- ID: ${complaint.id}, Title: ${complaint.title}, Status: ${complaint.status}`);
    });
    
    return complaints;
  } catch (error) {
    console.error('Error listing complaints:', error);
    throw error;
  }
}

// Get a complaint by ID
async function getComplaint(id) {
  console.log(`Getting complaint with ID: ${id}`);
  
  try {
    const response = await fetch(`${GET_COMPLAINT_URL}?id=${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get complaint: ${response.status} ${response.statusText}`);
    }
    
    const complaint = await response.json();
    console.log(`Complaint details:`, complaint);
    
    return complaint;
  } catch (error) {
    console.error(`Error getting complaint with ID ${id}:`, error);
    throw error;
  }
}

// Run the basic flow test
async function runBasicFlowTest() {
  try {
    console.log('=== STARTING BASIC FLOW TEST ===');
    
    // Step 1: Create a complaint
    console.log('\n=== STEP 1: Creating Complaint ===');
    const complaint = await createComplaint(testComplaint);
    
    // Step 2: Get the complaint by ID
    console.log('\n=== STEP 2: Getting Complaint by ID ===');
    await getComplaint(complaint.id);
    
    // Step 3: List all complaints
    console.log('\n=== STEP 3: Listing All Complaints ===');
    await listComplaints();
    
    console.log('\n=== BASIC FLOW TEST COMPLETED ===');
  } catch (error) {
    console.error('Basic flow test failed:', error);
  }
}

// Run the test
runBasicFlowTest();
