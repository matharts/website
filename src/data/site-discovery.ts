export const siteDiscovery = {
  origin: "https://matharts.cn",
  paths: {
    sitemap: "/sitemap-index.xml",
    schemaMap: "/schemamap.xml",
    llms: "/llms.txt"
  },
  schemas: [
    {
      path: "/schema/site.json",
      type: "WebSite",
      lastModifiedSource: "src/data/seo.ts",
      fallbackLastModified: "2026-07-19T00:00:00.000Z"
    }
  ]
} as const;
