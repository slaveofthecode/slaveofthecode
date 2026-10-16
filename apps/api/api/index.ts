import { handleRequest } from "../src/index";

/**
 * Vercel entry point (Node runtime). Vercel supports the Web Standard `fetch`
 * export, which matches our `handleRequest(request): Promise<Response>` handler.
 */
export default {
  fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
