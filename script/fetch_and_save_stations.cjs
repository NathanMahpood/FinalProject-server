const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../stations_data.json');
const FAILED_IDS_FILE = path.join(__dirname, './failed_station_ids.json');
const RAW_RESULTS_FILE = path.join(__dirname, './raw_station_results.json');

function getStationId(station) {
  return station.id || station.station_id || station.gtfs_stop_id || station._id;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchStationDetail(id, index = 0) {
  try {
    console.log(`[${index}] Fetching station ID: ${id}`);
    const res = await axios.get(`https://open-bus-stride-api.hasadna.org.il/gtfs_stops/get?id=${id}`);
    
    if (res.data && res.data.ok !== false && Object.keys(res.data).length > 0) {
      return res.data;
    } else {
      console.warn(`❌ Invalid response for ID ${id}:`, res.data);
      return null;
    }
  } catch (err) {
    console.error(`❌ Error fetching ID ${id}:`, err.response?.status || err.message);
    return null;
  }
}

async function fetchAllStations() {
  try {
    // Step 1: Get all station IDs from your local API
    const response = await axios.get('http://localhost:3000/routes/stations');
    const allIds = response.data;
    console.log(`📊 Received ${allIds.length} station IDs from local DB`);

    // Step 2: Deduplicate the station IDs
    const beforeDeduplication = allIds.length;
    const uniqueIds = Array.from(new Set(allIds));
    const afterDeduplication = uniqueIds.length;
    
    console.log(`🔄 Deduplication results:`);
    console.log(`   Before: ${beforeDeduplication} IDs`);
    console.log(`   After:  ${afterDeduplication} IDs`);
    console.log(`   Removed: ${beforeDeduplication - afterDeduplication} duplicates`);
    
    if (beforeDeduplication !== afterDeduplication) {
      console.log(`✅ Successfully removed ${beforeDeduplication - afterDeduplication} duplicate station IDs`);
    } else {
      console.log(`ℹ️ No duplicates found - all IDs are unique`);
    }

    // Step 3: Fetch each unique station's full data with rate limiting
    const results = [];
    const failedIds = [];
    const rawResults = {};
    
    console.log(`🚀 Starting to fetch ${uniqueIds.length} unique station details...`);
    
    for (let i = 0; i < uniqueIds.length; i++) {
      const id = uniqueIds[i];
      
      const data = await fetchStationDetail(id, i + 1);
      rawResults[id] = data;

      if (data) {
        results.push(data);
      } else {
        failedIds.push(id);
      }

      // Pause after every 100 requests to avoid being rate limited
      if ((i + 1) % 100 === 0) {
        console.log(`⏸️ Pause after ${i + 1} requests to avoid rate limit...`);
        await delay(1000); // 1 second pause
      } else {
        await delay(100); // 100ms between requests
      }
    }

    console.log(`✅ Successfully fetched ${results.length} station details`);
    console.log(`❌ Failed to fetch ${failedIds.length} station IDs`);

    // Optional: Save failed IDs and raw results
    await fs.writeFile(FAILED_IDS_FILE, JSON.stringify(failedIds, null, 2));
    await fs.writeFile(RAW_RESULTS_FILE, JSON.stringify(rawResults, null, 2));

    // Step 4: Merge with existing data
    let mergedDetails = {};
    try {
      const existingRaw = await fs.readFile(DATA_FILE, 'utf-8');
      const existing = JSON.parse(existingRaw);
      for (const station of existing) {
        const id = getStationId(station);
        if (id) mergedDetails[id] = station;
      }
      console.log(`📁 Loaded ${Object.keys(mergedDetails).length} existing stations from file`);
    } catch (err) {
      console.log('📁 No existing stations_data.json found, starting fresh.');
    }

    for (const station of results) {
      const id = getStationId(station);
      if (id) mergedDetails[id] = station;
    }

    const mergedArray = Object.values(mergedDetails);
    console.log(`🔀 Merged total: ${mergedArray.length} unique stations`);

    // Step 5: Save merged result
    await fs.writeFile(DATA_FILE, JSON.stringify(mergedArray, null, 2), 'utf-8');
    console.log('💾 Saved all station details to stations_data.json');

    if (failedIds.length > 0) {
      console.warn(`⚠️ Still failed to fetch ${failedIds.length} stations. Check ${FAILED_IDS_FILE}`);
    }
  } catch (err) {
    console.error('💥 Unexpected error in script:', err);
  }
}

fetchAllStations();
