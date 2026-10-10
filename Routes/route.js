import { Router } from "express";
import user from "../database/userSchema.js";
import { loginUser, signupUser } from "../zodLayer.js";
import { generateAccessToken, generateRefreshToken } from "../JWT/jwt.js";
// import cookieParser from "cookie-parser";
import authenticateToken, {
  accessTokenCookieOptions,
  refreshAccessFromCookie,
} from "../middleware/authCheck.js";
import "dotenv/config";

const router = Router();

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

// user registration route
router.post("/register", async (req, res) => {
  let result = signupUser.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(result.error.flatten());
  }
  let { firstName, lastName, email, password } = result.data;

  let existingUser = await user.findOne({ email });
  if (existingUser) {
    // throw new Error(`user With this ${email} is already registered`);
    return res.status(409).json({
      message: "Email already registered",
    });
  }
  let newUser = await user.create({ firstName, lastName, email, password });

  let accessToken = generateAccessToken({ id: newUser._id });
  let refreshToken = generateRefreshToken({ id: newUser._id });

  newUser.refreshToken = refreshToken;
  newUser.loggedIn = true;
  await newUser.save();

  res.cookie("keepNotesAccess", accessToken, {
    ...accessTokenCookieOptions,
  });

  res.cookie("keepNotesRefresh", refreshToken, {
    ...refreshTokenCookieOptions,
  });

  res.status(201).json({
    message: "registration successful",
    fullName: `${firstName} ${lastName}`,
  });
});

// user login route
router.post("/login", async (req, res) => {
  let result = loginUser.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(result.error.flatten());
  }
  let { email, password } = result.data;

  let loggedUser = await user.findOne({ email }).select("+password");
  if (!loggedUser) {
    loggedUser;
    // throw new Error(`user With this ${email} is already registered`);
    return res.status(404).json({
      message: "Email Not registered",
    });
  }

  let checkPass = await loggedUser.comparePassword(password);
  if (!checkPass) {
    return res
      .status(401)
      .json({ message: "login credentials invalid check email or password" });
  }

  let accessToken = generateAccessToken({ id: loggedUser._id });
  let refreshToken = generateRefreshToken({ id: loggedUser._id });

  loggedUser.refreshToken = refreshToken;
  loggedUser.loggedIn = true;
  await loggedUser.save();

  res.cookie("keepNotesAccess", accessToken, {
    ...accessTokenCookieOptions,
  });

  res.cookie("keepNotesRefresh", refreshToken, {
    ...refreshTokenCookieOptions,
  });

  res.status(200).json({
    user: `${loggedUser.firstName} ${loggedUser.lastName}`,
  });
});

router.get("/logout", async (req, res) => {
  const refreshToken = req.cookies.keepNotesRefresh;

  res.clearCookie("keepNotesAccess", accessTokenCookieOptions);
  res.clearCookie("keepNotesRefresh", refreshTokenCookieOptions);

  const loggedUser = refreshToken
    ? await user.findOne({ refreshToken })
    : null;

  if (loggedUser) {
    loggedUser.loggedIn = false;
    loggedUser.refreshToken = "";
    await loggedUser.save();
  }
  res.status(200).json({ message: "logout successful" });
});

router.get("/refresh", async (req, res) => {
  const refreshedUser = await refreshAccessFromCookie(req, res);

  if (!refreshedUser) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  res.status(200).json({
    message: "Access token refreshed",
    user: `${refreshedUser.firstName} ${refreshedUser.lastName}`,
  });
});

router.get("/getMe", authenticateToken, async (req, res) => {
  let userData = await user.findOne({ _id: req.user });
  // let userData = user.findOne({req})
  if (!userData) {
    return res.status(404).json({ message: "User not found" });
  }
  // console.log(userData);
  res.status(200).json({
    userName: `${userData.firstName} ${userData.lastName}`,
    loggedIn: userData.loggedIn,
  });
});

export default router;
