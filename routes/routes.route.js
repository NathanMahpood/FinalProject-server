import { Types } from "mongoose";
import { Router } from "express";
import RouteModel from "../models/route.model.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { busLineId,  limit = 100, offset = 0 } = req.query;

    const filter = {};
    if (busLineId) {
      filter.busLineId = busLineId;
    }

    const routes = await RouteModel.find(filter)
      .limit(Number(limit))
      .skip(Number(offset));

    res.json({
      routes,
      count: routes.length,
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 400).json(error);
  }
});

router.get("/station/:id", async (req, res) => {
  try {
    const { id: stationId } = req.params;

    const routes = await RouteModel.find({
      stations: +stationId,
    }).populate("busLineId");

    res.json({
      routes,
      count: routes.length,
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 400).json(error);
  }
});

// GET /stations - return all unique station IDs from all routes
router.get('/stations', async (req, res) => {
  try {
    const routes = await RouteModel.find({});
    // Flatten all station arrays and get unique station IDs
    const allStationIds = routes.flatMap(route => route.stations || []);
    const uniqueStationIds = Array.from(new Set(allStationIds));
    res.json(uniqueStationIds);
  } catch (error) {
    console.error(error);
    res.status(error.status || 400).json(error);
  }
});

export default router;