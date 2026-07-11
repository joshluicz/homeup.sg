"use client";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionBlendTop } from "@/components/ui/SectionBlend";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { SavingsSlider } from "@/components/ui/SavingsSlider";
import { SellPlanCard } from "@/components/ui/SellPlanCard";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { getPropertyTypeStyle, type PropertyTypeKey } from "@/lib/data/property-type-styles";
import { SELL_PLANS, type SellPropertyType } from "@/lib/data/sell-pricing";

const GST_RATE = 0.09;
const COMMISSION_RATE = 0.02;

function withGst(amount: number): number {
  return Math.round(amount * (1 + GST_RATE));
}

function formatSgd(amount: number): string {
  return `$${amount.toLocaleString("en-SG")}`;
}

/** Always show the marketing price — never the GST-inclusive figure. */
function formatHomeupFee(base: number): string {
  return `${formatSgd(base)}*`;
}

const COMPARISON_SOURCE = [
  { propertyType: "HDB" as PropertyTypeKey, type: "HDB Flat", salePrice: 500_000, homeupBase: SELL_PLANS[0].price },
  { propertyType: "Condo" as PropertyTypeKey, type: "Condo / EC", salePrice: 1_200_000, homeupBase: SELL_PLANS[1].price },
  { propertyType: "Landed" as PropertyTypeKey, type: "Landed Home", salePrice: 3_000_000, homeupBase: SELL_PLANS[2].price },
] as const;

const COMPARISON_ROWS = COMPARISON_SOURCE.map((row) => {
  const typicalBase = Math.round(row.salePrice * COMMISSION_RATE);
  const typicalInclGst = withGst(typicalBase);
  const homeupInclGst = withGst(row.homeupBase);

  return {
    ...row,
    typicalBase,
    typicalInclGst,
    homeupInclGst,
    savings: typicalInclGst - homeupInclGst,
  };
});

interface PricingSection4Props {
  id?: string;
  filterType?: SellPropertyType | null;
  showLearnMore?: boolean;
  defaultSliderType?: SellPropertyType;
  showSlider?: boolean;
}

function ComparisonCards() {
  return (
    <div className="grid gap-4 md:hidden">
      {COMPARISON_ROWS.map((row) => {
        const typeStyle = getPropertyTypeStyle(row.propertyType);
        return (
          <Card key={row.type} className="overflow-hidden border-neutral-200 shadow-sm">
            <div className={cn("border-b border-neutral-100 px-5 py-3", typeStyle.header)}>
              <p className="font-semibold text-neutral-900">{row.type}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Example sale {formatSgd(row.salePrice)}
              </p>
            </div>
            <CardContent className="p-5 pt-4">
              <dl className="grid gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-600">Typical 2% (incl. GST)</dt>
                  <dd className="font-medium tabular-nums text-neutral-900">
                    {formatSgd(row.typicalInclGst)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-600">HomeUP fixed fee*</dt>
                  <dd className="font-medium tabular-nums text-neutral-900">
                    {formatHomeupFee(row.homeupBase)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-2.5">
                  <dt className="font-semibold text-neutral-900">You save</dt>
                  <dd className="font-display font-bold tabular-nums text-primary-700">
                    {formatSgd(row.savings)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ComparisonTable() {
  return (
    <Card className="hidden overflow-hidden rounded-xl border-neutral-200 shadow-sm md:block">
      <CardContent className="p-0">
        <Table>
          <TableCaption className="sr-only">
            HomeUP fixed fee compared to typical 2% agent commission in Singapore. HomeUP fees
            shown before GST; savings use GST-inclusive amounts.
          </TableCaption>
          <TableHeader>
            <TableRow className="border-b border-neutral-200 bg-neutral-50 hover:bg-neutral-50">
              <TableHead className="h-auto px-6 py-3.5 font-semibold normal-case tracking-normal text-neutral-900">
                Property type
              </TableHead>
              <TableHead className="h-auto px-6 py-3.5 font-semibold normal-case tracking-normal text-neutral-900">
                Example sale price
              </TableHead>
              <TableHead className="h-auto px-6 py-3.5 font-semibold normal-case tracking-normal text-neutral-900">
                Typical 2% fee
                <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                  incl. 9% GST
                </span>
              </TableHead>
              <TableHead className="h-auto px-6 py-3.5 font-semibold normal-case tracking-normal text-neutral-900">
                HomeUP fixed fee*
                <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                  + 9% GST
                </span>
              </TableHead>
              <TableHead className="h-auto bg-primary-50/70 px-6 py-3.5 font-semibold normal-case tracking-normal text-primary-800">
                You save
                <span className="mt-0.5 block text-xs font-normal text-primary-700">
                  after GST on both
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COMPARISON_ROWS.map((row) => {
              const typeStyle = getPropertyTypeStyle(row.propertyType);
              return (
                <TableRow key={row.type} className="border-neutral-100 last:border-b-0">
                  <TableCell
                    className={cn(
                      "border-l-[3px] px-6 py-4 font-semibold text-neutral-900",
                      typeStyle.accentBorder,
                    )}
                  >
                    {row.type}
                  </TableCell>
                  <TableCell className="px-6 py-4 tabular-nums text-neutral-700">
                    {formatSgd(row.salePrice)}
                  </TableCell>
                  <TableCell className="px-6 py-4 tabular-nums text-neutral-600">
                    {formatSgd(row.typicalInclGst)}
                  </TableCell>
                  <TableCell className="px-6 py-4 font-semibold tabular-nums text-neutral-900">
                    {formatHomeupFee(row.homeupBase)}
                  </TableCell>
                  <TableCell className="bg-primary-50/40 px-6 py-4 font-semibold tabular-nums text-primary-700">
                    {formatSgd(row.savings)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function PricingSection4({
  id = "pricing",
  filterType = null,
  showLearnMore = true,
  defaultSliderType = "HDB",
  showSlider = true,
}: PricingSection4Props) {
  const plans = filterType
    ? SELL_PLANS.filter((p) => p.type === filterType)
    : SELL_PLANS;

  const gridClass =
    plans.length === 1 ? "mt-6 max-w-md mx-auto" : "mt-6 grid gap-6 md:grid-cols-3";

  const reserveFootnoteSpace =
    plans.length > 1 && plans.some((p) => p.footnote);

  return (
    <section
      aria-label="Fixed-fee pricing packages"
      id={id}
      className="relative overflow-hidden section-padding bg-neutral-50"
    >
      <SectionBlendTop from="primary-50" />
      <div className="container-page">
        {showSlider && (
          <FadeInUp delay={0.06}>
            <SavingsSlider mode="sell" defaultType={defaultSliderType} className="mt-0" />
          </FadeInUp>
        )}

        <FadeInUp delay={0.08} className="mt-10 sm:mt-12">
          <p className="text-sm font-bold text-neutral-900">Our fixed fees</p>
          <p className="mt-1 text-sm font-normal text-neutral-500">
            What you pay when you choose HomeUP
          </p>
        </FadeInUp>

        <StaggerContainer className={gridClass}>
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="h-full cursor-default"
              >
                <SellPlanCard
                  filterType={plan.type}
                  showLearnMore={showLearnMore}
                  learnMoreHref={plan.learnMoreHref}
                  reserveFootnoteSpace={reserveFootnoteSpace}
                />
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.12} className="mx-auto mt-14 max-w-3xl sm:mt-16">
          <h3 className="text-center font-display text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
            Same service. Different fee model.
          </h3>
          <p className="mt-4 text-center text-sm leading-relaxed text-neutral-600 sm:text-base speakable-fixed-fee-definition">
            A fixed-fee agent charges one flat fee. You still get listing, marketing,
            negotiation, and full documentation. The only change is what you pay at the end.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.18} className="mt-12 sm:mt-14">
          <div className="section-header mb-6">
            <Eyebrow>Compare the numbers</Eyebrow>
            <h3 className="section-title text-2xl sm:text-3xl">
              HomeUP vs Typical 2% Agent
            </h3>
          </div>

          <ComparisonCards />
          <ComparisonTable />

          <p className="mt-4 text-center text-[10px] font-normal leading-relaxed text-neutral-400">
            * HomeUP fixed fees shown before 9% GST. Savings = typical 2% commission (incl.
            GST) minus HomeUP fixed fee (incl. GST), based on the example sale prices shown.
          </p>
          <p className="mt-2 text-center text-[10px] font-normal leading-relaxed text-neutral-400">
            Typical 2% commission reflects common market practice among CEA-registered
            salespersons in Singapore. It is not a statutory or regulated rate.
          </p>
        </FadeInUp>

      </div>
    </section>
  );
}
