"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  Filter,
  Layout,
  Maximize2,
  ScanLine,
} from "lucide-react";

type FocusKey = "roadmap" | "seminar" | "assist";

const focusEvents: Array<{
  key: FocusKey;
  date: string;
  tag: string;
  title: string;
  desc: string;
}> = [
  {
    key: "roadmap",
    date: "09:00",
    tag: "Schedule",
    title: "Roadmap Focus Block",
    desc: "CS61B deep-work session synced from Weekly Schedule.",
  },
  {
    key: "seminar",
    date: "13:30",
    tag: "S&P",
    title: "Seminar Outline Review",
    desc: "Review project milestones and refine this week scope.",
  },
  {
    key: "assist",
    date: "19:00",
    tag: "Assist",
    title: "Smart Assist Plan Update",
    desc: "Apply AI plan suggestions to tomorrow's execution.",
  },
];

type MiddlePanelConfig = {
  chartType: "area" | "dotwave" | "bubble";
  metrics: Array<{ label: string; value: string; suffix?: string; serif?: boolean; muted?: boolean }>;
  momentumTitle: string;
  yAxis: string[];
  areaPath: string;
  linePath: string;
  points: Array<{ x: number; y: number; active?: boolean }>;
  dotSeries?: number[];
  bubbles?: Array<{ x: number; y: number; size: "sm" | "md" | "lg"; label: string; tone: string; dark?: boolean }>;
  tooltip: { period: string; delta: string; title: string; subtitle: string; left: string; top: string };
  xAxis: string[];
};

const middlePanelByFocus: Record<FocusKey, MiddlePanelConfig> = {
  roadmap: {
    chartType: "area",
    metrics: [
      { label: "Active Courses", value: "12", serif: true },
      { label: "Planned Sessions", value: "36", suffix: "/wk", serif: true },
      { label: "Sync Health", value: "Stable", muted: true },
    ],
    momentumTitle: "Execution Momentum",
    yAxis: ["100%", "75%", "50%", "25%"],
    areaPath: "M0,45 Q15,45 25,25 T50,20 T75,10 T100,5 L100,50 L0,50 Z",
    linePath: "M0,45 Q15,45 25,25 T50,20 T75,10 T100,5",
    points: [
      { x: 25, y: 25 },
      { x: 50, y: 20 },
      { x: 75, y: 10 },
      { x: 100, y: 5, active: true },
    ],
    tooltip: {
      period: "WEEK 09",
      delta: "+8%",
      title: "Plan Sync Lift",
      subtitle: "Smart Assist updates applied.",
      left: "70%",
      top: "10%",
    },
    xAxis: ["W1", "W2", "W3", "W4"],
  },
  seminar: {
    chartType: "bubble",
    metrics: [
      { label: "Open Seminars", value: "7", serif: true },
      { label: "Review Cycles", value: "14", suffix: "/wk", serif: true },
      { label: "Draft Health", value: "On Track", muted: true },
    ],
    momentumTitle: "Seminar Workflow Pulse",
    yAxis: ["90%", "70%", "45%", "20%"],
    areaPath: "M0,40 Q18,20 30,28 T58,18 T78,22 T100,12 L100,50 L0,50 Z",
    linePath: "M0,40 Q18,20 30,28 T58,18 T78,22 T100,12",
    points: [
      { x: 18, y: 20 },
      { x: 30, y: 28 },
      { x: 58, y: 18 },
      { x: 78, y: 22 },
      { x: 100, y: 12, active: true },
    ],
    bubbles: [
      { x: 14, y: 26, size: "sm", label: "118", tone: "bg-gradient-to-br from-stone-200 to-stone-400" },
      { x: 34, y: 12, size: "sm", label: "189", tone: "bg-gradient-to-br from-stone-100 to-stone-300" },
      { x: 44, y: 20, size: "md", label: "210", tone: "bg-gradient-to-br from-stone-300 to-stone-500" },
      { x: 50, y: 12, size: "sm", label: "216", tone: "bg-gradient-to-br from-stone-200 to-stone-400" },
      { x: 74, y: 22, size: "lg", label: "453", tone: "bg-gradient-to-br from-stone-400 to-stone-600" },
      { x: 88, y: 24, size: "lg", label: "528", tone: "bg-gradient-to-br from-stone-500 to-stone-800", dark: true },
    ],
    tooltip: {
      period: "SPRINT 03",
      delta: "+5%",
      title: "Outline Finalized",
      subtitle: "Milestones moved to review.",
      left: "66%",
      top: "16%",
    },
    xAxis: ["Prep", "Draft", "Review", "Ship"],
  },
  assist: {
    chartType: "dotwave",
    metrics: [
      { label: "AI Plans", value: "24", serif: true },
      { label: "Applied Actions", value: "58", suffix: "/wk", serif: true },
      { label: "Assist State", value: "Online", muted: true },
    ],
    momentumTitle: "Assist Confidence Pulse",
    yAxis: ["95%", "72%", "48%", "25%"],
    areaPath: "M0,46 Q12,34 24,30 T48,16 T72,14 T100,8 L100,50 L0,50 Z",
    linePath: "M0,46 Q12,34 24,30 T48,16 T72,14 T100,8",
    points: [
      { x: 24, y: 30 },
      { x: 48, y: 16 },
      { x: 72, y: 14 },
      { x: 100, y: 8, active: true },
    ],
    dotSeries: [28, 46, 52, 41, 37, 48, 63, 71, 59, 45, 36, 29, 34, 43, 50],
    tooltip: {
      period: "TODAY",
      delta: "+11%",
      title: "Assist Surge",
      subtitle: "More plan actions accepted.",
      left: "74%",
      top: "14%",
    },
    xAxis: ["Input", "Plan", "Apply", "Track"],
  },
};

const rightPanelByFocus: Record<
  FocusKey,
  {
    label: string;
    title: string;
    chartType: "matrix" | "rings" | "bubble" | "bars";
    axis?: [string, string, string];
    bars?: Array<{ label: string; value: number; tone: string }>;
    bubbles?: Array<{ x: number; y: number; size: "sm" | "md" | "lg"; label: string; tone: string; dark?: boolean }>;
    rings?: Array<{ label: string; value: string; tone: string }>;
    breakdownTitle: string;
    rows: Array<{ tone: string; label: string; hours: string; width: string }>;
  }
> = {
  roadmap: {
    label: "Heatmap",
    title: "Time Allocation",
    chartType: "matrix",
    axis: ["AM", "Noon", "PM"],
    breakdownTitle: "Module Split",
    rows: [
      { tone: "bg-stone-800", label: "Courses", hours: "64h", width: "60%" },
      { tone: "bg-stone-400", label: "Roadmap / Schedule", hours: "32h", width: "30%" },
      { tone: "border border-stone-300 bg-stone-200", label: "S&P / Workouts", hours: "12h", width: "10%" },
    ],
  },
  seminar: {
    label: "Distribution",
    title: "Seminar Allocation",
    chartType: "bars",
    bars: [
      { label: "Research", value: 72, tone: "bg-stone-800" },
      { label: "Drafting", value: 58, tone: "bg-stone-600" },
      { label: "Review", value: 41, tone: "bg-stone-400" },
    ],
    breakdownTitle: "Seminar Split",
    rows: [
      { tone: "bg-stone-800", label: "Research", hours: "22h", width: "45%" },
      { tone: "bg-stone-400", label: "Outline / Draft", hours: "18h", width: "35%" },
      { tone: "border border-stone-300 bg-stone-200", label: "Feedback Cycle", hours: "10h", width: "20%" },
    ],
  },
  assist: {
    label: "Signal",
    title: "Assist Execution",
    chartType: "rings",
    rings: [
      { label: "Plan Accuracy", value: "93%", tone: "border-stone-800" },
      { label: "Adoption", value: "81%", tone: "border-stone-500" },
      { label: "Sync Rate", value: "76%", tone: "border-stone-300" },
    ],
    breakdownTitle: "Assist Split",
    rows: [
      { tone: "bg-stone-800", label: "Plan Generation", hours: "20h", width: "40%" },
      { tone: "bg-stone-400", label: "Plan Refinement", hours: "16h", width: "32%" },
      { tone: "border border-stone-300 bg-stone-200", label: "Schedule Sync", hours: "14h", width: "28%" },
    ],
  },
};

const roadmapMatrix = [
    [1, 2, 3, 1, 2],
    [2, 3, 4, 2, 1],
    [1, 2, 2, 3, 4],
    [3, 4, 2, 1, 2],
    [1, 2, 3, 2, 1],
    [2, 1, 2, 3, 4],
    [1, 3, 4, 2, 1],
    [2, 2, 3, 1, 2],
  ];
const matrixTone = ["bg-stone-100", "bg-stone-200", "bg-stone-400", "bg-stone-600", "bg-stone-800"];

import { getPublicAssetUrl } from "@/lib/supabase/storage";

export default function Home() {
  const [selectedFocus, setSelectedFocus] = useState<FocusKey>("roadmap");
  const middlePanel = middlePanelByFocus[selectedFocus];
  const rightPanel = rightPanelByFocus[selectedFocus];
  const logoUrl = getPublicAssetUrl("athena.svg");

  return (
    <div
      className="relative overflow-x-hidden bg-[#fafaf9] text-[#1c1917]"
      style={{ fontFamily: "var(--font-landing-sans)" }}
    >
      <div className="pointer-events-none fixed inset-0 z-0 [background-image:linear-gradient(to_right,rgba(41,37,36,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(41,37,36,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />

      <nav className="relative z-50 mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3 text-2xl tracking-tight text-stone-900" style={{ fontFamily: "var(--font-landing-serif)" }}>
          <Image src={logoUrl} alt="Athena logo" width={24} height={24} />
          Athena
        </div>

        <div className="hidden items-center gap-8 text-xs uppercase tracking-widest text-stone-500 md:flex" style={{ fontFamily: "var(--font-landing-mono)" }}>
          <a href="#" className="transition hover:text-stone-900">Courses</a>
          <a href="#" className="transition hover:text-stone-900">Roadmap</a>
          <a href="#" className="transition hover:text-stone-900">Smart Assist</a>
        </div>

        <Link
          href="/overview"
          className="border border-stone-900 px-4 py-2 text-xs uppercase tracking-widest text-stone-900 transition hover:bg-stone-900 hover:text-white"
          style={{ fontFamily: "var(--font-landing-mono)" }}
        >
          Open Workspace
        </Link>
      </nav>

      <header className="relative z-10 flex flex-col items-center px-6 pb-12 pt-20 text-center">
        <div className="mb-8 inline-flex items-center gap-2 border border-[rgba(41,37,36,0.1)] bg-white px-3 py-1 text-[10px] uppercase tracking-widest text-stone-500" style={{ fontFamily: "var(--font-landing-mono)" }}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-900" /> Version 2.0.4
        </div>

        <h1 className="mb-6 max-w-4xl text-6xl font-light leading-[1.05] tracking-tight text-stone-900 md:text-[5.5rem]" style={{ fontFamily: "var(--font-landing-serif)" }}>
          The architecture of your <br />
          <span className="italic text-stone-500">academic record.</span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg font-light leading-relaxed text-stone-500">
          Athena combines course discovery, Smart Assist planning, roadmap tracking, weekly scheduling, and seminar/workout workflows in one operational workspace, with Smart Review next for AI-supported assignment and lab feedback.
        </p>
      </header>

      <section className="relative z-20 mx-auto max-w-[1200px] px-6 pb-32">
        <div className="flex w-full flex-col overflow-hidden rounded-lg border border-[rgba(41,37,36,0.1)] bg-white">
          <div className="flex h-10 items-center justify-between border-b border-[rgba(41,37,36,0.1)] bg-stone-50 px-4">
            <div className="flex gap-2">
              <div className="h-2.5 w-2.5 rounded-full border border-[rgba(41,37,36,0.1)] bg-stone-200" />
              <div className="h-2.5 w-2.5 rounded-full border border-[rgba(41,37,36,0.1)] bg-stone-200" />
              <div className="h-2.5 w-2.5 rounded-full border border-[rgba(41,37,36,0.1)] bg-stone-200" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>Overview / Athena_Workspace</div>
            <div className="flex gap-3 text-stone-400">
              <Layout className="h-3.5 w-3.5" />
              <Maximize2 className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="grid h-[clamp(420px,62vh,680px)] grid-cols-1 bg-white lg:grid-cols-12">
            <div className="col-span-3 flex h-full flex-col border-r border-[rgba(41,37,36,0.1)] bg-stone-50/50">
              <div className="border-b border-[rgba(41,37,36,0.1)] bg-white p-4">
                <div className="mb-1 text-[10px] uppercase tracking-widest text-stone-500" style={{ fontFamily: "var(--font-landing-mono)" }}>Active Queue</div>
                <div className="flex items-center justify-between text-lg text-stone-900" style={{ fontFamily: "var(--font-landing-serif)" }}>
                  Today Pipeline
                  <Filter className="h-3 w-3 text-stone-400" />
                </div>
              </div>
              <div className="relative flex-1 overflow-y-auto p-4">
                <div className="absolute bottom-4 left-[27px] top-4 w-px bg-stone-200" />
                <div className="relative space-y-6">
                  {focusEvents.map((event) => (
                    <TimelineItem
                      key={event.key}
                      active={selectedFocus === event.key}
                      date={event.date}
                      tag={event.tag}
                      title={event.title}
                      desc={event.desc}
                      onClick={() => setSelectedFocus(event.key)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative col-span-6 flex flex-col overflow-hidden border-r border-[rgba(41,37,36,0.1)] bg-white">
              <div className="flex h-24 border-b border-[rgba(41,37,36,0.1)]">
                {middlePanel.metrics.map((metric) => (
                  <MetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    suffix={metric.suffix}
                    serif={metric.serif}
                    muted={metric.muted}
                  />
                ))}
              </div>
              <div className="relative flex flex-1 flex-col p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-xs font-medium text-stone-900">{middlePanel.momentumTitle}</div>
                  <div className="flex gap-2">
                    <span className="block h-1 w-8 bg-stone-900" />
                    <span className="block h-1 w-8 border border-stone-200 [background-image:repeating-linear-gradient(-45deg,rgba(41,37,36,0.05),rgba(41,37,36,0.05)_1px,transparent_1px,transparent_3px)]" />
                  </div>
                </div>
                {middlePanel.chartType === "area" ? (
                  <div className="absolute inset-x-6 bottom-8 top-16 pointer-events-none">
                    <div className="flex h-full w-full flex-col justify-between border-b border-l border-stone-200 pb-1">
                      {middlePanel.yAxis.map((m) => (
                        <div key={m} className="relative h-px w-full bg-stone-100">
                          <span className="absolute -left-5 -top-2 text-[8px] text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="relative ml-1 mt-2 flex-1">
                  {middlePanel.chartType === "area" ? (
                    <svg viewBox="0 0 100 50" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <pattern id="hatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="4" stroke="#e7e5e4" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <path d={middlePanel.areaPath} fill="url(#hatch)" />
                      <path d={middlePanel.linePath} fill="none" stroke="#1c1917" strokeWidth="0.8" />
                      {middlePanel.points.map((point) => (
                        <circle
                          key={`${point.x}-${point.y}`}
                          cx={point.x}
                          cy={point.y}
                          r="1.5"
                          fill={point.active ? "#1c1917" : "#fafaf9"}
                          stroke="#1c1917"
                          strokeWidth="0.8"
                        />
                      ))}
                      <line
                        x1={middlePanel.points[middlePanel.points.length - 1].x}
                        y1={middlePanel.points[middlePanel.points.length - 1].y}
                        x2={middlePanel.points[middlePanel.points.length - 1].x}
                        y2="50"
                        stroke="#1c1917"
                        strokeWidth="0.5"
                        strokeDasharray="1,1"
                      />
                    </svg>
                  ) : null}
                  {middlePanel.chartType === "dotwave" ? (
                    <div className="relative h-full pt-2">
                      <div className="absolute inset-0 flex items-stretch gap-2 px-2 pb-5 pt-1">
                        {middlePanel.dotSeries?.map((value, idx) => (
                          <div key={idx} className="relative flex-1 border-l border-stone-200/80">
                            {Array.from({ length: Math.max(1, Math.round(value / 18)) }).map((_, dotIdx) => (
                              <span
                                key={dotIdx}
                                className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border shadow-[0_0_8px_rgba(120,113,108,0.28)] ${
                                  dotIdx % 2 === 0 ? "border-stone-200 bg-stone-300" : "border-stone-300 bg-stone-600"
                                }`}
                                style={{ bottom: `${value + dotIdx * 11}%` }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {middlePanel.chartType === "bubble" ? (
                    <div className="relative h-full pt-2">
                      <div className="absolute inset-0 grid grid-rows-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="border-t border-dashed border-stone-200/90" />
                        ))}
                      </div>
                      {middlePanel.bubbles?.map((bubble, idx) => {
                        const sizeClass = bubble.size === "sm" ? "h-9 w-9 text-[9px]" : bubble.size === "md" ? "h-12 w-12 text-sm" : "h-14 w-14 text-xl";
                        return (
                          <div
                            key={`${bubble.label}-${idx}`}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 ${sizeClass} ${bubble.tone} flex items-center justify-center rounded-2xl text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]`}
                            style={{ left: `${bubble.x}%`, top: `${100 - bubble.y}%` }}
                          >
                            <span className="font-medium">{bubble.label}</span>
                          </div>
                        );
                      })}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-2 text-[9px] text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>
                        <span>120K</span><span>240K</span><span>360K</span><span>480K</span><span>600K</span>
                      </div>
                    </div>
                  ) : null}
                  {middlePanel.chartType === "area" ? (
                    <div className={`absolute min-w-[120px] -translate-x-1/2 -translate-y-full border border-stone-200 bg-white p-2 text-xs text-stone-800`} style={{ left: middlePanel.tooltip.left, top: middlePanel.tooltip.top }}>
                      <div className="mb-1 flex justify-between border-b border-stone-200 pb-1 text-[9px] text-stone-500" style={{ fontFamily: "var(--font-landing-mono)" }}>
                        <span>{middlePanel.tooltip.period}</span><span className="text-stone-700">{middlePanel.tooltip.delta}</span>
                      </div>
                      <div className="font-medium">{middlePanel.tooltip.title}</div>
                      <div className="mt-0.5 text-[10px] text-stone-500">{middlePanel.tooltip.subtitle}</div>
                      <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-stone-200 bg-white" />
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 ml-4 flex w-full justify-between border-t border-stone-200 pt-2 pr-4 text-[9px] tracking-widest text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>
                  {middlePanel.xAxis.map((label) => <span key={label}>{label}</span>)}
                </div>
              </div>
            </div>

            <div className="col-span-3 flex flex-col bg-stone-50/50">
              <div className="border-b border-[rgba(41,37,36,0.1)] bg-white p-4">
                <div className="mb-1 text-[10px] uppercase tracking-widest text-stone-500" style={{ fontFamily: "var(--font-landing-mono)" }}>{rightPanel.label}</div>
                <div className="text-lg text-stone-900" style={{ fontFamily: "var(--font-landing-serif)" }}>{rightPanel.title}</div>
              </div>
              <div className="flex flex-1 flex-col gap-6 p-5">
                {rightPanel.chartType === "matrix" ? (
                  <div>
                    <div className="mb-1 flex gap-1">
                      {roadmapMatrix.map((col, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          {col.map((v, j) => (
                            <div key={`${i}-${j}`} className={`h-3 w-3 rounded-[1px] border border-black/5 ${matrixTone[v - 1]}`} />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[8px] text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>
                      <span>{rightPanel.axis?.[0]}</span>
                      <span>{rightPanel.axis?.[1]}</span>
                      <span>{rightPanel.axis?.[2]}</span>
                    </div>
                  </div>
                ) : null}

                {rightPanel.chartType === "bars" ? (
                  <div className="h-[150px]">
                    <div className="flex h-[118px] items-end gap-3">
                      {rightPanel.bars?.map((bar) => (
                        <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
                          <span className="text-[9px] text-stone-500" style={{ fontFamily: "var(--font-landing-mono)" }}>
                            {bar.value}%
                          </span>
                          <div className="relative h-[96px] w-full bg-stone-200">
                            <div className={`absolute inset-x-0 bottom-0 ${bar.tone}`} style={{ height: `${bar.value}%` }} />
                          </div>
                          <span className="text-[9px] text-stone-500 text-center" style={{ fontFamily: "var(--font-landing-mono)" }}>
                            {bar.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {rightPanel.chartType === "bubble" ? (
                  <div className="relative h-[150px]">
                    <div className="absolute inset-0 grid grid-rows-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="border-t border-dashed border-stone-200/90" />
                      ))}
                    </div>
                    {rightPanel.bubbles?.map((bubble, idx) => {
                      const sizeClass = bubble.size === "sm" ? "h-10 w-10 text-[9px]" : bubble.size === "md" ? "h-14 w-14 text-sm" : "h-16 w-16 text-xl";
                      return (
                        <div
                          key={`${bubble.label}-${idx}`}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 ${sizeClass} ${bubble.tone} flex items-center justify-center rounded-2xl text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]`}
                          style={{ left: `${bubble.x}%`, top: `${100 - bubble.y}%` }}
                        >
                            <span className="font-medium">{bubble.label}</span>
                        </div>
                      );
                    })}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-2 text-[9px] text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>
                      <span>120K</span><span>240K</span><span>360K</span><span>480K</span><span>600K</span>
                    </div>
                  </div>
                ) : null}

                {rightPanel.chartType === "rings" ? (
                  <div className="grid grid-cols-3 gap-2">
                    {rightPanel.rings?.map((ring) => (
                      <div key={ring.label} className="flex flex-col items-center gap-1">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 ${ring.tone} text-[10px] font-medium text-stone-700`}>
                          {ring.value}
                        </div>
                        <span className="text-[9px] text-stone-500 text-center" style={{ fontFamily: "var(--font-landing-mono)" }}>{ring.label}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="h-px w-full bg-stone-200" />
                <div className="space-y-4">
                  <div className="text-[10px] uppercase tracking-widest text-stone-500" style={{ fontFamily: "var(--font-landing-mono)" }}>
                    {rightPanel.breakdownTitle}
                  </div>
                  {rightPanel.rows.map((row) => (
                    <BreakdownRow key={row.label} tone={row.tone} label={row.label} hours={row.hours} width={row.width} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-8 items-center justify-between border-t border-[rgba(41,37,36,0.1)] bg-stone-50 px-4 text-[9px] uppercase tracking-widest text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500/80" /> Sync Complete</span>
              <span>12 Courses Active</span>
            </div>
            <div>Smart Assist: Online</div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1200px] border-t border-stone-200 px-6 py-24">
        <div className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row">
          <div className="max-w-xl">
            <div className="mb-4 text-[10px] uppercase tracking-widest text-stone-500" style={{ fontFamily: "var(--font-landing-mono)" }}>Core Modalities</div>
            <h2 className="text-3xl leading-tight text-stone-900 md:text-4xl" style={{ fontFamily: "var(--font-landing-serif)" }}>Information density,<br />engineered for clarity.</h2>
          </div>
          <p className="max-w-sm pb-2 text-sm font-light leading-relaxed text-stone-500">
            We believe in surfacing complex data, not hiding it behind simplistic pie charts. Athena utilizes architectural design principles to keep you oriented.
          </p>
        </div>

        <div className="grid auto-rows-[280px] grid-cols-1 gap-6 md:grid-cols-12">
          <div className="group relative col-span-1 overflow-hidden rounded-lg border border-[rgba(41,37,36,0.1)] bg-white p-8 md:col-span-8">
            <div className="absolute bottom-0 right-0 top-0 w-1/2 opacity-50 transition-opacity group-hover:opacity-100 [background-image:repeating-linear-gradient(45deg,rgba(41,37,36,0.03),rgba(41,37,36,0.03)_1px,transparent_1px,transparent_4px)]" />
            <div className="relative z-10 flex h-full w-2/3 flex-col justify-between">
              <div>
                <div className="mb-6 flex h-8 w-8 items-center justify-center rounded border border-[rgba(41,37,36,0.1)] bg-stone-50">
                  <ScanLine className="h-4 w-4 text-stone-700" />
                </div>
                <h3 className="mb-2 text-xl text-stone-900" style={{ fontFamily: "var(--font-landing-serif)" }}>Smart Assist</h3>
                <p className="text-sm font-light leading-relaxed text-stone-500">Generate and refine AI learning plans from course details, then sync plans directly into your roadmap and weekly schedule workflow.</p>
              </div>
              <div className="flex gap-2 text-[10px] text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>
                <span className="rounded-sm border border-[rgba(41,37,36,0.1)] bg-white px-2 py-1">AI_PLAN</span>
                <span className="rounded-sm border border-[rgba(41,37,36,0.1)] bg-white px-2 py-1">SYNC</span>
                <span className="rounded-sm border border-[rgba(41,37,36,0.1)] bg-white px-2 py-1">ROADMAP</span>
                <span className="rounded-sm border border-[rgba(41,37,36,0.1)] bg-white px-2 py-1">SMART_REVIEW_SOON</span>
              </div>
            </div>
          </div>
          <div className="relative col-span-1 flex flex-col justify-between overflow-hidden rounded-lg bg-stone-900 p-8 text-white md:col-span-4">
            <div>
              <div className="mb-4 text-[10px] uppercase tracking-widest text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>Module 02</div>
              <h3 className="mb-2 text-xl" style={{ fontFamily: "var(--font-landing-serif)" }}>Smart Review (Coming Soon)</h3>
              <p className="text-sm font-light leading-relaxed text-stone-400">AI review for assignments, labs, and project drafts with rubric-aware feedback and next-step suggestions connected to your active courses.</p>
            </div>
            <div className="mt-6 flex h-12 items-end gap-1 opacity-80">
              <div className="h-[40%] w-full rounded-t-sm bg-stone-700" />
              <div className="h-[60%] w-full rounded-t-sm bg-stone-600" />
              <div className="h-[85%] w-full rounded-t-sm bg-stone-500" />
              <div className="h-[100%] w-full rounded-t-sm bg-stone-300" />
            </div>
          </div>
          <div className="col-span-1 flex flex-col justify-between rounded-lg border border-[rgba(41,37,36,0.1)] bg-white p-8 md:col-span-5">
            <div>
              <div className="mb-6 flex h-8 w-8 items-center justify-center rounded border border-[rgba(41,37,36,0.1)] bg-stone-50">
                <CalendarDays className="h-4 w-4 text-stone-700" />
              </div>
              <h3 className="mb-2 text-xl text-stone-900" style={{ fontFamily: "var(--font-landing-serif)" }}>Weekly Schedule</h3>
              <p className="text-sm font-light leading-relaxed text-stone-500">Plan recurring study events, manage timezone/location, and inspect day details from course logistics in a weekly calendar.</p>
            </div>
          </div>
          <div className="relative col-span-1 flex items-center gap-6 overflow-hidden rounded-lg border border-[rgba(41,37,36,0.1)] bg-stone-50 p-8 md:col-span-7">
            <div className="relative z-10 flex-1">
              <h3 className="mb-2 text-xl text-stone-900" style={{ fontFamily: "var(--font-landing-serif)" }}>Relational Knowledge Base</h3>
              <p className="text-sm font-light leading-relaxed text-stone-500">Course resources, logistics, facts, and schedule events stay connected so Smart Assist, Roadmap, and Schedule all operate on the same source of truth.</p>
            </div>
            <div className="relative hidden h-32 w-48 sm:block">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-sm border border-[rgba(41,37,36,0.1)] bg-white shadow-sm" />
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-sm border border-[rgba(41,37,36,0.1)] bg-white p-2 opacity-70 shadow-sm">
                <div className="flex flex-col gap-1">
                  <div className="h-1 w-1/2 bg-stone-200" />
                  <div className="h-1 w-full bg-stone-100" />
                  <div className="h-1 w-3/4 bg-stone-100" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-sm border border-[rgba(41,37,36,0.1)] bg-white p-4 shadow-sm">
                <div className="h-2 w-1/3 rounded-sm bg-stone-800" />
                <div className="mt-4 h-1.5 w-full bg-stone-200" />
                <div className="mt-2 h-1.5 w-full bg-stone-200" />
                <div className="mt-2 h-1.5 w-5/6 bg-stone-200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mt-20 border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-10 px-6 py-12 md:flex-row">
          <div>
            <div className="mb-4 flex items-center gap-3 text-xl tracking-tight text-stone-900" style={{ fontFamily: "var(--font-landing-serif)" }}>
              <Image src={logoUrl} alt="Athena logo" width={20} height={20} />
              Athena
            </div>
            <div className="max-w-xs text-[10px] uppercase tracking-widest text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>
              Software for rigorous academic management. Designed in the pursuit of clarity.
            </div>
          </div>
          <div className="flex gap-16">
            <div>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-stone-900" style={{ fontFamily: "var(--font-landing-mono)" }}>Index</h4>
              <ul className="space-y-3 text-xs text-stone-500">
                <li><a href="#" className="transition hover:text-stone-900">Courses</a></li>
                <li><a href="#" className="transition hover:text-stone-900">Seminar & Project</a></li>
                <li><a href="#" className="transition hover:text-stone-900">Roadmap</a></li>
                <li><a href="#" className="transition hover:text-stone-900">Smart Review (Soon)</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-stone-900" style={{ fontFamily: "var(--font-landing-mono)" }}>Platform</h4>
              <ul className="space-y-3 text-xs text-stone-500">
                <li><a href="#" className="transition hover:text-stone-900">Settings</a></li>
                <li><a href="#" className="transition hover:text-stone-900">API Control</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1200px] justify-between border-t border-stone-100 px-6 py-6 text-[10px] text-stone-400" style={{ fontFamily: "var(--font-landing-mono)" }}>
          <span>© 2026 ATHENA SYSTEMS.</span>
          <span>DATA PROCESSED LOCALLY.</span>
        </div>
      </footer>
    </div>
  );
}

function TimelineItem({
  active = false,
  date,
  tag,
  title,
  desc,
  onClick,
}: {
  active?: boolean;
  date: string;
  tag: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full cursor-pointer gap-4 text-left ${active ? "" : "opacity-60 transition hover:opacity-100"}`}
    >
      <div className={`z-10 h-6 w-6 shrink-0 outline outline-4 outline-stone-50 ${active ? "flex items-center justify-center rounded-full bg-stone-900" : "rounded-full border border-stone-300 bg-white"}`}>
        {active ? <div className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </div>
      <div className="w-full pt-0.5">
        <div className="mb-1 flex items-baseline justify-between">
          <div className="font-mono tabular-nums text-[10px] text-stone-500">{date}</div>
          <div className={`rounded-sm px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${active ? "bg-stone-200 text-stone-700" : "border border-stone-200 text-stone-500"}`}>{tag}</div>
        </div>
        <div className="mb-1 text-sm font-medium leading-tight text-stone-900">{title}</div>
        <div className="text-xs text-stone-500">{desc}</div>
      </div>
    </button>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  muted = false,
  serif = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  muted?: boolean;
  serif?: boolean;
}) {
  return (
    <div className={`flex flex-1 flex-col justify-between p-4 ${muted ? "bg-stone-50" : "border-r border-[rgba(41,37,36,0.1)]"}`}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-stone-400">{label}</div>
      <div className={`${serif ? "font-serif text-4xl" : "font-mono text-xl"} tabular-data tracking-tight text-stone-900`}>
        {value}
        {suffix ? <span className="ml-1 font-sans text-lg text-stone-400">{suffix}</span> : null}
      </div>
    </div>
  );
}

function BreakdownRow({
  tone,
  label,
  hours,
  width,
}: {
  tone: string;
  label: string;
  hours: string;
  width: string;
}) {
  return (
    <div className="group flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-sm ${tone}`} />
        <span className="text-xs font-medium text-stone-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono tabular-data text-xs text-stone-500">{hours}</span>
        <div className="h-1 w-12 overflow-hidden rounded-full bg-stone-200">
          <div className={`h-full ${tone}`} style={{ width }} />
        </div>
      </div>
    </div>
  );
}
