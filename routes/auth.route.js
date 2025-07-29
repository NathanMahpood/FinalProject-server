import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Router } from "express";
import UserModel from "../models/user.model.js";
import { validateToken } from "../middlewares/tokenValidation.js";

const router = Router();

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if driver is approved
    if (user.role === "driver" && user.status !== "approved") {
      return res.status(401).json({ 
        message: "Your driver account is pending approval. Please contact the administrator." 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, "secret", {
      expiresIn: "24h",
    });

    user.password = "********";
    res.json({ user, token });
  } catch (err) {
    res.status(400).json(err);
  }
});

// SIGNUP ROUTE
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Set status based on role
    let status = "approved"; // Default for passengers
    if (role === "driver") {
      status = "pending"; // Drivers need approval
    }

    // Include confirmPassword in the constructor so virtual setter works
    const user = new UserModel({
      name,
      email,
      password,
      role: role || "passenger",
      status,
    });

    await user.validate();

    user.password = await bcrypt.hash(password, 10);

    // Save user to DB
    await user.save();

    // Hide hashed password in response
    user.password = "********";

    // Return appropriate message based on role
    if (role === "driver") {
      res.status(201).json({
        ...user.toObject(),
        message: "Driver account created successfully. Please wait for admin approval before logging in."
      });
    } else {
      res.status(201).json(user);
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }

    if (err.name === "ValidationError") {
      return res.status(422).json({ message: err.message });
    }

    res.status(400).json(err);
  }
});

// GET PENDING DRIVERS (Admin only)
router.get("/pending-drivers", validateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const pendingDrivers = await UserModel.find({ 
      role: "driver", 
      status: "pending" 
    }).select("-password");

    res.json(pendingDrivers);
  } catch (err) {
    res.status(400).json(err);
  }
});

// APPROVE/REJECT DRIVER (Admin only)
router.put("/approve-driver/:driverId", validateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { driverId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'" });
    }

    const driver = await UserModel.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (driver.role !== "driver") {
      return res.status(400).json({ message: "User is not a driver" });
    }

    driver.status = action === "approve" ? "approved" : "rejected";
    await driver.save();

    driver.password = "********";
    res.json({
      message: `Driver ${action}d successfully`,
      driver
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

// TOKEN VALIDATION ROUTE
router.get("/validate", validateToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    user.password = "********";
    res.json(user);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(400).json(err);
  }
});

export default router;
