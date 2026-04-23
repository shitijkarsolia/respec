# Respec — Project Documentation

## The Original Idea

Respec was born from a simple observation: **every AI coding agent generates plans, but nobody can review them well.**

Tools like Kiro produce structured specs — `requirements.md`, `design.md`, `tasks.md` — using the EARS notation (Easy Approach to Requirements Syntax). But developers review these as raw markdown in a sidebar and type feedback in chat. There's no visual layer, no cross-referencing, no structured feedback loop.

Respec is the **PR review UI for specs**. It takes the Plannotator pattern (visual annotation of agent output, 3.7k GitHub stars) and applies it to Kiro's three-phase spec workflow. The result: an interactive canvas where you can see, annotate, validate, and approve specs — with multiple AI agents running in the background to catch issues before code is written.

The name "Respec" is a play on "re-spec" (review your specs) and "respect" (give specs the attention they deserve).

---

## What We Built

### Core Product

A Next.js web application with a React Flow canvas that visualizes Kiro specs as interactive, cross-linked cards across three columns:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Respec]          Pomodoro Timer Spec            [Dark Mode]   │
├─────────────────────────────────────────────────────────────────┤
│                                                    ┌──────────┐ │
│  📋 Requirements    🎨 Design       ✅ Tasks       │  Agent   │ │
│  ┌──────────┐     ┌──────────┐    ┌──────────┐    │ Activity │ │
│  │ FR-1.1   │────▸│ Timer    │───▸│ T-1:     │    │          │ │
│  │ WHEN user│     │Component │    │ Build    │    │ ✓ Drift  │ │
│  │ clicks   │     │          │    │ Timer    │    │ ✓ Gap    │ │
│  │ start... │     └──────────┘    └──────────┘    │          │ │
│  └──────────┘                                      │ Insights │ │
│  ┌──────────┐     ┌──────────┐    ┌──────────┐    │ ⚠ FR-2.3│ │
│  │ FR-1.2   │     │ Sequence │    │ T-2:     │    │ ⚠ FR-4.1│ │
│  │ WHEN the │     │ Diagram  │    │ Build    │    │          │ │
│  │ timer... │     │ (mermaid)│    │ Display  │    └──────────┘ │
│  └──────────┘     └──────────┘    └──────────┘                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  0 annotations pending          [Request Changes]  [Approve]    │
└──────────────────────────────────────────────────────────────────┘
```

### Feature Breakdown

#### 1. Three-Column Canvas (React Flow)
- Requirements rendered as blue-bordered EARS cards with keyword pills (WHEN, WHILE, WHERE, IF)
- Design elements rendered as purple-bordered cards with type badges (Component, API, Data Model, Diagram)
- Tasks rendered as green-bordered cards with status pills (To Do, In Progress, Done)
- All cards are draggable, zoomable, and pannable via React Flow

#### 2. Cross-Linking Arcs
- Hover any requirement card → animated SVG arcs draw to every task and design element that implements it
- Color-coded: blue for "implements", orange for "depends", red for "conflicts"
- Glow effect on hover using SVG filters (feGaussianBlur)
- Arcs are computed from `implementsRequirements` arrays in the parsed spec data

#### 3. Inline Annotation
- Click any card → annotation popover appears (bottom-right)
- Four action types: Comment, Split, Remove, Clarify
- Annotations stored in Zustand with per-card counts shown as badges
- "Request Changes" compiles all annotations into a structured prompt via the FeedbackCompiler agent

#### 4. Multi-Agent Validation
Three AI agents run automatically when specs are loaded:

- **DriftDetector**: Cross-checks alignment between requirements ↔ design ↔ tasks. Flags orphaned requirements (not referenced by any task) and unlinked tasks (not implementing any requirement). Results appear as warning/error badges in the agent rail.

- **GapFinder**: Analyzes requirements for missing edge cases — error handling, security, empty states, responsive design, spec completeness. Returns suggestions with "Accept" / "Dismiss" actions.

- **FeedbackCompiler**: Triggered by "Request Changes". Compiles human annotations into a structured markdown prompt formatted for Kiro consumption:
  ```
  Please update the spec with the following changes:
  
  ## Requirements
  - [FR-1.1] Comment — "Timer should support configurable durations"
  
  ## Tasks
  - [T-3] Action: REMOVE — "Redundant task"
  ```

#### 5. Streaming Card Animation
When the canvas loads, cards appear one-by-one with 120ms stagger — simulating live Kiro spec generation. Headers appear instantly, then content nodes stream in. Edges only render when both endpoints are visible.

#### 6. Approval Flow
- Bottom bar shows pending annotation count
- "Request Changes" → triggers FeedbackCompiler → shows compiled feedback in a modal with copy-to-clipboard
- "Approve" → green "Spec Approved" banner, all annotations cleared

#### 7. Agent Activity Rail
- Collapsible right sidebar (320px)
- Shows real-time agent status: "thinking..." with bouncing dots, then completion with timestamp
- Lists all agent insights with severity badges and Accept/Dismiss buttons
- ARIA live regions for accessibility

#### 8. Dark Mode
- Toggle in toolbar (canvas) and top-right corner (homepage)
- Persisted to localStorage under `respec-theme`
- All cards, overlays, and the rail adapt to dark mode

#### 9. Homepage
- Two modes: "Try Demo" (pre-loaded Pomodoro Timer spec) and "Upload Specs" (paste your own markdown)
- Demo mode loads 12 requirements, 5 design elements, and 8 tasks with intentional drift bugs

---

## How It Works (Technical)

### Architecture

```
Browser (Next.js 16 App Router)
├── Homepage (/) — spec upload or demo loader
├── Canvas (/canvas) — React Flow + overlays + agent rail
└── API Routes
    ├── POST /api/specs — parse markdown → structured JSON
    ├── POST /api/agents/drift — run DriftDetector
    ├── POST /api/agents/gap — run GapFinder
    └── POST /api/agents/feedback — compile annotations → prompt
```

### Data Flow

1. **Spec Ingestion**: User uploads markdown or clicks "Try Demo". The `spec-parser.ts` module parses EARS-notation requirements, design sections, and task checklists into typed JSON (`ParsedSpec`).

2. **Canvas Rendering**: `buildNodes()` converts the parsed spec into React Flow nodes positioned in three columns. `computeCrossLinks()` scans `implementsRequirements` arrays to build edges between related items.

3. **Streaming**: On mount, a `setInterval` reveals nodes one-by-one (120ms each). Edges only appear when both source and target nodes are visible.

4. **Agent Validation**: Two `fetch()` calls fire on spec load — DriftDetector and GapFinder. Each returns `AgentInsight[]` objects that populate the rail and can flag cards.

5. **Annotation → Feedback**: User clicks card → popover → types annotation → stored in Zustand. "Request Changes" sends all annotations to `/api/agents/feedback`, which groups them by type and returns a structured prompt.

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | Server-side rendering, API routes, fast builds |
| Canvas | React Flow (@xyflow/react) | Node/edge rendering, zoom/pan, custom nodes |
| State | Zustand | Lightweight, no boilerplate, stable selectors |
| UI Components | shadcn/ui | Pre-built accessible components (Button, Badge, Popover, Textarea) |
| Animations | Framer Motion | Card entrance animations, popover transitions |
| Styling | Tailwind CSS | Utility-first, dark mode support |
| Deployment | Vercel | Instant deploys, serverless API routes |

### Key Files

```
respec/src/
├── app/
│   ├── page.tsx                    # Homepage with demo/upload
│   ├── canvas/page.tsx             # Main canvas with streaming + agents
│   └── api/agents/
│       ├── drift/route.ts          # DriftDetector endpoint
│       ├── gap/route.ts            # GapFinder endpoint
│       └── feedback/route.ts       # FeedbackCompiler endpoint
├── components/
│   ├── canvas/
│   │   ├── CanvasToolbar.tsx       # Top bar with logo + dark mode
│   │   ├── nodes/
│   │   │   ├── EarsCard.tsx        # Requirement card (blue)
│   │   │   ├── DesignCard.tsx      # Design element card (purple)
│   │   │   ├── TaskCard.tsx        # Task card (green)
│   │   │   └── AgentInsightCard.tsx # Agent suggestion card (amber/red)
│   │   ├── edges/
│   │   │   └── CrossLinkEdge.tsx   # Animated glow edge
│   │   └── overlays/
│   │       ├── AnnotationPopover.tsx # Click-to-annotate panel
│   │       ├── ApprovalBar.tsx      # Bottom approve/reject bar
│   │       └── FeedbackModal.tsx    # Compiled feedback display
│   └── rail/
│       ├── AgentActivityRail.tsx    # Right sidebar
│       ├── AgentBubble.tsx          # "Thinking..." animation
│       └── AgentLogEntry.tsx        # Completed agent log
├── lib/
│   ├── types.ts                    # All TypeScript interfaces
│   ├── spec-parser.ts              # Markdown → ParsedSpec
│   ├── cross-linker.ts             # Compute requirement ↔ task edges
│   ├── store.ts                    # Zustand global state
│   └── utils.ts                    # cn() helper
└── data/
    └── sample-specs.ts             # Demo Pomodoro Timer spec data
```

---

## How to Use It

### Quick Start (Demo Mode)

1. Visit the homepage (or https://respec-five.vercel.app)
2. Click "Launch Canvas with Demo Data"
3. Watch cards stream in across three columns
4. Hover any requirement card to see cross-linking arcs
5. Click any card to open the annotation popover
6. Check the Agent Activity rail for DriftDetector and GapFinder results
7. Click "Approve" or "Request Changes" in the bottom bar

### Upload Your Own Specs

1. Click "Upload Specs" on the homepage
2. Paste your Kiro-generated `requirements.md`, `design.md`, and `tasks.md`
3. Click "Parse & Launch Canvas"
4. The parser expects:
   - Requirements: `- **FR-X.Y** WHEN/WHILE/WHERE/IF ... THE SYSTEM SHALL ...`
   - Design: `### Section Title` with bullet points and optional mermaid blocks
   - Tasks: `### T-X: Title` with `- [ ]` / `- [x]` / `- [-]` checkboxes and `**Implements:** FR-X.Y`

### Annotation Workflow

1. Click a card on the canvas
2. Choose an action: Comment, Split, Remove, or Clarify
3. Type your feedback and click Submit
4. Repeat for other cards
5. Click "Request Changes" → the FeedbackCompiler generates a structured prompt
6. Copy the prompt and paste it into Kiro's chat to trigger spec regeneration

### Dark Mode

Click the sun/moon toggle in the toolbar (canvas) or top-right corner (homepage). Preference is saved to localStorage.

---

## Running Locally

```bash
cd respec
npm install
npm run dev
# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

### Run E2E Tests

```bash
npm install -D playwright
node test-e2e.js
```

---

## Kiro Integration

### Spec Files (`.kiro/specs/respec/`)
- `requirements.md` — EARS-notation functional and non-functional requirements
- `design.md` — Component design, sequence diagrams, data model, WebSocket protocol
- `tasks.md` — Phased task breakdown with dependency graph

### Steering Files (`.kiro/steering/`)
- `code-standards.md` — Tech stack rules, naming conventions, performance rules
- `agent-behavior.md` — Agent system prompts, trigger rules, output formats
- `ui-guidelines.md` — Color system, animation timing, card design, accessibility

### Hooks (`.kiro/hooks/`)
- `drift-on-save.json` — Triggers DriftDetector when any spec file is saved

### Custom Agents (`.kiro/agents/`)
- `drift-detector.json` — Validates spec alignment
- `gap-finder.json` — Identifies missing requirements
- `feedback-compiler.json` — Compiles annotations into Kiro prompts

---

## Hackathon Context

Built for the **Kiro Spark Challenge** at ASU (April 24, 2026) — a 1-day hackathon themed "Upgrade Vibe Coding to Professional Spec-Driven Development."

### Judging Alignment

| Track | How Respec Scores |
|-------|------------------|
| Build (Technical AI proficiency) | Multi-agent backend with DriftDetector, GapFinder, FeedbackCompiler |
| Collaboration (Cross-functional innovation) | The tool itself IS about team spec review |
| Impact (Meaningful, realistic solutions) | Every Kiro user writes specs — this is the review UI they need |
| Story (Transparent, scalable workflows) | Cross-linking arcs literally make workflows transparent |

### Differentiation from Plannotator

Plannotator is retrospective — review a plan after the agent made it. Respec is **bidirectional and live**: specs update as agents work, agents update as you annotate, and the whole thing animates in real-time with streaming cards.

---

## Live Demo

**Production URL**: https://respec-five.vercel.app

**GitHub**: https://github.com/shitijkarsolia/respec (private)

**VS Code Extension**: `respec-0.1.0.vsix` (194KB, in `respec-extension/`)

---

## Two Delivery Modes

### 1. VS Code Extension (Primary — for Kiro IDE)
Install the `.vsix` in Kiro. It reads `.kiro/specs/` directly, renders the canvas in a webview panel, and communicates with Kiro's AI through hooks (file-based `agent_prompt` triggers). No copy-paste, no external AI costs.

### 2. Web App (Fallback — for demo/standalone)
Visit https://respec-five.vercel.app. Click "Try Demo" for pre-loaded data, or "Upload Specs" to paste your own markdown. Agents run as deterministic API routes.

---

## Kiro Hook Integration

The extension uses Kiro's hook system for AI-powered features:

- **DriftDetector hook**: Fires on spec file save → `agent_prompt` cross-checks requirements against tasks → writes issues to `.kiro/respec/insights.json`
- **GapFinder hook**: Fires on requirements.md save → `agent_prompt` analyzes for missing edge cases → appends suggestions to insights.json
- **FeedbackApplier hook**: Fires when `.kiro/respec/feedback.md` is written → `agent_prompt` reads structured feedback → updates spec files

This means Kiro's own AI handles all the heavy lifting. The extension just reads files, renders the canvas, and writes feedback files. Zero external API costs.
