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
}

export function buildPageMetadata({
  title,
  description,
  path,
  ogImage = OG_IMAGE,
  ogImageAlt = "The HomeUP team — CEA-licensed property agents in Singapore",
  ogImageWidth = 920,
  ogImageHeight = 614,
}: PageMetaOptions): Metadata {
  const url = `${SITE_URL}${path}`;
  const displayTitle = title.includes("|") ? title : `${title} | HomeUP`;

  return {
    title: { absolute: displayTitle },
    description,
    alternates: { canonical: url },
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
