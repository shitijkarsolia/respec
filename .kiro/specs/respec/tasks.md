# Tasks — Respec

## Phase 1: Foundation (2 hours)

### T-1: Project Scaffolding
- [ ] `npx create-next-app@latest respec --typescript --tailwind --app --src-dir`
- [ ] Install deps: `@xyflow/react`, `zustand`, `framer-motion`, `mermaid`, `socket.io`, `socket.io-client`, `shadcn/ui`
- [ ] Configure shadcn/ui: `npx shadcn@latest init`
- [ ] Add shadcn components: button, popover, badge, card, textarea, separator, tooltip
- [ ] Set up project structure per ARCHITECTURE.md
- **Implements:** NFR-1.1

### T-2: Spec Parser
- [ ] Create `lib/spec-parser.ts`
- [ ] Parse requirements: regex for `**FR-X.Y**` + EARS keywords (WHEN/WHILE/WHERE/IF/SHALL)
- [ ] Parse design: H3 headers as components, extract mermaid code blocks, extract bullet properties
- [ ] Parse tasks: checkbox patterns `- [ ]` / `- [x]` / `- [-]` → todo/done/in-progress
- [ ] Cross-reference extraction: scan for `FR-X.Y` patterns in design/task text → `implementsRequirements[]`
- [ ] Unit test with sample spec files
- **Implements:** FR-1.1, FR-1.2, FR-1.3, FR-1.4

### T-3: Basic Three-Column Layout
- [ ] Create `SpecCanvas.tsx` — React Flow wrapper with three column groups
- [ ] Create column components: `RequirementsColumn`, `DesignColumn`, `TasksColumn`
- [ ] Implement dagre layout: columns at x=0, x=500, x=1000; 20px vertical gap
- [ ] Add column headers with color-coded labels (blue/purple/green)
- [ ] Placeholder cards for testing layout
- **Implements:** FR-2.1, FR-2.3

### T-4: Zustand Store
- [ ] Create `lib/store.ts` with `RespecState` interface
- [ ] Implement spec state management (setSpec, parsed data)
- [ ] Implement annotation state (add, remove, get by target)
- [ ] Implement agent state (activity log, insights)
- [ ] Implement UI state (approval status, rail toggle, hovered node)
- **Implements:** All FR (state backbone)

---

## Phase 2: Core Canvas (4 hours)

### T-5: EarsCard Node
- [ ] Create `nodes/EarsCard.tsx` — custom React Flow node
- [ ] Blue left border, priority badge (must/should/could)
- [ ] EARS keyword highlighting (bold + color)
- [ ] Annotation count badge
- [ ] Agent warning dot (conditional)
- [ ] Hover state: slight elevation + border glow
- **Implements:** FR-2.2, FR-3.2

### T-6: MermaidNode
- [ ] Create `nodes/MermaidNode.tsx` — custom React Flow node
- [ ] Integrate mermaid.js for rendering diagram code blocks
- [ ] Purple left border
- [ ] "Implements: FR-X.Y" footer with clickable links
- [ ] Fallback: render raw code if mermaid fails
- **Implements:** FR-1.3

### T-7: TaskCard Node
- [ ] Create `nodes/TaskCard.tsx` — custom React Flow node
- [ ] Green left border
- [ ] Status indicator: □ todo, ● in-progress (pulsing CSS animation), ☑ done
- [ ] Subtask list (indented)
- [ ] "Implements: FR-X.Y" footer
- **Implements:** FR-1.4

### T-8: Cross-Link Edges
- [ ] Create `edges/CrossLinkEdge.tsx` — custom React Flow edge
- [ ] Animated stroke-dasharray
- [ ] SVG glow filter (feGaussianBlur + feComposite) on hover
- [ ] Color by type: blue (implements), orange (depends), red (conflicts)
- [ ] Opacity mapped to strength (0.3–1.0)
- [ ] Create `lib/cross-linker.ts` — compute edges from parsed spec
- [ ] Create `hooks/useCrossLinks.ts` — show/hide edges on node hover
- **Implements:** FR-3.1, FR-3.2, FR-3.3, FR-3.4

### T-9: Annotation Popover
- [ ] Create `overlays/AnnotationPopover.tsx`
- [ ] Action dropdown: Comment, Split, Remove, Clarify
- [ ] Text input area
- [ ] Submit → store annotation, show badge on card
- [ ] Cancel → close popover
- [ ] Wire to Zustand store
- **Implements:** FR-4.1, FR-4.2

### T-10: Approval Bar
- [ ] Create `overlays/ApprovalBar.tsx` — fixed bottom bar
- [ ] "Approve" button (green) — marks all cards approved, green borders
- [ ] "Request Changes" button (amber) — triggers FeedbackCompiler
- [ ] Pending annotation count display
- [ ] Compiled feedback modal with copy button
- **Implements:** FR-4.3, FR-4.4, FR-6.1, FR-6.2, FR-6.3

---

## Phase 3: Agent Backend (3 hours)

### T-11: WebSocket Server
- [ ] Create `api/ws/route.ts` — Socket.io server setup
- [ ] Handle `spec:upload` → trigger SpecParser → broadcast `spec:parsed`
- [ ] Handle `action:approve` and `action:requestChanges`
- [ ] Create `lib/ws-client.ts` — client-side Socket.io wrapper
- [ ] Create `hooks/useSpecStream.ts` and `hooks/useAgentEvents.ts`
- **Implements:** FR-7.2

### T-12: DriftDetector Agent
- [ ] Create `agents/drift-detector.ts` using Strands SDK
- [ ] System prompt: "You are a spec alignment validator..."
- [ ] Tool: receives ParsedSpec, returns list of orphaned requirements and unlinked tasks
- [ ] Wire to WebSocket: emit `agent:thinking` → `agent:insight` → `agent:complete`
- [ ] Display red dots on flagged cards
- **Implements:** FR-5.1, FR-5.2

### T-13: GapFinder Agent
- [ ] Create `agents/gap-finder.ts` using Strands SDK
- [ ] System prompt: "You analyze requirements for missing edge cases..."
- [ ] Tool: receives requirements array, returns suggested additions
- [ ] Wire to WebSocket: emit suggestion cards
- [ ] Accept → add new requirement card + re-run cross-linker
- [ ] Dismiss → fade out suggestion card
- **Implements:** FR-5.3, FR-5.4, FR-5.5

### T-14: FeedbackCompiler Agent
- [ ] Create `agents/feedback-compiler.ts` using Strands SDK
- [ ] System prompt: "You compile human annotations into structured feedback..."
- [ ] Input: annotations array + original spec context
- [ ] Output: structured prompt optimized for Kiro consumption
- [ ] Display in modal with copy-to-clipboard
- **Implements:** FR-4.3, FR-4.4

### T-15: Agent Activity Rail
- [ ] Create `rail/AgentActivityRail.tsx` — collapsible right sidebar
- [ ] `AgentBubble.tsx` — "thinking..." animation per agent
- [ ] `AgentLogEntry.tsx` — timestamp + agent name + result summary
- [ ] ARIA live region for accessibility
- [ ] Toggle button in header
- **Implements:** FR-7.1, FR-7.2, FR-7.3, NFR-3.3

---

## Phase 4: Polish & Demo (3 hours)

### T-16: Animations
- [ ] Staggered card entrance (Framer Motion, 50ms delay per card)
- [ ] Pulsing ring on in-progress tasks (CSS keyframes)
- [ ] Arc glow on hover (SVG filter animation)
- [ ] Card slide-in when GapFinder suggestion accepted
- [ ] Fade-out on dismiss
- [ ] Smooth layout transitions when cards added/removed
- **Implements:** FR-2.2, NFR-1.2

### T-17: Streaming Simulation
- [ ] Create demo mode: cards appear one-by-one as if Kiro is streaming
- [ ] Typewriter effect on card text
- [ ] Progress indicator: "Kiro is generating requirements... (3/7)"
- [ ] Use for demo video — pre-loaded specs with timed reveal
- **Implements:** Demo wow factor

### T-18: Visual Polish
- [ ] Dark mode (Tailwind dark class)
- [ ] Consistent color system: blue/purple/green/red/amber per ARCHITECTURE.md
- [ ] Loading skeleton states
- [ ] Empty states ("Upload specs to get started")
- [ ] Responsive: works on 1080p and 1440p
- **Implements:** NFR-2.1, NFR-2.2

### T-19: Keyboard & Accessibility
- [ ] Tab navigation between cards
- [ ] Enter to open annotation popover
- [ ] Escape to close popovers
- [ ] ARIA labels on all interactive elements
- [ ] Color contrast check (WCAG AA)
- **Implements:** NFR-3.1, NFR-3.2, NFR-3.3

---

## Phase 5: Submission (3 hours)

### T-20: Deploy
- [ ] Deploy to Vercel
- [ ] Test with sample spec files
- [ ] Verify WebSocket works in production (fallback to polling if needed)
- [ ] Create shareable demo URL

### T-21: Demo Video
- [ ] Record 3-minute demo per STRATEGY.md script
- [ ] Screen capture: Kiro left, Respec right
- [ ] Voiceover explaining each feature
- [ ] Edit with transitions, captions

### T-22: Devpost Submission
- [ ] Write project description (features, functionality)
- [ ] Write "How we used Kiro" section
- [ ] Link GitHub repo (public)
- [ ] Upload demo video
- [ ] Submit before 11:59 PM

---

## Dependency Graph

```
T-1 (scaffold)
 ├── T-2 (parser)
 │    └── T-5, T-6, T-7 (card nodes) ← need parsed data types
 ├── T-3 (layout)
 │    └── T-8 (cross-links) ← needs nodes on canvas
 ├── T-4 (store)
 │    ├── T-9 (annotations) ← needs store
 │    └── T-10 (approval) ← needs store + annotations
 └── T-11 (websocket)
      ├── T-12 (drift agent)
      ├── T-13 (gap agent)
      ├── T-14 (feedback agent)
      └── T-15 (agent rail)

T-16, T-17, T-18, T-19 (polish) ← after core features
T-20, T-21, T-22 (submission) ← after polish
```

## Critical Path

**T-1 → T-2 → T-4 → T-3 → T-5/T-6/T-7 → T-8 → T-9 → T-10 → T-16 → T-20**

This is the minimum path to a demo-able product. Agent backend (T-11–T-15) runs in parallel with canvas work if two engineers split the work.
