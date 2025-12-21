const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);
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
  const { q, format = 'worstaudio' } = req.query;

  if (!q) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing query parameter: q' 
    });
  }

  try {
    console.log(`[${new Date().toISOString()}] Searching: ${q}`);

    // Try multiple extractor methods to bypass bot detection
    // 1. Try ios client (most reliable as of 2024-12)
    // 2. Fallback to web client if ios fails
    const cmd = `yt-dlp -f "251/140/bestaudio" --extractor-args "youtube:player_client=ios" --get-url --get-title "ytsearch1:${q}"`;
    
    const { stdout, stderr } = await execPromise(cmd, {
      timeout: 30000 // 30s timeout
    });

    if (stderr && !stdout) {
      throw new Error(`yt-dlp error: ${stderr}`);
    }

    const lines = stdout.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Invalid yt-dlp output');
    }

    const title = lines[0];
    const url = lines[1];

    if (!url || !url.startsWith('http')) {
      throw new Error('Failed to extract audio URL');
    }

    console.log(`[${new Date().toISOString()}] Found: ${title}`);
    console.log(`[${new Date().toISOString()}] URL: ${url.substring(0, 80)}...`);

    res.json({
      success: true,
      title: title,
      url: url,
      format: 'audio/mp4',
      source: 'youtube',
      quality: format
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
