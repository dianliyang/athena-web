"use client";

import type { Workout } from "@/types";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

type WorkoutPriceFields = Pick<
  Workout,
  "priceStudent" | "priceStaff" | "priceExternal" | "priceExternalReduced"
>;

interface WorkoutPriceProps extends WorkoutPriceFields {
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  triggerClassName?: string;
}

const PRICE_LABELS: Array<{ key: keyof WorkoutPriceFields; label: string }> = [
  { key: "priceStudent", label: "Student" },
  { key: "priceStaff", label: "Staff" },
  { key: "priceExternal", label: "External" },
  { key: "priceExternalReduced", label: "External (reduced)" },
];

export function formatWorkoutPrice(value: number | null): string {
  return value == null ? "-" : `€${Number(value).toFixed(2)}`;
}

export function getPrimaryWorkoutPrice(prices: WorkoutPriceFields): number | null {
  for (const { key } of PRICE_LABELS) {
    const value = prices[key];
    if (value != null) return value;
  }

  return null;
}

export function getPrimaryWorkoutPriceLabel(prices: WorkoutPriceFields): string {
  return formatWorkoutPrice(getPrimaryWorkoutPrice(prices));
}

export function getWorkoutPriceDetails(prices: WorkoutPriceFields): Array<{ label: string; value: string }> {
  return PRICE_LABELS.flatMap(({ key, label }) => {
    const value = prices[key];
    return value == null ? [] : [{ label, value: formatWorkoutPrice(value) }];
  });
}

export function WorkoutPrice({
  priceStudent,
  priceStaff,
  priceExternal,
  priceExternalReduced,
  className,
  labelClassName,
  valueClassName,
  triggerClassName,
}: WorkoutPriceProps) {
  const prices = { priceStudent, priceStaff, priceExternal, priceExternalReduced };
  const details = getWorkoutPriceDetails(prices);
  const primaryPriceLabel = getPrimaryWorkoutPriceLabel(prices);

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <p className={cn("text-[10px] uppercase tracking-wide text-muted-foreground/70", labelClassName)}>
        Price
      </p>
      <HoverCard openDelay={120} closeDelay={80}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex w-fit items-center rounded-sm text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              triggerClassName,
            )}
            aria-label="Price details"
          >
            <span className={cn("text-sm font-medium text-foreground", valueClassName)}>
              {primaryPriceLabel}
            </span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-52 p-3" align="end">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Price details
          </p>
          <div className="space-y-1">
            {details.length > 0 ? (
              details.map((item) => (
                <p key={item.label} className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <span>{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </p>
              ))
            ) : (
              <p className="text-[11px] text-muted-foreground">No prices available</p>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
