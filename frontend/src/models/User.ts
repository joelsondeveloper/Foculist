import mongoose, { Schema } from "mongoose";

export interface IUser extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    emailVerified: Date;
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
      required: true,
      select: false
    },
    emailVerified: {
      type: Date,
      default: null
    },
  });
  
  export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);