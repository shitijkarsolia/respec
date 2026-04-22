# Respec

**Visual annotation layer for spec-driven development.** Turn Kiro's three-phase specs (requirements, design, tasks) into interactive canvases you can annotate, approve, and send back to agents — live.

Built for the [Kiro Spark Challenge](https://kiro-spark-challenge.devpost.com/) at ASU, April 24 2026.

## What It Does

Kiro generates structured specs: `requirements.md` → `design.md` → `tasks.md`. Today you read them as markdown and type feedback in chat. Respec makes them **visual, interactive, and collaborative**.

- **Three-column canvas** — Requirements / Design / Tasks rendered as rich cards
- **Cross-linking arcs** — hover a requirement, see glowing lines to every task that implements it
- **Inline annotation** — highlight, comment, split, remove, reorder — all visual
- **Live agent feedback loop** — annotations compile into structured prompts sent back to Kiro
- **Multi-agent validation** — DriftDetector, GapFinder, and TestSynthesizer agents run continuously
- **Real-time streaming** — watch specs populate as Kiro thinks

## Why It Matters

Every team reviewing AI-generated specs needs a better interface than raw markdown. Respec is the **PR review UI for specs** — making the invisible work of agents visible, reviewable, and actionable.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React Flow, shadcn/ui, Framer Motion |
| Diagrams | Mermaid.js |
| Real-time | WebSockets + Yjs |
| Agents | AWS Strands Agents SDK, AgentCore Runtime |
| Infra | Vercel (frontend), AWS Lambda (agents) |

## Architecture

```
Browser (React Flow Canvas)
  ├── RequirementsColumn — EARS-notation cards
  ├── DesignColumn — Mermaid diagrams + cards  
  ├── TasksColumn — Kanban (todo/in-progress/done)
  ├── CrossLinkOverlay — SVG arcs between related items
  └── AnnotationLayer — inline comments, redlines
        │
        ▼
  WebSocket Server
        │
        ├── SpecParser — watches .kiro/specs/, parses markdown → structured data
        ├── DriftDetector agent — cross-checks req ↔ design ↔ tasks alignment
        ├── GapFinder agent — suggests missing requirements
        ├── TestSynthesizer agent — generates tests from EARS requirements
        └── FeedbackCompiler agent — packages annotations → structured Kiro prompts
```

## Team

- 3 ASU students, Kiro Spark Challenge 2026

## License

MIT
