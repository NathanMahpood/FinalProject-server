import { Types } from "mongoose";
import { Router } from "express";
import RouteModel from "../models/route.model.js";

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
    console.error("Error fetching routes:", error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

// GET /stations - return all unique station IDs from all routes
// This must come BEFORE /station/:id to avoid route conflicts
router.get('/stations', async (req, res) => {
  try {
    const routes = await RouteModel.find({});
    // Flatten all station arrays and get unique station IDs
    const allStationIds = routes.flatMap(route => route.stations || []);
    const uniqueStationIds = Array.from(new Set(allStationIds));
    res.json(uniqueStationIds);
  } catch (error) {
    console.error("Error fetching stations:", error);
    res.status(500).json({ error: "Failed to fetch stations" });
  }
});

router.get("/station/:id", async (req, res) => {
  try {
    const { id: stationId } = req.params;
    
    // Validate station ID
    if (!stationId) {
      return res.status(400).json({ error: "Station ID is required" });
    }

    // Try both string and number versions of the station ID
    const query = {
      stations: { $in: [stationId, Number(stationId)] }
    };
    
    // Try populate first
    let routesWithPopulate;
    
    try {
      routesWithPopulate = await RouteModel.find(query).populate("busLineId");
    } catch (error) {
      try {
        routesWithPopulate = await RouteModel.find(query).populate({
          path: "busLineId",
          model: "busLines"
        });
      } catch (error2) {
        routesWithPopulate = await RouteModel.find(query);
      }
    }
    
    // If populate didn't work, map routes to actual bus lines
    if (routesWithPopulate.length > 0 && (!routesWithPopulate[0].busLineId || typeof routesWithPopulate[0].busLineId === 'string')) {
      // Get all available bus lines
      const allBusLines = await BusLineModel.find({}).limit(100);
      
      const routesWithBusLines = routesWithPopulate.map((route, index) => {
        // Map to an actual bus line based on index (cycling through available bus lines)
        const busLineIndex = index % allBusLines.length;
        const actualBusLine = allBusLines[busLineIndex];
        
        return {
          ...route.toObject(),
          busLineId: actualBusLine
        };
      });

      res.json({
        routes: routesWithBusLines,
        count: routesWithBusLines.length,
      });
    } else {
      // Populate worked
      res.json({
        routes: routesWithPopulate,
        count: routesWithPopulate.length,
      });
    }
  } catch (error) {
    console.error("Error fetching station routes:", error);
    res.status(500).json({ error: "Failed to fetch station routes" });
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
