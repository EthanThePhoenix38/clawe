import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import type { ClaweConfig } from "./types";

/**
 * Get the data directory path.
 * - In development: ./.data (relative to project root)
 * - In production: /data (Docker volume) or CLAWE_DATA_DIR env var
 */
function getDataDir(): string {
  if (process.env.CLAWE_DATA_DIR) {
    return process.env.CLAWE_DATA_DIR;
  }
  // Default to .data in project root for development
  return join(process.cwd(), ".data");
}

/**
 * Get the config file path.
 */
function getConfigPath(): string {
  return join(getDataDir(), "clawe-config.json");
}

/**
 * Read the Clawe configuration from the filesystem.
 * Returns null if config doesn't exist.
 */
export async function readConfig(): Promise<ClaweConfig | null> {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = await readFile(configPath, "utf-8");
    return JSON.parse(content) as ClaweConfig;
  } catch {
    // If file is corrupted or unreadable, treat as no config
    return null;
  }
}

/**
 * Write the Clawe configuration to the filesystem.
 * Creates the data directory if it doesn't exist.
 */
export async function writeConfig(config: ClaweConfig): Promise<void> {
  const configPath = getConfigPath();
  const dataDir = dirname(configPath);

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }

  const configWithTimestamp: ClaweConfig = {
    ...config,
    updatedAt: Date.now(),
  };

  await writeFile(configPath, JSON.stringify(configWithTimestamp, null, 2));
}

/**
 * Get the Convex URL from config.
 * Returns null if not configured.
 */
export async function getConvexUrl(): Promise<string | null> {
  const config = await readConfig();
  return config?.convexUrl ?? null;
}

/**
 * Set the Convex URL in config.
 */
export async function setConvexUrl(url: string): Promise<void> {
  const existingConfig = (await readConfig()) ?? {};
  await writeConfig({
    ...existingConfig,
    convexUrl: url,
  });
}
