export interface Health {
  status: "ok";
  service: "portfolio-api";
  timestamp: string;
}

export function makeHealth(timestamp: string): Health {
  return { status: "ok", service: "portfolio-api", timestamp };
}
