import AILearningPlanner from "@/components/home/AILearningPlanner";

export const dynamic = "force-dynamic";

export default function SmartPlannerPage() {
  return (
    <div className="h-full">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-[#1f1f1f]">Smart Planer</h3>
        <p className="text-xs text-[#7a7a7a] mt-0.5">Generate and apply practical learning roadmaps with AI.</p>
      </div>
      <AILearningPlanner />
    </div>
  );
}
