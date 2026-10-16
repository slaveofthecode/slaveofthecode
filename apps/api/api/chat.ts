import { handleRequest } from "../src/index";

/**
 * Vercel entry point (Node runtime). Vercel's file-based functions map
 * `api/<name>.ts` to `/api/<name>`; `vercel.json` rewrites also expose the
 * clean `/chat` path. The router strips the `/api` prefix.
 */
export default {
  fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
