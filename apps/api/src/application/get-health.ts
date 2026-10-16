import { type Health, makeHealth } from "../domain/health.js";

/** Use case: report service health at a given point in time. */
export function getHealth(now: Date): Health {
  return makeHealth(now.toISOString());
}
