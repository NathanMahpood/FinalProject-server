import { Router } from "express";
import RouteModel from "../models/route.model.js";

const router = Router();

router.get("/", async (req, res) => {
  const routes = await RouteModel.find();
  res.json(routes);
});

export default router;
