import { Schema, mongoose } from "mongoose";

const VideoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // by the cloudnary
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: boolen,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default Video = mongoose.model("Video", VideoSchema);
