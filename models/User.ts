import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, required: true },  // changed here
  password: String,
  phoneNumber: { type: String, required: false },
  address: { type: String, required: false },
  role: { type: String, enum: ["superadmin", "user"], default: "user" }
}, { timestamps: true });

// Add some debugging
console.log('UserSchema fields:', Object.keys(UserSchema.paths));
console.log('UserSchema phoneNumber:', UserSchema.path('phoneNumber'));
console.log('UserSchema address:', UserSchema.path('address'));

export default mongoose.models.User || mongoose.model("User", UserSchema);
