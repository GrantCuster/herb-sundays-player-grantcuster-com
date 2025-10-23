/**
 * Wrapper around fetch that automatically refreshes Spotify tokens on 401 errors
 */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshSpotifyToken(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/spotify/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      return true;
    }

    // Refresh failed - user needs to login again
    return false;
  } catch (err) {
    console.error("Token refresh failed:", err);
    return false;
  }
}

/**
 * Fetch with automatic token refresh on 401 errors
 *
 * @param input - URL or Request object
 * @param init - RequestInit options
 * @returns Response
 */
export async function fetchWithRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  // Always include credentials for cookie-based auth
  const fetchOptions: RequestInit = {
    ...init,
    credentials: "include",
  };

  // Make initial request
  let response = await fetch(input, fetchOptions);

  // If we get a 401, try to refresh the token
  if (response.status === 401) {
    // Prevent multiple simultaneous refresh attempts
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshSpotifyToken();
    }

    // Wait for the refresh to complete
    const refreshSuccess = await refreshPromise!;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshSuccess) {
      // Retry the original request with the new token
      response = await fetch(input, fetchOptions);
    } else {
      // Refresh failed - redirect to login
      window.location.href = "/api/auth/spotify/login";
    }
  }

  return response;
}
