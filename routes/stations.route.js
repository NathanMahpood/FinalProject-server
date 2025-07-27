import { Router } from "express";
import StationModel from "../models/station.model.js";

const router = Router();

router.get("/", async (req, res) => {
  const { lat, lon, name, city, code, limit = 100, offset = 0 } = req.query;

  const filter = {};

  if (lat) {
    filter.lat = { $gte: lat - 0.01, $lte: lat + 0.01 };
  }
  if (lon) {
    filter.lon = { $gte: lon - 0.01, $lte: lon + 0.01 };
  }
  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }
  if (city) {
    filter.city = { $regex: city, $options: "i" };
  }
  if (code) {
    filter.code = { $regex: code, $options: "i" };
  }

  const stations = await StationModel.find(filter)
    .limit(Number(limit))
    .skip(Number(offset));

  res.json({
    stations,
    count: stations.length,
  });
});

export default router;
