const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Free MP3 radio stations (always available, no auth needed)
const RADIO_STATIONS = {
  'chill': 'https://streams.ilovemusic.de/iloveradio17.mp3', // Chill
  'pop': 'https://streams.ilovemusic.de/iloveradio2.mp3',    // Pop hits
  'dance': 'https://streams.ilovemusic.de/iloveradio3.mp3',  // Dance
  'rock': 'https://streams.ilovemusic.de/iloveradio8.mp3',   // Rock
  'lofi': 'https://streams.lofiradio.com/lofi',               // Lo-fi beats
};

// CORS for ESP32
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Xiaozhi Music API',
    endpoints: ['/search?q=genre', '/stations'],
    stations: Object.keys(RADIO_STATIONS)
  });
});

// List available stations
app.get('/stations', (req, res) => {
  res.json({
    success: true,
    stations: RADIO_STATIONS
  });
});

// Search endpoint - maps keywords to radio stations
app.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing query parameter: q' 
    });
  }

  try {
    console.log(`[${new Date().toISOString()}] Searching: ${q}`);

    const query = q.toLowerCase();
    let station = 'chill'; // default
    let title = 'Chill Music Radio';

    // Simple keyword matching
    if (query.includes('pop') || query.includes('hit')) {
      station = 'pop';
      title = 'Pop Hits Radio';
    } else if (query.includes('dance') || query.includes('edm') || query.includes('party')) {
      station = 'dance';
      title = 'Dance Music Radio';
    } else if (query.includes('rock') || query.includes('metal')) {
      station = 'rock';
      title = 'Rock Music Radio';
    } else if (query.includes('lofi') || query.includes('study') || query.includes('relax')) {
      station = 'lofi';
      title = 'Lo-fi Beats Radio';
    }

    console.log(`[${new Date().toISOString()}] Found: ${title} (${station})`);

    res.json({
      success: true,
      title: title,
      videoId: station,
      streamUrl: `/stream/${station}`
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stream endpoint - proxies radio stream
app.get('/stream/:station', async (req, res) => {
  const { station } = req.params;

  const streamUrl = RADIO_STATIONS[station];
  
  if (!streamUrl) {
    return res.status(404).json({ 
      success: false, 
      error: 'Station not found' 
    });
  }

  try {
    console.log(`[${new Date().toISOString()}] Streaming: ${station} -> ${streamUrl}`);

    // Proxy radio stream
    https.get(streamUrl, (streamRes) => {
      if (streamRes.statusCode !== 200) {
        console.error(`[${new Date().toISOString()}] Radio returned: ${streamRes.statusCode}`);
        return res.status(500).json({ success: false, error: 'Stream unavailable' });
      }
      
      // Copy headers
      res.setHeader('Content-Type', streamRes.headers['content-type'] || 'audio/mpeg');
      
      streamRes.pipe(res);
      
      streamRes.on('error', (err) => {
        console.error(`[${new Date().toISOString()}] Stream error:`, err.message);
      });
    }).on('error', (err) => {
      console.error(`[${new Date().toISOString()}] HTTPS error:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 Xiaozhi Music API running on port ${PORT}`);
});
