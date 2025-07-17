import { Router } from "express";
import UserModel from "../models/user.model.js";
import {
  validateAdmin,
  validateToken,
} from "../middlewares/tokenValidation.js";

const router = Router();

router.get("/", validateToken, validateAdmin, async (req, res) => {
  const users = await UserModel.find();
  res.json(users);
});

export default router;
