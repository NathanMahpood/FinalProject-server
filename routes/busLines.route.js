import express from 'express';
import BusRoute from '../models/busLines.model.js';

const router = express.Router();

// New endpoint for driver search
router.get('/driver-search', async (req, res) => {
    const { busCompany, busRouteNumber, cityName } = req.query;

    if (!busCompany || !busRouteNumber || !cityName) {
        return res.status(400).json({ 
            message: "All three parameters are required: busCompany, busRouteNumber, cityName" 
        });
    }

    try {
        // Build query to search for matching bus lines
        const query = {
            agency_name: { $regex: busCompany, $options: 'i' },
            route_short_name: { $regex: busRouteNumber, $options: 'i' },
            // Look for city name with dashes on both sides: -cityName-
            route_long_name: { $regex: `-${cityName}-`, $options: 'i' }
        };

        console.log('Driver search query:', query);

        const routes = await BusRoute.find(query)
            .limit(100)
            .lean();

        // Sort routes numerically by route_short_name
        const sortedRoutes = routes.sort((a, b) => {
            const aNum = parseInt(a.route_short_name) || 0;
            const bNum = parseInt(b.route_short_name) || 0;
            return aNum - bNum;
        });

        const processedRoutes = sortedRoutes.map(route => ({
            _id: route._id,
            id: route.id,
            route_short_name: route.route_short_name,
            route_long_name: route.route_long_name,
            agency_name: route.agency_name,
            operator_ref: route.operator_ref,
            route_type: route.route_type,
            route_mkt: route.route_mkt,
            route_direction: route.route_direction,
            route_alternative: route.route_alternative,
            date: route.date,
            line_ref: route.line_ref
        }));

        console.log(`Found ${processedRoutes.length} matching bus lines for driver search`);
        
        res.json({
            count: processedRoutes.length,
            routes: processedRoutes
        });

    } catch (err) {
        console.error('Error in driver search:', err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    const {
        id,
        operator_refs,
        route_short_name,
        route_long_name,
        agency_name,
        limit = 100,
        offset = 0,
        get_count = 'false'
    } = req.query;

    const query = {};

    if (operator_refs) {
        // The model uses 'operator_ref', not 'operator_refs'
        query.operator_ref = { $in: operator_refs.split(',').map(n=>+n) };
    }

    if (route_short_name) {
        query.route_short_name = new RegExp(route_short_name, 'i');
    }

    if (id) {
        query.id = new RegExp(id, 'i');
    }

    if (route_long_name) {
        query.route_long_name = new RegExp(route_long_name, 'i');
    }

    if (agency_name) {
        query.agency_name = new RegExp(agency_name, 'i');
    }
    console.log('BusLines query:', query);

    try {
        if (get_count === 'true') {
            const count = await BusRoute.countDocuments(query);
            return res.json(count);
        }

        const routes = await BusRoute.find(query)
            .sort({ route_short_name: 'asc' })
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .lean(); // Convert to plain JavaScript objects

        // Ensure _id is included and log sample data
        const processedRoutes = routes.map(route => ({
            _id: route._id,
            id: route.id,
            route_short_name: route.route_short_name,
            route_long_name: route.route_long_name,
            agency_name: route.agency_name,
            operator_ref: route.operator_ref,
            route_type: route.route_type,
            route_mkt: route.route_mkt,
            route_direction: route.route_direction,
            route_alternative: route.route_alternative,
            date: route.date,
            line_ref: route.line_ref
        }));

        console.log(`Returning ${processedRoutes.length} bus lines`);
        if (processedRoutes.length > 0) {
            console.log('Sample bus line:', {
                _id: processedRoutes[0]._id,
                route_short_name: processedRoutes[0].route_short_name,
                agency_name: processedRoutes[0].agency_name
            });
        }

        res.json(processedRoutes);
    } catch (err) {
        console.error('Error in busLines route:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
