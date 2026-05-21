# Steering: Respec Code Standards

## Project Context
Respec is a visual annotation layer for Kiro's spec-driven development workflow. It began as a hackathon project and is now presented as a portfolio demo, so keep the code easy to demo, easy to explain, and honest about what is implemented.

## Tech Stack Rules
- Next.js 15 with App Router (no Pages Router)
- TypeScript strict mode — no `any` types except in rapid prototyping blocks marked `// HACK:`
- React Flow (@xyflow/react) for the canvas — use custom nodes, not default
- Zustand for state — single store in `lib/store.ts`, no prop drilling
- shadcn/ui for all UI primitives — don't reinvent buttons, popovers, cards
- Framer Motion for animations — keep variants in the component file, not a separate file
- Tailwind CSS — no inline styles, no CSS modules
- Socket.io for WebSocket — client wrapper in `lib/ws-client.ts`

## Code Patterns
- Components: one component per file, named export, PascalCase filename
- Hooks: prefix with `use`, one hook per file in `hooks/` directory
- Types: shared types in `lib/types.ts`, component-specific types co-located
- API routes: Next.js route handlers in `app/api/`
- Agents: each agent in `lib/agents/` with its own file, Strands SDK pattern

## Naming Conventions
- Spec items: `FR-X.Y` for requirements, `DE-X` for design elements, `T-X` for tasks
- Agent names: PascalCase (DriftDetector, GapFinder, FeedbackCompiler, TestSynthesizer)
- WebSocket events: `namespace:action` format (e.g., `spec:upload`, `agent:thinking`)
- CSS: Tailwind utility classes only, use `cn()` helper from shadcn for conditional classes

## Performance Rules
- React Flow: memoize custom nodes with `React.memo`
- Mermaid: render async, show skeleton while loading
- Cross-links: compute on hover only, cache results in Zustand
- Animations: use `will-change` sparingly, prefer `transform` and `opacity`

## Demo-First Development
- Every feature should be visually impressive within 5 seconds of interaction
- Prefer animated transitions over instant state changes
- Always have a fallback for slow agent responses (skeleton, "thinking..." state)
- Sample data should look realistic — use a real-world app spec, not lorem ipsum
