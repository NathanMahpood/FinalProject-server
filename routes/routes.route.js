import { Router } from "express";
import RouteModel from "../models/route.model.js";
import StationModel from "../models/station.model.js";
import mongoose from "mongoose";

const router = Router();

// Debug list all routes
router.get("/", async (req, res) => {
  try {
    const { busLineId, limit = 100, offset = 0 } = req.query;
    const filter = {};
    if (busLineId) {
      filter.busLineId = busLineId;
    }

    const routes = await RouteModel.find(filter)
      .limit(Number(limit))
      .skip(Number(offset));

    console.log("Fetched routes:", routes.length);
    res.json({ routes, count: routes.length });
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

// Get all unique station IDs
router.get("/stations", async (req, res) => {
  try {
    const routes = await RouteModel.find({});
    const allStationIds = routes.flatMap(route => route.stations || []);
    const uniqueStationIds = Array.from(new Set(allStationIds));
    console.log("Unique station IDs found:", uniqueStationIds.length);
    res.json(uniqueStationIds);
  } catch (error) {
    console.error("Error fetching stations:", error);
    res.status(500).json({ error: "Failed to fetch stations" });
  }
});

// Get all routes for a specific station ID with detailed populate debug
router.get("/station/:id", async (req, res) => {
  try {
    const param = req.params.id;
    const stationId = isNaN(Number(param)) ? param : Number(param);
    console.log("Received station ID param:", param);
    console.log("Parsed stationId for query:", stationId, typeof stationId);

    // Find routes and populate busLineId with selected fields for better debug
    const routes = await RouteModel.find({
      stations: { $in: [stationId] }
    }).populate("busLineId", "route_short_name route_long_name route_desc agency_name");

    console.log("Routes found for station ID:", routes.length);

    // Detailed debug for each route's populated busLineId
    routes.forEach((route, i) => {
      const busLine = route.busLineId;
      console.log(`\nRoute ${i + 1} (${route._id}):`);
      console.log("  Stations count:", route.stations?.length || 0);
      if (!busLine || typeof busLine !== "object" || !busLine.route_short_name) {
        console.warn("  ❌ busLineId not populated or missing expected fields");
        console.log("  busLineId raw value:", route.busLineId);
      } else {
        console.log("  ✅ Populated busLineId:");
        console.log("    route_short_name:", busLine.route_short_name);
        console.log("    route_long_name:", busLine.route_long_name);
        console.log("    agency_name:", busLine.agency_name);
        console.log("    route_desc:", busLine.route_desc);
      }
    });

    res.json({ routes, count: routes.length });
  } catch (error) {
    console.error("Error in /station/:id:", error);
    res.status(500).json({ error: "Failed to fetch routes for station" });
  }
});

// Get first route of a specific bus line
router.get("/line/:busLineId", async (req, res) => {
  try {
    const { busLineId } = req.params;
    console.log("Looking for first route with busLineId:", busLineId);

    const firstRoute = await RouteModel.findOne({ busLineId }).populate("busLineId");

    if (!firstRoute) {
      return res.status(404).json({ message: "No route found for this bus line", route: null });
    }

    console.log("First route found:", firstRoute._id);

    const stationsWithDetails = await Promise.all(
      (firstRoute.stations || []).map(async (stationId) => {
        try {
          const station = await StationModel.findOne({ id: stationId });
          return station;
        } catch (err) {
          console.error(`Error fetching station ${stationId}:`, err);
          return null;
        }
      })
    );

    res.json({
      _id: firstRoute._id,
      busLineId: firstRoute.busLineId,
      stations: stationsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching first route:", error);
    res.status(500).json({ message: "Error fetching first route", error: error.message });
  }
});

export default router;
