import { createApiCatalog } from "@jdevalk/astro-seo-graph";
import { siteDiscovery } from "../../data/site-discovery";

export const prerender = true;

export const GET = createApiCatalog({
  siteUrl: siteDiscovery.origin,
  schemaEndpoints: siteDiscovery.schemas.map(({ path, type }) => ({
    path,
    schemaType: type
  })),
  schemaMap: { path: siteDiscovery.paths.schemaMap }
});
