# Respec

**Visual review UI for Kiro-style specs.**

Respec turns `requirements.md`, `design.md`, and `tasks.md` into an interactive canvas where reviewers can see coverage, flag issues, compile feedback, and approve a spec.

[Live Demo](https://respec-five.vercel.app) | [Architecture](docs/ARCHITECTURE.md)

![Respec canvas](docs/assets/respec-canvas.png)

## Demo Flow

The demo now runs as a complete review loop:

| Start | Review |
|-------|--------|
| ![Home screen](docs/assets/respec-home.png) | ![Canvas review](docs/assets/respec-canvas.png) |

| Annotate | Compile feedback |
|----------|------------------|
| ![Annotation flow](docs/assets/respec-annotate.png) | ![Compiled feedback](docs/assets/respec-feedback.png) |

1. Launch the Pomodoro Timer demo.
2. Use the demo panel to add a sample annotation to an unlinked task.
3. Click **Request Changes** to compile structured feedback.
4. Continue reviewing or approve the spec.

## What It Shows

- Three-column spec canvas: requirements, design, tasks.
- Cross-links from requirements to implementation work.
- Deterministic DriftDetector and GapFinder demo agents.
- Typed annotations: comment, split, remove, clarify.
- FeedbackCompiler output ready to paste into Kiro or another agent.
- VS Code extension path that reads `.kiro/specs/` and writes `.kiro/respec/` review artifacts.

## Run Locally

```bash
git clone https://github.com/shitijkarsolia/respec.git
cd respec/respec
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
cd respec
npm ci
npm run lint
npm run build
npm audit

cd ../respec-extension
npm ci
cd webview && npm ci && cd ..
npm run build
npm audit
cd webview && npm audit
```

## Repo Map

```text
respec/
├── respec/             # Next.js web demo
├── respec-extension/   # VS Code extension + webview
├── .kiro/              # Example Kiro specs, hooks, and steering
└── docs/               # One architecture/walkthrough doc plus screenshots
```

## Notes

Built by a three-person team for the Kiro Spark Challenge at ASU. The agent layer is deterministic for demo reliability; the architecture keeps a clear path for Bedrock/Claude-powered agents later.

## License

MIT
