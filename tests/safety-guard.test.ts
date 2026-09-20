import { describe, it, expect } from "vitest";
import path from "path";
import { assertSafeTestDatabaseUrl, parseEnvFile } from "./safety-guard";

describe("Safety Guard — Database Isolation Protection", () => {
  it("throws error when DATABASE_URL is missing or empty", () => {
    expect(() => assertSafeTestDatabaseUrl("")).toThrowError(
      /Refusing to run tests: DATABASE_URL is missing/i
    );
  });

  it("throws error when DATABASE_URL matches known production database name", () => {
    const prodDbUrl = "postgresql://user:pass@render.com/capacity_connect_db_uh6j";
    expect(() => assertSafeTestDatabaseUrl(prodDbUrl)).toThrowError(
      /Refusing to run tests against the production\/application database/i
    );
  });

  it("throws error when DATABASE_URL matches known production host", () => {
    const prodHostUrl = "postgresql://user:pass@dpg-dacqaivavr4c739e3ujg-a.singapore-postgres.render.com/custom_db";
    expect(() => assertSafeTestDatabaseUrl(prodHostUrl)).toThrowError(
      /Refusing to run tests against the production\/application database/i
    );
  });

  it("throws error when DATABASE_URL is identical to production .env DATABASE_URL", () => {
    const prodEnv = parseEnvFile(path.resolve(process.cwd(), ".env"));
    if (prodEnv.DATABASE_URL) {
      expect(() => assertSafeTestDatabaseUrl(prodEnv.DATABASE_URL)).toThrowError(
        /Refusing to run tests against the production\/application database/i
      );
    }
  });

  it("accepts a dedicated test database URL", () => {
    const testDbUrl = "postgresql://postgres:postgres@localhost:5432/capacity_connect_test";
    const result = assertSafeTestDatabaseUrl(testDbUrl);
    expect(result).toBe(testDbUrl);
  });
});
