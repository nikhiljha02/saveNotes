import "dotenv/config";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../JWT/jwt.js";
import user from "../database/userSchema.js";

export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

export async function refreshAccessFromCookie(req, res) {
  const refreshToken = req.cookies.keepNotesRefresh;

  if (!refreshToken) {
    return null;
  }

  try {
    const refreshData = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET,
    );

    if (!refreshData.id) {
      return null;
    }

    const loggedUser = await user.findOne({
      _id: refreshData.id,
      refreshToken,
      loggedIn: true,
    });

    if (!loggedUser) {
      return null;
    }

    const accessToken = generateAccessToken({ id: loggedUser._id });

    res.cookie("keepNotesAccess", accessToken, accessTokenCookieOptions);

    return loggedUser;
  } catch {
    return null;
  }
}

export default async function authenticateToken(req, res, next) {
  const token = req.cookies.keepNotesAccess;

  if (token) {
    try {
      const tokenData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      if (tokenData.id) {
        req.user = tokenData.id;
        return next();
      }
    } catch {
      // Fall through to refresh-token recovery below.
    }
  }

  const refreshedUser = await refreshAccessFromCookie(req, res);

  if (!refreshedUser) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.user = refreshedUser._id;
  return next();
}
