import mongoose, {Schema} from "mongoose";

const VerificationTokenSchema = new Schema({
    identifier: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expires: {
        type: Date,
        required: true
    }
});

export default mongoose.models.VerificationToken || mongoose.model('VerificationToken', VerificationTokenSchema);