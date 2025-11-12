import { google, Auth } from "googleapis";

export type GoogleTokens = Auth.Credentials;

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} = process.env;

export function assertGoogleEnv() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
      "Google OAuth environment variables are missing. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI."
    );
  }
}

export function getOAuthClient(tokens?: GoogleTokens) {
  assertGoogleEnv();
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  if (tokens) {
    client.setCredentials(tokens);
  }
  return client;
}

export function serializeTokens(tokens: GoogleTokens) {
  const sanitized: GoogleTokens = {
    ...tokens,
    expiry_date: tokens.expiry_date ?? undefined
  };
  return Buffer.from(JSON.stringify(sanitized), "utf8").toString("base64");
}

export function deserializeTokens(encoded?: string | null): GoogleTokens | null {
  if (!encoded) {
    return null;
  }
  try {
    const json = Buffer.from(encoded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch (error) {
    console.error("Failed to deserialize Google tokens", error);
    return null;
  }
}

export function getDriveClient(tokens: GoogleTokens) {
  const auth = getOAuthClient(tokens);
  return google.drive({ version: "v3", auth });
}

export function getYouTubeClient(tokens: GoogleTokens) {
  const auth = getOAuthClient(tokens);
  return google.youtube({ version: "v3", auth });
}
