export const SPOTIFY_WIDGET_STORAGE_KEY = "accusense-widget-config:spotify";
export const SPOTIFY_WIDGET_EVENT = "accusense-spotify-config-updated";
const VERIFIER_KEY = "accusense-spotify-pkce-verifier";
const STATE_KEY = "accusense-spotify-oauth-state";

export type SpotifyConfig = {
  clientId: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

export function readSpotifyConfig(): SpotifyConfig {
  try {
    const value = JSON.parse(localStorage.getItem(SPOTIFY_WIDGET_STORAGE_KEY) ?? "{}") as Partial<SpotifyConfig>;
    return {
      clientId: typeof value.clientId === "string" ? value.clientId : "",
      redirectUri: typeof value.redirectUri === "string" ? value.redirectUri : "",
      accessToken: typeof value.accessToken === "string" ? value.accessToken : undefined,
      refreshToken: typeof value.refreshToken === "string" ? value.refreshToken : undefined,
      expiresAt: typeof value.expiresAt === "number" ? value.expiresAt : undefined,
    };
  } catch { return { clientId: "", redirectUri: "" }; }
}

export function saveSpotifyConfig(config: SpotifyConfig) {
  localStorage.setItem(SPOTIFY_WIDGET_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(SPOTIFY_WIDGET_EVENT));
}

function randomString(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"[byte % 66]).join("");
}

async function challengeFor(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function beginSpotifyAuthorization(config: SpotifyConfig) {
  const verifier = randomString(64);
  const state = randomString(24);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    code_challenge_method: "S256",
    code_challenge: await challengeFor(verifier),
    state,
    scope: "user-read-currently-playing user-read-playback-state user-modify-playback-state",
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params.toString()}`);
}

export async function completeSpotifyAuthorization(code: string, state: string) {
  const config = readSpotifyConfig();
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const expectedState = sessionStorage.getItem(STATE_KEY);
  if (!verifier || !expectedState || state !== expectedState) throw new Error("Estado OAuth inválido. Inicie a conexão novamente.");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, grant_type: "authorization_code", code, redirect_uri: config.redirectUri, code_verifier: verifier }),
  });
  if (!response.ok) throw new Error("O Spotify recusou a autorização. Confira a URI de redirecionamento.");
  const token = await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
  saveSpotifyConfig({ ...config, accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: Date.now() + token.expires_in * 1000 });
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
}

async function refreshAccessToken(config: SpotifyConfig) {
  if (!config.refreshToken) throw new Error("Conecte sua conta Spotify.");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, grant_type: "refresh_token", refresh_token: config.refreshToken }),
  });
  if (!response.ok) throw new Error("A sessão do Spotify expirou.");
  const token = await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
  const next = { ...config, accessToken: token.access_token, refreshToken: token.refresh_token ?? config.refreshToken, expiresAt: Date.now() + token.expires_in * 1000 };
  saveSpotifyConfig(next);
  return next.accessToken;
}

export async function getSpotifyAccessToken() {
  const config = readSpotifyConfig();
  if (config.accessToken && (config.expiresAt ?? 0) > Date.now() + 30_000) return config.accessToken;
  return refreshAccessToken(config);
}

export async function spotifyFetch(path: string, init?: RequestInit) {
  const token = await getSpotifyAccessToken();
  const response = await fetch(`https://api.spotify.com/v1${path}`, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } });
  if (!response.ok && response.status !== 204) throw new Error(response.status === 403 ? "Esta ação exige Spotify Premium." : "Não foi possível consultar o Spotify.");
  return response;
}