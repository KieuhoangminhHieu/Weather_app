// Express static server + simple proxy for OpenWeatherMap
const express = require('express');
const path = require('path');
const https = require('https');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const OWM_KEY = process.env.OWM_API_KEY;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

// Simple in-memory cache to reduce requests and protect API key usage
const cache = {}; // { key: { statusCode, data, ts } }
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    delete cache[key];
    return null;
  }
  return { statusCode: entry.statusCode, data: entry.data };
}

function setCached(key, statusCode, data) {
  cache[key] = { statusCode, data, ts: Date.now() };
}

function proxyGet(url, res, cacheKey) {
  const cached = getCached(cacheKey);
  if (cached) {
    return res.status(cached.statusCode).json(cached.data);
  }

  https.get(url, (apiRes) => {
    let body = '';
    apiRes.on('data', (chunk) => body += chunk);
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        setCached(cacheKey, apiRes.statusCode, parsed);
        res.status(apiRes.statusCode).json(parsed);
      } catch (err) {
        res.status(502).json({ error: 'Bad gateway', details: err.message });
      }
    });
  }).on('error', (err) => {
    res.status(502).json({ error: err.message });
  });
}

if (!OWM_KEY) {
  console.warn('Warning: OWM_API_KEY not found in environment. /api routes will return errors until it is set.');
}

// Proxy endpoints
app.get('/api/weather', (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: 'Missing city parameter' });
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`;
  const cacheKey = `weather:city:${city}`;
  proxyGet(url, res, cacheKey);
});

app.get('/api/forecast', (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: 'Missing city parameter' });
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`;
  const cacheKey = `forecast:city:${city}`;
  proxyGet(url, res, cacheKey);
});

// Coordinate-based endpoints
app.get('/api/weather/coords', (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat or lon' });
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${OWM_KEY}&units=metric`;
  const cacheKey = `weather:coords:${lat}:${lon}`;
  proxyGet(url, res, cacheKey);
});

app.get('/api/forecast/coords', (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat or lon' });
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${OWM_KEY}&units=metric`;
  const cacheKey = `forecast:coords:${lat}:${lon}`;
  proxyGet(url, res, cacheKey);
});

app.listen(port, () => {
  console.log(`🌐 Server running at http://localhost:${port}`);
});