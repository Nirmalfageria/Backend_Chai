import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiErrors.js";
import User from "../models/user.model.js";
import cloudinaryUploader from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // 1. Destructure request body
  const { fullName, userName, email, password } = req.body;

  // 2. Validate required fields
  if ([fullName, userName, email, password].some(field => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // 3. Check for existing user
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // 4. Handle file uploads
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

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
    password
  });

  // 7. Fetch created user without sensitive data
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 8. Return success response
  return res.status(201).json(
    new ApiResponse(201, userCreated, "User created successfully")
  );
});

export default registerUser;