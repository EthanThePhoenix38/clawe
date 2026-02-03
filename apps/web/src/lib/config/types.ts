/**
 * Clawe application configuration stored on the server filesystem.
 * This config is populated during onboarding and persists across restarts.
 */
export type ClaweConfig = {
  /** Convex deployment URL (e.g., https://xxx.convex.cloud) */
  convexUrl?: string;
  /** Timestamp when the config was last updated */
  updatedAt?: number;
};

/**
 * API response for /api/config endpoint
 */
export type ConfigResponse =
  | { configured: true; config: ClaweConfig }
  | { configured: false };
