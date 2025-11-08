import mongoose, {Schema, Document, Types} from "mongoose";

export interface ITask extends Document {
    title: string;
    description: string;
    status: string;
    userId: Types.ObjectId
    dueDate?: Date | null;
    priority: 'low' | 'medium' | 'high';
    isCompleted: boolean
  }

const TaskSchema = new Schema<ITask>({
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dueDate: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }, { timestamps: true });
  
  export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);