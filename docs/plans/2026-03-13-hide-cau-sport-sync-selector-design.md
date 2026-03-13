# Hide CAU Sport Sync Selector Design

**Goal:** Remove the visible `CAU Sport` option from the `Target Institutions` selector without changing synchronization behavior or accepted target ids.

## Scope

- Update the synchronization UI in `src/components/identity/SystemMaintenanceCard.tsx`.
- Keep the underlying synchronization target list and execution flow unchanged.
- Preserve the existing tile layout, logo rendering, toggle behavior, and selected-state styling for the remaining visible institutions.

## Design

The `Target Institutions` grid currently renders every entry from the `UNIVERSITIES` list, including `cau-sport`. The change should be UI-only: stop rendering `cau-sport` in that grid while leaving the backing data structure intact so no sync logic regresses.

The most direct implementation is to filter the rendered collection in the selector section rather than rewriting the underlying source list. That keeps the visible change minimal and avoids accidental changes to sync behavior elsewhere in the component.

## Validation

- The `Target Institutions` selector should no longer show a `CAU Sport` tile.
- Existing logo tiles for MIT, Stanford, CMU, UC Berkeley, and CAU Kiel should still render.
- Existing synchronization controls and recent-runs behavior should continue to work.
