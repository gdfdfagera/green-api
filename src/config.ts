export interface AppConfig {
  port: number;
  greenApiBaseUrl: string;
  greenApiTimeoutMs: number;
}

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer, got: "${raw}"`);
  }
  return parsed;
}

export function loadConfig(): AppConfig {
  const baseUrl = (process.env.GREEN_API_BASE_URL ?? 'https://api.green-api.com').replace(/\/+$/, '');
  return {
    port: readInt('PORT', 3000),
    greenApiBaseUrl: baseUrl,
    greenApiTimeoutMs: readInt('GREEN_API_TIMEOUT_MS', 15_000),
  };
}
