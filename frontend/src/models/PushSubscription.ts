import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPushSubscription extends Document {
    userId: Types.ObjectId;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

const PushSubscriptionSchema: Schema<IPushSubscription> = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    endpoint: {
        type: String,
        required: true,
        unique: true,
    },
    keys: {
        p256dh: {
            type: String,
            required: true,
        },
        auth: {
            type: String,
            required: true,
        },
    },
}, {
    timestamps: true
});

PushSubscriptionSchema.index({ userId: 1 });

const PushSubscription: Model<IPushSubscription> = mongoose.models.PushSubscription || mongoose.model("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;