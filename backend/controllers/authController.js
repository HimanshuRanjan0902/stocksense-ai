import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import RevokedToken from "../models/RevokedToken.js";
import { verifyFirebaseIdToken } from "../config/firebaseAdmin.js";

const generateToken = (userId) => jwt.sign(
  { id: userId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email || null,
  phoneNumber: user.phoneNumber || null,
  authProvider: user.authProvider
});

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Please provide name, email and password" });
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") return res.status(400).json({ success: false, message: "Invalid input" });
    if (name.trim().length < 2 || name.trim().length > 50) return res.status(400).json({ success: false, message: "Name must be between 2 and 50 characters" });
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ success: false, message: "Please provide a valid email" });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ success: false, message: "An account with this email already exists" });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, authProvider: "password" });
    return res.status(201).json({ success: true, message: "Account created successfully", token: generateToken(user._id), user: publicUser(user) });
  } catch (error) {
    console.error("Registration error:", error.message);
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Email is already registered" });
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || typeof email !== "string" || typeof password !== "string") return res.status(400).json({ success: false, message: "Please provide valid email and password" });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: "Invalid email or password" });
    return res.status(200).json({ success: true, message: "Login successful", token: generateToken(user._id), user: publicUser(user) });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== "string") return res.status(400).json({ success: false, message: "Firebase ID token is required" });

    const decoded = await verifyFirebaseIdToken(idToken);
    const firebaseUid = decoded.uid;
    const email = decoded.email ? decoded.email.trim().toLowerCase() : undefined;
    const phoneNumber = decoded.phone_number || undefined;
    const provider = decoded.firebase?.sign_in_provider;
    const authProvider = provider === "google.com" ? "google" : provider === "phone" ? "phone" : null;

    if (!authProvider || (authProvider === "google" && !decoded.email_verified)) {
      return res.status(401).json({ success: false, message: "Unsupported or unverified Firebase sign-in provider" });
    }
    if (!email && !phoneNumber) return res.status(400).json({ success: false, message: "Firebase account must contain a verified email or phone number" });

    let user = await User.findOne({ firebaseUid });
    if (!user && email) user = await User.findOne({ email });
    if (!user && phoneNumber) user = await User.findOne({ phoneNumber });

    if (user) {
      user.firebaseUid = firebaseUid;
      if (email && !user.email) user.email = email;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (user.authProvider === "password") user.authProvider = authProvider;
      else if (user.authProvider !== authProvider) user.authProvider = "google+phone";
      if (!user.name || user.name === "StockSense User") user.name = decoded.name || email?.split("@")[0] || phoneNumber;
      await user.save();
    } else {
      user = await User.create({
        name: (decoded.name || email?.split("@")[0] || phoneNumber || "StockSense User").slice(0, 50),
        ...(email ? { email } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
        firebaseUid,
        authProvider
      });
    }

    return res.status(200).json({ success: true, message: "Firebase sign-in successful", token: generateToken(user._id), user: publicUser(user) });
  } catch (error) {
    console.error("Firebase authentication error:", error.message);
    if (error.code === 11000) return res.status(409).json({ success: false, message: "This email or phone number is already linked to another account" });
    return res.status(401).json({ success: false, message: "Firebase authentication failed. Please sign in again." });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Authentication token missing" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await RevokedToken.findOneAndUpdate({ tokenHash }, { tokenHash, expiresAt: new Date(decoded.exp * 1000) }, { upsert: true, returnDocument: "after" });
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
