import mongoose, {Schema, Document, Types} from "mongoose";

export interface ITask extends Document {
    title: string;
    description: string;
    status: string;
    userId: Types.ObjectId
    dueDate?: Date | null;
    priority?: 'low' | 'medium' | 'high';
    isCompleted: boolean
    order: number
    isPriorityManual: boolean
  }

  export interface ITaskClient {
  _id: string;
  title: string;
  description: string;
  status: string;
  userId: string;
  dueDate?: Date | null;
  priority?: "low" | "medium" | "high";
  isCompleted: boolean;
  order: number;
  isPriorityManual: boolean
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
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0,
      required: true
    },
    isPriorityManual: {
      type: Boolean,
      default: false,
      required: true
    }
  }, { timestamps: true });
  
  export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);