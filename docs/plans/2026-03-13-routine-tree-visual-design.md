# Routine Tree Visual Design

**Goal:** Make parent/child relationships in `Today's Routine` visually explicit on both the overview and calendar pages.

## Scope

- Update `src/components/home/StudyCalendar.tsx`.
- Update `src/components/dashboard/OverviewRoutineList.tsx`.
- Reuse the existing grouping behavior from `src/lib/week-calendar.ts`.
- Keep interaction behavior unchanged: links, completion toggles, and detail popovers/drawers should continue to work.

## Design

`Today's Routine` already groups same-day study-plan parents with their schedule and assignment children, but the rendered UI still reads as a mostly flat list. The change is presentation-focused: parent items stay as the primary card or row, while children render in a visually nested tree container under that parent.

The child container should read like a real hierarchy rather than just extra spacing. The nested block will use:

- left indentation
- a vertical guide rail
- small branch connectors for each child item

This applies in both places where grouped routine items are shown:

- the overview routine list
- the calendar page `Today's Routine` list

Standalone workouts and ungrouped items remain top-level entries with no tree rail.

## Validation

- Grouped children render inside a dedicated nested tree container in both surfaces.
- The nested container has visible tree styling rather than a flat stack.
- Existing interaction behavior remains intact.
