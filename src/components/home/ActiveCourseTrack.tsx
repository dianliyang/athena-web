"use client";

import { useMemo, useState } from "react";
import { Course } from "@/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UniversityIcon from "@/components/common/UniversityIcon";
import { Dictionary } from "@/lib/dictionary";
import AddPlanModal from "./AddPlanModal";
import { useAppToast } from "@/components/common/AppToastProvider";
import {
  ExternalLink,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";

type AiSyncSourceMode = "auto" | "existing" | "fresh";
const AI_SYNC_MODE_STORAGE_KEY = "cc:ai-sync-source-mode";

interface ActiveCourseTrackProps {
  course: Course;
  initialProgress: number;
  plan?: {
    id: number;
    start_date: string;
    end_date: string;
    days_of_week: number[];
    start_time: string;
    end_time: string;
    location: string;
  } | null;
  onUpdate?: () => void;
  dict: Dictionary["dashboard"]["roadmap"];
}

export default function ActiveCourseTrack({
  course,
  initialProgress,
  plan,
}: Omit<ActiveCourseTrackProps, "dict">) {
  const router = useRouter();
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [localPlan, setLocalPlan] = useState(plan);
  const [isAiUpdating, setIsAiUpdating] = useState(false);
  const [aiStatus, setAiStatus] = useState<"idle" | "success" | "error">("idle");
  const [aiSourceMode, setAiSourceMode] = useState<AiSyncSourceMode>(() => {
    if (typeof window === "undefined") return "auto";
    try {
      const saved = window.localStorage.getItem(AI_SYNC_MODE_STORAGE_KEY);
      return saved === "fresh" || saved === "existing" || saved === "auto" ? saved : "auto";
    } catch {
      return "auto";
    }
  });
  const { showToast } = useAppToast();

  const detailHref = `/courses/${course.id}`;
  const progress = useMemo(() => {
    if (!localPlan?.start_date || !localPlan?.end_date) return Math.max(0, Math.min(100, Math.round(initialProgress || 0)));
    const start = new Date(`${localPlan.start_date}T00:00:00`);
    const end = new Date(`${localPlan.end_date}T23:59:59`);
    const now = new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    if (now <= start) return 0;
    if (now >= end) return 100;
    const total = Math.max(1, end.getTime() - start.getTime());
    const done = Math.max(0, now.getTime() - start.getTime());
    return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  }, [initialProgress, localPlan]);

  const isNonNavigableTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest(
        'a,button,input,select,textarea,label,[role="button"],[data-no-card-nav="true"]',
      ),
    );
  };

  const handleCardNavigation = () => {
    router.push(detailHref);
  };

  const handleAiSync = async () => {
    setIsAiUpdating(true);
    setAiStatus("idle");
    try {
      const res = await fetch("/api/ai/course-intel/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, sourceMode: aiSourceMode }),
      });
      if (res.ok || res.status === 202) {
        setAiStatus("success");
        showToast({ type: "success", message: `AI sync started in background (${aiSourceMode}).` });
        window.dispatchEvent(new Event("course-intel-job-started"));
      } else {
        setAiStatus("error");
        let message = "AI sync failed.";
        try {
          const payload = await res.json();
          const candidate = typeof payload?.error === "string" ? payload.error.trim() : "";
          if (candidate) message = candidate;
        } catch {
          // Ignore parse error and use default message.
        }
        showToast({ type: "error", message });
      }
    } catch {
      setAiStatus("error");
      showToast({ type: "error", message: "Network error while running AI sync." });
    } finally {
      setIsAiUpdating(false);
      setTimeout(() => setAiStatus("idle"), 3000);
    }
  };

  const weekdaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const focusSegments = 20;
  const activeFocusSegments = Math.round((progress / 100) * focusSegments);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={(e) => {
        if (isNonNavigableTarget(e.target)) return;
        handleCardNavigation();
      }}
      onKeyDown={(e) => {
        if (isNonNavigableTarget(e.target)) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardNavigation();
        }
      }}
      className="bg-white border border-[#e5e5e5] rounded-sm p-3 grid grid-cols-1 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] gap-3 md:items-center cursor-pointer"
    >
      {/* Modals */}
      <AddPlanModal
        isOpen={showAddPlanModal}
        onClose={() => setShowAddPlanModal(false)}
        onSuccess={(saved) => setLocalPlan(saved)}
        course={{ id: course.id, title: course.title }}
        existingPlan={localPlan}
      />

      {/* Top Section */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <UniversityIcon
            name={course.university}
            size={32}
            className="flex-shrink-0 bg-gray-50 rounded-lg border border-gray-100"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-medium text-[#4d4d4d] leading-none">
                {course.university}
              </span>
              <span className="w-0.5 h-0.5 bg-gray-200 rounded-full"></span>
              <span className="text-[11px] text-[#777]">
                {course.courseCode}
              </span>
            </div>
            <h3 className="text-base font-semibold text-[#1f1f1f] tracking-tight leading-tight line-clamp-1">
              <Link href={detailHref}>{course.title}</Link>
            </h3>
            <div className="mt-1 flex items-center gap-1.5">
              {course.aiPlanSummary?.days ? (
                <span className="text-[10px] rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-800">
                  {course.aiPlanSummary.nextDate ? `AI Plan ${course.aiPlanSummary.nextDate}` : "AI Plan Ready"}{course.aiPlanSummary.nextFocus ? ` · ${course.aiPlanSummary.nextFocus}` : ""}
                </span>
              ) : (
                <span className="text-[10px] rounded border border-[#e3e3e3] bg-[#f8f8f8] px-1.5 py-0.5 font-medium text-[#666]">
                  AI Plan pending sync
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logistics Section */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#c0c0c0] uppercase tracking-wider mb-0.5">
              Logistics
            </span>
            {localPlan ? (
              <div className="flex items-center gap-1 text-[10px] font-medium text-[#666]">
                <Clock className="w-2.5 h-2.5" />
                <span>
                  {localPlan.days_of_week
                    .map((d) => weekdaysShort[d].toUpperCase())
                    .join("/")}{" "}
                  • {localPlan.start_time.slice(0, 5)} •{" "}
                  {new Date(localPlan.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  -
                  {new Date(localPlan.end_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ) : (
              <div className="text-[10px] font-medium text-[#ababab] italic">
                No schedule defined
              </div>
            )}
          </div>
          <span className="text-lg font-semibold tracking-tight text-[#1f1f1f]">
            {progress}%
          </span>
        </div>

        <div className="relative h-3 flex items-center">
          <div className="absolute inset-0 flex items-center gap-1">
            {Array.from({ length: focusSegments }).map((_, index) => (
              <span
                key={index}
                className={`h-2 flex-1 rounded-[2px] transition-colors ${
                  index < activeFocusSegments
                    ? "bg-brand-blue"
                    : "bg-gray-100 border border-gray-100"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div data-no-card-nav="true" className="flex items-center gap-2 pt-2 border-t border-[#f0f0f0] md:pt-0 md:border-t-0 md:pl-2 md:border-l md:border-[#f0f0f0]">
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <select
            value={aiSourceMode}
            onChange={(e) => {
              const next = e.target.value as AiSyncSourceMode;
              setAiSourceMode(next);
              try {
                window.localStorage.setItem(AI_SYNC_MODE_STORAGE_KEY, next);
              } catch {
                // Ignore localStorage errors.
              }
            }}
            className="h-7 rounded-md border border-[#d3d3d3] bg-white px-1.5 text-[10px] text-[#555] outline-none hover:bg-[#f8f8f8]"
            title="AI Sync mode"
            aria-label="AI Sync mode"
          >
            <option value="auto">Auto</option>
            <option value="existing">Existing</option>
            <option value="fresh">Fresh</option>
          </select>

          <Link
            href={detailHref}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-all border bg-white text-[#666] border-[#d3d3d3] hover:bg-[#f0f0f0] hover:text-[#1f1f1f]"
            title="Open course"
            aria-label="Open course"
          >
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            onClick={handleAiSync}
            disabled={isAiUpdating}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all border disabled:opacity-50 ${
              aiStatus === "success"
                ? "bg-white text-emerald-600 border-emerald-300"
                : aiStatus === "error"
                  ? "bg-white text-rose-500 border-rose-300"
                  : "bg-white text-[#666] border-[#d3d3d3] hover:bg-[#f0f0f0] hover:text-[#1f1f1f]"
            }`}
            title="AI Sync"
            aria-label="AI Sync course intel"
          >
            {isAiUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setShowAddPlanModal(true)}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all border ${
              localPlan
                ? "bg-white text-[#1f1f1f] border-[#d3d3d3] hover:bg-[#f5f5f5]"
                : "bg-white text-[#666] border-[#d3d3d3] hover:bg-[#f0f0f0] hover:text-[#1f1f1f]"
            }`}
          >
            {localPlan ? (
              <CalendarCheck className="w-3 h-3" />
            ) : (
              <CalendarPlus className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
