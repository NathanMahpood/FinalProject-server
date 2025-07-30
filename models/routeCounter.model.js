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
  routeDirection: {
    type: String,
    required: false,
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

// Compound index to ensure unique combinations of station, line, and direction
routeCounterSchema.index({ stationId: 1, route_mkt: 1, routeDirection: 1 }, { unique: true });

const RouteCounter = mongoose.model("counter", routeCounterSchema);

export default RouteCounter; 