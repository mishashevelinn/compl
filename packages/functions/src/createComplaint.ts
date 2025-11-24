import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getClient, complaints, NewComplaint } from "../../core/src/db/index.js";
import { eq } from "drizzle-orm";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("Event received:", JSON.stringify(event, null, 2));
    
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const requestBody = JSON.parse(event.body);
    console.log("Request body:", requestBody);
    
    const { title, description, customerEmail, urgency } = requestBody;

    // Validate required fields
    if (!title || !description || !customerEmail) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: "Missing required fields", 
          requiredFields: ["title", "description", "customerEmail"] 
        }),
      };
    }

    // Log environment variables (without sensitive data)
    console.log("Environment variables:", {
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
    });

    // Initialize database client
    console.log("Initializing database client...");
    const db = getClient();
    console.log("Database client initialized");

    // Create new complaint with PENDING status
    const newComplaint: NewComplaint = {
      title,
      description,
      customerEmail,
      urgency: urgency || "NORMAL",
      status: "PENDING", // Set initial status to PENDING
    };

    console.log("Inserting complaint into database:", newComplaint);
    
    // Insert complaint into database
    const result = await db.insert(complaints).values(newComplaint).returning();
    const complaint = result[0];
    console.log("Complaint inserted:", complaint);

    // For now, immediately update the status to RESOLVED
    // (simulating the processing that would normally happen via EventBridge/SQS)
    await db.update(complaints)
      .set({ status: "RESOLVED" })
      .where(eq(complaints.id, complaint.id));
    
    console.log("Complaint status updated to RESOLVED");
    
    // Get the updated complaint
    const updatedResult = await db.select().from(complaints).where(eq(complaints.id, complaint.id));
    const updatedComplaint = updatedResult[0];

    // Return success response
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Complaint created successfully and processed",
        complaint: updatedComplaint,
      }),
    };
  } catch (error) {
    console.error("Error creating complaint:", error);
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to create complaint",
        details: error instanceof Error ? error.message : String(error)
      }),
    };
  }
};