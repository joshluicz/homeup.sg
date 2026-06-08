"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { uploadListingImage } from "@/lib/listings/storage";
import type { ListingFormData } from "@/lib/listings/types";
import {
  computeAreaSqm,
  computePricePsf,
  generateSlug,
  getPublicListingUrl,
} from "@/lib/listings/utils";
import {
  CONDITION_LABELS,
  FLAT_TYPE_LABELS,
  NEGOTIABLE_LABELS,
} from "@/lib/listings/utils";
import { cn } from "@/lib/utils";
import { Check, Copy, Loader2 } from "lucide-react";

const DEFAULT_FORM: ListingFormData = {
  title: "",
  slug: "",
  status: "draft",
  listed_as: "sell",
  is_sold: false,
  is_featured: false,
  price: 0,
  negotiable: "negotiable",
  area_sqft: 0,
  flat_type: "condominium",
  condition: "no_furnishing",
  rooms: null,
  bathrooms: null,
  tenure: null,
  is_freehold: false,
  address_line_1: "",
  featured_image_url: null,
  image_urls: [],
};

type ListingFormProps = {
  listingId: string;
  initialData?: ListingFormData;
  mode: "create" | "edit";
  initialSaved?: boolean;
};

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-5 text-sm font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-neutral-700">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

export function ListingForm({
  listingId,
  initialData,
  mode,
  initialSaved,
}: ListingFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ListingFormData>(initialData ?? DEFAULT_FORM);
  const [slugEdited, setSlugEdited] = useState(!!initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(
    initialSaved && initialData?.slug ? initialData.slug : null,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slugEdited && form.title) {
      setForm((prev) => ({ ...prev, slug: generateSlug(form.title) }));
    }
  }, [form.title, slugEdited]);

  function update<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const pricePsf = computePricePsf(form.price, form.area_sqft);
  const areaSqm = computeAreaSqm(form.area_sqft);

  async function handleSubmit(action: "draft" | "publish") {
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      featured_image_url: form.featured_image_url,
      status: action === "publish" ? "active" as const : "draft" as const,
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/listings"
          : `/api/admin/listings/${listingId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const body =
        mode === "create"
          ? { data: payload, action, id: listingId }
          : { data: payload, action };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save listing");

      if (mode === "create") {
        router.push(`/admin/listings/${json.listing.id}/edit?saved=1`);
      } else {
        setSavedSlug(json.listing.slug);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save listing");
    } finally {
      setSaving(false);
    }
  }

  async function copyUrl() {
    const slug = savedSlug ?? form.slug;
    await navigator.clipboard.writeText(getPublicListingUrl(slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const uploadImage = (file: File) => uploadListingImage(listingId, file);

  return (
    <div className="space-y-6">
      {savedSlug && (
        <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-primary-800">Listing saved successfully</p>
            <p className="text-sm text-primary-700">{getPublicListingUrl(savedSlug)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={copyUrl}>
            {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? "Copied" : "Copy URL"}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FormSection title="Basic Info">
        <div className="space-y-4">
          <div>
            <FieldLabel required>Title</FieldLabel>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. 3-Bedroom Condo at Orchard"
            />
          </div>
          <div>
            <FieldLabel required>Slug</FieldLabel>
            <input
              className={cn(inputClass, "font-mono text-neutral-600")}
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                update("slug", e.target.value);
              }}
              placeholder="auto-generated-from-title"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>Status</FieldLabel>
              <div className="flex gap-4">
                {(["active", "draft"] as const).map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="status"
                      checked={form.status === s}
                      onChange={() => update("status", s)}
                      className="accent-primary-600"
                    />
                    <span className="capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel required>Listed As</FieldLabel>
              <div className="flex gap-4">
                {(["rent", "sell"] as const).map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="listed_as"
                      checked={form.listed_as === s}
                      onChange={() => update("listed_as", s)}
                      className="accent-primary-600"
                    />
                    <span className="capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Flags">
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => update("is_featured", e.target.checked)}
              className="accent-primary-600"
            />
            Feature on Homepage
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_sold}
              onChange={(e) => update("is_sold", e.target.checked)}
              className="accent-primary-600"
            />
            Sold
          </label>
        </div>
      </FormSection>

      <FormSection title="Financials">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Price (SGD)</FieldLabel>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.price || ""}
              onChange={(e) => update("price", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel>Negotiable</FieldLabel>
            <select
              className={inputClass}
              value={form.negotiable}
              onChange={(e) => update("negotiable", e.target.value as ListingFormData["negotiable"])}
            >
              {Object.entries(NEGOTIABLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel required>Area (sqft)</FieldLabel>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.area_sqft || ""}
              onChange={(e) => update("area_sqft", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel>Price psf</FieldLabel>
            <div className={cn(inputClass, "bg-neutral-50 text-neutral-600")}>
              {pricePsf != null ? `$${pricePsf.toLocaleString()}` : "—"}
            </div>
          </div>
          <div>
            <FieldLabel>Area (sqm)</FieldLabel>
            <div className={cn(inputClass, "bg-neutral-50 text-neutral-600")}>
              {areaSqm != null ? `${areaSqm.toLocaleString()} sqm` : "—"}
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Property Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Flat Type</FieldLabel>
            <select
              className={inputClass}
              value={form.flat_type}
              onChange={(e) => update("flat_type", e.target.value as ListingFormData["flat_type"])}
            >
              {Object.entries(FLAT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Condition</FieldLabel>
            <select
              className={inputClass}
              value={form.condition}
              onChange={(e) => update("condition", e.target.value as ListingFormData["condition"])}
            >
              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Rooms</FieldLabel>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.rooms ?? ""}
              onChange={(e) =>
                update("rooms", e.target.value ? parseInt(e.target.value, 10) : null)
              }
            />
          </div>
          <div>
            <FieldLabel>Bathrooms</FieldLabel>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.bathrooms ?? ""}
              onChange={(e) =>
                update("bathrooms", e.target.value ? parseInt(e.target.value, 10) : null)
              }
            />
          </div>
          <div>
            <FieldLabel>Tenure (years)</FieldLabel>
            <input
              type="number"
              min={0}
              disabled={form.is_freehold}
              className={cn(inputClass, form.is_freehold && "opacity-50")}
              value={form.tenure ?? ""}
              onChange={(e) =>
                update("tenure", e.target.value ? parseInt(e.target.value, 10) : null)
              }
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_freehold}
                onChange={(e) => {
                  update("is_freehold", e.target.checked);
                  if (e.target.checked) update("tenure", null);
                }}
                className="accent-primary-600"
              />
              Freehold
            </label>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Address Line 1</FieldLabel>
            <input
              className={inputClass}
              value={form.address_line_1}
              onChange={(e) => update("address_line_1", e.target.value)}
              placeholder="Block / Street / Postal code"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Media">
        <div className="space-y-6">
          <ImageUploader
            label="Featured Image"
            images={form.featured_image_url ? [form.featured_image_url] : []}
            onImagesChange={(urls) => update("featured_image_url", urls[0] ?? null)}
            onUpload={uploadImage}
            multiple={false}
          />
          <ImageUploader
            label="Additional Images"
            images={form.image_urls}
            onImagesChange={(urls) => update("image_urls", urls)}
            onUpload={uploadImage}
            multiple
          />
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          disabled={saving}
          onClick={() => handleSubmit("draft")}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save as Draft
        </Button>
        <Button disabled={saving} onClick={() => handleSubmit("publish")}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Publish
        </Button>
      </div>
    </div>
  );
}
