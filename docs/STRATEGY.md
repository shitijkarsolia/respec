# Hackathon Strategy — Respec

## Critical: Mystery Prompt

The hackathon reveals a **mystery prompt** at the live event (9:00 AM April 24). Our architecture must be flexible enough to pivot. Respec's core canvas is **domain-agnostic** — it visualizes any Kiro spec. So regardless of the prompt, we build the same tool and apply it to whatever domain they specify.

**Pivot plan:** If the mystery prompt is "build X," we build X using Kiro specs AND demo Respec as the interface we used to review/steer those specs. Two birds, one stone.

---

## Judging Alignment

### Grand Prize Strategy
Hit all four tracks simultaneously:

| Track | Criteria | How We Score |
|-------|----------|-------------|
| **Build** | Technical AI proficiency | Multi-agent backend (DriftDetector, GapFinder, TestSynthesizer, FeedbackCompiler). Strands SDK + AgentCore. Not just calling an API — orchestrating agents. |
| **Collaboration** | Cross-functional innovation | Non-tech teammate designs the annotation UX, writes the demo script, manages the spec review flow. The tool itself IS about collaboration (team spec review). |
| **Impact** | Meaningful, realistic solutions | Every Kiro user writes specs. Every team reviews them. This is a tool for the workflow they're promoting. Immediate real-world use. |
| **Story** | Transparent, scalable workflows | Respec literally makes workflows transparent. The cross-linking arcs ARE transparency. We eat our own dogfood — we use Respec to build Respec. |

### Key Differentiator for AWS Judges
The judges are from the AWS agentic team. They want to see:
1. **Multiple agents collaborating** — not a single LLM call
2. **Agent reasoning made visible** — our canvas shows agent thoughts/actions live
3. **Human-in-the-loop done right** — annotations → structured feedback → agent regeneration
4. **AWS services used well** — Strands SDK, AgentCore Runtime, Bedrock

---

## Timeline (14 hours of build time)

### Phase 1: Foundation (9:00 AM – 11:00 AM) — 2 hours
- [ ] Read mystery prompt, adapt plan
- [ ] `npx create-next-app` + install deps (React Flow, shadcn, framer-motion, mermaid)
- [ ] Basic three-column layout with placeholder cards
- [ ] WebSocket server skeleton

### Phase 2: Core Canvas (11:00 AM – 3:00 PM) — 4 hours
- [ ] Spec parser: markdown → structured JSON (requirements, design, tasks)
- [ ] React Flow nodes for each spec type (EARS cards, Mermaid diagrams, Kanban tasks)
- [ ] Cross-linking arcs (SVG overlay, hover-triggered)
- [ ] Annotation layer (click card → inline comment popover)

### Phase 3: Agent Backend (3:00 PM – 6:00 PM) — 3 hours
- [ ] DriftDetector agent (cross-check alignment between spec phases)
- [ ] GapFinder agent (suggest missing requirements)
- [ ] FeedbackCompiler (annotations → structured prompt)
- [ ] Wire agents to WebSocket — live updates on canvas

### Phase 4: Polish & Demo (6:00 PM – 9:00 PM) — 3 hours
- [ ] Animations: streaming card population, pulsing in-progress tasks, arc glow
- [ ] Approve / Request Changes buttons with agent feedback loop
- [ ] Dark mode, responsive layout, loading states
- [ ] TestSynthesizer agent (stretch goal)

### Phase 5: Submission (9:00 PM – 11:59 PM) — 3 hours
- [ ] Record demo video (3 min max)
- [ ] Write project description + Kiro usage write-up
- [ ] Deploy to Vercel
- [ ] Final testing, bug fixes
- [ ] Submit to Devpost

---

## Role Assignments (Team of 3)

| Role | Person | Focus |
|------|--------|-------|
| **Frontend Lead** | Tech #1 | React Flow canvas, animations, annotation UI, cross-linking |
| **Backend/Agent Lead** | Tech #2 | Spec parser, WebSocket server, Strands agents, AgentCore |
| **Design/Demo Lead** | Non-tech | UX design, annotation flow, demo script, video recording, Devpost submission, Kiro write-up |

---

## Demo Script (60 seconds, expandable to 3 min)

### The Hook (0:00 – 0:10)
"Every AI coding agent generates plans. Nobody can review them well. Meet Respec."

### The Setup (0:10 – 0:20)
Split screen: Kiro IDE left, Respec right. Type a prompt in Kiro: "Build a [mystery prompt topic] with authentication and a dashboard."

### The Wow (0:20 – 0:40)
- Requirements stream in as cards — live, animated
- Design column populates with Mermaid sequence diagram
- GapFinder agent pulses: "Missing: error handling for expired sessions"
- Click "Accept" — new card slides in
- Hover a requirement — arcs draw to 3 related tasks

### The Payoff (0:40 – 0:55)
- Click "Approve All"
- Tasks flip to in-progress with pulsing rings
- Code appears in Kiro terminal
- Tasks flip to done
- App runs

### The Close (0:55 – 1:00)
"Spec to code to running app. Reviewed, validated, transparent. That's Respec."

---

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Mystery prompt requires major pivot | Medium | Canvas is domain-agnostic. We apply Respec to whatever they ask us to build. |
| React Flow learning curve too steep | Medium | Pre-study docs tonight. Fallback: CSS Grid layout with manual SVG arcs (simpler but still visual). |
| Strands SDK setup issues | Medium | Fallback: mock agent responses for demo, implement real agents as stretch. |
| Live Kiro regeneration too slow for demo | High | Pre-cache responses. Record demo with slight speed-up. Have a "replay" mode with saved data. |
| WebSocket complexity | Low | Fallback: polling with 1s interval. Looks the same in demo. |
| Time crunch | High | Prioritize: canvas > annotations > one agent > polish. Cut TestSynthesizer and Yjs collab first. |

---

## Pre-Event Prep (Tonight, April 23)

- [ ] Study React Flow docs — custom nodes, edges, layout algorithms
- [ ] Study Strands Agents SDK — basic agent creation, tool definition
- [ ] Scaffold Next.js project with all deps installed
- [ ] Build a throwaway React Flow prototype (3 columns, draggable cards, SVG edges)
- [ ] Write sample spec files to test parser against
- [ ] Prepare `.kiro/` config files (steering, hooks, agents)
