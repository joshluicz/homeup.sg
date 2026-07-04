"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultistepForm, type MultistepFormStep } from "@/components/ui/multistep-form";
import { getAttributionForSubmit } from "@/lib/intake/attribution";
import { SG_DISTRICTS } from "@/lib/intake/districts";
import { LISTING_TYPE_OPTIONS } from "@/lib/intake/listing-types";
import type { ListingType } from "@/lib/intake/types";
import { MAX_PHOTOS, MIN_PHOTOS, RECOMMENDED_PHOTOS, MAX_PHOTO_BYTES } from "@/lib/intake/storage";
import { cn } from "@/lib/utils";

type PhotoPreview = {
  file: File;
  url: string;
};

const INTAKE_STEPS: MultistepFormStep[] = [
  {
    id: "contact",
    title: "Contact",
    description: "How can we reach you?",
  },
  {
    id: "listing",
    title: "Listing",
    description: "What are you renting out?",
  },
  {
    id: "property",
    title: "Property",
    description: "Tell us about the unit",
  },
  {
    id: "photos",
    title: "Photos",
    description: "Add photos and any extra notes",
  },
];

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const textareaClassName =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function LandlordIntakeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const attribution = useMemo(
    () => getAttributionForSubmit(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [listingType, setListingType] = useState<ListingType | "">("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formToken, setFormToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [validationTick, setValidationTick] = useState(0);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const bump = () => setValidationTick((n) => n + 1);
    form.addEventListener("input", bump);
    form.addEventListener("change", bump);
    return () => {
      form.removeEventListener("input", bump);
      form.removeEventListener("change", bump);
    };
  }, []);

  useEffect(() => {
    fetch("/api/intake/token")
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Could not start form session");
        }
        return res.json() as Promise<{ token: string }>;
      })
      .then((data) => {
        setFormToken(data.token);
        setTokenError(null);
      })
      .catch((err) => {
        setTokenError(err instanceof Error ? err.message : "Could not start form session");
      });
  }, []);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [photos]);

  const handlePhotoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (selected.length === 0) return;

      const combined = [...photos.map((p) => p.file), ...selected];
      if (combined.length > MAX_PHOTOS) {
        setError(`Maximum ${MAX_PHOTOS} photos allowed`);
        return;
      }

      for (const file of selected) {
        if (!file.type.startsWith("image/")) {
          setError("Photos must be JPG, PNG, or WebP");
          return;
        }
        if (file.size > MAX_PHOTO_BYTES) {
          setError("Each photo must be 10MB or smaller");
          return;
        }
      }

      setError(null);
      setPhotos((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return combined.map((file) => ({
          file,
          url: URL.createObjectURL(file),
        }));
      });
    },
    [photos],
  );

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const form = formRef.current;
    if (!form) return false;

    const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      `[data-step="${currentStep}"] [required]`,
    );

    for (const field of fields) {
      if (!field.reportValidity()) return false;
    }

    if (currentStep === 1 && !listingType) {
      setError("Please select what you are renting out");
      return false;
    }

    setError(null);
    return true;
  }, [currentStep, listingType]);

  const isStepValid = useCallback((): boolean => {
    const form = formRef.current;
    if (!form) return currentStep === 3;

    if (currentStep === 1) return listingType !== "";

    const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      `[data-step="${currentStep}"] [required]`,
    );

    for (const field of fields) {
      if (field.type === "radio") continue;
      if (!field.value.trim()) return false;
    }

    return true;
  }, [currentStep, listingType, validationTick]);

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((s) => Math.min(INTAKE_STEPS.length - 1, s + 1));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!formToken) {
      setError(tokenError ?? "Form not ready — please refresh the page");
      return;
    }

    const form = formRef.current;
    if (!form || !validateCurrentStep()) return;

    const formData = new FormData(form);

    formData.set("listing_type", listingType);
    formData.set("source_variant", attribution.source_variant ?? "");
    formData.set("utm_source", attribution.utm_source ?? "");
    formData.set("utm_medium", attribution.utm_medium ?? "");
    formData.set("utm_campaign", attribution.utm_campaign ?? "");
    formData.set("utm_content", attribution.utm_content ?? "");
    formData.set("form_token", formToken);

    photos.forEach((photo) => formData.append("photos", photo.file));

    setSubmitting(true);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        throw new Error(result.error ?? "Submission failed");
      }

      router.push(`/list/thanks?id=${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  };

  const displayError = error ?? tokenError;

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="relative">
      <input
        type="text"
        name="company_name"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <MultistepForm
        steps={INTAKE_STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isStepValid={isStepValid() && Boolean(formToken)}
        isSubmitting={submitting}
        submitLabel="Submit listing details"
        footerExtra={
          displayError ? (
            <p className="w-full rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {displayError}
            </p>
          ) : undefined
        }
      >
        {currentStep === 0 && (
          <div data-step="0" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="landlord_name">Name *</Label>
              <Input id="landlord_name" name="landlord_name" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landlord_phone">Phone *</Label>
              <Input
                id="landlord_phone"
                name="landlord_phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="91234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landlord_email">Email</Label>
              <Input
                id="landlord_email"
                name="landlord_email"
                type="email"
                autoComplete="email"
                placeholder="Optional"
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <fieldset data-step="1" className="space-y-3">
            <legend className="sr-only">What are you renting out?</legend>
            <div className="space-y-2">
              {LISTING_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    listingType === option.value
                      ? "border-primary-600 bg-primary-50/40"
                      : "border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="listing_type_ui"
                      value={option.value}
                      checked={listingType === option.value}
                      onChange={() => setListingType(option.value)}
                      className="h-4 w-4 accent-primary-600"
                    />
                    {option.label}
                  </span>
                  {option.fee ? (
                    <span className="text-xs font-semibold text-neutral-600">{option.fee}</span>
                  ) : null}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {currentStep === 2 && (
          <div data-step="2" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <select id="district" name="district" required className={selectClassName}>
                <option value="">Select district</option>
                {SG_DISTRICTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent_monthly">Monthly rent (SGD) *</Label>
                <Input
                  id="rent_monthly"
                  name="rent_monthly"
                  type="number"
                  min={1}
                  step={1}
                  required
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sqft">Size (sqft)</Label>
                <Input id="sqft" name="sqft" type="number" min={1} step={1} inputMode="numeric" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min={0}
                  step={1}
                  required
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min={1}
                  step={1}
                  required
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mrt_distance">MRT distance</Label>
              <Input id="mrt_distance" name="mrt_distance" placeholder="e.g. 5 min walk to Bishan" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="furnishing">Furnishing</Label>
              <select id="furnishing" name="furnishing" className={selectClassName}>
                <option value="">Select furnishing</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="partial">Partially furnished</option>
                <option value="fully">Fully furnished</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability_date">Available from</Label>
              <Input id="availability_date" name="availability_date" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_points">Selling points</Label>
              <textarea
                id="selling_points"
                name="selling_points"
                rows={3}
                placeholder="One point per line, up to 3"
                className={textareaClassName}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div data-step="3" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="photos">
                Photos{MIN_PHOTOS > 0 ? " *" : ""}
                {MIN_PHOTOS > 0 ? ` (${MIN_PHOTOS}–${MAX_PHOTOS})` : ` (up to ${MAX_PHOTOS})`}
              </Label>
              {RECOMMENDED_PHOTOS > 0 && (
                <p className="text-sm text-neutral-500">
                  At least {RECOMMENDED_PHOTOS} photos helps us market your listing faster.
                </p>
              )}
              <label
                htmlFor="photos"
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/30",
                  photos.length >= RECOMMENDED_PHOTOS && "border-primary-200 bg-primary-50/20",
                )}
              >
                <Upload className="h-6 w-6 text-neutral-400" />
                <span className="text-sm font-medium text-neutral-700">Tap to add photos</span>
                <span className="text-sm text-neutral-500">JPG, PNG, or WebP · max 10MB each</span>
              </label>
              <input
                id="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={handlePhotoChange}
              />
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((photo, index) => (
                    <div key={photo.url} className="relative aspect-square overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Anything else we should know?"
                className={textareaClassName}
              />
            </div>
          </div>
        )}
      </MultistepForm>
    </form>
  );
}
