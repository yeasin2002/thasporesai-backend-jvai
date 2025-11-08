// MongoDB initialization script
// This script runs when MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB("jobsphere");

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "role"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
        role: {
          enum: ["customer", "contractor", "admin"],
        },
      },
    },
  },
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });

// Create other collections
db.createCollection("jobs");
db.jobs.createIndex({ customerId: 1 });
db.jobs.createIndex({ contractorId: 1 });
db.jobs.createIndex({ status: 1 });
db.jobs.createIndex({ createdAt: -1 });

db.createCollection("notifications");
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ isRead: 1 });

db.createCollection("fcmtokens");
db.fcmtokens.createIndex({ userId: 1 });
db.fcmtokens.createIndex({ token: 1 }, { unique: true });

db.createCollection("messages");
db.messages.createIndex({ conversationId: 1, createdAt: -1 });
db.messages.createIndex({ senderId: 1 });
db.messages.createIndex({ receiverId: 1 });

db.createCollection("conversations");
db.conversations.createIndex({ participants: 1 });
db.conversations.createIndex({ updatedAt: -1 });

print("MongoDB initialization completed successfully");
