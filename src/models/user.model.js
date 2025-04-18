import { Schema, mongoose } from "mongoose";

const UserSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    avatar: String,
    coverImage: String,
    watchHistory: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refereshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const  User = mongoose.model("User",UserSchema)