import mongoose, { Schema } from "mongoose";

export interface IUser extends mongoose.Document {
    name: string;
    email: string;
    password?: string;
    emailVerified: Date;
    image: string;
    plan: string;
    stripeCustomerId: string;
    subscriptionId: string;
    subscriptionEndDate: Date;
}

const UserSchema = new Schema<IUser>({
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      select: false
    },
    emailVerified: {
      type: Date,
      default: null
    },
    image: {
      type: String,
      default: ''
    },
    plan: {
      type: String,
      default: 'free'
    },
    stripeCustomerId: {
      type: String,
      default: ''
    },
    subscriptionId: {
      type: String,
      default: ''
    },
    subscriptionEndDate: {
      type: Date,
      default: null
    }
  });
  
  export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);