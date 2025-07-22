import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// קריאת נתוני המסלולים מהקובץ
const routesDataPath = path.join(__dirname, '../data/routes_fetched.json');
let routesData = [];
let stationToLinesMap = new Map();

// טעינת הנתונים
function loadRoutesData() {
  try {
    const data = fs.readFileSync(routesDataPath, 'utf8');
    routesData = JSON.parse(data);
    console.log(`Loaded ${routesData.length} routes from routes_fetched.json`);
    buildStationToLinesMap();
  } catch (error) {
    console.error('Error loading routes data:', error);
    routesData = [];
  }
}

// בניית מיפוי תחנה -> קווים
function buildStationToLinesMap() {
  stationToLinesMap.clear();
  
  routesData.forEach((route) => {
    const { busLineId, stations } = route;
    
    // עבור כל תחנה במסלול, הוספת הקו לרשימת הקווים של התחנה
    stations.forEach((stationId) => {
      if (!stationToLinesMap.has(stationId)) {
        stationToLinesMap.set(stationId, new Set());
      }
      stationToLinesMap.get(stationId).add(busLineId);
    });
  });
  
  console.log(`Built station-to-lines mapping for ${stationToLinesMap.size} stations`);
}

// קבלת קווים לתחנה מסוימת
function getLinesForStation(stationId) {
  const numericStationId = parseInt(stationId);
  const lines = stationToLinesMap.get(numericStationId);
  return lines ? Array.from(lines) : [];
}

// קבלת מסלול לקו מסוים
function getRouteForLine(busLineId) {
  const route = routesData.find(r => r.busLineId === busLineId);
  return route ? route.stations : [];
}

// קבלת כל הנתונים
function getAllRoutesData() {
  return routesData;
}

// סטטיסטיקות
function getStats() {
  return {
    totalRoutes: routesData.length,
    totalStations: stationToLinesMap.size,
    averageLinesPerStation: stationToLinesMap.size > 0 ? 
      Array.from(stationToLinesMap.values()).reduce((sum, lines) => sum + lines.size, 0) / stationToLinesMap.size : 0
  };
}

// טעינה ראשונית
loadRoutesData();

export {
  getLinesForStation,
  getRouteForLine,
  getAllRoutesData,
  getStats,
  loadRoutesData
};
