import mongoose, {Schema, Document, Types} from "mongoose";

export interface ICategory extends Document {
    title: string;
    color: string;
    userId: Types.ObjectId;
    order: number
}

const CategorySchema = new Schema<ICategory>({
    title: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true,
        default: '#888'
    },
    userId: {
        type: Schema.Types.ObjectId ,
        ref: 'User',
        required: true
    },
    order: {
        type: Number,
        default: 0,
        required: true
    }
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);