import { Router } from "express";
import {
  changeCurrentPassword,
  getChannelDetails,
  getCurrentUser,
  getWatchHistory,
  registerUser,
  updateAvatar,
  updateUser,
} from "../controllers/user.controller.js";
import {
  loginUser,
  loggedOutUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),

  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, loggedOutUser);
router.route("/refersh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/get-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateUser);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
// we get the data from the params from the params in the chnnel details function
router.route("/channel/:userName").get(verifyJWT, getChannelDetails);
router.route("/history").get(verifyJWT, getWatchHistory);
export default router;
