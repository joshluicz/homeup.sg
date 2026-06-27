import type { Metadata } from "next";
import { OG_IMAGE, SITE_URL } from "./constants";

interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  /** When set, canonical points here instead of `path` (e.g. watch page → article). */
  canonicalPath?: string;
  robots?: Metadata["robots"];
}

export function buildPageMetadata({
  title,
  description,
  path,
  ogImage = OG_IMAGE,
  ogImageAlt = "The HomeUP team, CEA-licensed property agents in Singapore",
  ogImageWidth = 920,
  ogImageHeight = 614,
  canonicalPath,
  robots,
}: PageMetaOptions): Metadata {
  const url = `${SITE_URL}${path}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath ?? path}`;
  const displayTitle = title.includes("|") ? title : `${title} | HomeUP`;

  return {
    title: { absolute: displayTitle },
    description,
    ...(robots && { robots }),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      url,
      title: displayTitle,
      description,
      images: [
        {
          url: ogImage,
          width: ogImageWidth,
          height: ogImageHeight,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
      images: [ogImage],
    },
  };
}
