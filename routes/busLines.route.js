import express from 'express';
import BusRoute from '../models/busLines.model.js';

const router = express.Router();

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
    console.log(query);

    try {
        if (get_count === 'true') {
            const count = await BusRoute.countDocuments(query);
            return res.json(count);
        }

        const routes = await BusRoute.find(query)
            .sort({ route_short_name: 'asc' })
            .skip(parseInt(offset))
            .limit(parseInt(limit));

        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
