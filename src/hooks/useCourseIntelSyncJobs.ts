"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type CourseIntelJobItem = {
  id: number;
  status: string;
  error?: string | null;
  sourceMode?: "auto" | "existing" | "fresh";
  university?: string | null;
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
      // Ignore transient polling errors.
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
        () => {
          void loadJobs();
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
