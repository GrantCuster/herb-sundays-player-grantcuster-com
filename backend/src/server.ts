import express from "express";
import { Pool } from 'pg'
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";

dotenv.config();

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_LOCAL_REDIRECT_URI,
  SPOTIFY_PROD_REDIRECT_URI,
  SPOTIFY_SCOPES = "user-read-email",
  DATABASE_URL,
} = process.env;

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({ connectionString: DATABASE_URL });

async function getFavorites(userId: string) {
  const res = await pool.query(
    "SELECT items FROM favorites WHERE user_id = $1",
    [userId],
  );
  return res.rows[0]?.items ?? [];
}

async function setFavorites(userId: string, items: string[]) {
  await pool.query(
    `INSERT INTO favorites (user_id, items)
     VALUES ($1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET items = EXCLUDED.items`,
    [userId, items],
  );
}

if (
  !SPOTIFY_CLIENT_ID ||
  !SPOTIFY_CLIENT_SECRET ||
  !SPOTIFY_LOCAL_REDIRECT_URI ||
  !SPOTIFY_PROD_REDIRECT_URI
) {
  throw new Error(
    "Missing Spotify env vars. Set SPOTIFY_CLIENT_ID/SECRET/REDIRECT_URI.",
  );
}

// Tiny helpers
function base64(str: string) {
  return Buffer.from(str).toString("base64");
}
function setAuthCookies(
  res: express.Response,
  tokens: { access_token: string; refresh_token?: string; expires_in?: number },
) {
  const { access_token, refresh_token, expires_in = 3600 } = tokens;

  // Access token cookie (short lived)
  res.cookie("spotify_access_token", access_token, {
    httpOnly: true,
    secure: false, // only for local dev
    sameSite: "lax",
    maxAge: (expires_in - 30) * 1000, // small buffer
    path: "/",
  });

  // Refresh token cookie (long lived)
  if (refresh_token) {
    res.cookie("spotify_refresh_token", refresh_token, {
      httpOnly: true,
      secure: false, // only for local dev
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30, // ~30 days
      path: "/",
    });
  }
}

// CSRF-ish: remember state in a cookie
function genState() {
  return crypto.randomBytes(16).toString("hex");
}

const app = express();
app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
const PORT = process.env.PORT || 4001;

app.use(express.json());

app.use(
  express.static(path.join(__dirname, "public"), {
    etag: false,
    lastModified: false,
    setHeaders: (res, path) => {
      // No cache for index html otherwhise there's gonna be problems loading the scripts
      if (path.indexOf("index.html") !== -1) {
        res.set("Cache-Control", "no-store");
      }
    },
  }),
);

app.get("/api/health", (_, res) => {
  res.json({ status: "OK", message: "Backend is live running!" });
});

app.get("/api/auth/spotify/login", (_, res) => {
  const state = genState();
  res.cookie("spotify_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/",
  });

  const authURL = new URL("https://accounts.spotify.com/authorize");
  authURL.searchParams.set("response_type", "code");
  authURL.searchParams.set("client_id", SPOTIFY_CLIENT_ID!);
  authURL.searchParams.set("scope", SPOTIFY_SCOPES);
  authURL.searchParams.set(
    "redirect_uri",
    isProduction ? SPOTIFY_PROD_REDIRECT_URI! : SPOTIFY_LOCAL_REDIRECT_URI!,
  );
  authURL.searchParams.set("state", state);

  res.redirect(authURL.toString());
});

app.get("/api/auth/spotify/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  // const savedState = req.cookies.spotify_oauth_state;

  if (!code || !state) {
    return res.status(400).send("Invalid state or missing code.");
  }

  // Clear state cookie
  res.clearCookie("spotify_oauth_state", {
    path: "/",
  });

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set(
    "redirect_uri",
    isProduction ? SPOTIFY_PROD_REDIRECT_URI! : SPOTIFY_LOCAL_REDIRECT_URI!,
  );

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!r.ok) {
    const text = await r.text();
    return res.status(500).send(`Token exchange failed: ${text}`);
  }

  const json = (await r.json()) as {
    access_token: string;
    token_type: "Bearer";
    scope: string;
    expires_in: number;
    refresh_token: string;
  };

  setAuthCookies(res, json);

  // Redirect back to your frontend (adjust if your app runs elsewhere)
  if (!isProduction) {
    res.redirect("http://127.0.0.1:4000" /* FRONTEND_URL */);
  } else {
    res.redirect(
      "https://herb-sunday-dot-computing-experiments.uc.r.appspot.com",
    );
  }
});

app.post("/auth/spotify/refresh", async (req, res) => {
  const refresh_token = req.cookies.spotify_refresh_token;
  if (!refresh_token)
    return res.status(401).json({ error: "No refresh token" });

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refresh_token);

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!r.ok) {
    const text = await r.text();
    return res.status(500).json({ error: "Refresh failed", detail: text });
  }

  const json = (await r.json()) as {
    access_token: string;
    token_type: "Bearer";
    scope: string;
    expires_in: number;
    refresh_token?: string;
  };

  setAuthCookies(res, json);
  res.json({ ok: true });
});

app.get("/api/getFavorites", async (req, res) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  getFavorites(userId)
    .then((items) => res.json({ items }))
    .catch((err) => {
      console.error("Error getting favorites:", err);
      res.status(500).json({ error: "Failed to get favorites" });
    });
});

app.post("/api/setFavorites", async (req, res) => {
  const { userId, items } = req.body as { userId?: string; items?: string[] };
  if (!userId || !items)
    return res.status(400).json({ error: "Missing userId or items" });
  try {
    await setFavorites(userId, items);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error setting favorites:", err);
    res.status(500).json({ error: "Failed to set favorites" });
  }
});

app.get("/api/spotify/me", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  const r = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (r.status === 401) {
    return res.status(401).json({ error: "Access token expired" });
  }

  const json = await r.json();
  res.json(json);
});

app.get("/api/spotify/herb_sundays", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  let playlists = [] as any[];
  async function fetchAllPlaylists(offset = 0, limit = 100) {
    const r = await fetch(
      `https://api.spotify.com/v1/users/sam98/playlists?limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const data = (await r.json()) as {
      items: any[];
      offset: number;
      limit: number;
      total: number;
    };
    const total = data.total || 0;
    playlists.push(...data.items);
    if (data.offset + data.limit < total) {
      await fetchAllPlaylists(data.offset + data.limit);
    } else {
      if (r.status === 204) {
        return res.status(204).end(); // nothing playing
      }
      res.status(r.status).json(playlists);
    }
  }
  await fetchAllPlaylists();
});

app.get("/api/spotify/me/player/currently-playing", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  const r = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    },
  );

  if (r.status === 204) {
    return res.status(204).end(); // nothing playing
  }
  const json = await r.json();
  res.status(r.status).json(json);
});

// Get tracks from a playlist
app.get("/api/spotify/playlist/:id/tracks", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  const playlist_id = req.params.id;
  if (!playlist_id)
    return res.status(400).json({ error: "Missing playlist id" });

  let tracks = [] as any[];
  async function fetchAllTracks(offset = 0, limit = 100) {
    const r = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const data = (await r.json()) as {
      items: any[];
      offset: number;
      limit: number;
      total: number;
    };
    const total = data.total || 0;
    tracks.push(...data.items);
    if (data.offset + data.limit < total) {
      await fetchAllTracks(data.offset + data.limit);
    } else {
      if (r.status === 204) {
        return res.status(204).end(); // nothing playing
      }
      res.status(r.status).json(tracks);
    }
  }
  await fetchAllTracks();
});

app.get("/api/spotify/search", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  const q = (req.query.q as string) ?? "";
  const type = (req.query.type as string) ?? "track";
  const limit = (req.query.limit as string) ?? "10";

  const r = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&limit=${encodeURIComponent(limit)}&market=us`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );

  const text = await r.text();
  res.status(r.status).send(text); // pass through JSON (or 204/etc.)
});

// 2) Play (start/resume) on user's active device or specified device_id.
// Body can be: { uris?: string[], context_uri?: string, device_id?: string, position_ms?: number }
app.put("/api/spotify/play", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  const { uris, context_uri, device_id, offset, position_ms } = req.body ?? {};

  const url = new URL("https://api.spotify.com/v1/me/player/play");
  if (device_id) url.searchParams.set("device_id", device_id);

  const r = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Either `uris` (array of track URIs) OR `context_uri` (album/playlist/artist)
      ...(uris ? { uris } : {}),
      ...(offset ? { offset } : {}),
      ...(context_uri ? { context_uri } : {}),
      ...(typeof position_ms === "number" ? { position_ms } : {}),
    }),
  });

  if (r.status === 204) return res.json({ ok: true });
  const text = await r.text();
  res.status(r.status).send(text);
});

// Pause
app.put("/api/spotify/pause", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  const { device_id } = req.body ?? {};

  const url = new URL("https://api.spotify.com/v1/me/player/pause");
  if (device_id) url.searchParams.set("device_id", device_id);

  const r = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (r.status === 204) return res.json({ ok: true });
  const text = await r.text();
  res.status(r.status).send(text);
});

// Next track
app.post("/api/spotify/next", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  const { device_id } = req.body ?? {};

  const url = new URL("https://api.spotify.com/v1/me/player/next");
  if (device_id) url.searchParams.set("device_id", device_id);

  const r = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (r.status === 204) return res.json({ ok: true });
  const text = await r.text();
  res.status(r.status).send(text);
});

// (Optional) List devices to help users pick a playback target
app.get("/api/spotify/devices", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  const r = await fetch("https://api.spotify.com/v1/me/player/devices", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const json = await r.json();
  res.status(r.status).json(json);
});

// Transfer playback to a device (optionally start playing immediately)
app.put("/api/spotify/transfer", async (req, res) => {
  const access_token = req.cookies.spotify_access_token;
  if (!access_token)
    return res.status(401).json({ error: "Not authenticated" });

  const { device_id, play = true } = req.body ?? {};
  if (!device_id) return res.status(400).json({ error: "device_id required" });

  const r = await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_ids: [device_id], play }),
  });

  if (r.status === 204) return res.json({ ok: true });
  const text = await r.text();
  res.status(r.status).send(text);
});

app.post("/auth/spotify/logout", (req, res) => {
  res.clearCookie("spotify_access_token", {
    path: "/",
  });
  res.clearCookie("spotify_refresh_token", {
    path: "/",
  });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
