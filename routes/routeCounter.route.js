import express from 'express';
import RouteCounter from '../models/routeCounter.model.js';
import { validateToken } from '../middlewares/tokenValidation.js';

const router = express.Router();

// Function to ensure the collection has the correct indexes
async function ensureCorrectIndexes() {
  try {
    // Drop any old indexes that might conflict
    const indexes = await RouteCounter.collection.getIndexes();
    console.log('Current indexes:', Object.keys(indexes));
    
    // Drop old indexes if they exist
    if (indexes['line_1_station_1']) {
      console.log('Dropping old index: line_1_station_1');
      await RouteCounter.collection.dropIndex('line_1_station_1');
    }
    if (indexes['stationId_1_lineShortName_1']) {
      console.log('Dropping old index: stationId_1_lineShortName_1');
      await RouteCounter.collection.dropIndex('stationId_1_lineShortName_1');
    }
    if (indexes['stationId_1_lineLongName_1']) {
      console.log('Dropping old index: stationId_1_lineLongName_1');
      await RouteCounter.collection.dropIndex('stationId_1_lineLongName_1');
    }
    
    // Ensure the correct index exists
    await RouteCounter.collection.createIndex({ stationId: 1, route_mkt: 1 }, { unique: true });
    console.log('Created correct index: stationId_1_route_mkt_1');
  } catch (error) {
    console.error('Error ensuring correct indexes:', error);
  }
}

// Call this when the route is first loaded
ensureCorrectIndexes();

// POST /route-counter - Increment route counter
router.post('/', validateToken, async (req, res) => {
  try {
    const { stationId, stationName, lineShortName, routeLongName, agencyName, route_mkt } = req.body;
    const userId = req.user.id; // From token validation middleware - token stores it as 'id', not '_id'

    // Convert route_mkt to number if it's a string
    const route_mkt_num = Number(route_mkt);
    
    console.log('Received route counter request:', { stationId, stationName, lineShortName, route_mkt, route_mkt_num, userId });
    console.log('User ID from token:', userId, 'Type:', typeof userId);

    if (!stationId || !stationName || !lineShortName || !route_mkt) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: stationId, stationName, lineShortName, route_mkt" 
      });
    }

    // Check if a document with the same station and line already exists
    const existingCounter = await RouteCounter.findOne({
      stationId: stationId,
      route_mkt: route_mkt_num
    });

    if (existingCounter) {
      // Increment counter and add user if not already present
      const updateData = {
        $inc: { counter: 1 }
      };

      // Only add user to users array if not already present
      if (!existingCounter.users.includes(userId)) {
        updateData.$push = { users: userId };
      }

      const updatedCounter = await RouteCounter.findByIdAndUpdate(
        existingCounter._id,
        updateData,
        { new: true }
      );

      console.log(`Updated route counter for station ${stationName}, line ${lineShortName}. New count: ${updatedCounter.counter}`);
      
      return res.json({
        success: true,
        message: "Route counter updated successfully",
        counter: updatedCounter.counter,
        usersCount: updatedCounter.users.length
      });
    } else {
      // Create new document
      console.log('Creating new RouteCounter document:', { stationId, stationName, lineShortName, route_mkt_num });
      
      const newCounter = new RouteCounter({
        stationId: stationId,
        stationName: stationName,
        lineShortName: lineShortName,
        routeLongName: routeLongName,
        agencyName: agencyName,
        route_mkt: route_mkt_num,
        counter: 1,
        users: [userId]
      });

      try {
        await newCounter.save();
        console.log(`Created new route counter for station ${stationName}, line ${lineShortName}, route_mkt: ${route_mkt_num}`);
        return res.json({
          success: true,
          message: "New route counter created successfully",
          counter: 1,
          usersCount: 1
        });
      } catch (err) {
        console.error('Error creating new RouteCounter:', err);
        // Handle duplicate key error (race condition)
        if (err.code === 11000) {
          // Document already exists, update it instead
          console.error('Duplicate key error: trying to update existing RouteCounter', { stationId, route_mkt_num });
          
          // Log all documents with this stationId to see what's actually in the DB
          const allDocsWithStation = await RouteCounter.find({ stationId: stationId });
          console.log('All docs with this stationId:', allDocsWithStation);
          
          const updatedCounter = await RouteCounter.findOneAndUpdate(
            { stationId: stationId, route_mkt: route_mkt_num },
            {
              $inc: { counter: 1 },
              $addToSet: { users: userId }
            },
            { new: true }
          );
          if (!updatedCounter) {
            console.error('RouteCounter not found for update after duplicate key error:', { stationId, route_mkt_num });
            console.error('Available docs with this stationId:', allDocsWithStation.map(doc => ({ stationId: doc.stationId, route_mkt: doc.route_mkt })));
            return res.status(404).json({
              success: false,
              message: 'RouteCounter not found for update after duplicate key error'
            });
          }
          return res.json({
            success: true,
            message: "Route counter updated after duplicate key error",
            counter: updatedCounter.counter,
            usersCount: updatedCounter.users.length
          });
        } else {
          throw err;
        }
      }
    }
  } catch (error) {
    console.error("Error in route counter:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// GET /route-counter/station - Get route counter for specific station and route
router.get('/station', async (req, res) => {
  try {
    const { stationId, route_mkt } = req.query;
    
    if (!stationId || !route_mkt) {
      return res.status(400).json({
        success: false,
        message: "stationId and route_mkt are required"
      });
    }

    // Convert route_mkt to number if it's a string
    const route_mkt_num = Number(route_mkt);
    
    console.log('Fetching route counter for:', { stationId, route_mkt, route_mkt_num });

    const counter = await RouteCounter.findOne({
      stationId: stationId,
      route_mkt: route_mkt_num
    });

    if (!counter) {
      // Return default data if no counter exists
      return res.json({
        success: true,
        counter: 0,
        usersCount: 0,
        shouldStop: false
      });
    }

    res.json({
      success: true,
      counter: counter.counter,
      usersCount: counter.users.length,
      shouldStop: counter.counter > 0
    });
  } catch (error) {
    console.error("Error fetching route counter for station:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// GET /route-counter - Get route counters (optional, for admin purposes)
router.get('/', async (req, res) => {
  try {
    const counters = await RouteCounter.find({})
      .sort({ counter: -1 })
      .limit(100);

    res.json({
      success: true,
      counters: counters
    });
  } catch (error) {
    console.error("Error fetching route counters:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

export default router; 