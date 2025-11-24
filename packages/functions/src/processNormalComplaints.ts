import { SQSHandler } from "aws-lambda";
import { getClient, complaints } from "../../core/src/db/index.js";
import { eq } from "drizzle-orm";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES client for sending emails
const sesClient = new SESClient({});
// Admin email address - replace with your actual email
const ADMIN_EMAIL = "michaels@aradtech.com";

export const handler: SQSHandler = async (event) => {
  try {
    console.log("Processing normal complaints batch:", event);
    
    // Extract complaints from SQS messages
    // Each message is an EventBridge event that was sent to SQS
    const batchComplaints = event.Records.map(record => {
      const body = JSON.parse(record.body);
      // For EventBridge events sent to SQS, the actual event detail is in the 'detail' field
      return JSON.parse(body.detail);
    });
    
    console.log(`Processing ${batchComplaints.length} normal complaints`);
    
    // Initialize database client
    const db = getClient();
    
    // Update status of all complaints to IN_PROGRESS
    for (const complaint of batchComplaints) {
      await db.update(complaints)
        .set({ status: "IN_PROGRESS" })
        .where(eq(complaints.id, complaint.complaintId));
    }
    
    // Generate email content with complaint summaries
    const emailSubject = `Complaint Summary: ${batchComplaints.length} New Complaints`;
    
    let emailBody = `
      <h1>New Complaints Summary</h1>
      <p>You have ${batchComplaints.length} new complaints to review:</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse;">
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Customer Email</th>
          <th>Urgency</th>
          <th>Created At</th>
        </tr>
    `;
    
    batchComplaints.forEach(complaint => {
      emailBody += `
        <tr>
          <td>${complaint.complaintId}</td>
          <td>${complaint.title}</td>
          <td>${complaint.customerEmail}</td>
          <td>${complaint.urgency}</td>
          <td>${new Date(complaint.createdAt).toLocaleString()}</td>
        </tr>
      `;
    });
    
    emailBody += `
      </table>
      <p>Please review these complaints in the system.</p>
    `;
    
    // Send email using SES
    const sendEmailCommand = new SendEmailCommand({
      Destination: {
        ToAddresses: [ADMIN_EMAIL],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: emailBody,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: emailSubject,
        },
      },
      Source: ADMIN_EMAIL, // Must be a verified email in SES
    });
    
    await sesClient.send(sendEmailCommand);
    console.log("Email sent successfully");
    
    // Update status of all complaints to RESOLVED
    for (const complaint of batchComplaints) {
      await db.update(complaints)
        .set({ status: "RESOLVED" })
        .where(eq(complaints.id, complaint.complaintId));
    }
    
    console.log("All complaints processed successfully");
  } catch (error) {
    console.error("Error processing normal complaints:", error);
    throw error; // Rethrow to trigger SQS retry
  }
};