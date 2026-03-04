"use client";

import { useEffect, useState } from "react";
import { Workout } from "@/types";
import { Dictionary } from "@/lib/dictionary";
import WorkoutCard from "./WorkoutCard";
import WorkoutListHeader from "./WorkoutListHeader";
import { ChevronDown, ExternalLink } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WorkoutListProps {
  initialWorkouts: Workout[];
  dict: Dictionary["dashboard"]["workouts"];
  categoryGroups: Array<{
    category: string;
    count: number;
    minStudentPrice: number | null;
    maxStudentPrice: number | null;
  }>;
  selectedCategory: string;
}

const statusStyle: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-100",
  fully_booked: "bg-rose-50 text-rose-700 border-rose-100",
  expired: "bg-slate-50 text-slate-600 border-slate-100",
  waitlist: "bg-amber-50 text-amber-700 border-amber-100",
  cancelled: "bg-rose-50 text-rose-700 border-rose-100",
  see_text: "bg-sky-50 text-sky-700 border-sky-100",
};

function getStatusLabel(
  status: string | null,
  dict: Dictionary["dashboard"]["workouts"],
) {
  if (!status) return "-";
  const statusMap: Record<
    string,
    keyof Dictionary["dashboard"]["workouts"]
  > = {
    available: "status_available",
    fully_booked: "status_full",
    expired: "status_expired",
    waitlist: "status_waitlist",
    cancelled: "status_cancelled",
    see_text: "status_details",
  };
  const key = statusMap[status];
  return key && dict[key] ? String(dict[key]) : status;
}

export default function WorkoutList({
  initialWorkouts,
  dict,
  categoryGroups,
  selectedCategory,
}: WorkoutListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    if (typeof window === "undefined") return "list";
    const savedMode = localStorage.getItem("workoutViewMode");
    return savedMode === "grid" || savedMode === "list" ? savedMode : "list";
  });
  const [expandedGridCategory, setExpandedGridCategory] = useState<string | null>(
    selectedCategory || null,
  );

  const workouts: Workout[] = initialWorkouts;
  const effectiveViewMode: "list" | "grid" = viewMode;

  const selectedGroup = {
    category: selectedCategory,
    items: workouts,
  };

  const formatPrice = (value: number | null) =>
    value == null ? "-" : Number(value).toFixed(2);

  const selectedActionHref =
    selectedGroup.items.find((w) => w.bookingUrl || w.url)?.bookingUrl ||
    selectedGroup.items.find((w) => w.bookingUrl || w.url)?.url ||
    null;

  const handleViewModeChange = (mode: "list" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("workoutViewMode", mode);
  };

  const setCategoryOnServer = (category: string) => {
    if (category === selectedCategory) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", category);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!searchParams.get("category") && selectedCategory) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", selectedCategory);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, selectedCategory, router, pathname]);

  return (
    <main className="h-full min-w-0 flex flex-col">
      <WorkoutListHeader
        viewMode={effectiveViewMode}
        setViewMode={handleViewModeChange}
        dict={dict}
      />

      <div className={`mt-3 min-h-0 flex-1 ${effectiveViewMode === "grid" ? "overflow-y-auto" : "overflow-hidden"}`}>
        {effectiveViewMode === "list" ? (
          <>
            <div className="hidden h-full min-h-0 border-t md:grid md:grid-cols-[360px_minmax(0,1fr)]">
              <div className="flex h-full min-h-0 flex-col border-r">
                  <div className="flex h-12 items-center justify-between border-b px-3">
                    <span className="text-sm font-medium">
                      {dict?.sidebar_categories || "Category"}
                    </span>
                    <Badge variant="secondary">{categoryGroups.length}</Badge>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    {categoryGroups.map((group, index) => {
                      const active = selectedCategory === group.category;
                      const priceRange =
                        group.minStudentPrice == null
                          ? "-"
                          : group.minStudentPrice === group.maxStudentPrice
                            ? `€${formatPrice(group.minStudentPrice)}`
                            : `from €${formatPrice(group.minStudentPrice)}`;

                      return (
                        <div key={group.category}>
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => setCategoryOnServer(group.category)}
                            className={`h-auto w-full items-start justify-between px-2 py-2 text-left ${active ? "bg-muted" : ""}`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {group.category}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {priceRange}
                              </p>
                            </div>
                            <Badge variant={active ? "outline" : "secondary"}>
                              {group.count}
                            </Badge>
                          </Button>
                          {index < categoryGroups.length - 1 ? (
                            <Separator className="my-1" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              <div className="flex h-full min-h-0 flex-col">
                  <div className="flex h-12 items-center justify-between border-b px-4">
                    <p className="truncate text-sm font-medium">
                      {selectedGroup ? `${selectedGroup.category} choices` : "Choices"}
                    </p>
                    {selectedActionHref && selectedCategory !== "Semester Fee" ? (
                      <Button variant="outline" asChild>
                        <a
                          href={selectedActionHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Book Now
                          <ExternalLink />
                        </a>
                      </Button>
                    ) : null}
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {selectedGroup.items.length === 0 ? (
                      <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
                        No workouts in this category.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {selectedGroup.items.map((w) => {
                          const title = w.titleEn || w.title;
                          const statusClass =
                            w.bookingStatus && statusStyle[w.bookingStatus]
                              ? statusStyle[w.bookingStatus]
                              : "bg-slate-50 text-slate-600 border-slate-100";
                          const statusLabel = getStatusLabel(w.bookingStatus, dict);
                          const duration =
                            typeof w.details?.duration === "string"
                              ? w.details.duration
                              : w.startDate && w.endDate
                                ? `${w.startDate} - ${w.endDate}`
                                : "-";
                          const bookingHref = w.bookingUrl || w.url;

                          return (
                            <div
                              key={w.id}
                              className={`grid gap-3 px-4 py-3 lg:items-center ${
                                selectedCategory === "Semester Fee"
                                  ? "lg:grid-cols-[minmax(0,1fr)_220px_150px_auto]"
                                  : "lg:grid-cols-[minmax(0,1fr)_220px_150px]"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {title}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <Badge className={statusClass}>{statusLabel}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {duration}
                                  </span>
                                </div>
                              </div>

                              <div className="text-sm">
                                <p className="font-medium">
                                  <span className="text-muted-foreground">
                                    {w.dayOfWeek || "-"}
                                  </span>{" "}
                                  {w.startTime ? w.startTime.slice(0, 5) : ""}
                                  {w.endTime ? `-${w.endTime.slice(0, 5)}` : ""}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {w.locationEn || w.location || "-"}
                                </p>
                              </div>

                              <div className="text-sm lg:text-right">
                                <p>Student: €{formatPrice(w.priceStudent)}</p>
                                <p className="text-muted-foreground">
                                  Staff: €{formatPrice(w.priceStaff)}
                                </p>
                              </div>

                              {selectedCategory === "Semester Fee" ? (
                                <div className="flex justify-end">
                                  {bookingHref ? (
                                    <Button variant="outline" size="icon" asChild>
                                      <a
                                        href={bookingHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Open booking"
                                      >
                                        <ExternalLink />
                                      </a>
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      disabled
                                      aria-label="Booking unavailable"
                                    >
                                      <ExternalLink />
                                    </Button>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
            </div>

            <div className="space-y-2 md:hidden">
              {workouts.map((workout, idx) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  viewMode={effectiveViewMode}
                  dict={dict}
                  rowIndex={idx}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3 p-1">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {categoryGroups.flatMap((group) => {
                const priceRange =
                  group.minStudentPrice == null
                    ? "-"
                    : group.minStudentPrice === group.maxStudentPrice
                      ? `€${formatPrice(group.minStudentPrice)}`
                      : `€${formatPrice(group.minStudentPrice)} ~ €${formatPrice(group.maxStudentPrice)}`;
                const expanded =
                  expandedGridCategory === group.category &&
                  selectedCategory === group.category;
                const visibleChoices = expanded ? workouts : [];

                const categoryCard = (
                  <Card
                    key={group.category}
                    className={expanded ? "bg-black text-white" : undefined}
                    onClick={() => {
                      if (expandedGridCategory === group.category) {
                        setExpandedGridCategory(null);
                        return;
                      }
                      setExpandedGridCategory(group.category);
                      if (selectedCategory !== group.category) {
                        setCategoryOnServer(group.category);
                      }
                    }}
                  >
                    <CardHeader>
                      <CardTitle>{group.category}</CardTitle>
                      <CardAction>
                        <ChevronDown
                          className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </CardAction>
                    </CardHeader>
                    <CardFooter
                      className={`mt-auto text-xs ${
                        expanded ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      <p>
                        <span
                          className={expanded ? "font-medium text-white" : "font-medium text-foreground"}
                        >
                          {group.count}
                        </span>{" "}
                        choices
                      </p>
                      <p className="ml-auto">{priceRange}</p>
                    </CardFooter>
                  </Card>
                );

                if (!expanded) return [categoryCard];

                const choiceCards = visibleChoices.map((workout) => {
                  const bookingHref = workout.bookingUrl || workout.url;
                  const title = workout.titleEn || workout.title;
                  const timeLabel = `${workout.dayOfWeek || "-"} ${workout.startTime ? workout.startTime.slice(0, 5) : ""}${workout.endTime ? `-${workout.endTime.slice(0, 5)}` : ""}`.trim();
                  const dateLabel =
                    workout.startDate && workout.endDate
                      ? `${workout.startDate} - ${workout.endDate}`
                      : workout.startDate || workout.endDate || "-";
                  const statusClass =
                    workout.bookingStatus && statusStyle[workout.bookingStatus]
                      ? statusStyle[workout.bookingStatus]
                      : "bg-slate-50 text-slate-600 border-slate-100";
                  const statusLabel = getStatusLabel(workout.bookingStatus, dict);

                  return (
                    <Card
                      key={`${group.category}-${workout.id}`}
                      className={
                        bookingHref
                          ? "cursor-pointer transition-colors hover:bg-muted/60"
                          : undefined
                      }
                      onClick={
                        bookingHref
                          ? () => window.open(bookingHref, "_blank", "noopener,noreferrer")
                          : undefined
                      }
                    >
                      <CardHeader>
                        <CardTitle>{title}</CardTitle>
                        <CardAction>
                          {bookingHref ? <ExternalLink className="size-4" /> : null}
                        </CardAction>
                        <CardDescription className="text-xs">
                          <div className="space-y-1">
                            <p className="truncate">{workout.locationEn || workout.location || "-"}</p>
                            <p className="truncate">{dateLabel}</p>
                            <p className="truncate">{timeLabel}</p>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="mt-auto text-xs text-muted-foreground">
                        <Badge className={statusClass}>{statusLabel}</Badge>
                        <p className="ml-auto font-medium text-foreground">
                          €{formatPrice(workout.priceStudent)}
                        </p>
                      </CardFooter>
                    </Card>
                  );
                });

                return [categoryCard, ...choiceCards];
              })}
            </div>
          </div>
        )}

        {workouts.length === 0 ? (
          <div className="py-16 text-center">
            <h3 className="text-sm font-semibold text-slate-900">
              {dict?.empty_header || "No matches found"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {dict?.empty_desc || "Try adjusting your current filters."}
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
