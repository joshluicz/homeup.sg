export const WHATSAPP_NUMBER = "6580877015";

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildListingWhatsAppUrl(listingName: string, listingPrice: string): string {
  return buildWhatsAppUrl(
    `Hi, I'm interested in ${listingName} listed at ${listingPrice}. Could you share more details?`,
  );
}

export function buildBuyPlanWhatsAppUrl(planName: string): string {
  return buildWhatsAppUrl(
    `Hi, I'm interested in the ${planName} buyer representation plan on HomeUP. Can we chat?`,
  );
}

export function buildSellPlanWhatsAppUrl(planName: string): string {
  return buildWhatsAppUrl(
    `Hi, I'm interested in the ${planName} fixed-fee selling plan on HomeUP. Can we chat?`,
  );
}

export const WHATSAPP_MESSAGES = {
  faqHomepage:
    "Hi, I read the FAQs on HomeUP and still have a question. Can we chat?",
  faqBuyHdb:
    "Hi, I'm looking at buying an HDB and have a question after reading your FAQs.",
  faqBuyCondo:
    "Hi, I'm looking at buying a resale condo or landed home and have a question after reading your FAQs.",
  faqBuyNewLaunch:
    "Hi, I'm looking at a new launch and have a question after reading your FAQs.",
  faqBuyGeneral:
    "Hi, I'm exploring buying with HomeUP and have a question after reading your FAQs.",
  faqSellHdb:
    "Hi, I'm selling my HDB and have a question after reading your FAQs.",
  faqSellCondo:
    "Hi, I'm selling my condo and have a question after reading your FAQs.",
  faqSellLanded:
    "Hi, I'm selling my landed property and have a question after reading your FAQs.",
  faqSellGeneral:
    "Hi, I'm exploring selling with HomeUP and have a question after reading your FAQs.",
  heroHome: "Hi, I'd like to find out more about selling with HomeUP.",
  heroBuy: "Hi, I'd like to find out more about buying with HomeUP.",
  heroBuyHdb: "Hi, I'd like to find out more about buying an HDB with HomeUP.",
  heroBuyCondo:
    "Hi, I'd like to find out more about buying a resale condo or landed home with HomeUP.",
  heroBuyNewLaunch:
    "Hi, I'd like to find out more about buying a new launch with HomeUP.",
  heroSell: "Hi, I'd like to find out more about selling with HomeUP.",
  heroSellHdb: "Hi, I'd like to find out more about selling my HDB with HomeUP.",
  heroSellCondo: "Hi, I'd like to find out more about selling my condo with HomeUP.",
  heroSellLanded:
    "Hi, I'd like to find out more about selling my landed property with HomeUP.",
  ctaBanner: "Hi, I'd like to schedule a planning conversation with HomeUP.",
  navbar: "Hi, I'd like to get in touch with HomeUP.",
  float: "Hi, I have a question for HomeUP.",
  comparisonTable:
    "Hi, I'm comparing selling options and would like to talk to HomeUP.",
} as const;

export type WhatsAppMessageKey = keyof typeof WHATSAPP_MESSAGES;

export function whatsAppUrlFor(key: WhatsAppMessageKey): string {
  return buildWhatsAppUrl(WHATSAPP_MESSAGES[key]);
}
