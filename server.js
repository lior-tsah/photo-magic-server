// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import GooglePhotosService from "./googlePhotosService.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Photos Service
const googlePhotosService = new GooglePhotosService();

// Store user tokens temporarily (in production, use a proper database)
let userTokens = null;

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Photo Magic Server - Google Photos API",
    endpoints: {
      "/auth/google": "GET - Initiate Google OAuth",
      "/auth/google/callback": "GET - OAuth callback",
      "/photos": "GET - Get last 100 photos",
      "/photos/paginated": "GET - Get photos with pagination"
    }
  });
});

// Initiate Google OAuth flow
app.get("/auth/google", (req, res) => {
  try {
    const authUrl = googlePhotosService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle OAuth callback
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    const tokens = await googlePhotosService.getTokens(code);
    userTokens = tokens;
    
    res.json({ 
      message: "Authentication successful!", 
      hasTokens: true,
      expiresAt: new Date(tokens.expiry_date).toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the last 100 photos
app.get("/photos", async (req, res) => {
  if (!userTokens) {
    return res.status(401).json({ 
      error: "Not authenticated. Please authenticate first using /auth/google" 
    });
  }

  try {
    googlePhotosService.setCredentials(userTokens);
    const photos = await googlePhotosService.getLastPhotos(100);
    
    res.json({
      count: photos.length,
      photos: photos
    });
  } catch (error) {
    // If token is expired, require re-authentication
    if (error.message.includes('invalid_grant') || error.message.includes('unauthorized')) {
      userTokens = null;
      return res.status(401).json({ 
        error: "Token expired. Please re-authenticate using /auth/google" 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get photos with pagination
app.get("/photos/paginated", async (req, res) => {
  if (!userTokens) {
    return res.status(401).json({ 
      error: "Not authenticated. Please authenticate first using /auth/google" 
    });
  }

  const { pageSize = 50, pageToken } = req.query;

  try {
    googlePhotosService.setCredentials(userTokens);
    const result = await googlePhotosService.getPhotosWithPagination(
      parseInt(pageSize), 
      pageToken
    );
    
    res.json({
      count: result.photos.length,
      photos: result.photos,
      nextPageToken: result.nextPageToken,
      hasMore: !!result.nextPageToken
    });
  } catch (error) {
    if (error.message.includes('invalid_grant') || error.message.includes('unauthorized')) {
      userTokens = null;
      return res.status(401).json({ 
        error: "Token expired. Please re-authenticate using /auth/google" 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Check authentication status
app.get("/auth/status", (req, res) => {
  res.json({
    authenticated: !!userTokens,
    tokenExpiry: userTokens ? new Date(userTokens.expiry_date).toISOString() : null
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`To get started:`);
  console.log(`1. Set up your Google Photos API credentials in .env file`);
  console.log(`2. Visit http://localhost:${port}/auth/google to authenticate`);
  console.log(`3. Use http://localhost:${port}/photos to get your photos`);
});
