import mongoose, { Types } from "mongoose";

const routeSchema = new mongoose.Schema({
  busLineId: {
    type: Types.ObjectId,
    ref: "busLines",
    required: true,
  },
  stations: {
    type: Array,
    required: true,
  },
});

const RouteModel = mongoose.model("routes", routeSchema);

export default RouteModel;
