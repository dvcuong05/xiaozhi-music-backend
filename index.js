const express = require('express');
const https = require('https');
const ytdl = require('@distube/ytdl-core');
const YouTube = require('youtube-sr').default;

const app = express();
const PORT = process.env.PORT || 3000;

// Helper to resolve redirects and return final URL
function resolveRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) {
      return resolve(url);
    }
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Range': 'bytes=0-0',  // Request only 1 byte to trigger redirect
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 5000
    };
    
    https.request(options, (res) => {
      res.resume(); // Drain response
      
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : new URL(res.headers.location, url).href;
        resolveRedirects(nextUrl, maxRedirects - 1).then(resolve).catch(reject);
      } else {
        resolve(url);
      }
    }).on('error', () => resolve(url)).end();
  });
}

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
    endpoints: ['/search?q=song+name']
  });
});

// Search endpoint
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

    // Search YouTube
    const searchResults = await YouTube.searchOne(q, 'video');
    
    if (!searchResults) {
      throw new Error('No video found');
    }
    
    const videoUrl = `https://www.youtube.com/watch?v=${searchResults.id}`;
    const title = searchResults.title;
    
    console.log(`[${new Date().toISOString()}] Found: ${title} (${searchResults.id})`);
    
    // Get audio stream info (format 140 = M4A audio, 251 = WEBM Opus)
    const info = await ytdl.getInfo(videoUrl);
    const audioFormat = ytdl.chooseFormat(info.formats, { 
      quality: 'lowestaudio',
      filter: 'audioonly'
    });
    
    if (!audioFormat || !audioFormat.url) {
      throw new Error('No audio stream found');
    }
    
    console.log(`[${new Date().toISOString()}] Resolving redirects...`);
    
    // Resolve redirects to get final URL (without redirect_counter parameter)
    const finalUrl = await resolveRedirects(audioFormat.url);
    
    console.log(`[${new Date().toISOString()}] Success: ${audioFormat.container} ${audioFormat.audioBitrate}kbps`);
    console.log(`[${new Date().toISOString()}] Final URL length: ${finalUrl.length} chars`);

    res.json({
      success: true,
      title: title,
      url: finalUrl,  // Return resolved final URL
      format: audioFormat.mimeType || 'audio/mp4',
      source: 'youtube',
      quality: 'audio',
      bitrate: audioFormat.audioBitrate
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
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
