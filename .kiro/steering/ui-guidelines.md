# Steering: UI/UX Guidelines

## Color System
| Element | Color | Tailwind Class |
|---------|-------|---------------|
| Requirements | Blue | `border-blue-500`, `bg-blue-50` (light) / `bg-blue-950` (dark) |
| Design | Purple | `border-purple-500`, `bg-purple-50` / `bg-purple-950` |
| Tasks | Green | `border-green-500`, `bg-green-50` / `bg-green-950` |
| Warnings (Drift) | Red | `border-red-500`, `text-red-600` |
| Suggestions (Gap) | Amber | `border-amber-500`, `bg-amber-50` / `bg-amber-950` |
| Approved | Emerald | `border-emerald-400`, `bg-emerald-50` |

## Animation Timing
- Card entrance: 300ms ease-out, 50ms stagger between cards
- Hover glow: 200ms ease-in-out
- Arc appearance: 400ms ease-out
- Pulsing (in-progress): 2s infinite ease-in-out
- Fade out (dismiss): 200ms ease-in
- Layout shift (card added/removed): 500ms spring

## Card Design
- All cards: rounded-lg, shadow-sm, border-l-4 (color-coded)
- Hover: shadow-md, slight scale(1.01)
- Selected: ring-2 ring-offset-2
- Flagged: red dot (absolute positioned, top-right, 8px circle, pulsing)
- Annotated: badge with count (bottom-left)

## Canvas Behavior
- Default zoom: fit all content
- Min zoom: 0.3, Max zoom: 2.0
- Background: subtle dot grid (React Flow MiniMap optional)
- Columns: fixed horizontal position, vertical scroll within column

## Responsive Breakpoints
- 1080p (1920x1080): three columns visible, rail collapsed by default
- 1440p (2560x1440): three columns + rail visible
- Below 1080p: not supported (hackathon scope)

## Empty States
- No specs loaded: centered illustration + "Upload your Kiro specs to get started" + upload button
- No annotations: subtle "Click any card to annotate" hint text
- No agent insights: "All clear — no issues detected" in agent rail

## Accessibility Minimums
- All interactive elements: visible focus ring (ring-2 ring-blue-500)
- Cards: role="article", aria-label with requirement/task ID
- Agent rail: aria-live="polite" for new entries
- Approval bar: buttons with clear aria-labels
- Color is never the only indicator — always pair with icon or text
