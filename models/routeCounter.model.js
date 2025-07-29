import mongoose, { Types } from "mongoose";

const routeCounterSchema = new mongoose.Schema({
  stationId: {
    type: Number,
    required: true,
  },
  stationName: {
    type: String,
    required: true,
  },
  lineShortName: {
    type: String,
    required: true,
  },
  lineLongName: {
    type: String,
    required: false,
  },
  agencyName: {
    type: String,
    required: false,
  },
  route_mkt: {
    type: Number,
    required: true,
  },
  counter: {
    type: Number,
    required: true,
    default: 1,
  },
  users: [{
    type: Types.ObjectId,
    ref: "users",
  }],
}, {
  timestamps: true,
});

// Compound index to ensure unique combinations of station and line
routeCounterSchema.index({ stationId: 1, route_mkt: 1 }, { unique: true });

const RouteCounter = mongoose.model("counter", routeCounterSchema);

export default RouteCounter; 