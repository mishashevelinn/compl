import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getClient, complaints } from "../../core/src/db/index.js";
import { eq } from "drizzle-orm";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Get ID from path parameters or query parameters
    // This handles both API Gateway paths and Lambda Function URL query params
    const id = event.pathParameters?.id || event.queryStringParameters?.id;
    
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