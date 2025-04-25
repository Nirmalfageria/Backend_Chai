import mongoose from "mongoose";
import Schema from "mongoose";
// import User from "./user.model";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      typeof: Schema.Types.ObjectId,
      ref: User,
    },
    channels: {
      typeof: Schema.Types.ObjectId,
        ref: User,
    },
  },
  {
    timestamps: true,
  }
);

export default Subscription = mongoose.model(
  "Subscription",
  subscriptionSchema
);
