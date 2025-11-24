// Shared TypeScript types for the Complaint Box application

export type Urgency = "URGENT" | "NORMAL";

export type ComplaintStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Complaint {
  id: number;
  customer_name: string;
  message: string;
  urgency: Urgency;
  status: ComplaintStatus;
  created_at: Date;
  updated_at: Date;
}

// The shape of data when creating a new complaint (no id, timestamps, or status yet)
export interface CreateComplaintInput {
  customer_name: string;
  message: string;
  urgency: Urgency;
}

// EventBridge event payload when a complaint is created
export interface ComplaintCreatedEvent {
  source: "com.store.complaints";
  "detail-type": "ComplaintCreated";
  detail: {
    complaintId: number;
    customerName: string;
    message: string;
    urgency: Urgency;
    status: ComplaintStatus;
    createdAt: string; // ISO 8601 timestamp
  };
}



