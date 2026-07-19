import { createSchemaMap, gitLastmod } from "@jdevalk/astro-seo-graph";
import { siteDiscovery } from "../data/site-discovery";

export const prerender = true;

const [siteSchema] = siteDiscovery.schemas;
const schemaLastModified =
  gitLastmod(siteSchema.lastModifiedSource) ?? new Date(siteSchema.fallbackLastModified);

export const GET = createSchemaMap({
  siteUrl: siteDiscovery.origin,
  entries: [
    {
      path: siteSchema.path,
      lastModified: schemaLastModified
    }
  ]
});
