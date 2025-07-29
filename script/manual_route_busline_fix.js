import mongoose from "mongoose";
import Route from "../models/route.model.js";
import "../db/dbConnection.js";

// Paste your mappings here:
const mappings = [
  // Example:
  // { routeId: "687e0e5f69cfd971e3e929de", busLineId: "687909e7d910f61a421b957b" },
];

async function fixMappings() {
  for (const { routeId, busLineId } of mappings) {
    try {
      // Update the routes document's busLineId directly
      const result = await Route.updateOne(
        { _id: routeId },
        { $set: { busLineId: busLineId } }
      );
      if (result.modifiedCount === 1) {
        console.log(`Successfully updated route ${routeId} to busLineId ${busLineId}`);
      } else if (result.matchedCount === 1) {
        console.log(`Route ${routeId} already had the correct busLineId.`);
      } else {
        console.error(`No route found with _id = ${routeId}`);
      }
    } catch (err) {
      console.error(`Error updating routeId ${routeId}:`, err.message);
    }
  }
  mongoose.connection.close();
}

fixMappings(); 