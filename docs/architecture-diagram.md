# Architecture Diagrams

These diagrams illustrate the system architecture of Respec, from high-level component interactions down to the frontend component hierarchy. Each diagram focuses on a different aspect of the system to provide a complete picture of how data flows from markdown specs through parsing, rendering, and agent validation.

---

## High-Level System Architecture

This diagram shows the two primary delivery paths: the Next.js web application served through a browser, and the VS Code extension that integrates directly with the Kiro IDE through file-based hooks.

```mermaid
flowchart LR
    subgraph Browser["Browser"]
        NextApp["Next.js App<br/>(React Flow Canvas)"]
    end

    subgraph Server["Next.js API Routes"]
        SpecAPI["POST /api/specs<br/>Spec Parser"]
        DriftAPI["POST /api/agents/drift<br/>DriftDetector"]
        GapAPI["POST /api/agents/gap<br/>GapFinder"]
        FeedbackAPI["POST /api/agents/feedback<br/>FeedbackCompiler"]
    end

    subgraph AWS["AWS (Planned)"]
        Bedrock["Bedrock / Claude<br/>(Planned)"]
    end

    subgraph VSCode["VS Code / Kiro"]
        Extension["Respec Extension<br/>(Webview Panel)"]
    end

    subgraph FileSystem["File System"]
        KiroSpecs[".kiro/specs/<br/>requirements.md<br/>design.md<br/>tasks.md"]
        Hooks[".kiro/hooks/<br/>agent_prompt triggers"]
    end

    NextApp --> SpecAPI
    NextApp --> DriftAPI
    NextApp --> GapAPI
    NextApp --> FeedbackAPI
    SpecAPI -.-> Bedrock
    DriftAPI -.-> Bedrock
    GapAPI -.-> Bedrock
    FeedbackAPI -.-> Bedrock

    Extension --> KiroSpecs
    Extension --> Hooks
    Hooks -.-> Bedrock
```

> **Note:** Agents currently use deterministic logic (set operations, pattern matching, and template formatting) for reliability and fast response times. The architecture is designed for drop-in replacement with AWS Bedrock/Claude via the Strands SDK when LLM-powered analysis is desired. Dashed arrows indicate planned connections.

---

## Data Flow Pipeline

This diagram traces the path from raw markdown spec files through the parsing and rendering pipeline, showing how structured JSON feeds both the React Flow canvas and the cross-link computation engine.

```mermaid
flowchart TD
    SpecFiles["Markdown Specs<br/>(.kiro/specs/)"] --> Parser["SpecParser<br/>(spec-parser.ts)"]
    Parser --> ParsedSpec["ParsedSpec JSON<br/>{requirements[], design[], tasks[]}"]

    ParsedSpec --> BuildNodes["buildNodes()<br/>Generate React Flow Nodes"]
    ParsedSpec --> CrossLinker["computeCrossLinks()<br/>(cross-linker.ts)"]

    BuildNodes --> Nodes["Node Array<br/>(EarsCard, DesignCard, TaskCard)"]
    CrossLinker --> Edges["Edge Array<br/>(CrossLinkEdge with glow)"]

    Nodes --> DagreLayout["Dagre Layout Engine<br/>Three-Column Positioning"]
    DagreLayout --> Canvas["React Flow Canvas<br/>Zoom / Pan / Interact"]
    Edges --> Canvas

    ParsedSpec --> AgentInput["Agent Input Data"]
    AgentInput --> DriftDetector["DriftDetector<br/>Alignment Validation"]
    AgentInput --> GapFinder["GapFinder<br/>Missing Requirements"]

    DriftDetector --> Insights["AgentInsight[]<br/>Warnings + Suggestions"]
    GapFinder --> Insights
    Insights --> Canvas
```

---

## Agent Pipeline

This diagram details the three-agent validation system, showing trigger conditions, inputs, processing logic, and how outputs surface on the canvas and in the agent activity rail.

```mermaid
flowchart TD
    SpecLoad["Spec Load Event"] --> DriftTrigger["Trigger DriftDetector"]
    SpecLoad --> GapTrigger["Trigger GapFinder"]
    UserAnnotations["User Annotations<br/>(Request Changes)"] --> FeedbackTrigger["Trigger FeedbackCompiler"]

    subgraph DriftDetector["DriftDetector"]
        DriftInput["Input: ParsedSpec JSON"] --> DriftProcess["Cross-check requirement IDs<br/>against design + task references"]
        DriftProcess --> DriftOutput["Output: Orphaned requirements,<br/>unlinked tasks, misaligned refs"]
    end

    subgraph GapFinder["GapFinder"]
        GapInput["Input: Requirements text"] --> GapProcess["Pattern-match for missing:<br/>error handling, security,<br/>empty states, responsive"]
        GapProcess --> GapOutput["Output: Suggested requirements,<br/>severity ratings"]
    end

    subgraph FeedbackCompiler["FeedbackCompiler"]
        FeedbackInput["Input: Annotation[]<br/>(comment/split/remove/clarify)"] --> FeedbackProcess["Group by target type,<br/>format as structured markdown"]
        FeedbackProcess --> FeedbackOutput["Output: Structured prompt<br/>formatted for Kiro"]
    end

    DriftTrigger --> DriftInput
    GapTrigger --> GapInput
    FeedbackTrigger --> FeedbackInput

    DriftOutput --> InsightCards["AgentInsightCards<br/>on Canvas"]
    GapOutput --> InsightCards
    DriftOutput --> Rail["Agent Activity Rail<br/>(severity badges)"]
    GapOutput --> Rail
    FeedbackOutput --> Modal["Feedback Modal<br/>(copy to clipboard)"]
```

---

## Frontend Component Hierarchy

This diagram shows the React component tree from the root layout down through the canvas page, custom node types, edge types, overlay components, and the agent activity rail.

```mermaid
flowchart TD
    AppLayout["App Layout<br/>(layout.tsx)"] --> HomePage["HomePage<br/>(page.tsx)"]
    AppLayout --> CanvasPage["CanvasPage<br/>(canvas/page.tsx)"]

    CanvasPage --> ReactFlow["ReactFlow<br/>(@xyflow/react)"]
    CanvasPage --> Toolbar["CanvasToolbar<br/>(logo, dark mode toggle)"]
    CanvasPage --> Rail["AgentActivityRail<br/>(right sidebar)"]
    CanvasPage --> ApprovalBar["ApprovalBar<br/>(bottom bar)"]
    CanvasPage --> AnnotationPopover["AnnotationPopover<br/>(click-to-annotate)"]
    CanvasPage --> FeedbackModal["FeedbackModal<br/>(compiled prompt display)"]

    ReactFlow --> EarsCard["EarsCard<br/>(blue requirement node)"]
    ReactFlow --> DesignCard["DesignCard<br/>(purple design node)"]
    ReactFlow --> TaskCard["TaskCard<br/>(green task node)"]
    ReactFlow --> AgentInsightCard["AgentInsightCard<br/>(amber/red insight node)"]
    ReactFlow --> ColumnHeader["ColumnHeader<br/>(section labels)"]
    ReactFlow --> CrossLinkEdge["CrossLinkEdge<br/>(animated SVG with glow)"]

    Rail --> AgentBubble["AgentBubble<br/>(thinking animation)"]
    Rail --> AgentLogEntry["AgentLogEntry<br/>(completed action log)"]

    DesignCard --> MermaidRenderer["MermaidRenderer<br/>(diagram rendering)"]
```
