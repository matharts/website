import type { APIRoute } from "astro";
import { siteDiscovery } from "../data/site-discovery";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error("The Astro site option is required to generate robots.txt.");
  }

  const sitemapURL = new URL(siteDiscovery.paths.sitemap, site);
  const body = ["User-agent: *", "Allow: /", "", `Sitemap: ${sitemapURL.href}`, ""].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};
