import { Document, Schema } from 'mongoose';

// Define the User interface for TypeScript typing
export interface User {
  name: string;
  email: string;
  age: number;
  createdAt: Date;
}

// Extend Document to get Mongoose document methods
export interface UserDocument extends User, Document {}

// Create the traditional Mongoose schema
export const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: 'users',
  },
);

// Add instance methods (optional)
// UserSchema.methods.getFullInfo = function () {
//   return `${this.name} (${this.email}) - Age: ${this.age}`;
// };

// Add static methods (optional)
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};
