import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getClient, complaints, NewComplaint } from "@complaint-box/core/src/db/index.js";
import { eq } from "drizzle-orm";

// Handler for creating a new complaint
export const create: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const requestBody = JSON.parse(event.body);
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

    // Initialize database client
    const db = getClient();

    // Create new complaint
    const newComplaint: NewComplaint = {
      title,
      description,
      customerEmail,
      urgency: urgency || "NORMAL",
      status: "NEW",
    };

    // Insert complaint into database
    const result = await db.insert(complaints).values(newComplaint).returning();

    // Return success response
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Complaint created successfully",
        complaint: result[0],
      }),
    };
  } catch (error) {
    console.error("Error creating complaint:", error);
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to create complaint" }),
    };
  }
};

// Handler for getting all complaints
export const list: APIGatewayProxyHandlerV2 = async () => {
  try {
    // Initialize database client
    const db = getClient();

    // Query all complaints
    const result = await db.select().from(complaints).orderBy(complaints.createdAt);

    // Return success response
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error listing complaints:", error);
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to list complaints" }),
    };
  }
};

// Handler for getting a single complaint by ID
export const get: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const id = event.pathParameters?.id;
    
    if (!id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Complaint ID is required" }),
      };
    }

    // Initialize database client
    const db = getClient();

    // Query complaint by ID
    const result = await db.select().from(complaints).where(eq(complaints.id, parseInt(id)));

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Complaint not found" }),
      };
    }

    // Return success response
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    console.error("Error getting complaint:", error);
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to get complaint" }),
    };
  }
};
