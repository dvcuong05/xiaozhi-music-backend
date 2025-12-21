const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

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

    // Use Invidious API - no cookies required, no yt-dlp needed
    // Public instances: https://api.invidious.io/instances.json
    const invidiousInstances = [
      'https://invidious.io.lol',
      'https://inv.tux.pizza',
      'https://invidious.privacyredirect.com'
    ];
    
    let searchResults = null;
    let audioUrl = null;
    
    // Try multiple instances for reliability
    for (const instance of invidiousInstances) {
      try {
        // Search for video
        const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(q)}&type=video`;
        const searchResponse = await fetch(searchUrl, { timeout: 10000 });
        
        if (!searchResponse.ok) continue;
        
        const videos = await searchResponse.json();
        if (!videos || videos.length === 0) continue;
        
        const videoId = videos[0].videoId;
        const title = videos[0].title;
        
        // Get audio stream URL
        const videoUrl = `${instance}/api/v1/videos/${videoId}`;
        const videoResponse = await fetch(videoUrl, { timeout: 10000 });
        
        if (!videoResponse.ok) continue;
        
        const videoData = await videoResponse.json();
        
        // Find audio-only stream (format itag 251 = Opus, 140 = AAC)
        const audioStream = videoData.adaptiveFormats?.find(f => 
          f.type?.startsWith('audio/') && (f.itag === 251 || f.itag === 140)
        ) || videoData.adaptiveFormats?.find(f => f.type?.startsWith('audio/'));
        
        if (audioStream && audioStream.url) {
          audioUrl = audioStream.url;
          searchResults = { title, videoId };
          console.log(`[${new Date().toISOString()}] Found via ${instance}: ${title}`);
          break;
        }
      } catch (err) {
        console.log(`[${new Date().toISOString()}] ${instance} failed: ${err.message}`);
        continue;
      }
    }
    
    if (!audioUrl || !searchResults) {
      throw new Error('All Invidious instances failed or no audio stream found');
    }

    console.log(`[${new Date().toISOString()}] URL: ${audioUrl.substring(0, 80)}...`);

    res.json({
      success: true,
      title: searchResults.title,
      url: audioUrl,
      format: 'audio/webm',
      source: 'invidious',
      quality: 'audio'
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
