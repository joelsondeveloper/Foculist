import mongoose, {Schema, Document, Types} from "mongoose";

export interface ITask extends Document {
    title: string;
    description: string;
    date: Date;
    status: string;
    userId: Types.ObjectId
  }

const TaskSchema = new Schema<ITask>({
    title: {
      type: String,
      required: true
    },
    description: String,
    date: Date,
    status: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  });
  
  export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);