const express = require('express');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

// Helper to make HTTPS requests with redirect support
function httpsGet(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 3) {
      return reject(new Error('Too many redirects'));
    }
    
    https.get(url, { timeout: 8000 }, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        const location = res.headers.location;
        if (location) {
          return httpsGet(location, redirectCount + 1).then(resolve).catch(reject);
        }
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
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

    // Try Piped API first (more stable)
    const pipedInstances = [
      'pipedapi.kavin.rocks',
      'api-piped.mha.fi',
      'pipedapi.adminforge.de'
    ];
    
    for (const instance of pipedInstances) {
      try {
        console.log(`[${new Date().toISOString()}] Trying Piped: ${instance}...`);
        
        const searchUrl = `https://${instance}/search?q=${encodeURIComponent(q)}&filter=videos`;
        const searchResults = await httpsGet(searchUrl);
        
        if (!searchResults || !searchResults.items || searchResults.items.length === 0) {
          continue;
        }
        
        const video = searchResults.items[0];
        const videoId = video.url?.replace('/watch?v=', '');
        const title = video.title;
        
        if (!videoId) continue;
        
        console.log(`[${new Date().toISOString()}] Found: ${videoId} - ${title}`);
        
        const streamUrl = `https://${instance}/streams/${videoId}`;
        const streamData = await httpsGet(streamUrl);
        
        // Find audio stream
        const audioStream = streamData.audioStreams?.find(s => 
          s.format === 'WEBMA_OPUS' || s.format === 'M4A'
        ) || streamData.audioStreams?.[0];
        
        if (audioStream && audioStream.url) {
          console.log(`[${new Date().toISOString()}] Success via Piped ${instance}: ${title}`);
          
          return res.json({
            success: true,
            title: title,
            url: audioStream.url,
            format: audioStream.mimeType || 'audio/webm',
            source: 'piped',
            quality: 'audio'
          });
        }
      } catch (err) {
        console.log(`[${new Date().toISOString()}] Piped ${instance} failed: ${err.message}`);
        continue;
      }
    }

    // Fallback to Invidious API
    const invidiousInstances = [
      'invidious.io.lol',
      'inv.tux.pizza',
      'invidious.privacyredirect.com',
      'yt.artemislena.eu',
      'invidious.slipfox.xyz'
    ];
    
    let lastError = null;
    
    // Try multiple instances for reliability
    for (const instance of invidiousInstances) {
      try {
        console.log(`[${new Date().toISOString()}] Trying ${instance}...`);
        
        // Search for video
        const searchUrl = `https://${instance}/api/v1/search?q=${encodeURIComponent(q)}&type=video`;
        const videos = await httpsGet(searchUrl);
        
        if (!videos || videos.length === 0) {
          lastError = `${instance}: No results`;
          continue;
        }
        
        const videoId = videos[0].videoId;
        const title = videos[0].title;
        
        console.log(`[${new Date().toISOString()}] Found video: ${videoId} - ${title}`);
        
        // Get audio stream URL
        const videoUrl = `https://${instance}/api/v1/videos/${videoId}`;
        const videoData = await httpsGet(videoUrl);
        
        // Find audio-only stream (format itag 251 = Opus, 140 = AAC)
        const audioStream = videoData.adaptiveFormats?.find(f => 
          f.type?.startsWith('audio/') && (f.itag === 251 || f.itag === 140)
        ) || videoData.adaptiveFormats?.find(f => f.type?.startsWith('audio/'));
        
        if (audioStream && audioStream.url) {
          console.log(`[${new Date().toISOString()}] Success via ${instance}: ${title}`);
          console.log(`[${new Date().toISOString()}] URL: ${audioStream.url.substring(0, 80)}...`);

          return res.json({
            success: true,
            title: title,
            url: audioStream.url,
            format: audioStream.type || 'audio/webm',
            source: 'invidious',
            quality: 'audio'
          });
        } else {
          lastError = `${instance}: No audio stream found`;
        }
      } catch (err) {
        lastError = `${instance}: ${err.message}`;
        console.log(`[${new Date().toISOString()}] ${lastError}`);
        continue;
      }
    }
    
    throw new Error(`All instances failed (Piped + Invidious). Last: ${lastError}`);

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
