import { handleRequest } from "../src/index.js";

/**
 * Vercel entry point (Node runtime) for the `/health` check. Also reachable at
 * `/api/health`; the router strips the `/api` prefix.
 */
export default {
  fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
