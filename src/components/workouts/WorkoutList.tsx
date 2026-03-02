"use client";

import { useState, useEffect } from "react";
import { Workout } from "@/types";
import { Dictionary } from "@/lib/dictionary";
import WorkoutCard from "./WorkoutCard";
import WorkoutListHeader from "./WorkoutListHeader";
import { ChevronDown, ExternalLink } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface WorkoutListProps {
  initialWorkouts: Workout[];
  dict: Dictionary["dashboard"]["workouts"];
  lastUpdated: string | null;
  categoryGroups: Array<{ category: string; count: number; minStudentPrice: number | null; maxStudentPrice: number | null }>;
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

function getStatusLabel(status: string | null, dict: Dictionary["dashboard"]["workouts"]) {
  if (!status) return "-";
  const statusMap: Record<string, keyof Dictionary["dashboard"]["workouts"]> = {
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
  lastUpdated,
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
  const workouts: Workout[] = initialWorkouts;

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

  const effectiveViewMode: "list" | "grid" = viewMode;

  const selectedGroup = {
    category: selectedCategory,
    items: workouts,
  };

  const [expandedGridCategory, setExpandedGridCategory] = useState<string | null>(selectedCategory || null);

  const formatPrice = (value: number | null) => (value == null ? "-" : Number(value).toFixed(2));
  const selectedActionHref = selectedGroup.items.find((w) => w.bookingUrl || w.url)?.bookingUrl
    || selectedGroup.items.find((w) => w.bookingUrl || w.url)?.url
    || null;

  return (
    <main className="h-full flex flex-col min-w-0">
      <div className="sticky top-[-12px] z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-4 bg-[#fcfcfc] border-b border-[#e5e5e5]">
        <WorkoutListHeader
          viewMode={effectiveViewMode}
          setViewMode={handleViewModeChange}
          dict={dict}
          lastUpdated={lastUpdated}
        />
      </div>

      <div className={`mt-4 flex-1 min-h-0 bg-[#fcfcfc] rounded-lg border border-[#e5e5e5] ${effectiveViewMode === "grid" ? "overflow-auto p-3" : "overflow-hidden"}`}>
        {effectiveViewMode === "list" ? (
          <>
            <div className="hidden md:grid md:grid-cols-[320px_minmax(0,1fr)] h-full min-h-0">
              <div className="border-r border-[#e5e5e5] bg-[#f8f8f8] flex flex-col min-h-0">
                <div className="h-[40px] px-4 flex items-center justify-between bg-[#eeeeee] border-b border-[#e5e5e5] text-[11px] font-bold text-[#666] uppercase tracking-wider">
                  <span>{dict?.sidebar_categories || "Category"}</span>
                  <span className="text-[10px] bg-[#dddddd] px-1.5 py-0.5 rounded-md tabular-nums">{categoryGroups.length}</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {categoryGroups.map((group, idx) => {
                    const priceRange = group.minStudentPrice == null
                      ? "-"
                      : group.minStudentPrice === group.maxStudentPrice
                        ? `€${formatPrice(group.minStudentPrice)}`
                        : `from €${formatPrice(group.minStudentPrice)}`;
                    const active = selectedCategory === group.category;
                    const bgClass = active 
                      ? "bg-white z-10" 
                      : (idx % 2 === 0 ? "bg-[#f8f8f8]" : "bg-[#f2f2f2]");

                    return (
                      <button
                        key={group.category}
                        type="button"
                        onClick={() => setCategoryOnServer(group.category)}
                        className={`w-full text-left px-4 py-3.5 border-b border-[#e8e8e8] hover:bg-white transition-all relative group ${bgClass}`}
                      >
                        {/* Active indicator bar */}
                        {active && (
                          <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-brand-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[16px] truncate transition-colors ${active ? "font-bold text-black" : "font-semibold text-[#444] group-hover:text-black"}`}>
                            {group.category}
                          </p>
                          <span className={`text-[12px] font-bold px-1.5 py-0.5 rounded-md tabular-nums shrink-0 transition-colors ${active ? "bg-brand-blue text-white shadow-sm" : "bg-[#e2e2e2] text-[#555]"}`}>
                            {group.count}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <span className={`text-[12px] tabular-nums transition-colors ${active ? "text-[#555] font-medium" : "text-[#8a8a8a]"}`}>
                            {priceRange}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col min-h-0 bg-white">
                <div className="h-[40px] px-4 bg-[#f9f9f9] border-b border-[#e5e5e5] text-[11px] font-bold text-[#666] uppercase tracking-wider flex items-center justify-between gap-2">
                  <span className="truncate">{selectedGroup ? `${selectedGroup.category} choices` : "Choices"}</span>
                  {selectedActionHref && selectedCategory !== "Semester Fee" ? (
                    <a href={selectedActionHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1.5 rounded border border-[#d6d6d6] bg-white px-2.5 text-[11px] font-bold text-[#444] hover:bg-[#f4f4f4] normal-case transition-colors">
                      Book Now <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#efefef]">
                  {selectedGroup?.items.map((w, idx) => {
                    const title = w.titleEn || w.title;
                    const statusClass = w.bookingStatus && statusStyle[w.bookingStatus] ? statusStyle[w.bookingStatus] : "bg-slate-50 text-slate-600 border-slate-100";
                    const statusLabel = getStatusLabel(w.bookingStatus, dict);
                    
                    const formatDate = (dateStr: string | null) => {
                      if (!dateStr) return null;
                      if (dateStr.includes("-")) {
                        const [y, m, d] = dateStr.split("-");
                        if (y && m && d) return `${d}.${m}.${y}`;
                      }
                      return dateStr;
                    };

                    const duration = typeof w.details?.duration === "string"
                      ? w.details.duration
                      : (w.startDate && w.endDate ? `${formatDate(w.startDate)} - ${formatDate(w.endDate)}` : null);

                    const bgClass = idx % 2 === 0 ? "bg-white" : "bg-[#fafafa]";
                    const isSemesterFee = selectedCategory === "Semester Fee";

                    return (
                      <div key={w.id} className={`px-5 py-4 hover:bg-white transition-colors ${bgClass}`}>
                        {/* Main row: Title/Status vs Time/Location */}
                        <div className="flex items-start justify-between gap-6 mb-4">
                          {/* Left: Title, Metadata (Status + Duration) */}
                          <div className="flex flex-col gap-2 min-w-0 flex-1">
                            <h3 className="text-[16px] font-bold text-[#111] leading-tight">{title}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                                {statusLabel}
                              </span>
                              {duration && (
                                <span className="text-[11px] font-medium text-[#888] tabular-nums">
                                  {duration}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Time and Location */}
                          <div className="text-right shrink-0 flex flex-col gap-1.5 max-w-[200px]">
                            <div className="text-[13px] font-bold text-[#111] tabular-nums">
                              <span className="mr-1.5 text-[#777] font-medium">{w.dayOfWeek || "-"}</span>
                              {w.startTime ? w.startTime.slice(0,5) : ""}{w.endTime ? `-${w.endTime.slice(0,5)}` : ""}
                            </div>
                            <div className="text-[12px] text-[#888] line-clamp-2 leading-relaxed">
                              {w.locationEn || w.location || "-"}
                            </div>
                          </div>
                        </div>

                        {/* Bottom row: Prices and Booking */}
                        <div className="flex items-center justify-between gap-4 border-t border-[#f3f3f3] pt-3">
                          <div className="flex items-center gap-8">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#aaa] uppercase tracking-tight leading-none">Student</span>
                              <span className="text-[15px] font-bold text-[#111] leading-none tabular-nums">€{formatPrice(w.priceStudent)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#aaa] uppercase tracking-tight leading-none">Staff</span>
                              <span className="text-[14px] font-semibold text-[#444] leading-none tabular-nums">€{formatPrice(w.priceStaff)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#aaa] uppercase tracking-tight leading-none">External</span>
                              <span className="text-[14px] font-semibold text-[#444] leading-none tabular-nums">€{formatPrice(w.priceExternal)}</span>
                            </div>
                          </div>

                          {(isSemesterFee && (w.bookingUrl || w.url)) && (
                            <a
                              href={(w.bookingUrl || w.url)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-7 items-center gap-1.5 rounded border border-[#d6d6d6] bg-white px-2.5 text-[11px] font-bold text-[#444] hover:bg-[#f4f4f4] normal-case transition-colors"
                            >
                              Book Now
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="md:hidden">
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
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {categoryGroups.map((group) => {
                const priceRange = group.minStudentPrice == null
                  ? "-"
                  : group.minStudentPrice === group.maxStudentPrice
                    ? formatPrice(group.minStudentPrice)
                    : `${formatPrice(group.minStudentPrice)} ~ ${formatPrice(group.maxStudentPrice)}`;
                const expanded = expandedGridCategory === group.category;

                return (
                  <button
                    key={group.category}
                    type="button"
                    onClick={() => {
                      setExpandedGridCategory(group.category);
                      if (selectedCategory !== group.category) setCategoryOnServer(group.category);
                    }}
                    className={`text-left rounded-xl border p-3 transition-colors ${expanded ? "border-[#cfcfcf] bg-white" : "border-[#e3e3e3] bg-[#fafafa] hover:bg-white"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#2e2e2e] truncate">{group.category}</p>
                      <ChevronDown className={`w-4 h-4 text-[#777] transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </div>
                    <p className="mt-1 text-xs text-[#666]">{group.count} choices</p>
                    <p className="mt-1 text-xs text-[#666]">Student: {priceRange}</p>
                  </button>
                );
              })}
            </div>

            {expandedGridCategory === selectedCategory ? (
              <div className="rounded-xl border border-[#e3e3e3] bg-[#fcfcfc] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#2e2e2e]">{selectedCategory} choices</p>
                  {selectedActionHref ? (
                    <a href={selectedActionHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-[#d6d6d6] bg-white px-2 py-1 text-xs text-[#444] hover:bg-[#f4f4f4]">
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
              </div>
            ) : null}
          </div>
        )}

        {workouts.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-sm font-semibold text-slate-900">{dict?.empty_header || "No matches found"}</h3>
            <p className="text-sm text-slate-500 mt-1">{dict?.empty_desc || "Try adjusting your current filters."}</p>
          </div>
        )}
      </div>

      
    </main>
  );
}
