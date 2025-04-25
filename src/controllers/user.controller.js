import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiErrors.js";
import User from "../models/user.model.js";
import cloudinaryUploader from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
// login setup
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
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body();

  if (!username || !email || !password) {
    throw new ApiError(400, "username or password is required");
  }

  const userexist = await User.findOne({
    $or: [{ username, email }],
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
  throw new ApiError(401,error?.message|| "Invalid refersh token")
 }
});

export { registerUser, loginUser, loggedOutUser,refreshAccessToken };
