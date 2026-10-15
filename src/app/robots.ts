import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  if (siteConfig.previewNoIndex) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    ...(siteConfig.siteUrl
      ? { sitemap: `${siteConfig.siteUrl.replace(/\/+$/, "")}/sitemap.xml` }
      : {}),
  };
}
