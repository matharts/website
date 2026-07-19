import { createSchemaEndpoint } from "@jdevalk/astro-seo-graph";
import { publicationMetadata } from "../../data/seo";
import { siteDiscovery } from "../../data/site-discovery";

export const prerender = true;

export const GET = createSchemaEndpoint({
  entries: async () => [{ canonicalURL: new URL("/", siteDiscovery.origin) }],
  mapper: ({ canonicalURL }) => publicationMetadata.siteSchema(canonicalURL)
});
