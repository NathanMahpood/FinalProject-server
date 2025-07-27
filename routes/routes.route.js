import { Types } from "mongoose";
import { Router } from "express";
import RouteModel from "../models/route.model.js";
import StationModel from "../models/station.model.js";

const router = Router();

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

// נתיב חדש להחזרת המסלול הראשון של קו מסוים עם populate על התחנות
router.get("/line/:busLineId", async (req, res) => {
  try {
    const { busLineId } = req.params;

    // מחפש את המסלול הראשון של הקו הספציפי
    const firstRoute = await RouteModel.findOne({
      busLineId: busLineId,
    }).populate("busLineId");

    if (!firstRoute) {
      return res.status(404).json({
        message: "לא נמצא מסלול עבור קו זה",
        route: null,
      });
    }

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
    console.error("שגיאה בשליפת המסלול הראשון:", error);
    res.status(error.status || 500).json({
      message: "שגיאה בשליפת המסלול הראשון",
      error: error.message,
    });
  }
});

export default router;
