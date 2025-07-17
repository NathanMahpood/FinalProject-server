import mongoose, { Types } from "mongoose";

const stationSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  code: {
    type: Number,
    required: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lon: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
});

const StationModel = mongoose.model("stations", stationSchema);

export default StationModel;
