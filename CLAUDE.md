# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Respec is a visual annotation layer for Kiro's spec-driven development. It transforms markdown specs (requirements, design, tasks) into interactive cross-linked canvases with agent-powered validation. Two deliverables: a Next.js web app and a VS Code extension.

## Commands

### Web App (`respec/`)
```bash
cd respec && npm install
cd respec && npm run dev          # Dev server on :3000
cd respec && npm run build        # Production build
cd respec && npm run lint         # ESLint
```

### VS Code Extension (`respec-extension/`)
```bash
cd respec-extension && npm install
cd respec-extension && npm run build        # Build extension + webview
cd respec-extension && npm run build:ext    # Extension only (esbuild)
cd respec-extension && npm run build:webview # Webview only (Vite)
cd respec-extension && npm run package      # Package .vsix
```

### Webview (`respec-extension/webview/`)
```bash
cd respec-extension/webview && npm run build
cd respec-extension/webview && npm run dev
```

## Architecture

Two packages sharing core logic:

- **`respec/`** — Next.js 16 App Router web app. React Flow canvas, Zustand state, shadcn/ui components, Tailwind CSS 4.
- **`respec-extension/`** — VS Code extension (esbuild) with embedded React webview (Vite). Reads `.kiro/specs/` files, watches for changes, writes feedback back.

### Core Data Flow
1. Markdown specs → `lib/spec-parser.ts` → `ParsedSpec` (requirements, design, tasks)
2. `lib/cross-linker.ts` computes edges between spec items via `implementsRequirements`/`implementsDesign` arrays
3. `app/canvas/page.tsx` renders three-column React Flow layout (requirements → design → tasks)
4. API routes (`app/api/agents/`) run DriftDetector and GapFinder validation
5. Annotations stored in Zustand → FeedbackCompiler → structured markdown for Kiro

### Key Modules
- `lib/types.ts` — All shared interfaces (Requirement, DesignElement, Task, Annotation, AgentInsight)
- `lib/spec-parser.ts` — EARS-notation markdown parser (parseRequirements, parseDesign, parseTasks)
- `lib/cross-linker.ts` — Bidirectional linking + orphan detection
- `lib/store.ts` — Zustand store with selectors for annotations and insights
- `components/canvas/nodes/` — EarsCard (blue), DesignCard (purple), TaskCard (green)
- `components/canvas/edges/CrossLinkEdge.tsx` — Animated SVG arcs with glow
- `components/canvas/overlays/` — AnnotationPopover, ApprovalBar, FeedbackModal
- `components/rail/AgentActivityRail.tsx` — Agent status sidebar

### Naming Conventions
- Requirements: `FR-X.Y`, Design: `DE-X`, Tasks: `T-X`
- One component per file, PascalCase for agents

### Color System
Blue = requirements, Purple = design, Green = tasks, Red = warnings, Amber = suggestions

## Kiro Steering

`.kiro/steering/` contains code standards, UI guidelines, and agent behavior rules. These define the project's conventions — read them before making changes to canvas components or agent logic.

## Deployment
- Web: Vercel (https://respec-five.vercel.app)
- Extension: `.vsix` package in `respec-extension/`
