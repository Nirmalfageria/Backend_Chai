import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiErrors.js";
import User from "../models/user.model.js";
import cloudinaryUploader from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await user.findById(userId);

    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();

    //save the token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating the access and refersh token"
    );
  }
};
// login setup
const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body();

  if (!(userName || email)) {
    throw new ApiError(400, "username or password is required");
  }

  const userexist = await User.findOne({
    $or: [{ userName, email }],
  });
  if (!userexist) {
    throw new ApiError(400, "user not found");
  }

  // use user (use small u beacuse this is user that we create in the UserSchema and there we define the our own methods and these are not mongoose methods so we can not access them by User so use user)

  const ispasswordValid = await userexist.isPasswordCorrect(password);

  if (!ispasswordValid) {
    throw new ApiError(400, "password id wrong");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    userexist._id
  );

  const loggedInUser = User.findById(userexist._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user looged in successfully"
      )
    );
});
//logout method
const loggedOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "user looged out suuessfully"));
});
const registerUser = asyncHandler(async (req, res) => {
  // 1. Destructure request body
  const { fullName, userName, email, password } = req.body;

  // 2. Validate required fields
  if ([fullName, userName, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // 3. Check for existing user
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // 4. Handle file uploads
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  // check first avatar is there or not and then [0] means url is there or not
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // 5. Upload to Cloudinary
  const avatar = await cloudinaryUploader(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await cloudinaryUploader(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  // 6. Create user
  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
  });

  // 7. Fetch created user without sensitive data
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 8. Return success response❤️
  return res
    .status(201)
    .json(new ApiResponse(201, userCreated, "User created successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = cookies.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "Unathuorised request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invaild Token");
    }

    if (incomingToken !== user?.refreshToken) {
      throw new ApiError(402, "Refresh Token is experied or Invalid");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user?._id
    );

    res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", newRefreshToken)
      .json(
        new ApiResponse(
          200,

          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refersh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});
const updateUser = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "all fields are required");
  }

  const user = await User.findById(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "please upload the files");
  }
  const avatar = await cloudinaryUploader(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(
      500,
      "error while uploading the avatar on the cloudinary"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: avatar.url },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const getChannelDetails = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(400, "username is required");
  }
  //pipelines of the mongoDB
  const channel = await User.aggregate([
    {
      $match: {
        userName: userName.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Chennel details fetched successfully")
    );
});
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistroy",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                    userName: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, user[0].watcHistroy, "WatchHistory fetched successfully"));
});
export {
  registerUser,
  loginUser,
  loggedOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUser,
  updateAvatar,
  getChannelDetails,
};
