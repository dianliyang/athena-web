"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type CourseIntelJobItem = {
  id: number;
  status: string;
  error?: string | null;
  sourceMode?: "auto" | "existing" | "fresh";
  university?: string | null;
  course_university?: string | null;
  course_code?: string | null;
  course_label?: string | null;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  meta?: {
    course_id?: number;
    progress?: number;
    source_mode?: "auto" | "existing" | "fresh";
    activity?: Array<{
      ts: string;
      stage: string;
      message: string;
      progress?: number;
      details?: Record<string, unknown>;
    }>;
    [key: string]: unknown;
  } | null;
};

export function useCourseIntelSyncJobs() {
  const [items, setItems] = useState<CourseIntelJobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>["channel"]> | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabaseClient> | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/course-intel/jobs", { cache: "no-store" });
      if (!res.ok) return;
      const payload = await res.json();
      if (Array.isArray(payload?.items)) {
        setItems(payload.items as CourseIntelJobItem[]);
      }
    } catch {
      // Ignore transient load errors.
    } finally {
      setLoading(false);
    }
  }, []);

  const closeChannel = useCallback(async () => {
    const supabase = supabaseRef.current;
    const channel = channelRef.current;
    if (supabase && channel) {
      await supabase.removeChannel(channel);
    }
    channelRef.current = null;
    setHasSubscribed(false);
  }, []);

  const openChannel = useCallback(() => {
    if (channelRef.current) return;
    const supabase = supabaseRef.current || createBrowserSupabaseClient();
    supabaseRef.current = supabase;
    channelRef.current = supabase
      .channel("course_intel_jobs:global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scraper_jobs" },
        (payload) => {
          const row = (payload as { new?: Record<string, unknown>; old?: Record<string, unknown> }).new
            || (payload as { new?: Record<string, unknown>; old?: Record<string, unknown> }).old;
          if (!row || typeof row.id !== "number") {
            void loadJobs();
            return;
          }

          setItems((prev) => {
            const next = [...prev];
            const idx = next.findIndex((item) => item.id === row.id);
            const merged = {
              ...(idx >= 0 ? next[idx] : {}),
              ...row,
              sourceMode:
                typeof (row as { sourceMode?: unknown }).sourceMode === "string"
                  ? ((row as { sourceMode: "auto" | "existing" | "fresh" }).sourceMode)
                  : (idx >= 0 ? next[idx].sourceMode : "auto"),
            } as CourseIntelJobItem;

            if (idx >= 0) next[idx] = merged;
            else next.unshift(merged);
            return next.slice(0, 20);
          });
        }
      )
      .subscribe();
    setHasSubscribed(true);
  }, [loadJobs]);

  useEffect(() => {
    void loadJobs();
    const onStarted = () => {
      void loadJobs();
    };
    const onFocus = () => {
      void loadJobs();
    };
    window.addEventListener("course-intel-job-started", onStarted as EventListener);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("course-intel-job-started", onStarted as EventListener);
      window.removeEventListener("focus", onFocus);
      void closeChannel();
    };
  }, [closeChannel, loadJobs]);

  const activeJobs = items.filter((job) => job.status === "queued" || job.status === "running");
  const hasActive = activeJobs.length > 0;

  useEffect(() => {
    if (hasActive) {
      openChannel();
      return;
    }
    if (hasSubscribed) {
      void closeChannel();
    }
  }, [closeChannel, hasActive, hasSubscribed, openChannel]);

  return {
    items,
    activeJobs,
    hasActive,
    loading,
    reload: loadJobs,
  };
}
