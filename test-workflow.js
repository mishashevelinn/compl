// Test script for the complete complaint workflow
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

// API URLs from the SST deployment
const CREATE_COMPLAINT_URL = 'https://pkybygq5kg7msc7sj2et6w3t5q0opopn.lambda-url.us-east-2.on.aws/';
const LIST_COMPLAINTS_URL = 'https://2a3alk3tnm43ynovqqqlapp6cy0oxsxc.lambda-url.us-east-2.on.aws/';
const GET_COMPLAINT_URL = 'https://bv7ziippwfdm3eoapbzbaxlt4a0jhagf.lambda-url.us-east-2.on.aws/';

// Test data
const testComplaints = [
  {
    title: "Slow Website Performance",
    description: "The website is extremely slow when browsing product pages.",
    customerEmail: "customer1@example.com",
    urgency: "NORMAL"
  },
  {
    title: "Order Not Delivered",
    description: "I placed an order 2 weeks ago and it still hasn't arrived.",
    customerEmail: "customer2@example.com",
    urgency: "NORMAL"
  },
  {
    title: "Wrong Item Received",
    description: "I ordered a blue shirt but received a red one instead.",
    customerEmail: "customer3@example.com",
    urgency: "NORMAL"
  }
];

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
      throw new Error(`Failed to create complaint: ${response.status} ${response.statusText}`);
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

// Monitor a complaint's status changes
async function monitorComplaintStatus(id, targetStatus = 'RESOLVED', maxAttempts = 10) {
  console.log(`Monitoring complaint ${id} for status change to ${targetStatus}...`);
  
  let attempts = 0;
  let complaint;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    complaint = await getComplaint(id);
    
    if (complaint.status === targetStatus) {
      console.log(`Complaint ${id} reached target status: ${targetStatus}`);
      return complaint;
    }
    
    console.log(`Attempt ${attempts}/${maxAttempts}: Complaint status is ${complaint.status}, waiting for ${targetStatus}...`);
    
    // Wait 5 seconds before checking again
    await setTimeout(5000);
  }
  
  console.log(`Monitoring timed out. Final status: ${complaint.status}`);
  return complaint;
}

// Run the complete workflow test
async function runWorkflowTest() {
  try {
    console.log('=== STARTING COMPLAINT WORKFLOW TEST ===');
    
    // Step 1: Create multiple complaints to trigger batch processing
    console.log('\n=== STEP 1: Creating Complaints ===');
    const createdComplaints = [];
    
    for (const complaintData of testComplaints) {
      const complaint = await createComplaint(complaintData);
      createdComplaints.push(complaint);
      
      // Wait a bit between creations
      await setTimeout(1000);
    }
    
    // Step 2: List all complaints to verify creation
    console.log('\n=== STEP 2: Verifying Complaints Created ===');
    await listComplaints();
    
    // Step 3: Monitor the status of the first complaint
    // It should change from PENDING to IN_PROGRESS to RESOLVED
    // as the SQS queue processes it
    console.log('\n=== STEP 3: Monitoring Complaint Status Changes ===');
    if (createdComplaints.length > 0) {
      const firstComplaintId = createdComplaints[0].id;
      
      // Wait a bit for the SQS queue to process the message
      console.log('Waiting for SQS to process the complaint...');
      await setTimeout(10000);
      
      // Monitor the complaint status
      await monitorComplaintStatus(firstComplaintId);
    }
    
    // Step 4: Final status check of all complaints
    console.log('\n=== STEP 4: Final Status Check ===');
    await listComplaints();
    
    console.log('\n=== WORKFLOW TEST COMPLETED ===');
  } catch (error) {
    console.error('Workflow test failed:', error);
  }
}

// Run the test
runWorkflowTest();
