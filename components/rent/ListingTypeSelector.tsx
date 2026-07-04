"use client";

import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  LISTING_TYPE_OPTIONS,
  formatListingTypeLabel,
  type ListingTypeOption,
} from "@/lib/intake/listing-types";
import type { ListingType } from "@/lib/intake/types";
import { cn } from "@/lib/utils";

type ListingTypeSelectorProps = {
  value: ListingType | "";
  onChange: (value: ListingType) => void;
  className?: string;
};

function ListingTypeCard({
  option,
  selected,
}: {
  option: ListingTypeOption;
  selected: boolean;
}) {
  const id = `listing-type-${option.value}`;

  return (
    <Label
      htmlFor={id}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 transition-all",
        selected
          ? "border-primary-600 bg-primary-50/60 shadow-sm"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80",
      )}
    >
      <RadioGroupItem id={id} value={option.value} className="sr-only" />

      <span
        aria-hidden
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? "border-primary-600 bg-primary-600 text-white"
            : "border-neutral-300 bg-white group-hover:border-neutral-400",
        )}
      >
        <Check
          className={cn(
            "h-3 w-3 stroke-[3] transition-opacity",
            selected ? "opacity-100" : "opacity-0",
          )}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-neutral-900">{option.property}</span>
        <span className="block text-sm text-neutral-600">{option.unit}</span>
      </span>

      {option.fee ? (
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
            selected ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-700",
          )}
        >
          {option.fee}
        </span>
      ) : (
        <span className="shrink-0 text-xs font-medium text-neutral-500">Custom</span>
      )}
    </Label>
  );
}

export function ListingTypeSelector({ value, onChange, className }: ListingTypeSelectorProps) {
  return (
    <RadioGroup
      value={value || undefined}
      onValueChange={(next) => onChange(next as ListingType)}
      className={cn("grid gap-2.5", className)}
    >
      {LISTING_TYPE_OPTIONS.map((option) => (
        <ListingTypeCard key={option.value} option={option} selected={value === option.value} />
      ))}
    </RadioGroup>
  );
}

export { formatListingTypeLabel };
