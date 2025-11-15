import mongoose, { Schema } from "mongoose";
import Category from "./Category";
import Task from "./Task";
import Account from "./Account";

export interface IUser extends mongoose.Document {
    name: string;
    email: string;
    password?: string;
    emailVerified: Date;
    image: string;
    plan: 'free' | 'premium';
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
      enum: ['free', 'premium'],
      default: 'free',
      required: true
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

  UserSchema.pre<IUser>('deleteOne', { document: true, query: false }, async function(next) {
    const user = this as IUser;
    console.log(`🟡 Executando middleware pre-deleteOne para User ${user._id}`);

    try {
      
      await Category.deleteMany({ userId: user._id });
      await Task.deleteMany({ userId: user._id });
      await Account.deleteMany({ userId: user._id });

      next();

    } catch (error) {
      console.error(`🔴 Erro ao executar middleware pre-deleteOne para User ${user._id}: ${error}`);
      next(new Error(`Erro ao executar middleware pre-deleteOne para User ${user._id}: ${error}`));
    }
  });
  
  export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);