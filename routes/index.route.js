import { Router } from "express";
import userRoute from "./user.route.js";
import authRoute from "./auth.route.js";
import stationsRoute from "./stations.route.js";
import routesRoute from "./routes.route.js";
import Logger from "../utils/Logger.js";
import busRoutes from "./busLines.route.js";


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
router.use('/bus-lines', busRoutes);
router.use("/stations", stationsRoute);
router.use("/routes", routesRoute);

export default router;
