# Routine Tree Visual Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render `Today's Routine` parent/child relationships as a visible tree on the overview and calendar pages.

**Architecture:** Keep `buildTodayRoutineGroups` as the source of parent/child structure and update only the presentation layers plus the shared child-container helper. Add focused tests that assert grouped children render inside a tree-styled nested container in both surfaces.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library

---

### Task 1: Add tree visual regression coverage

**Files:**
- Modify: `src/tests/unit/overview-routine-list-prefetch.test.tsx`
- Modify: `src/tests/unit/study-calendar-optimistic.test.tsx`

**Step 1: Write the failing tests**

Add one overview test and one calendar test that render a parent study-plan item with children and assert the children are placed inside a nested tree container with the expected tree classes or test ids.

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/tests/unit/overview-routine-list-prefetch.test.tsx src/tests/unit/study-calendar-optimistic.test.tsx`
Expected: FAIL because the current markup does not expose the required tree structure assertions.

**Step 3: Write minimal implementation**

Update the overview and calendar routine renderers to add explicit nested tree containers and child branch markers, reusing the shared child-container layout helper where possible.

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/tests/unit/overview-routine-list-prefetch.test.tsx src/tests/unit/study-calendar-optimistic.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add docs/plans/2026-03-13-routine-tree-visual-design.md docs/plans/2026-03-13-routine-tree-visual-implementation-plan.md src/lib/routine-layout.ts src/components/dashboard/OverviewRoutineList.tsx src/components/home/StudyCalendar.tsx src/tests/unit/overview-routine-list-prefetch.test.tsx src/tests/unit/study-calendar-optimistic.test.tsx
git commit -m "feat: show routine hierarchy as a tree"
```
