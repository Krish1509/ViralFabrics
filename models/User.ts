import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, required: true },  // changed here
  password: String,
  role: { type: String, enum: ["superadmin", "user"], default: "user" }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
