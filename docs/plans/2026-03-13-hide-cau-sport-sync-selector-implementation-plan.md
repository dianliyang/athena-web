# Hide CAU Sport Sync Selector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove `CAU Sport` from the visible `Target Institutions` selector while keeping synchronization behavior unchanged.

**Architecture:** Keep `SystemMaintenanceCard` as the single source of synchronization UI state, but filter the rendered university tiles so `cau-sport` is hidden only in presentation. Reuse the existing unit test for the sync card to verify the visible tile set.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library

---

### Task 1: Update visible target institution tiles

**Files:**
- Modify: `src/components/identity/SystemMaintenanceCard.tsx`
- Test: `src/tests/unit/system-maintenance-card-cache.test.tsx`

**Step 1: Write the failing test**

Add an assertion in `src/tests/unit/system-maintenance-card-cache.test.tsx` that the rendered selector does not include an image or accessible control for `CAU Sport`, while still including the other visible institution tiles.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/tests/unit/system-maintenance-card-cache.test.tsx`
Expected: FAIL because `CAU Sport` is still rendered.

**Step 3: Write minimal implementation**

In `src/components/identity/SystemMaintenanceCard.tsx`, filter the mapped `UNIVERSITIES` collection in the `Target Institutions` render path so entries with id `cau-sport` are not rendered in the visible grid.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/tests/unit/system-maintenance-card-cache.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add docs/plans/2026-03-13-hide-cau-sport-sync-selector-design.md docs/plans/2026-03-13-hide-cau-sport-sync-selector-implementation-plan.md src/components/identity/SystemMaintenanceCard.tsx src/tests/unit/system-maintenance-card-cache.test.tsx
git commit -m "fix: hide cau sport sync tile"
```
