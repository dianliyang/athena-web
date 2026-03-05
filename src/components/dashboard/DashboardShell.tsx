"use client";

import { useEffect, useState } from "react";
import LeftRail from "@/components/dashboard/LeftRail";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const LEFT_RAIL_COLLAPSED_KEY = "cc:dashboard:left-rail-collapsed";

interface DashboardShellProps {
  labels: {
    command: string;
    identity: string;
    hub: string;
    courses: string;
    projectsSeminars: string;
    studyPlan: string;
    smartPlanner: string;
    studySchedule: string;
    workouts: string;
    profile: string;
    settings: string;
    settingsEngine: string;
    settingsUsage: string;
    settingsSecurity: string;
    settingsSystem: string;
    settingsApiControl: string;
    settingsApiReference: string;
    docs?: string;
    import: string;
  };
  children: React.ReactNode;
}

export default function DashboardShell({ labels, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LEFT_RAIL_COLLAPSED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(saved === "true");
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(false);
    }
  }, []);

  return (
    <SidebarProvider
      className="h-svh min-h-0 overflow-hidden overscroll-none"
      open={!collapsed}
      onOpenChange={(open) => {
        const nextCollapsed = !open;
        setCollapsed(nextCollapsed);
        try {
          window.localStorage.setItem(LEFT_RAIL_COLLAPSED_KEY, String(nextCollapsed));
        } catch {
          // Ignore localStorage errors.
        }
      }}
    >
      <LeftRail labels={labels} />
      <SidebarInset className="h-svh min-w-0 overflow-hidden overscroll-none">
        <div
          id="dashboard-scroll"
          className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
