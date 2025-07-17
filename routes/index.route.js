import { Router } from "express";
import userRoute from "./user.route.js";
import authRoute from "./auth.route.js";
import Logger from "../utils/Logger.js";

const router = Router();

router.use("/", (req, res, next) => {
  Logger.info(`${req.method} ${req.url}`);
  next();
});

router.get("/health", (req, res) => {
  res.json({
    message: "ok",
  });
});

router.use("/users", userRoute);
router.use("/auth", authRoute);

export default router;
