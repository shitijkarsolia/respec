# Architecture — Respec

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                      │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Requirements │  │   Design    │  │    Tasks     │      │
│  │   Column     │  │   Column    │  │   Column     │      │
│  │             │  │             │  │             │      │
│  │ EARS Cards  │  │ Mermaid +   │  │ Kanban Board │      │
│  │ + Badges    │  │ Info Cards  │  │ todo/wip/done│      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │              │
│  ┌──────┴────────────────┴────────────────┴──────┐      │
│  │           CrossLinkOverlay (SVG arcs)          │      │
│  └────────────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────────────┐      │
│  │         AnnotationLayer (popovers)             │      │
│  └────────────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────────────┐      │
│  │         AgentActivityRail (right side)          │      │
│  └────────────────────────────────────────────────┘      │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  Backend (Next.js API Routes)             │
│                                                           │
│  ┌──────────────┐  ┌──────────────────────────────┐      │
│  │  SpecParser   │  │      Agent Orchestrator       │      │
│  │  .md → JSON   │  │                                │      │
│  └──────┬───────┘  │  ┌────────────┐ ┌──────────┐  │      │
│         │          │  │DriftDetector│ │GapFinder │  │      │
│         │          │  └────────────┘ └──────────┘  │      │
│         │          │  ┌────────────┐ ┌──────────┐  │      │
│         │          │  │FeedbackComp│ │TestSynth │  │      │
│         │          │  └────────────┘ └──────────┘  │      │
│         │          └──────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
                       │
                       ▼ Bedrock API
┌──────────────────────────────────────────────────────────┐
│              AWS (Strands SDK + Bedrock)                   │
└──────────────────────────────────────────────────────────┘
```

## Component Map

### Frontend Components

```
src/
├── app/
│   ├── layout.tsx              # Root layout, providers, fonts
│   ├── page.tsx                # Landing / file upload
│   └── canvas/
│       └── page.tsx            # Main canvas view
├── components/
│   ├── canvas/
│   │   ├── SpecCanvas.tsx      # React Flow wrapper, manages all nodes/edges
│   │   ├── columns/
│   │   │   ├── RequirementsColumn.tsx
│   │   │   ├── DesignColumn.tsx
│   │   │   └── TasksColumn.tsx
│   │   ├── nodes/
│   │   │   ├── EarsCard.tsx        # WHEN/THE SYSTEM SHALL card
│   │   │   ├── MermaidNode.tsx     # Renders mermaid diagram inside RF node
│   │   │   ├── DesignCard.tsx      # Design decision card
│   │   │   ├── TaskCard.tsx        # Checkbox + status badge
│   │   │   └── AgentInsightCard.tsx # GapFinder/DriftDetector suggestion
│   │   ├── edges/
│   │   │   └── CrossLinkEdge.tsx   # Animated SVG arc with glow on hover
│   │   └── overlays/
│   │       ├── AnnotationPopover.tsx
│   │       └── ApprovalBar.tsx     # Approve / Request Changes buttons
│   ├── rail/
│   │   ├── AgentActivityRail.tsx   # Right sidebar showing agent status
│   │   ├── AgentBubble.tsx         # "Kiro is thinking..." stream
│   │   └── AgentLogEntry.tsx       # Individual agent action log
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── spec-parser.ts          # Markdown → structured spec JSON
│   ├── cross-linker.ts         # Computes requirement ↔ task relationships
│   ├── annotation-store.ts     # Local state for annotations
│   ├── ws-client.ts            # WebSocket client wrapper
│   └── types.ts                # Shared TypeScript types
├── hooks/
│   ├── useSpecStream.ts        # Subscribe to live spec updates via WS
│   ├── useAgentEvents.ts       # Subscribe to agent activity via WS
│   └── useCrossLinks.ts       # Compute and cache cross-link edges
└── api/
    ├── specs/
    │   └── route.ts            # POST: upload spec files, GET: fetch parsed specs
    ├── agents/
    │   ├── drift/route.ts      # Trigger DriftDetector
    │   ├── gap/route.ts        # Trigger GapFinder
    │   ├── feedback/route.ts   # POST annotations → compiled feedback
    │   └── test/route.ts       # Trigger TestSynthesizer
    └── ws/
        └── route.ts            # WebSocket upgrade handler
```

### Data Flow

```
1. SPEC INGESTION
   User uploads/pastes .kiro/specs/ files
   → SpecParser extracts structured data
   → JSON stored in memory (no DB needed for hackathon)
   → WebSocket broadcasts to canvas

2. CANVAS RENDERING
   SpecCanvas receives parsed spec JSON
   → Generates React Flow nodes per column
   → CrossLinker computes edges (requirement.id → task.implementsReq)
   → React Flow renders with dagre layout

3. ANNOTATION FLOW
   User clicks card → AnnotationPopover opens
   → User types comment / selects action (split, remove, clarify)
   → Annotation stored locally
   → "Request Changes" → FeedbackCompiler agent
   → Compiled prompt displayed + copyable for Kiro

4. AGENT VALIDATION (continuous)
   On spec change → DriftDetector runs
   → Compares requirement IDs referenced in design vs tasks
   → Flags orphaned requirements or unlinked tasks
   → AgentInsightCard appears on canvas with red dot

   On spec load → GapFinder runs
   → Analyzes requirements for missing edge cases
   → Suggests new requirements as ghost cards

5. APPROVAL FLOW
   User clicks "Approve"
   → All annotations cleared
   → Spec marked as approved (green border)
   → Tasks column activates (ready for execution)
```

### Key Types

```typescript
interface Requirement {
  id: string;
  type: 'WHEN' | 'WHILE' | 'WHERE' | 'IF' | 'SHALL';  // EARS keywords
  trigger: string;
  response: string;
  priority: 'must' | 'should' | 'could';
  status: 'draft' | 'approved' | 'flagged';
}

interface DesignElement {
  id: string;
  type: 'component' | 'api' | 'dataModel' | 'diagram';
  title: string;
  description: string;
  mermaidCode?: string;          // For diagram type
  implementsRequirements: string[]; // Links to Requirement.id
}

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  implementsRequirements: string[];
  implementsDesign: string[];
  subtasks?: string[];
}

interface Annotation {
  id: string;
  targetId: string;              // ID of requirement/design/task
  targetType: 'requirement' | 'design' | 'task';
  action: 'comment' | 'split' | 'remove' | 'clarify' | 'reorder';
  content: string;
  author: string;
  timestamp: number;
}

interface AgentInsight {
  id: string;
  agentName: 'DriftDetector' | 'GapFinder' | 'TestSynthesizer';
  severity: 'info' | 'warning' | 'error';
  targetId?: string;
  message: string;
  suggestion?: string;           // Actionable fix
  accepted: boolean;
}

interface CrossLink {
  sourceId: string;
  targetId: string;
  type: 'implements' | 'depends' | 'conflicts';
  strength: number;              // 0-1, affects arc opacity
}
```

### Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout engine | React Flow + dagre | Handles node positioning, zoom/pan, edge routing out of the box |
| State management | Zustand | Lightweight, no boilerplate, perfect for hackathon speed |
| Styling | Tailwind + shadcn/ui | Pre-built accessible components, consistent design |
| Animations | Framer Motion | Smooth card entrances, arc glow, pulsing badges |
| Diagrams | Mermaid.js | Renders sequence/ER diagrams from markdown already in Kiro specs |
| WebSocket | Socket.io | Reliable reconnection, rooms, fallback to polling |
| Agent SDK | Strands Agents SDK | AWS-native, judges are from the agentic team |
| LLM | Bedrock (Claude) | Available through Kiro credits, Strands integrates natively |
| Deployment | Vercel | Instant deploys, preview URLs for demo |

### Minimum Viable Demo (MVP cut line)

**Must have (demo-blocking):**
- Three-column canvas with real spec data rendered as cards
- Cross-linking arcs on hover
- At least one working agent (DriftDetector or GapFinder)
- Annotation popover with comment action
- Approve / Request Changes flow
- Streaming card population animation

**Nice to have (polish):**
- Mermaid diagram rendering inside nodes
- TestSynthesizer agent
- Yjs collaborative cursors
- Dark mode toggle
- Keyboard shortcuts

**Cut if behind schedule:**
- Real-time Kiro integration (use saved spec files instead)
- Multiple agent orchestration (one agent is enough)
- Yjs collaboration
