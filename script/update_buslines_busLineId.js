import mongoose from "mongoose";
import BusLine from "../models/busLines.model.js";
import "../db/dbConnection.js";

// Paste your mappings here:
const mappings = [
  // Example:
  // { busLinesDocumentId: "6879043769cfd971e3e91e41", busLineIdToSet: "687909e7d910f61a421b957b" },
];

async function updateBusLineIds() {
  for (const { busLinesDocumentId, busLineIdToSet } of mappings) {
    try {
      const result = await BusLine.updateOne(
        { _id: busLinesDocumentId },
        { $set: { busLineId: busLineIdToSet } }
      );
      if (result.modifiedCount === 1) {
        console.log(`Successfully updated busLines ${busLinesDocumentId} with busLineId ${busLineIdToSet}`);
      } else if (result.matchedCount === 1) {
        console.log(`busLines ${busLinesDocumentId} already had the correct busLineId.`);
      } else {
        console.error(`No busLines document found with _id = ${busLinesDocumentId}`);
      }
    } catch (err) {
      console.error(`Error updating busLinesDocumentId ${busLinesDocumentId}:`, err.message);
    }
  }
  mongoose.connection.close();
}

updateBusLineIds(); 