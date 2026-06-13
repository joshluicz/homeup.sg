import type { FaqItem } from "@/lib/data/faqs";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  serviceSchema,
  type BreadcrumbItem,
  type HowToStep,
} from "@/lib/seo/schema";

interface ServiceOffer {
  name: string;
  price: string;
  description: string;
}

interface LandingPageJsonLdProps {
  breadcrumbs: BreadcrumbItem[];
  faq?: FaqItem[];
  howTo?: {
    name: string;
    description: string;
    steps: HowToStep[];
  };
  service?: {
    name: string;
    description: string;
    path: string;
    offers?: ServiceOffer[];
  };
}

export function LandingPageJsonLd({
  breadcrumbs,
  faq,
  howTo,
  service,
}: LandingPageJsonLdProps) {
  const schemas: Record<string, unknown>[] = [breadcrumbSchema(breadcrumbs)];

  if (faq?.length) {
    schemas.push(faqSchema(faq));
  }

  if (howTo) {
    schemas.push(howToSchema(howTo.name, howTo.description, howTo.steps));
  }

  if (service) {
    schemas.push(
      serviceSchema({
        name: service.name,
        description: service.description,
        path: service.path,
        offers: service.offers,
      }),
    );
  }

  return <JsonLd data={schemas} />;
}
