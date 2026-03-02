"use client";

import { Dictionary } from "@/lib/dictionary";

interface StudyPlanHeaderProps {
  enrolledCount: number;
  completedCount: number;
  totalCredits: number;
  averageProgress: number;
  attendance?: { attended: number; total: number };
  dict: Dictionary['dashboard']['roadmap'];
}

export default function StudyPlanHeader({ enrolledCount, completedCount, totalCredits, attendance, dict }: Omit<StudyPlanHeaderProps, 'averageProgress'>) {
  const attendanceRate = attendance && attendance.total > 0 
    ? Math.round((attendance.attended / attendance.total) * 100) 
    : 0;

  return (
    <section className="sticky top-[-12px] z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-4 bg-[#fcfcfc] border-b border-[#e5e5e5]">
      <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
        <div className="px-4 py-3 border-r border-b lg:border-b-0 border-[#e5e5e5]">
          <p className="text-xs text-slate-500">{dict?.header_total || "Active Tracks"}</p>
          <p className="mt-1 text-[26px] leading-none font-semibold tracking-tight text-slate-900">{enrolledCount}</p>
        </div>
        <div className="px-4 py-3 border-b lg:border-b-0 lg:border-r border-[#e5e5e5]">
          <p className="text-xs text-slate-500">{dict?.header_mastered || "Completed"}</p>
          <p className="mt-1 text-[26px] leading-none font-semibold tracking-tight text-slate-900">{completedCount}</p>
        </div>
        <div className="px-4 py-3 border-r border-[#e5e5e5]">
          <p className="text-xs text-slate-500">Total Units</p>
          <p className="mt-1 text-[26px] leading-none font-semibold tracking-tight text-slate-900">{totalCredits}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-slate-500">Attendance</p>
          <p className="mt-1 text-[26px] leading-none font-semibold tracking-tight text-slate-900">{attendanceRate}%</p>
        </div>
      </div>
    </section>
  );
}
