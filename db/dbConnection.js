import mongoose from "mongoose";
import { MONGO_URL } from "../env.config.js";

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("mongo connected");
  })
  .catch((err) => {
    console.log(err);
  });
