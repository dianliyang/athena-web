"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type CourseIntelJobItem = {
  id: number;
  status: string;
  error?: string | null;
  university?: string | null;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  meta?: {
    course_id?: number;
    progress?: number;
    activity?: Array<{ ts: string; stage: string; message: string; progress?: number }>;
    [key: string]: unknown;
  } | null;
};

export function useCourseIntelSyncJobs() {
  const [items, setItems] = useState<CourseIntelJobItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadJobs = async () => {
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
  };

  useEffect(() => {
    void loadJobs();
    const timer = window.setInterval(() => {
      void loadJobs();
    }, 12000);

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("course_intel_jobs:global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scraper_jobs" },
        () => {
          void loadJobs();
        }
      )
      .subscribe();

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, []);

  const activeJobs = items.filter((job) => job.status === "queued" || job.status === "running");
  const hasActive = activeJobs.length > 0;

  return {
    items,
    activeJobs,
    hasActive,
    loading,
    reload: loadJobs,
  };
}
