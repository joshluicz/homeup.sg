import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { buildIntakeWhatsAppUrl } from "@/lib/intake/contact";
import { LISTING_TYPE_LABELS, listingTypeFee } from "@/lib/intake/listing-types";
import { getIntakeSummary } from "@/lib/intake/queries";

function formatRent(amount: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function RentThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  const summary = await getIntakeSummary(id);
  if (!summary) notFound();

  const whatsappUrl = buildIntakeWhatsAppUrl();
  const fee = listingTypeFee(summary.listing_type);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Thanks — we&apos;ve received your listing</h1>
          <p className="text-sm text-neutral-600">We&apos;ll be in touch within 24 hours.</p>
        </div>

        <dl className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Listing</dt>
            <dd className="font-medium text-right">{LISTING_TYPE_LABELS[summary.listing_type]}</dd>
          </div>
          {fee && (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Fixed fee</dt>
              <dd className="font-medium">{fee}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">District</dt>
            <dd className="font-medium">{summary.district}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Monthly rent</dt>
            <dd className="font-medium">{formatRent(summary.rent_monthly)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Photos</dt>
            <dd className="font-medium">{summary.photo_count} uploaded</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Submitted</dt>
            <dd className="font-medium">{formatDate(summary.submitted_at)}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="h-12 w-full">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/list">Submit another listing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
