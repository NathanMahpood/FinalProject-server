import mongoose from 'mongoose';

// Using a non-strict schema for read-only purposes
const busRouteSchema = new mongoose.Schema({}, { strict: false });

const BusRoute = mongoose.model('busLines', busRouteSchema);

export default BusRoute;
