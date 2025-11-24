import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getClient, complaints } from "../../core/src/db/index.js";

export const handler: APIGatewayProxyHandlerV2 = async () => {
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