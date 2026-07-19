import { siteDiscovery } from "./site-discovery";

interface SocialImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface PageMetadataOptions {
  url: URL;
  site?: URL;
  title?: string;
  description?: string;
  image?: SocialImage;
  noindex?: boolean;
}

const siteIdentity = {
  name: "MathArts",
  title: "MathArts · 中国数术数字基础设施",
  description:
    "MathArts 以现代数学、计算机科学与软件工程，建设开放、可追溯、可验证的中国数术数字基础设施。",
  language: "zh-CN",
  locale: "zh_CN",
  copyrightYear: 2026,
  knowsAbout: ["中国数术数字基础设施", "现代数学", "计算机科学", "软件工程", "天文历法", "紫微斗数"]
} as const;

const defaultSocialImage = {
  src: "/preview.jpg",
  alt: "MathArts 中国数术数字基础设施官网预览",
  width: 1200,
  height: 675
} satisfies SocialImage;

function normalizedText(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function createSchemaGraph(
  canonicalURL: URL,
  siteURL: URL,
  title: string,
  description: string,
  image: SocialImage
) {
  const organizationID = new URL("/#organization", siteURL).href;
  const websiteID = new URL("/#website", siteURL).href;
  const socialImageURL = new URL(image.src, siteURL);
  const socialImageID = `${socialImageURL.href}#primaryimage`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationID,
        name: siteIdentity.name,
        url: siteURL.href,
        logo: new URL("/avatar.png", siteURL).href,
        description: siteIdentity.description,
        knowsAbout: siteIdentity.knowsAbout,
        sameAs: ["https://github.com/matharts"]
      },
      {
        "@type": "WebSite",
        "@id": websiteID,
        url: siteURL.href,
        name: siteIdentity.name,
        description: siteIdentity.description,
        inLanguage: siteIdentity.language,
        publisher: { "@id": organizationID },
        copyrightHolder: { "@id": organizationID },
        copyrightYear: siteIdentity.copyrightYear
      },
      {
        "@type": "ImageObject",
        "@id": socialImageID,
        url: socialImageURL.href,
        contentUrl: socialImageURL.href,
        width: image.width,
        height: image.height,
        caption: image.alt
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalURL.href}#webpage`,
        url: canonicalURL.href,
        name: title,
        description,
        inLanguage: siteIdentity.language,
        isPartOf: { "@id": websiteID },
        about: { "@id": organizationID },
        primaryImageOfPage: { "@id": socialImageID },
        copyrightHolder: { "@id": organizationID },
        copyrightYear: siteIdentity.copyrightYear
      }
    ]
  } as const;
}

function metadataForPage({
  url,
  site = new URL(siteDiscovery.origin),
  title: requestedTitle,
  description: requestedDescription,
  image = defaultSocialImage,
  noindex = false
}: PageMetadataOptions) {
  const title = normalizedText(requestedTitle, siteIdentity.title);
  const description = normalizedText(requestedDescription, siteIdentity.description);
  const canonicalURL = new URL(url.pathname, site);

  return {
    title,
    description,
    image,
    siteName: siteIdentity.name,
    language: siteIdentity.language,
    locale: siteIdentity.locale,
    canonicalURL,
    socialImageURL: new URL(image.src, site),
    robots: noindex
      ? "noindex, follow"
      : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    indexable: !noindex,
    structuredData: noindex
      ? null
      : createSchemaGraph(canonicalURL, site, title, description, image)
  } as const;
}

export const publicationMetadata = {
  forPage: metadataForPage,
  siteSchema(canonicalURL: URL) {
    return createSchemaGraph(
      canonicalURL,
      new URL(siteDiscovery.origin),
      siteIdentity.title,
      siteIdentity.description,
      defaultSocialImage
    )["@graph"];
  }
} as const;
