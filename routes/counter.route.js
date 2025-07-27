import { Router } from "express";
import CounterModel from "../models/counter.model.js";
import mongoose from "mongoose";

const router = Router();

// GET - קבלת ספירות לפי קו ותחנה
router.get("/", async (req, res) => {
  try {
    const { line, station, limit = 100, offset = 0 } = req.query;

    const filter = {};
    if (line) {
      filter.line = line;
    }
    if (station) {
      filter.station = station;
    }

    const counters = await CounterModel.find(filter)
      .populate("line")
      .populate("station")
      .limit(Number(limit))
      .skip(Number(offset))
      .sort({ counter: -1 });

    res.json({
      counters,
      count: counters.length,
    });
  } catch (error) {
    console.error("Error fetching counters:", error);
    res.status(500).json({
      message: "שגיאה בשליפת הספירות",
      error: error.message,
    });
  }
});

// GET - קבלת ספירה ספציפית לפי קו ותחנה
router.get("/:lineId/:stationId", async (req, res) => {
  try {
    const { lineId, stationId } = req.params;

    const counter = await CounterModel.findOne({
      line: lineId,
      station: stationId,
    })
      .populate("line")
      .populate("station");

    if (!counter) {
      return res.status(404).json({
        message: "לא נמצאה ספירה עבור קו ותחנה זו",
        counter: null,
      });
    }

    res.json({
      counter,
    });
  } catch (error) {
    console.error("Error fetching specific counter:", error);
    res.status(500).json({
      message: "שגיאה בשליפת הספירה",
      error: error.message,
    });
  }
});

// POST - הוספת משתמש לספירה (או יצירת ספירה חדשה)
router.post("/increment", async (req, res) => {
  try {
    const { lineId, stationId, userId } = req.body;

    if (!lineId || !stationId || !userId) {
      return res.status(400).json({
        message: "חסרים פרמטרים נדרשים: lineId, stationId, userId",
      });
    }

    // בדיקה אם הספירה כבר קיימת
    let counter = await CounterModel.findOne({
      line: lineId,
      station: stationId,
    });

    if (counter) {
      // בדיקה אם המשתמש כבר קיים ברשימה
      const userExists = counter.users.some(
        (user) => user.userId.toString() === userId
      );
      if (userExists) {
        return res.status(400).json({
          message: "המשתמש כבר דיווח שהוא בתחנה הזו עבור הקו הזה.",
        });
      }
      // הוספת המשתמש והגדלת הספירה
      counter.users.push({ userId: userId });
      counter.counter = counter.users.length;
      await counter.save();
    } else {
      // יצירת ספירה חדשה
      counter = new CounterModel({
        line: lineId,
        station: stationId,
        counter: 1,
        users: [{ userId: userId }],
      });
      await counter.save();
    }

    res.json({
      message: "הדיווח התקבל בהצלחה!",
      counterId: counter._id,
    });
  } catch (error) {
    console.error("Error incrementing counter:", error);
    res.status(500).json({
      message: "שגיאה בעדכון הספירה",
      error: error.message,
    });
  }
});

// DELETE - הסרת משתמש מספירה
router.delete("/decrement", async (req, res) => {
  try {
    const { lineId, stationId, userId } = req.body;

    if (!lineId || !stationId || !userId) {
      return res.status(400).json({
        message: "חסרים פרמטרים נדרשים: lineId, stationId, userId",
      });
    }

    const counter = await CounterModel.findOne({
      line: lineId,
      station: stationId,
    });

    if (!counter) {
      return res.status(404).json({
        message: "לא נמצאה ספירה עבור קו ותחנה זו",
      });
    }

    // הסרת המשתמש מהרשימה
    counter.users = counter.users.filter(
      (user) => user.userId.toString() !== userId
    );
    counter.counter = counter.users.length;

    // אם אין יותר משתמשים, מחיקת הספירה
    if (counter.users.length === 0) {
      await CounterModel.findByIdAndDelete(counter._id);
      return res.json({
        message: "הספירה נמחקה (אין יותר משתמשים)",
        counter: null,
      });
    }

    await counter.save();
    const populatedCounter = await CounterModel.findById(counter._id)
      .populate("line")
      .populate("station")
      .populate("users.userId");

    res.json({
      message: "המשתמש הוסר מהספירה",
      counter: populatedCounter,
    });
  } catch (error) {
    console.error("Error decrementing counter:", error);
    res.status(500).json({
      message: "שגיאה בהסרת המשתמש מהספירה",
      error: error.message,
    });
  }
});

export default router;
