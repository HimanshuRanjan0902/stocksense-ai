import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    default: undefined
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    default: undefined
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    default: undefined
  },
  authProvider: {
    type: String,
    enum: ["password", "google", "phone", "google+phone"],
    default: "password"
  },
  password: {
    type: String,
    minlength: 8,
    select: false
  }
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
