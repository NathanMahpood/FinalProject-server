import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name must be at most 50 characters"],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
    match: [/.+@.+\..+/, "Please enter a valid email address"],
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    maxlength: [128, "Password must be at most 128 characters"],
    validate: {
      validator: function (v) {
        return (
          /[0-9]/.test(v) &&
          /[A-Z]/.test(v) &&
          /[a-z]/.test(v) &&
          /[^A-Za-z0-9]/.test(v)
        );
      },
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    },
  },
  role: {
    type: String,
    enum: ["passenger", "driver", "admin"],
    default: "passenger",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  image: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.virtual("confirmPassword")
  .get(function () {
    return this._confirmPassword;
  })
  .set(function (value) {
    this._confirmPassword = value;
  });

const UserModel = mongoose.model("users", userSchema);
export default UserModel;
