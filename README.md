# Respec

**Visual annotation layer for spec-driven development**

Transform structured markdown specs into interactive, cross-linked canvases with AI agent validation.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React Flow](https://img.shields.io/badge/React_Flow-12-ff0072?style=flat-square)](https://reactflow.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-respec--five.vercel.app-00C853?style=flat-square&logo=vercel)](https://respec-five.vercel.app)

---

## What is Respec?

AI coding agents generate structured specs (requirements, design, tasks) but developers still review them as raw markdown with no visual layer, no cross-referencing between documents, and no structured feedback loop. Respec bridges this gap by rendering specs as an interactive three-column canvas where requirements, design elements, and tasks are visually linked, annotatable, and validated by AI agents in real time. It is the PR review UI for specs.

[**Live Demo**](https://respec-five.vercel.app)

---

## Demo

<!-- Add a screenshot of the Respec canvas here -->
![Respec Canvas](docs/screenshot-placeholder.png)
<!-- Replace the above with an actual screenshot of the three-column canvas view -->

> Try it live at [respec-five.vercel.app](https://respec-five.vercel.app)

---

## Features

### Three-Column Canvas
Requirements, design elements, and tasks rendered as color-coded cards in a zoomable, pannable React Flow canvas. Each column uses distinct styling: blue EARS cards for requirements, purple cards for design, and green kanban cards for tasks.

### Cross-Linking Arcs
Hover any requirement to see animated SVG arcs connecting it to every task and design element that implements it. Arcs use glow effects and color coding to show relationship types at a glance.

### Inline Annotation
Click any card to open an annotation popover with four action types: comment, split, remove, and clarify. Annotations are tracked per-card with badge counts and persist in the session state.

### Multi-Agent Validation
Three AI agents run automatically on spec load. DriftDetector checks alignment between requirements, design, and tasks. GapFinder identifies missing edge cases and requirements gaps. FeedbackCompiler compiles annotations into structured prompts.

### Streaming Card Animation
Cards appear one-by-one with 120ms stagger intervals, simulating live spec generation. Edges only render when both endpoint nodes are visible, creating a natural build-up effect.

### Approval Workflow
A bottom approval bar tracks pending annotations. "Request Changes" triggers the FeedbackCompiler to produce a structured prompt for spec regeneration. "Approve" clears all annotations and marks the spec as accepted.

### Agent Activity Rail
A collapsible right sidebar displays real-time agent status with thinking animations, completion timestamps, and insight cards. Each insight has Accept/Dismiss actions for incorporating agent suggestions.

### Dark Mode
Full dark mode support with a toolbar toggle. Preference persists to localStorage. All cards, overlays, edges, and the agent rail adapt to the selected theme.

---

## Architecture Overview

The system follows a pipeline architecture: markdown specs flow through a parser into typed JSON, which feeds React Flow for rendering and a cross-linker for edge computation. Three validation agents run in parallel on spec load to surface insights. For detailed diagrams, see the [Architecture Diagrams](docs/architecture-diagram.md).

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Server-side rendering, API routes, fast builds |
| Canvas | React Flow (@xyflow/react) | Node/edge rendering, zoom/pan, custom node types |
| Layout | Dagre | Automatic graph layout for three-column positioning |
| State | Zustand | Lightweight state management with selectors |
| UI Components | shadcn/ui | Pre-built accessible components |
| Animations | Framer Motion | Card entrance animations, popover transitions |
| Styling | Tailwind CSS 4 | Utility-first styling with dark mode support |
| Diagrams | Mermaid.js | In-canvas diagram rendering from spec markdown |
| Deployment | Vercel | Instant deploys, serverless API routes |

---

## Project Structure

```
respec/
├── respec/                  # Next.js 16 web application
│   ├── src/
│   │   ├── app/             # App Router pages and API routes
│   │   ├── components/      # Canvas nodes, edges, overlays, rail, UI
│   │   ├── lib/             # Spec parser, cross-linker, store, types
│   │   └── data/            # Sample spec data for demo mode
│   └── package.json
├── respec-extension/        # VS Code extension
│   ├── src/                 # Extension host code
│   ├── webview/             # Webview panel UI
│   └── hooks/               # Kiro hook definitions
├── .kiro/                   # Kiro specs, steering files, hooks, agents
│   ├── specs/               # EARS requirements, design, tasks
│   ├── steering/            # Code standards, agent behavior, UI guidelines
│   ├── hooks/               # File-based agent triggers
│   └── agents/              # Custom agent definitions
└── docs/                    # Architecture diagrams, technical writeup
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/shitijkarsolia/respec.git
cd respec/respec
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## VS Code Extension

The VS Code extension provides an in-editor canvas that reads `.kiro/specs/` directly from the workspace. It uses Kiro hooks for AI-powered features: DriftDetector fires on spec save, GapFinder runs on requirements changes, and FeedbackApplier processes structured feedback.

### Build the Extension

```bash
cd respec-extension
npm install
npm run build
npm run package
```

This produces a `.vsix` file that can be installed in VS Code or Kiro.

---

## Links

- [Live Demo](https://respec-five.vercel.app)
- [Architecture Diagrams](docs/architecture-diagram.md)
- [Technical Writeup](docs/PROJECT.md)

---

## Built By

Team of 3 - Kiro Spark Challenge at ASU, April 2026

---

## License

MIT
