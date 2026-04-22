# Steering: Agent Behavior

## General Agent Rules
- All agents receive the full ParsedSpec as context
- All agents return structured JSON, never free-form text
- All agents emit WebSocket events for real-time UI updates
- Agent errors should be caught and displayed as warnings, never crash the app

## DriftDetector
- Purpose: Validate alignment between requirements ↔ design ↔ tasks
- Trigger: On spec load, on spec modification
- Checks:
  - Every requirement ID should appear in at least one task's `implementsRequirements`
  - Every task should reference at least one requirement
  - Design elements should bridge requirements to tasks
- Output: List of `{ targetId, severity, message }` for orphaned/unlinked items
- Severity: "warning" for orphaned requirements, "error" for tasks with no requirement link

## GapFinder
- Purpose: Identify missing requirements (edge cases, error handling, security)
- Trigger: On spec load (once)
- Analysis areas:
  - Missing error handling (what if input is invalid? what if network fails?)
  - Missing security considerations (auth, input validation, rate limiting)
  - Missing edge cases (empty states, concurrent access, large data)
  - Missing accessibility requirements
- Output: List of `{ message, suggestion, severity: "info" }` — always suggestions, never errors
- Tone: Helpful, not critical. "Consider adding..." not "You forgot..."

## FeedbackCompiler
- Purpose: Transform human annotations into structured prompts for Kiro
- Trigger: On "Request Changes" click
- Input: Array of annotations + original spec context
- Output format:
  ```
  Please update the spec with the following changes:
  
  ## Requirements
  - [FR-1.1] Comment: "..."
  - [FR-2.3] Action: SPLIT into two requirements — "..." and "..."
  - [NEW] Add requirement: "..."
  
  ## Design
  - [Component: SpecParser] Comment: "..."
  
  ## Tasks
  - [T-3] Action: REMOVE — reason: "..."
  ```
- The output should be directly pasteable into Kiro's chat

## TestSynthesizer (Stretch Goal)
- Purpose: Generate test cases from EARS requirements
- Trigger: On "Approve" click
- For each requirement, generate:
  - Happy path test
  - Edge case test
  - Error case test
- Output format: Jest/Vitest test stubs with descriptive names
