# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Spotify web player for listening to [Herb Sundays](https://herbsundays.substack.com/) playlists. The app allows users to authenticate with Spotify, browse Herb Sundays playlists (curated by user sam98), and control playback across devices.

## Architecture

### Monorepo Structure

This is an npm workspaces-based monorepo with two main workspaces:
- `frontend/` - React + TypeScript + Vite application
- `backend/` - Express.js + TypeScript server

### Frontend (`frontend/`)

**Tech Stack:**
- React 19 with TypeScript
- Vite for build tooling
- Jotai for state management (all Spotify state is in atoms)
- TailwindCSS 4 for styling
- React Router for routing

**State Management:**
All Spotify-related state is centralized in Jotai atoms defined in `frontend/src/Spotify/SpotifyAtoms.tsx`:
- `SpotifyUserIdAtom` - Current user's Spotify ID
- `SpotifyFavoritesAtom` - User's favorite playlists
- `SpotifyNowPlayingAtom` - Currently playing track info
- `SpotifyDevicesAtom` - Available Spotify devices
- `SpotifyActiveDeviceAtom` - Currently selected device
- `SpotifyPlaylistsAtom` - Herb Sundays playlists
- `SpotifyPlaylistTracksMapAtom` - Cache of tracks for each playlist

**Key Components:**
- `App.tsx` - Main app with auth state and routing logic
- `useSpotify.tsx` - Custom hook that polls Spotify API (every 5s) for devices and now-playing state
- `Playlist.tsx` - Displays Herb Sundays playlists
- `NowPlaying.tsx` - Shows currently playing track
- `DevicePicker.tsx` - Device selection UI
- `Favs.tsx` - Favorites view

**View Modes:**
The app supports different views via query params (`?view=player` or `?view=favs`)

### Backend (`backend/`)

**Tech Stack:**
- Express.js with TypeScript
- PostgreSQL (via `pg` package) for storing user favorites
- Cookie-based session management for Spotify OAuth tokens

**Server Configuration:**
- Development: `localhost:4001` (proxied by Vite dev server at `localhost:4000`)
- Production: Port `8005`

**Database:**
Uses PostgreSQL to store user favorites in a `favorites` table:
- Schema: `(user_id, items)` where items is an array of playlist IDs
- Connection via `DATABASE_URL` environment variable

**Authentication Flow:**
1. User clicks "Login with Spotify" → redirects to `/api/auth/spotify/login`
2. Server redirects to Spotify OAuth with client credentials
3. Spotify redirects back to `/api/auth/spotify/callback` with auth code
4. Server exchanges code for access/refresh tokens
5. Tokens stored in httpOnly cookies (`spotify_access_token`, `spotify_refresh_token`)
6. Frontend makes requests to `/api/*` endpoints, server uses cookies to authorize Spotify API calls

**API Endpoints:**
All backend endpoints are prefixed with `/api/`:
- `/api/health` - Health check
- `/api/auth/spotify/login` - Initiate OAuth flow
- `/api/auth/spotify/callback` - OAuth callback handler
- `/api/spotify/me` - Get current user info
- `/api/spotify/herb_sundays` - Fetch all playlists from user sam98
- `/api/spotify/playlist/:id/tracks` - Get tracks from a playlist
- `/api/spotify/me/player/currently-playing` - Currently playing track
- `/api/spotify/devices` - List available devices
- `/api/spotify/transfer` - Transfer playback to device
- `/api/spotify/play` - Start/resume playback
- `/api/spotify/pause` - Pause playback
- `/api/spotify/next` - Skip to next track
- `/api/getFavorites` - Get user's favorites from database
- `/api/setFavorites` - Save user's favorites to database

**Environment Variables:**
Required in `backend/.env`:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_LOCAL_REDIRECT_URI` (for dev)
- `SPOTIFY_PROD_REDIRECT_URI` (for production)
- `SPOTIFY_SCOPES` (optional, defaults to "user-read-email")
- `DATABASE_URL` (PostgreSQL connection string)

### Build Process

**Development:**
Frontend builds to `../backend/dist/public` so the backend can serve it in production. In development, Vite dev server runs on port 4000 and proxies `/api/*` requests to the backend on port 4001.

**Production:**
1. Frontend is built via Vite → outputs to `backend/dist/public`
2. Backend TypeScript is compiled → outputs to `backend/dist`
3. Server serves frontend static files from `backend/dist/public`
4. Server entry point: `backend/dist/server.js`

### Deployment

The app is deployed to Google Cloud Platform (App Engine).

**Deployment script:** `deploy.sh`
- Reads environment variables from `backend/.env`
- Dynamically generates `app.yaml` with env variables
- Runs `gcloud app deploy` to project `computing-experiments`
- Cleans up temporary `app.yaml`

**Production URLs:**
- Frontend/Backend: `https://herb-sunday-dot-computing-experiments.uc.r.appspot.com`
- OAuth callback must match `SPOTIFY_PROD_REDIRECT_URI`

## Common Commands

### Development

```bash
# Install all dependencies (root + workspaces)
npm run install:all

# Run both frontend and backend in dev mode (uses concurrently)
npm run dev

# Run only frontend dev server
npm run dev:frontend

# Run only backend dev server
npm run dev:backend
```

### Building

```bash
# Build both frontend and backend
npm run build

# Build only frontend (outputs to backend/dist/public)
npm run build --workspace=frontend

# Build only backend (compiles TypeScript)
npm run build --workspace=backend
```

### Production

```bash
# Start production server (NODE_ENV=production)
npm start
```

### Deployment

```bash
# Build and deploy to Google Cloud App Engine
npm run deploy
```

### Linting

```bash
# Run ESLint on frontend
npm run lint --workspace=frontend
```

## Development Notes

### Vite Configuration
- Frontend dev server: port 4000
- API proxy: `/api` → `http://localhost:4001`
- Build output: `../backend/dist/public`
- WASM and 3D model assets are included via `assetsInclude`

### TypeScript Configuration
- Backend uses `commonjs` modules (for Node.js compatibility)
- Frontend uses ES modules (Vite default)
- Both extend root `tsconfig.json`

### Polling Behavior
The `useSpotify` hook polls the Spotify API every 5 seconds for:
- Device list
- Currently playing track

Polling can be paused via `SpotifyPausePollingAtom`.

### Herb Sundays Playlist Filtering
The backend fetches all playlists from Spotify user `sam98`. The frontend filters for playlists:
1. Containing "Herb Sundays" (case-insensitive)
2. With a number in the 3rd word (e.g., "Herb Sundays 123: Title")

Playlist names are parsed into `formattedNumber` and `formattedName` for display.
