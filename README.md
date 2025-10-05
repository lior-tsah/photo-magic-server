# Photo Magic Server - Google Photos API

A Node.js server that connects to Google Photos API and retrieves the last 100 photos.

## Setup Instructions

### 1. Google Photos API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Photos Library API:
   - Go to "APIs & Services" > "Library"
   - Search for "Photos Library API"
   - Click on it and press "Enable"

4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   - Save and copy the Client ID and Client Secret

### 2. Environment Configuration

Update the `.env` file with your Google API credentials:

```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
PORT=3000
```

### 3. Installation and Running

```bash
# Install dependencies
npm install

# Start the server
npm start
```

## API Endpoints

### Authentication

- **GET /auth/google** - Get Google OAuth URL for authentication
- **GET /auth/google/callback** - OAuth callback (handled automatically)
- **GET /auth/status** - Check authentication status

### Photos

- **GET /photos** - Get the last 100 photos
- **GET /photos/paginated** - Get photos with pagination
  - Query parameters:
    - `pageSize` (optional): Number of photos per page (max 100, default 50)
    - `pageToken` (optional): Token for next page

### Basic Info

- **GET /** - Server info and available endpoints

## Usage Flow

1. Start the server: `npm start`
2. Visit `http://localhost:3000/auth/google` to get the authentication URL
3. Follow the authentication flow
4. Once authenticated, use `http://localhost:3000/photos` to get your photos

## Response Format

### Photos Response

```json
{
  "count": 100,
  "photos": [
    {
      "id": "photo_id",
      "filename": "IMG_001.jpg",
      "mimeType": "image/jpeg",
      "creationTime": "2023-10-01T10:00:00Z",
      "width": 3000,
      "height": 4000,
      "baseUrl": "https://lh3.googleusercontent.com/...",
      "thumbnailUrl": "https://lh3.googleusercontent.com/...=w400-h400",
      "fullSizeUrl": "https://lh3.googleusercontent.com/...=d"
    }
  ]
}
```

### Paginated Photos Response

```json
{
  "count": 50,
  "photos": [...],
  "nextPageToken": "next_page_token",
  "hasMore": true
}
```

## Security Notes

- This is a development setup with in-memory token storage
- For production, implement proper database storage for user tokens
- Consider implementing user sessions and proper authentication middleware
- Add rate limiting and other security measures

## Troubleshooting

1. **Authentication Issues**: Make sure your Google OAuth credentials are correct and the redirect URI matches exactly
2. **API Quota**: Google Photos API has usage limits. Check your quota in Google Cloud Console
3. **Token Expiry**: Tokens expire after some time. Re-authenticate when you get 401 errors