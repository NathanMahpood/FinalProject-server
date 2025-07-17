import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Router } from "express";
import UserModel from "../models/user.model.js";
import { validateToken } from "../middlewares/tokenValidation.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const payload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, "secret", {
      expiresIn: "24h",
    });
    user.password = "********";
    res.json({
      user,
      token,
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role: role || "passenger",
    });
    await user.save();
    user.password = "********";
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    if (err.name === "ValidationError") {
      return res.status(422).json({
        message: err.message,
      });
    }

    res.status(400).json(err);
  }
});

router.get("/validate", validateToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    user.password = "********";
    res.json(user);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    }
    res.status(400).json(err);
  }
});

export default router;
