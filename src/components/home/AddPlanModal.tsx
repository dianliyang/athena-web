"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, LocateFixed, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "@/components/ui/input-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxSeparator
} from "@/components/ui/combobox";
import { format, parseISO } from "date-fns";
import { type DateRange } from "react-day-picker";

interface PlanData {
  id: number;
  start_date: string;
  end_date: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  location: string;
  kind?: string | null;
  timezone?: string | null;
}

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (plan: PlanData) => void;
  mode?: "modal" | "inline";
  course: {
    id: number;
    title: string;
    courseCode?: string;
    university?: string;
  };
  existingPlan?: PlanData | null;
}

function resolvePreferredLanguage(): string {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.trim();
    if (htmlLang) return htmlLang;
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en";
}

async function reverseGeocodeLocationName(
  lat: number,
  lng: number
): Promise<string> {
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const language = resolvePreferredLanguage();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=${encodeURIComponent(language)}`
    );
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      name?: string;
      display_name?: string;
      address?: Record<string, string | undefined>;
    };
    const address = data.address || {};
    const locality =
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.county ||
      address.state;
    const microArea =
      address.road ||
      address.pedestrian ||
      address.footway ||
      address.amenity ||
      address.building;
    const area = address.suburb || address.neighbourhood || address.city_district;
    const country = address.country;
    const compact = [microArea, area, locality, country].filter(Boolean).join(", ");
    if (compact) return compact;
    if (data.name) return data.name;
    if (data.display_name) return data.display_name.split(",").slice(0, 3).join(",").trim();
    return fallback;
  } catch {
    return fallback;
  }
}

export default function AddPlanModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "modal",
  course,
  existingPlan
}: AddPlanModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const currentTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const timeZoneOptions = useMemo(() => {
    try {
      const intlWithSupported = Intl as unknown as Intl.DateTimeFormatConstructor & {
        supportedValuesOf?: (key: string) => string[];
      };
      const zones = intlWithSupported.supportedValuesOf?.("timeZone");
      if (zones && zones.length > 0) return zones;
      return [currentTimeZone, "UTC"];
    } catch {
      return [currentTimeZone, "UTC"];
    }
  }, [currentTimeZone]);

  const getInitialFormData = useCallback(() => ({
    startDate: existingPlan?.start_date || new Date().toISOString().split("T")[0],
    endDate:
      existingPlan?.end_date ||
      new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0],
    days: existingPlan?.days_of_week || ([] as number[]),
    startTime: existingPlan?.start_time?.slice(0, 5) || "09:00",
    endTime: existingPlan?.end_time?.slice(0, 5) || "11:00",
    kind: existingPlan?.kind?.trim() || "Self-Study",
    location: existingPlan?.location || "Library",
    timezone: existingPlan?.timezone?.trim() || currentTimeZone
  }), [existingPlan, currentTimeZone]);

  const [formData, setFormData] = useState(getInitialFormData);

  useEffect(() => {
    if (!isOpen) return;
    const next = getInitialFormData();
    setFormData(next);
  }, [isOpen, getInitialFormData]);

  const timeZoneGroups = useMemo(() => {
    const zones = [...timeZoneOptions];
    const selected = formData.timezone?.trim();
    if (selected && !zones.includes(selected)) {
      zones.unshift(selected);
    }
    const groups = new Map<string, string[]>();
    zones.forEach((zone) => {
      let group = "Other";
      if (zone.startsWith("America/")) group = "Americas";
      else if (zone.startsWith("Europe/")) group = "Europe";
      else if (zone.startsWith("Asia/")) group = "Asia";
      else if (zone.startsWith("Africa/")) group = "Africa";
      else if (zone.startsWith("Australia/") || zone.startsWith("Pacific/"))
        group = "Australia & Pacific";
      else if (zone === "UTC") group = "Standard";

      const list = groups.get(group) || [];
      list.push(zone);
      groups.set(group, list);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [timeZoneOptions, formData.timezone]);

  const handleSave = () => {
    startTransition(async () => {
      setLoading(true);
      try {
        const payload = {
          action: existingPlan ? "update_plan" : "add_plan",
          planId: existingPlan?.id,
          courseId: course.id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          daysOfWeek: formData.days,
          startTime: formData.startTime + ":00",
          endTime: formData.endTime + ":00",
          kind: formData.kind,
          location: formData.location,
          timezone: formData.timezone
        };

        const res = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save study plan");
        }

        const savedPlan = await res.json();
        toast.success(
          existingPlan ? "Study plan updated" : "Study plan added successfully"
        );
        if (onSuccess) onSuccess(savedPlan);
        onClose();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save plan");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const name = await reverseGeocodeLocationName(
            position.coords.latitude,
            position.coords.longitude
          );
          setFormData((p) => ({ ...p, location: name }));
          toast.success("Location updated");
        } catch {
          toast.error("Failed to resolve location name");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error("Failed to get your location");
      },
      { timeout: 10000 }
    );
  };

  const dateRange: DateRange | undefined = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return undefined;
    try {
      return {
        from: parseISO(formData.startDate),
        to: parseISO(formData.endDate)
      };
    } catch {
      return undefined;
    }
  }, [formData.startDate, formData.endDate]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      setFormData((p) => ({ ...p, startDate: format(range.from!, "yyyy-MM-dd") }));
    }
    if (range?.to) {
      setFormData((p) => ({ ...p, endDate: format(range.to!, "yyyy-MM-dd") }));
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <FieldGroup>
            <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Schedule Window
            </FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 px-3 border-border/60 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <Clock className="mr-2 h-4 w-4 opacity-50" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Weekdays
            </FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <Toggle
                  key={i}
                  size="sm"
                  pressed={formData.days.includes(i)}
                  onPressedChange={(pressed) => {
                    setFormData((p) => ({
                      ...p,
                      days: pressed
                        ? [...p.days, i].sort()
                        : p.days.filter((d) => d !== i)
                    }));
                  }}
                  className="h-8 w-8 p-0 text-[10px] font-bold border border-border/40 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all"
                >
                  {day}
                </Toggle>
              ))}
            </div>
          </FieldGroup>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Start
              </FieldLabel>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, startTime: e.target.value }))
                }
                className="h-10 border-border/60 focus-visible:ring-primary/20"
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                End
              </FieldLabel>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, endTime: e.target.value }))
                }
                className="h-10 border-border/60 focus-visible:ring-primary/20"
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Location
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                placeholder="Where will you study?"
                value={formData.location}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, location: e.target.value }))
                }
                className="h-10 border-border/60 focus-visible:ring-primary/20"
              />
              <InputGroupAddon className="p-0 border-border/60">
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={locating}
                  onClick={handleLocateMe}
                  className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                >
                  {locating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </FieldGroup>
        </div>
      </div>

      <Separator className="bg-border/40" />

      <div className="grid gap-6 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Session Type
          </FieldLabel>
          <Combobox
            value={formData.kind}
            onValueChange={(val) => setFormData((p) => ({ ...p, kind: val || "" }))}
          >
            <ComboboxInput
              placeholder="Select type..."
              className="h-10 border-border/60 focus-visible:ring-primary/20"
            />
            <ComboboxContent>
              <ComboboxEmpty>No type found.</ComboboxEmpty>
              <ComboboxGroup>
                {[
                  "Self-Study",
                  "Lecture",
                  "Lab",
                  "Recitation",
                  "Project",
                  "Exam Prep"
                ].map((type) => (
                  <ComboboxItem key={type} value={type}>
                    {type}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            </ComboboxContent>
          </Combobox>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Timezone
          </FieldLabel>
          <Combobox
            value={formData.timezone || ""}
            onValueChange={(val) => setFormData((p) => ({ ...p, timezone: val || "" }))}
          >
            <ComboboxInput
              placeholder="Search timezone..."
              className="h-10 border-border/60 focus-visible:ring-primary/20 font-mono text-[11px]"
            />
            <ComboboxContent className="max-h-[300px] overflow-auto">
              <ComboboxEmpty>No timezone found.</ComboboxEmpty>
              {timeZoneGroups.map(([group, zones]) => (
                <div key={group}>
                  <ComboboxLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 py-2 px-3">
                    {group}
                  </ComboboxLabel>
                  <ComboboxGroup>
                    {zones.map((zone) => (
                      <ComboboxItem
                        key={zone}
                        value={zone}
                        className="font-mono text-[11px] py-2"
                      >
                        {zone.replace(/_/g, " ")}
                      </ComboboxItem>
                    ))}
                  </ComboboxGroup>
                  <ComboboxSeparator className="bg-border/30" />
                </div>
              ))}
            </ComboboxContent>
          </Combobox>
        </FieldGroup>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-xs font-bold uppercase tracking-wider"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || formData.days.length === 0}
          className="px-8 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingPlan ? "Update Plan" : "Create Plan"}
        </Button>
      </div>
    </div>
  );

  if (mode === "inline") {
    return (
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold tracking-tight">
            {existingPlan ? "Edit Study Plan" : "Add Study Plan"}
          </CardTitle>
          <CardDescription className="text-xs">
            {course.courseCode ? `${course.courseCode} · ` : ""}
            {course.title}
          </CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverContent
        className="w-[95vw] max-w-2xl p-6 shadow-2xl border-border/40 sm:rounded-2xl"
        align="center"
        sideOffset={8}
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {existingPlan ? "Adjust Study Plan" : "New Study Plan"}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              {course.courseCode ? (
                <span className="text-primary/80 font-bold">{course.courseCode}</span>
              ) : null}
              {course.courseCode ? " · " : ""}
              {course.title}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {content}
      </PopoverContent>
    </Popover>
  );
}
