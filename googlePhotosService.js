import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

class GooglePhotosService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Define the scopes for Google Photos API
    this.scopes = [
      'https://www.googleapis.com/auth/photoslibrary.readonly'
    ];
  }

  // Generate authentication URL
  getAuthUrl() {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent'
    });
    return authUrl;
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      throw new Error(`Failed to get tokens: ${error.message}`);
    }
  }

  // Set credentials for authenticated requests
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Get the last 100 photos from Google Photos
  async getLastPhotos(pageSize = 100) {
    try {
      // Create Photos Library API client
      const photosLibrary = google.photoslibrary({
        version: 'v1',
        auth: this.oauth2Client
      });

      const response = await photosLibrary.mediaItems.list({
        pageSize: Math.min(pageSize, 100), // Maximum 100 per request
        orderBy: 'MediaMetadata.creation_time desc'
      });

      if (!response.data.mediaItems) {
        return [];
      }

      // Format the response to include relevant photo information
      const photos = response.data.mediaItems.map(item => ({
        id: item.id,
        filename: item.filename,
        mimeType: item.mimeType,
        creationTime: item.mediaMetadata?.creationTime,
        width: item.mediaMetadata?.width,
        height: item.mediaMetadata?.height,
        baseUrl: item.baseUrl,
        // Add size parameter to get a reasonable sized image
        thumbnailUrl: `${item.baseUrl}=w400-h400`,
        fullSizeUrl: `${item.baseUrl}=d`
      }));

      return photos;
    } catch (error) {
      throw new Error(`Failed to fetch photos: ${error.message}`);
    }
  }

  // Get photos with pagination
  async getPhotosWithPagination(pageSize = 50, pageToken = null) {
    try {
      const photosLibrary = google.photoslibrary({
        version: 'v1',
        auth: this.oauth2Client
      });

      const requestParams = {
        pageSize: Math.min(pageSize, 100),
        orderBy: 'MediaMetadata.creation_time desc'
      };

      if (pageToken) {
        requestParams.pageToken = pageToken;
      }

      const response = await photosLibrary.mediaItems.list(requestParams);

      const photos = response.data.mediaItems?.map(item => ({
        id: item.id,
        filename: item.filename,
        mimeType: item.mimeType,
        creationTime: item.mediaMetadata?.creationTime,
        width: item.mediaMetadata?.width,
        height: item.mediaMetadata?.height,
        baseUrl: item.baseUrl,
        thumbnailUrl: `${item.baseUrl}=w400-h400`,
        fullSizeUrl: `${item.baseUrl}=d`
      })) || [];

      return {
        photos,
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      throw new Error(`Failed to fetch photos: ${error.message}`);
    }
  }
}

export default GooglePhotosService;