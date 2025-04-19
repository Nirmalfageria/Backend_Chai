import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiErrors.js";
import User from "../models/user.model.js"
import cloudinaryUploader from "../utils/cloudinary.js"
import ApiResponse from "../utils/apiResponse.js"


const registerUser = asyncHandler(async (req, res) => {
  const [fullName, userName, email, password] = req.body();
  console.log(email);

  if (
    [fullName, userName, email, password].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "all the fields are required");
  }

  // finding the user is new or old

  const existedUser = User.findOne({
    $or:[{userName,email}]
  })

  // id user is there throw a error
  if(existedUser){
    throw new ApiError(409,"user already existed")
  }
});

// keeping the file to the local using the multer
const avatarLocalPath =  req.files?.avatar[0]?.path
const coverImageLocalPath = req.files?.coverImage[0]?.path

if(!avatarLocalPath){
    throw new ApiError(409,"avatar is required")
}

//upload to the cloudinary

const avatar  = await cloudinaryUploader(avatarLocalPath)
const coverImage = await cloudinaryUploader(avatarLocalPath)

if(!avatar){
    throw new ApiError(409,"avatar is required")
}

 const user = await User.create({
    fullName,
    userName:userName.toLowerCase(),
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password
})

const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!userCreated){
    throw new ApiError(500 ,"something went wrong while creating registering the user")
}

return res.status(201).json({
    new ApiResponse(200 ,userCreated,"user created successfully")
})

export default registerUser;
