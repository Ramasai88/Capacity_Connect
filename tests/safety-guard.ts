import fs from "fs";
import path from "path";

/**
 * Parses a simple .env file without external dependencies.
 */
export function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) {
    return result;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

/**
 * Validates that the provided DATABASE_URL is safe for test execution
 * and does NOT point to the production/application database.
 */
export function assertSafeTestDatabaseUrl(candidateUrl?: string): string {
  const url = candidateUrl !== undefined ? candidateUrl : process.env.DATABASE_URL;

  if (!url || url.trim() === "") {
    throw new Error(
      "Refusing to run tests: DATABASE_URL is missing. Please configure a dedicated test database in .env.test (e.g. DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/capacity_connect_test\")."
    );
  }

  // Read production .env if available to compare directly against production DATABASE_URL
  const prodEnvPath = path.resolve(process.cwd(), ".env");
  const prodEnv = parseEnvFile(prodEnvPath);
  const prodDatabaseUrl = prodEnv.DATABASE_URL;

  if (prodDatabaseUrl && url.trim() === prodDatabaseUrl.trim()) {
    throw new Error(
      "Refusing to run tests against the production/application database. Configured test DATABASE_URL matches production .env DATABASE_URL."
    );
  }

  // Check known production markers (Render database name and host)
  const normalized = url.toLowerCase();
  const knownProdMarkers = [
    "capacity_connect_db_uh6j",
    "dpg-dacqaivavr4c739e3ujg-a",
    "singapore-postgres.render.com",
  ];

  for (const marker of knownProdMarkers) {
    if (normalized.includes(marker.toLowerCase())) {
      throw new Error(
        `Refusing to run tests against the production/application database. URL contains production marker "${marker}".`
      );
    }
  }

  return url;
}
