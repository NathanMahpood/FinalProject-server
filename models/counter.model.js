import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  line: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "busLines",
    required: true
  },
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "stations",
    required: true
  },
  counter: {
    type: Number,
    default: 0
  },
  users: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    }
  }]
}, {
  timestamps: true
});

// יצירת אינדקס ייחודי לקו ותחנה
counterSchema.index({ line: 1, station: 1 }, { unique: true });

const CounterModel = mongoose.model("Counter", counterSchema);

export default CounterModel;
