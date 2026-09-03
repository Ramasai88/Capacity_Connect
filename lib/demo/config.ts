/**
 * Helper to determine if the application is running in Demo / Exploration Mode.
 * In Demo Mode, database dependencies (PostgreSQL/Prisma) are bypassed and realistic
 * static mock data is served to allow frontend exploration.
 */
export function isDemoMode(): boolean {
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}
