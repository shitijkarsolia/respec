# Respec - Technical Writeup

**A visual annotation layer that transforms structured specs into interactive, agent-validated canvases.**

---

## Problem Statement

AI coding agents have fundamentally changed how software is planned. Tools like Kiro generate structured specifications -- requirements documents in EARS notation, design breakdowns with component diagrams, and phased task lists with dependency tracking. These specs represent significant planning work, but the review experience has not kept pace with the generation capabilities.

Today, developers review AI-generated specs as raw markdown in a sidebar panel. They scroll through dozens of requirements, mentally trace which tasks implement which requirements, and type feedback in a chat window hoping the agent interprets their intent correctly. There is no visual representation of the relationships between documents, no way to see orphaned requirements that nothing implements, and no structured mechanism to communicate changes back to the agent.

This gap between plan generation and plan review means specs often ship with alignment issues, missing edge cases, and requirements that no task addresses. The feedback loop is unstructured: a developer types "fix requirement 3" and hopes the agent understands which aspect needs fixing and how the change cascades through design and tasks. Respec closes this gap.

---

## Solution Overview

Respec is the PR review UI for specs. It renders the three-phase spec workflow (requirements, design, tasks) as an interactive three-column canvas where every element is a distinct card, relationships are visible as animated arcs, and feedback is structured through typed annotations.

The three-column approach mirrors how specs are organized but adds a spatial dimension: requirements on the left, design in the center, tasks on the right. Cross-linking arcs draw connections between related items, making it immediately visible which requirements have implementations and which are orphaned. Hovering a requirement highlights every task and design element that references it.

The annotation workflow replaces unstructured chat feedback with typed actions. Instead of typing "split requirement 3 into two parts," a reviewer clicks the requirement card, selects "Split," and describes the desired split. When ready, the FeedbackCompiler agent compiles all annotations into a structured markdown prompt formatted for the AI agent to consume without ambiguity. The result is a closed-loop system where specs are generated, visually reviewed, annotated with precision, and regenerated with clear instructions.

---

## Technical Architecture Deep-Dive

### Frontend: React Flow Canvas

The canvas is built on React Flow (@xyflow/react) with custom node types for each spec element category. EarsCard renders requirements with EARS keyword pills (WHEN, WHILE, WHERE, IF) and priority badges. DesignCard renders design elements with type indicators and optional Mermaid diagram embedding. TaskCard renders tasks as kanban-style cards with status pills (To Do, In Progress, Done).

Layout is computed using the Dagre graph layout algorithm, which positions nodes in three columns with appropriate spacing. The layout runs once on spec load and respects the document ordering within each column.

Streaming animation reveals cards one-by-one at 120ms intervals on initial load. This creates a visual effect of specs "generating" in real time. Edges only render when both their source and target nodes are visible, preventing arcs from appearing before their endpoints. The stagger timing was tuned to balance perceived speed with readability.

Cross-link edges use a custom SVG edge component (CrossLinkEdge) with a Gaussian blur filter for a glow effect on hover. Edge opacity reflects relationship strength, and color coding distinguishes relationship types.

### State Management: Zustand Store

Application state lives in a single Zustand store with selector-based access patterns. The store manages:

- **Spec data**: The parsed spec JSON (requirements, design elements, tasks)
- **Annotations**: Per-card annotation arrays with action types and content
- **Agent insights**: Results from DriftDetector and GapFinder with accept/dismiss state
- **UI state**: Selected node, rail visibility, dark mode preference, streaming progress

Selectors provide derived state (annotation counts, filtered insights, connected nodes for a given requirement) without redundant computation. Components subscribe only to the slices they need, minimizing re-renders across the canvas.

### Spec Parser

The spec parser (`spec-parser.ts`) converts EARS-notation markdown into typed JSON. It handles three document types:

- **Requirements**: Extracts EARS keywords (WHEN, WHILE, WHERE, IF, SHALL), requirement IDs (FR-X.Y), priority levels, and the trigger/response structure
- **Design elements**: Parses section headers as element titles, identifies type from content patterns (component, API, data model, diagram), and extracts Mermaid code blocks
- **Tasks**: Parses task headers (T-X: Title), checkbox states for subtasks, status indicators, and `implementsRequirements` references

The parser uses regex-based extraction tuned to the specific format Kiro produces. Output is a `ParsedSpec` interface containing typed arrays for each category, ready for direct consumption by the node builder.

### Cross-Linker

The cross-linker (`cross-linker.ts`) computes bidirectional relationships between spec elements. It scans `implementsRequirements` arrays in tasks and design elements to build a link map, then inverts it to provide queries in both directions: "what implements this requirement?" and "what requirements does this task address?"

Key capabilities:
- **Orphan detection**: Requirements with no implementing task or design element
- **Unlinked task detection**: Tasks that reference no requirements
- **Connected node queries**: Given a node ID, return all directly linked nodes for hover highlighting
- **Link strength computation**: Based on the number of shared references between connected elements

---

## Agent System Design

### DriftDetector

The DriftDetector validates alignment across the three spec phases. It uses the cross-linker to identify:

- **Orphaned requirements**: Requirements that no task or design element references
- **Unlinked tasks**: Tasks with empty `implementsRequirements` arrays
- **Misaligned references**: Tasks referencing requirement IDs that do not exist in the requirements document
- **Coverage gaps**: Design elements with no corresponding implementation tasks

Results surface as AgentInsightCard nodes on the canvas (positioned near the flagged element) and as entries in the Agent Activity Rail with severity badges (warning for orphans, error for invalid references).

### GapFinder

The GapFinder analyzes requirement text to identify common omissions. It pattern-matches against categories that specs frequently miss:

- **Error handling**: Requirements that describe success paths without failure modes
- **Security**: User-facing features without authentication or authorization requirements
- **Empty states**: UI requirements without initial/empty state definitions
- **Responsive design**: Layout requirements without viewport adaptation
- **Accessibility**: Interactive elements without keyboard or screen reader requirements

Each suggestion includes a severity rating and a proposed requirement in EARS notation that the reviewer can accept or dismiss.

### FeedbackCompiler

The FeedbackCompiler transforms user annotations into structured output formatted for AI agent consumption. When a reviewer clicks "Request Changes," the compiler:

1. Groups annotations by target type (requirements, design, tasks)
2. Formats each annotation with its action type, target ID, and content
3. Produces markdown structured for unambiguous interpretation
4. Presents the compiled prompt in a modal with copy-to-clipboard

The output format is designed for direct paste into Kiro or any AI coding agent, providing clear instructions without requiring the agent to interpret natural language intent.

### Agent Architecture Note

For demo reliability, agents use deterministic logic rather than live LLM calls. DriftDetector performs set operations on ID arrays. GapFinder uses pattern matching on requirement text. FeedbackCompiler applies template-based formatting. This approach ensures consistent, fast results during demonstrations while the architecture remains designed for drop-in replacement with Bedrock-powered agents via the AWS Strands SDK.

---

## Key Engineering Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canvas library | React Flow vs custom canvas | React Flow provides node management, zoom/pan, edge routing, and custom node support out of the box, saving weeks of implementation |
| State management | Zustand vs Redux | Zustand offers lightweight store creation with no boilerplate, ideal for a focused application with clear state boundaries |
| Streaming animation | 120ms stagger interval | Simulates live spec generation, creating engagement during load while remaining fast enough to not frustrate users |
| Agent implementation | Deterministic vs LLM-powered | Deterministic logic guarantees consistent demo results; architecture supports swapping to real Bedrock agents without frontend changes |
| Deployment | Vercel | Instant deploys from git push, serverless API routes for agent endpoints, preview URLs for every branch |
| Requirements format | EARS notation | Industry-standard syntax for requirements engineering, already used by Kiro for spec generation |

---

## VS Code Extension

Respec ships as two deliverables: the web application and a VS Code extension. The extension provides the same canvas experience inside the editor, reading `.kiro/specs/` directly from the workspace file system rather than requiring upload or paste.

The extension integrates with Kiro through its hook system:

- **DriftDetector hook**: Triggers on spec file save. Writes an `agent_prompt` that cross-checks requirements against tasks and outputs issues to `.kiro/respec/insights.json`.
- **GapFinder hook**: Triggers on `requirements.md` modification. Analyzes for missing edge cases and appends suggestions to the insights file.
- **FeedbackApplier hook**: Triggers when `.kiro/respec/feedback.md` is written. Reads the structured feedback and updates spec files accordingly.

This hook-based approach means Kiro's own AI handles all heavy computation. The extension reads files, renders the canvas, and writes feedback files. There are zero external API costs since all AI operations run through Kiro's built-in agent infrastructure.

---

## Challenges and Learnings

**React Flow custom node performance**: With 20+ custom nodes rendering simultaneously, initial implementations caused layout thrashing. The solution was to batch node additions during streaming and defer edge computation until both endpoints were stable. Memoization of node components with React.memo prevented unnecessary re-renders during hover interactions.

**Cross-link computation optimization**: The naive O(n*m) approach to computing all cross-links became noticeable with large specs (50+ requirements). Building an inverted index during parsing reduced lookup to O(1) per query, making hover highlighting instant regardless of spec size.

**Balancing agent complexity with demo reliability**: Early versions attempted real LLM calls for agent validation, but network latency and response variability made demos unpredictable. The shift to deterministic agents with LLM-compatible interfaces preserved the architecture while guaranteeing sub-100ms response times during presentations.

**Streaming animation timing**: Finding the right stagger interval required iteration. Too fast (50ms) and cards appeared instantly with no effect. Too slow (300ms) and users waited impatiently. The 120ms interval with ease-out animation creates perceived intelligence without frustrating delays.

---

## Future Roadmap

- **Real-time Kiro integration**: Live spec updates via WebSocket connection to Kiro's spec generation pipeline, enabling the canvas to update as the agent writes
- **Collaborative editing**: Yjs-powered concurrent editing with live cursors, allowing multiple reviewers to annotate simultaneously
- **Full LLM-powered agents**: Replace deterministic logic with Bedrock/Claude via the AWS Strands SDK for deeper semantic analysis, including natural language understanding of requirement quality
- **Test generation from EARS requirements**: A TestSynthesizer agent that produces test cases directly from EARS-notation requirements, mapping WHEN triggers to test preconditions and SHALL responses to assertions
