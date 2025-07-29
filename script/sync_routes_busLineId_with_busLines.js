import mongoose from "mongoose";
import BusLine from "../models/busLines.model.js";
import Route from "../models/route.model.js";
import "../db/dbConnection.js";

async function syncBusLineIds() {
  try {
    // Fetch all busLines and routes, sorted by _id
    const busLines = await BusLine.find({}).sort({ _id: 1 });
    const routes = await Route.find({}).sort({ _id: 1 });

    if (busLines.length !== routes.length) {
      console.error(`Mismatch: busLines (${busLines.length}) and routes (${routes.length}) count differ!`);
      mongoose.connection.close();
      return;
    }

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const busLine = busLines[i];
      if (!route.busLineId || String(route.busLineId) !== String(busLine._id)) {
        const result = await Route.updateOne(
          { _id: route._id },
          { $set: { busLineId: busLine._id } }
        );
        if (result.modifiedCount === 1) {
          console.log(`Updated route ${route._id} busLineId to ${busLine._id}`);
        } else if (result.matchedCount === 1) {
          console.log(`Route ${route._id} already had the correct busLineId.`);
        } else {
          console.error(`No route found with _id = ${route._id}`);
        }
      } else {
        console.log(`Route ${route._id} already has correct busLineId.`);
      }
    }
  } catch (err) {
    console.error("Error during sync:", err.message);
  }
  mongoose.connection.close();
}

syncBusLineIds(); 