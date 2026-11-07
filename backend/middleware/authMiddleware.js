
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import User from "../models/User.js";
import RevokedToken from "../models/RevokedToken.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login."
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const revokedToken = await RevokedToken.findOne({ tokenHash });

    if (revokedToken) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again."
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists."
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again."
    });
  }
};
