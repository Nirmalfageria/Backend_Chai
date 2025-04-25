import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
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
export default router;
