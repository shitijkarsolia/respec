# Respec Architecture

This is the one supporting doc for the repo. The README shows the product; this page shows how the two deliverables fit together.

## System Shape

```mermaid
flowchart LR
    subgraph Web["Next.js web demo"]
        Upload["Paste/upload specs"]
        Parser["Markdown parser"]
        Canvas["React Flow canvas"]
        Routes["Deterministic agent routes"]
    end

    subgraph Extension["VS Code extension"]
        Reader["Read .kiro/specs"]
        Webview["Canvas webview"]
        Writer["Write .kiro/respec feedback"]
        Watcher["Watch specs and insights"]
    end

    subgraph Shared["Shared model"]
        Spec["ParsedSpec"]
        Links["Cross-links"]
        Review["Annotations + approval"]
    end

    Upload --> Parser --> Spec
    Reader --> Spec
    Spec --> Links --> Canvas
    Spec --> Webview
    Canvas --> Routes --> Review
    Webview --> Writer --> Review
    Watcher --> Webview
```

## Visual Flow

| Load specs | Review graph |
|------------|--------------|
| ![Home screen](assets/respec-home.png) | ![Canvas](assets/respec-canvas.png) |

| Add feedback | Compile handoff |
|--------------|-----------------|
| ![Annotation](assets/respec-annotate.png) | ![Feedback](assets/respec-feedback.png) |

## Implemented

- Web app parses Kiro-style markdown into typed requirements, design elements, and tasks.
- React Flow renders the three-column canvas, cross-links, hover states, annotations, agent rail, and approval bar.
- DriftDetector and GapFinder run deterministic checks through Next.js API routes.
- FeedbackCompiler converts annotations into structured markdown.
- VS Code extension reads workspace specs, renders the same webview, and writes `.kiro/respec/feedback.md`.

## Planned Path

- Replace deterministic checks with Bedrock/Claude-powered semantic agents.
- Stream live Kiro generation events into the canvas.
- Persist collaborative review sessions.
- Generate tests from EARS requirements.
