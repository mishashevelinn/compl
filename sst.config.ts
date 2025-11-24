/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "complaint-box",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    // --- DATABASE SECRET ---
    // This stores the PostgreSQL connection string.
    // Set it using: npx sst secret set DATABASE_URL "postgresql://user:pass@host:5432/dbname"
    const databaseUrl = new sst.Secret("DATABASE_URL");

    // --- EVENT BUS ---
    // Create an EventBridge event bus for complaints
    const eventBus = new sst.aws.Bus("ComplaintEventBus");

    // --- QUEUE ---
    // Create an SQS queue for normal complaints with batching
    const normalComplaintsQueue = new sst.aws.Queue("NormalComplaintsQueue", {
      consumer: {
        function: {
          handler: "packages/functions/src/processNormalComplaints.handler",
          environment: {
            DATABASE_URL: databaseUrl.value,
          },
          permissions: [
            // Allow the function to send emails via SES
            {
              actions: ["ses:SendEmail", "ses:SendRawEmail"],
              resources: ["*"],
            },
          ],
        },
        cdk: {
          eventSource: {
            batchSize: 10, // Process up to 10 messages at once
            maxBatchingWindow: 60, // Wait up to 60 seconds to accumulate messages
          },
        },
      },
    });

    // --- EVENT RULES ---
    // Route normal complaints to SQS directly from the bus
    eventBus.subscribeQueue("NormalComplaintsSubscription", normalComplaintsQueue, {
      pattern: {
        source: ["com.store.complaints"],
        detailType: ["ComplaintCreated"],
        detail: {
          urgency: ["NORMAL"],
        },
      },
    });

    // --- API FUNCTIONS ---
    // Create separate functions for each API operation
    
    // Function for creating a complaint
    const createComplaintFunction = new sst.aws.Function("CreateComplaint", {
      handler: "packages/functions/src/createComplaint.handler",
      environment: {
        DATABASE_URL: databaseUrl.value,
        EVENT_BUS_NAME: eventBus.name,
      },
      permissions: [
        // Allow the function to put events on the EventBridge bus
        {
          actions: ["events:PutEvents"],
          resources: [eventBus.arn],
        },
      ],
      url: true,
    });

    // Function for listing all complaints
    const listComplaintsFunction = new sst.aws.Function("ListComplaints", {
      handler: "packages/functions/src/listComplaints.handler",
      environment: {
        DATABASE_URL: databaseUrl.value,
      },
      url: true,
    });

    // Function for getting a complaint by ID
    const getComplaintFunction = new sst.aws.Function("GetComplaint", {
      handler: "packages/functions/src/getComplaint.handler",
      environment: {
        DATABASE_URL: databaseUrl.value,
      },
      url: true,
    });

    // Output the API URLs and other resources
    return {
      createComplaintUrl: createComplaintFunction.url,
      listComplaintsUrl: listComplaintsFunction.url,
      getComplaintUrl: getComplaintFunction.url,
      eventBusName: eventBus.name,
      eventBusArn: eventBus.arn,
    };
  },
});