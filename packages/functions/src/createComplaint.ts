import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getClient, complaints, NewComplaint } from "../../core/src/db/index.js";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

// Initialize EventBridge client
const eventBridgeClient = new EventBridgeClient({});

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
      EVENT_BUS_NAME_SET: !!process.env.EVENT_BUS_NAME,
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

    // Prepare complaint data for EventBridge
    const complaintData = {
      complaintId: complaint.id,
      title: complaint.title,
      description: complaint.description,
      customerEmail: complaint.customerEmail,
      urgency: complaint.urgency,
      status: complaint.status,
      createdAt: complaint.createdAt,
    };

    // Get the EventBridge bus name from environment variables
    const eventBusName = process.env.EVENT_BUS_NAME;
    
    if (!eventBusName) {
      console.error("EVENT_BUS_NAME environment variable is not set");
      throw new Error("EventBus name not configured");
    }
    
    console.log("Sending event to EventBridge:", eventBusName);
    
    // Send event to EventBridge
    const putEventsCommand = new PutEventsCommand({
      Entries: [
        {
          EventBusName: eventBusName,
          Source: "com.store.complaints",
          DetailType: "ComplaintCreated",
          Detail: JSON.stringify(complaintData),
        },
      ],
    });
    
    const response = await eventBridgeClient.send(putEventsCommand);
    console.log("Event sent to EventBridge:", response);

    // Return success response
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Complaint created successfully and sent for processing",
        complaint,
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