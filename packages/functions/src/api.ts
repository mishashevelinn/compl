import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getClient, complaints, NewComplaint } from "@complaint-box/core/src/db/index.js";
import { eq } from "drizzle-orm";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Initialize database client
  const db = getClient();
  
  try {
    // Handle different routes based on HTTP method and path
    const path = event.rawPath;
    const method = event.requestContext.http.method;
    const pathParams = event.pathParameters || {};
    
    // POST /api/complaints - Create a new complaint
    if (method === "POST" && path === "/api/complaints") {
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
    }
    
    // GET /api/complaints - List all complaints
    if (method === "GET" && path === "/api/complaints") {
      // Query all complaints
      const result = await db.select().from(complaints).orderBy(complaints.createdAt);

      // Return success response
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    }
    
    // GET /api/complaints/{id} - Get a single complaint by ID
    if (method === "GET" && path.match(/^\/api\/complaints\/\d+$/)) {
      const id = pathParams.id;
      
      if (!id) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Complaint ID is required" }),
        };
      }

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
    }
    
    // Route not found
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Route not found" }),
    };
    
  } catch (error) {
    console.error("API Error:", error);
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
