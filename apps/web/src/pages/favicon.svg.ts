import { getContent } from "@portfolio/content";
import type { APIRoute } from "astro";
import { renderInitialsIcon } from "../lib/favicon";
import { initials } from "../lib/initials";

export const GET: APIRoute = () => {
  const svg = renderInitialsIcon(initials(getContent("en").profile.name));
  return new Response(svg, {
    headers: { "content-type": "image/svg+xml; charset=utf-8" },
  });
};
