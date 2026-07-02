# Respec

**Visual review UI for Kiro-style specs.**

Respec turns `requirements.md`, `design.md`, and `tasks.md` into an interactive canvas where reviewers can see coverage, flag issues, compile feedback, and approve a spec.

[Live Demo](https://respec-ai.vercel.app) | [Architecture](docs/ARCHITECTURE.md)

## Demo

https://github.com/user-attachments/assets/c2bb4277-f33e-4ff4-b879-6bd2a0902e8f

▶ A ~28s walkthrough of the full review loop (landing → canvas → trace → annotate → compile → approve → handoff). The composition source lives in [`demo-video/`](demo-video).

## The idea

Kiro writes specs as three Markdown files: `requirements.md`, `design.md`, and `tasks.md`. That's a fine format for a machine to produce, and a rough one for a human to read through. Everything connects to everything, but a document only shows you one line at a time. A requirement points at a design decision, which points at a handful of tasks. So to check whether task T-6 actually implements requirement FR-2.1, you're scrolling between three files and holding the map in your head. Miss one link and a whole requirement ships with nothing built for it.

So I built Respec. It takes those same three files and lays them out on a canvas: requirements on the left, design in the middle, tasks on the right, with lines drawn between the things that reference each other. You pick a sample spec or paste your own, the canvas builds itself, and then you review.

Hover a requirement and its links light up while everything unrelated dims, so you can see exactly what implements it. Two rule-based agents, DriftDetector and GapFinder, scan the spec and flag the gaps: a task that implements nothing, a requirement nobody built. When you spot a problem you annotate it right on the card. You can comment, ask for a split, mark something for removal, or flag it for clarification. When you're done, hit Request Changes and Respec compiles your annotations into a clean feedback document you can download or paste straight back into Kiro. Or approve the spec, and it hands you an approval artifact to pass along. You can also share a review as a link that carries the whole annotated canvas, so whoever opens it sees exactly what you saw. No server on the other end, nothing to log into.

And that's really the whole idea. Specs are where the cheap fixes live. Catch a missing task on the canvas and it costs you a second. Catch it after someone's built the wrong thing and it costs a sprint. Respec just makes the structure visible enough that the cheap fix is the one you reach for.

## Demo Flow

The demo runs as a complete review loop:

| Start | Review |
|-------|--------|
| ![Home screen](docs/assets/respec-home.png) | ![Canvas review](docs/assets/respec-canvas.png) |

| Annotate | Compile feedback |
|----------|------------------|
| ![Annotation flow](docs/assets/respec-annotate.png) | ![Compiled feedback](docs/assets/respec-feedback.png) |

1. Pick a sample spec (Pomodoro Timer, URL Shortener API, or Realtime Chat) — or paste your own.
2. Review the canvas: cross-links, agent flags on the cards, and the activity rail.
3. Annotate an issue (the Pomodoro demo includes a guided walkthrough).
4. Click **Request Changes** to compile structured feedback, then **Download** it as Markdown or **Copy** it.
5. **Share** the review — the link rebuilds the exact annotated canvas, no backend required.
6. Continue reviewing or approve the spec.

## What It Shows

- Three-column spec canvas: requirements, design, tasks.
- Cross-links from requirements to implementation work, with agent flags surfaced on the cards and minimap.
- Multiple sample specs plus bring-your-own upload.
- Deterministic DriftDetector and GapFinder demo agents (a preview of what Kiro's Claude/Bedrock agents surface).
- Typed annotations: comment, split, remove, clarify.
- FeedbackCompiler output ready to download, copy, or paste into Kiro or another agent.
- Shareable review links that round-trip the full canvas state through the URL.
- Responsive layout: the canvas chrome adapts to mobile (drawer rail, bottom-sheet annotations).
- VS Code extension path that reads `.kiro/specs/` and writes `.kiro/respec/` review artifacts.

## Run Locally

```bash
git clone https://github.com/shitijkarsolia/respec.git
cd respec/respec
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Repo Map

```text
respec/
├── respec/             # Next.js web demo
├── respec-extension/   # VS Code extension + webview
├── demo-video/         # "video-as-code" demo (capture + composition)
├── .kiro/              # Example Kiro specs, hooks, and steering
└── docs/               # Architecture doc and screenshots
```

## Notes

Built by me for the Kiro Spark Challenge at ASU. The agent layer is deterministic for demo reliability; the architecture keeps a clear path for Bedrock/Claude-powered agents later.

## License

MIT
