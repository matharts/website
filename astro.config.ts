import sitemap from "@astrojs/sitemap";
import seoGraph from "@jdevalk/astro-seo-graph/integration";
import { defineConfig, fontProviders } from "astro/config";
import { siteDiscovery } from "./src/data/site-discovery.ts";

export default defineConfig({
  site: siteDiscovery.origin,
  output: "static",

  build: {
    inlineStylesheets: "always"
  },

  integrations: [
    sitemap(),
    seoGraph({
      validateH1: true,
      validateUniqueMetadata: true,
      validateImageAlt: true,
      validateMetadataLength: {
        title: { min: 12, max: 35 },
        description: { min: 40, max: 100 }
      },
      validateInternalLinks: true
    })
  ],

  fonts: [
    {
      provider: fontProviders.local(),
      name: "IBM Plex Sans",
      cssVariable: "--font-ibm-plex-sans",
      fallbacks: [],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/ibm-plex-sans.woff2"],
            weight: "100 700",
            style: "normal"
          }
        ]
      }
    },
    {
      provider: fontProviders.local(),
      name: "Noto Sans SC",
      cssVariable: "--font-noto-sans-sc",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/noto-sans-sc.woff2"],
            weight: "100 900",
            style: "normal"
          }
        ]
      }
    },
    {
      provider: fontProviders.local(),
      name: "Noto Serif SC",
      cssVariable: "--font-noto-serif-sc",
      fallbacks: ["serif"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/noto-serif-sc.woff2"],
            weight: "200 900",
            style: "normal"
          }
        ]
      }
    }
  ]
});
