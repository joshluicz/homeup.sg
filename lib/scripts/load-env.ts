import { existsSync, readFileSync } from "fs";
import path from "path";

export function loadEnvFromFile(envPath: string): Record<string, string> {
  if (!existsSync(envPath)) {
    throw new Error(`Missing ${envPath}`);
  }
  const env: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const value = m[2].trim();
      env[key] = value;
      if (!process.env[key]) process.env[key] = value;
    }
  }
  return env;
}

export function loadProjectEnv(root: string): Record<string, string> {
  return loadEnvFromFile(path.join(root, ".env.local"));
}
