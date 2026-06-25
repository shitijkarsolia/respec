// Sample Kiro specs used by the demo. Each entry is a complete
// requirements / design / tasks trio authored to parse cleanly with
// `spec-parser.ts` and to include at least one deliberate coverage gap so the
// DriftDetector agent has a real finding to surface.

export interface DemoSpec {
  id: string;
  name: string;
  tagline: string;
  /** Short accent used on the picker card: 'emerald' | 'purple' | 'sky'. */
  accent: 'emerald' | 'purple' | 'sky';
  requirements: string;
  design: string;
  tasks: string;
}

/* ------------------------------------------------------------------ */
/* 1. Pomodoro Timer (the guided-tour demo — keep T-8 as the gap)      */
/* ------------------------------------------------------------------ */

export const sampleRequirements = `# Requirements: Pomodoro Timer App

## Functional Requirements

### Timer Functionality

- **FR-1.1** WHEN the user clicks the start button, THE SYSTEM SHALL begin a countdown timer from the configured duration (default 25 minutes).
- **FR-1.2** WHEN the user clicks the pause button while a timer is running, THE SYSTEM SHALL pause the countdown and preserve the remaining time.
- **FR-1.3** WHEN the user clicks the reset button, THE SYSTEM SHALL stop the current timer and reset the display to the configured duration.

### Session Tracking

- **FR-2.1** WHEN a timer countdown reaches zero, THE SYSTEM SHALL record the completed session with a timestamp, duration, and optional label to the session history.
- **FR-2.2** WHEN the user navigates to the statistics view, THE SYSTEM SHALL display total focus time, completed sessions, and average session length for the current day and week.
- **FR-2.3** WHEN the user sets a daily goal, THE SYSTEM SHALL track progress toward that goal and display a progress indicator on the main screen.

### Notifications

- **FR-3.1** WHEN a timer countdown reaches zero, THE SYSTEM SHALL play an audible alert sound to notify the user.
- **FR-3.2** WHEN a timer countdown reaches zero AND the browser supports the Notifications API, THE SYSTEM SHALL display a browser push notification with the session summary.

### User Interface

- **FR-4.1** THE SYSTEM SHALL provide a responsive layout that adapts to viewport widths from 320px to 2560px without horizontal scrolling.
- **FR-4.2** WHEN the user toggles the theme switch, THE SYSTEM SHALL switch between light and dark color modes and persist the preference in local storage.

## Non-Functional Requirements

- **NFR-1.1** THE SYSTEM SHALL maintain timer accuracy within 100ms of real elapsed time by using a drift-correcting interval mechanism.
- **NFR-2.1** THE SYSTEM SHALL be fully operable via keyboard, with visible focus indicators on all interactive elements, conforming to WCAG 2.1 Level AA.
`;

export const sampleDesign = `# Design: Pomodoro Timer App

## Component Overview

The application is structured as a single-page app with four primary components:

1. **TimerDisplay** — Renders the countdown clock face and controls (start, pause, reset). Implements FR-1.1, FR-1.2, and FR-1.3.
2. **SessionHistory** — Lists completed Pomodoro sessions with timestamps and durations. Supports FR-2.1 and FR-2.2.
3. **GoalTracker** — Shows daily goal progress as a ring chart. Implements FR-2.3.
4. **SettingsPanel** — Allows configuration of timer duration, notification preferences (FR-3.1, FR-3.2), and theme toggle (FR-4.2).

All components share state through a central \`TimerContext\` provider.

## Timer Flow

The following sequence diagram illustrates the core timer lifecycle, covering start, countdown, completion, and session persistence (FR-1.1, FR-2.1, FR-3.1, FR-3.2):

\`\`\`mermaid
sequenceDiagram
    participant User
    participant TimerDisplay
    participant TimerEngine
    participant NotificationService
    participant SessionStore

    User->>TimerDisplay: Click Start
    TimerDisplay->>TimerEngine: start(duration)
    loop Every 1s (drift-corrected)
        TimerEngine->>TimerDisplay: tick(remainingMs)
    end
    TimerEngine->>TimerDisplay: complete()
    TimerDisplay->>NotificationService: alertUser()
    NotificationService->>User: Play sound (FR-3.1)
    NotificationService->>User: Browser notification (FR-3.2)
    TimerEngine->>SessionStore: saveSession(session)
    SessionStore-->>TimerDisplay: Updated history
\`\`\`

## Data Model

Sessions are persisted in \`localStorage\` under the key \`pomodoro_sessions\`. Each entry follows this schema:

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| id          | string   | UUID v4 identifier                       |
| startedAt   | string   | ISO 8601 timestamp of session start      |
| duration    | number   | Configured duration in seconds           |
| actualTime  | number   | Actual elapsed time in seconds           |
| label       | string?  | Optional user-provided label (FR-2.1)    |
| completedAt | string   | ISO 8601 timestamp of session completion |

User preferences (theme mode per FR-4.2, daily goal per FR-2.3, default duration) are stored under the key \`pomodoro_settings\`.

## API: Timer Controls

The \`TimerEngine\` exposes the following programmatic interface, used by TimerDisplay:

| Method              | Description                                                        |
|---------------------|--------------------------------------------------------------------|
| \`start(duration)\`   | Begins countdown from the given duration in ms. See FR-1.1.        |
| \`pause()\`           | Freezes the countdown, preserving remaining time. See FR-1.2.      |
| \`reset()\`           | Stops the timer and resets to configured duration. See FR-1.3.     |
| \`onTick(callback)\`  | Registers a listener invoked each second with remaining ms.        |
| \`onComplete(cb)\`    | Registers a listener invoked when the countdown reaches zero.      |

The engine uses \`performance.now()\` for drift correction to satisfy NFR-1.1.
`;

export const sampleTasks = `# Tasks: Pomodoro Timer App

### T-1: Set up project scaffolding

- [x] Initialize React project with TypeScript template
- [x] Configure ESLint and Prettier
- [x] Add Tailwind CSS and base theme tokens
- [x] Create folder structure (components, hooks, utils, types)

**Implements:** FR-4.1

### T-2: Implement TimerEngine core logic

- [x] Create \`useTimer\` hook with start, pause, and reset methods
- [x] Implement drift-correcting interval using \`performance.now()\`
- [x] Add unit tests for timer accuracy

**Implements:** FR-1.1, FR-1.2, FR-1.3, NFR-1.1

### T-3: Build TimerDisplay component

- [x] Render circular countdown visualization
- [x] Wire start, pause, and reset buttons to TimerEngine
- [x] Add keyboard shortcuts for timer controls
- [x] Ensure visible focus indicators on all buttons

**Implements:** FR-1.1, FR-1.2, FR-1.3, NFR-2.1

### T-4: Implement session persistence

- [-] Create SessionStore utility for localStorage CRUD
- [-] Save completed session on timer completion
- [ ] Add data migration strategy for schema changes

**Implements:** FR-2.1

### T-5: Build statistics dashboard

- [ ] Create SessionHistory list component
- [ ] Implement daily and weekly aggregation logic
- [ ] Build summary cards for total time, session count, and averages

**Implements:** FR-2.1, FR-2.2

### T-6: Add notification system

- [-] Integrate Web Audio API for completion sound
- [ ] Request and handle Notification API permissions
- [ ] Display browser notification with session summary on completion

**Implements:** FR-3.1, FR-3.2

### T-7: Implement dark mode toggle

- [ ] Create theme context with light/dark tokens
- [ ] Build toggle switch component in SettingsPanel
- [ ] Persist theme preference to localStorage

**Implements:** FR-4.2

### T-8: Add Pomodoro streak badges

- [ ] Design badge artwork for 3-day, 7-day, and 30-day streaks
- [ ] Implement streak calculation logic
- [ ] Display earned badges on the statistics dashboard
`;

/* ------------------------------------------------------------------ */
/* 2. URL Shortener API                                                */
/* ------------------------------------------------------------------ */

const urlShortenerRequirements = `# Requirements: URL Shortener API

## Functional Requirements

### Link Creation

- **FR-1.1** WHEN a user submits a long URL, THE SYSTEM SHALL generate a unique short code and return the shortened URL.
- **FR-1.2** WHEN a user submits a URL that has already been shortened, THE SYSTEM SHALL return the existing short code instead of creating a duplicate.
- **FR-1.3** IF a submitted URL is malformed or invalid, THE SYSTEM SHALL reject the request with a 400 error and a descriptive message.
- **FR-1.4** WHEN an authenticated user provides a custom alias, THE SYSTEM SHALL use that alias if it is available and unreserved.

### Redirection

- **FR-2.1** WHEN a visitor requests a short code, THE SYSTEM SHALL redirect to the original URL with a 301 response.
- **FR-2.2** WHEN a short code does not exist, THE SYSTEM SHALL return a 404 response with an option to create a new link.
- **FR-2.3** WHEN a short link is accessed, THE SYSTEM SHALL increment its click counter and record the access timestamp.

### Analytics & Access Control

- **FR-3.1** WHEN an authenticated user opens their dashboard, THE SYSTEM SHALL display every link they created with total clicks and last-accessed time.
- **FR-3.2** WHERE a link has an expiration date, THE SYSTEM SHALL return a 410 Gone response for requests after that date.

## Non-Functional Requirements

- **NFR-1.1** THE SYSTEM SHALL resolve short codes within 50ms at the 95th percentile.
- **NFR-2.1** THE SYSTEM SHALL enforce a rate limit of 100 link creations per hour per IP address.
`;

const urlShortenerDesign = `# Design: URL Shortener API

## System Architecture

The service is a stateless API backed by a key-value store for code lookups and a relational store for analytics (FR-2.1, FR-2.3, FR-3.1):

\`\`\`mermaid
flowchart LR
    Client -->|POST /shorten| API
    Client -->|GET /:code| API
    API --> Cache[(Redis cache)]
    API --> DB[(Postgres)]
    Cache -. miss .-> DB
    API --> Analytics[Click pipeline]
\`\`\`

## Short Code Generation

- Encodes an auto-incrementing ID into a base-62 string for compact codes. Implements FR-1.1.
- Checks a reserved-word list before accepting custom aliases (FR-1.4).
- Deduplicates by hashing the normalized URL and looking up existing codes (FR-1.2).

## Data Model

Links are stored in the \`links\` table and resolved via a Redis cache (FR-2.1, FR-3.2):

| Field       | Type      | Description                                  |
|-------------|-----------|----------------------------------------------|
| code        | string    | Short code (primary key)                     |
| longUrl     | string    | Original destination URL                     |
| ownerId     | string?   | Creator's user id, null for anonymous (FR-3.1)|
| clicks      | number    | Running click count (FR-2.3)                 |
| expiresAt   | string?   | Optional ISO 8601 expiry (FR-3.2)            |
| createdAt   | string    | ISO 8601 creation timestamp                  |

## API: Endpoints

| Method & Path     | Description                                              |
|-------------------|----------------------------------------------------------|
| \`POST /shorten\`   | Create a short link from a long URL. See FR-1.1, FR-1.3. |
| \`GET /:code\`      | Resolve and redirect to the original URL. See FR-2.1.    |
| \`GET /api/links\`  | List the authenticated user's links. See FR-3.1.        |
`;

const urlShortenerTasks = `# Tasks: URL Shortener API

### T-1: Provision data stores

- [x] Set up Postgres schema and migrations for the links table
- [x] Configure Redis cache for hot code lookups
- [x] Add connection pooling and health checks

**Implements:** FR-2.1, FR-2.3

### T-2: Implement short code generator

- [x] Build base-62 encoder over auto-increment IDs
- [x] Add reserved-word and collision checks
- [-] Wire URL normalization and dedup lookup

**Implements:** FR-1.1, FR-1.2, FR-1.4

### T-3: Build creation endpoint

- [x] Validate incoming URLs and return 400 on malformed input
- [-] Apply per-IP rate limiting middleware
- [ ] Return the canonical short URL in the response body

**Implements:** FR-1.1, FR-1.3, NFR-2.1

### T-4: Build redirect endpoint

- [ ] Resolve codes from cache with Postgres fallback
- [ ] Increment click counter asynchronously on each hit
- [ ] Return 404 and 410 responses for missing or expired links

**Implements:** FR-2.1, FR-2.2, FR-2.3, FR-3.2

### T-5: Build analytics dashboard API

- [ ] Add authenticated route listing a user's links
- [ ] Aggregate click totals and last-accessed timestamps

**Implements:** FR-3.1

### T-6: Add QR code generation for links

- [ ] Generate a scannable QR image per short link
- [ ] Expose a download endpoint for the QR asset
`;

/* ------------------------------------------------------------------ */
/* 3. Realtime Chat                                                    */
/* ------------------------------------------------------------------ */

const chatRequirements = `# Requirements: Realtime Chat

## Functional Requirements

### Messaging

- **FR-1.1** WHEN a user sends a message in a channel, THE SYSTEM SHALL deliver it to all connected members within 200ms.
- **FR-1.2** WHEN a user opens a channel, THE SYSTEM SHALL load the 50 most recent messages in reverse chronological order.
- **FR-1.3** WHILE a user is typing, THE SYSTEM SHALL broadcast a typing indicator to other members of the channel.

### Reliability

- **FR-2.1** IF a message fails to send, THE SYSTEM SHALL queue it locally and retry delivery, marking it as pending until acknowledged.
- **FR-2.2** WHEN a user reconnects after a network drop, THE SYSTEM SHALL synchronize any messages missed while offline.

### Access Control

- **FR-3.1** WHEN a user signs in, THE SYSTEM SHALL authenticate them via OAuth before granting access to any channel.
- **FR-3.2** WHERE a user lacks permission for a channel, THE SYSTEM SHALL hide that channel from their channel list.

### Presence & Empty States

- **FR-4.1** WHEN a channel has no messages, THE SYSTEM SHALL display an empty state with onboarding tips and a prompt to start the conversation.

## Non-Functional Requirements

- **NFR-1.1** THE SYSTEM SHALL support 10,000 concurrent WebSocket connections per node.
`;

const chatDesign = `# Design: Realtime Chat

## Connection Lifecycle

Clients hold a persistent WebSocket; a gateway fans messages out to channel subscribers and persists them asynchronously (FR-1.1, FR-2.2):

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant PubSub
    participant Store

    Client->>Gateway: connect (OAuth token)
    Gateway->>Client: ack + presence
    Client->>Gateway: sendMessage(channel, body)
    Gateway->>PubSub: publish(channel, message)
    PubSub-->>Gateway: fan-out to subscribers
    Gateway-->>Client: deliver(message)
    Gateway->>Store: persist(message)
\`\`\`

## Message Gateway

- Maintains a WebSocket per client and maps channels to subscriber sets. Implements FR-1.1 and FR-1.3.
- Buffers undelivered messages for retry and acknowledgement (FR-2.1).
- Replays missed messages on reconnect using a per-client cursor (FR-2.2).

## Data Model

Messages and channel membership are persisted for history and access control (FR-1.2, FR-3.2):

| Field      | Type    | Description                                  |
|------------|---------|----------------------------------------------|
| id         | string  | Message id (ULID, sortable by time)          |
| channelId  | string  | Owning channel                               |
| authorId   | string  | Sender's user id                             |
| body       | string  | Message text                                 |
| status     | string  | sent \\| pending \\| failed (FR-2.1)           |
| sentAt     | string  | ISO 8601 timestamp                           |

## API: Realtime Events

| Event              | Description                                          |
|--------------------|------------------------------------------------------|
| \`message.send\`     | Client publishes a new message. See FR-1.1.         |
| \`message.typing\`   | Client signals typing activity. See FR-1.3.         |
| \`channel.sync\`     | Server replays missed messages. See FR-2.2.         |
`;

const chatTasks = `# Tasks: Realtime Chat

### T-1: Stand up the WebSocket gateway

- [x] Implement connection handshake with OAuth token validation
- [x] Map channels to subscriber sets in memory
- [-] Add horizontal scaling via a shared pub/sub backbone

**Implements:** FR-1.1, FR-3.1, NFR-1.1

### T-2: Implement message delivery

- [x] Broadcast new messages to channel subscribers
- [-] Persist messages asynchronously to the store
- [ ] Enforce 200ms delivery budget with backpressure

**Implements:** FR-1.1, FR-1.2

### T-3: Add typing indicators

- [x] Emit typing events on input activity
- [ ] Debounce and expire stale typing state

**Implements:** FR-1.3

### T-4: Build offline reliability

- [ ] Queue failed messages locally and retry with backoff
- [ ] Replay missed messages on reconnect using a cursor

**Implements:** FR-2.1, FR-2.2

### T-5: Enforce channel access control

- [ ] Filter channel lists by membership and permission
- [ ] Reject sends to channels the user cannot access

**Implements:** FR-3.2

### T-6: Design channel empty state

- [ ] Build onboarding empty-state component with tips
- [ ] Prompt the first message when a channel is new

**Implements:** FR-4.1

### T-7: Add message reactions and emoji picker

- [ ] Build emoji picker UI
- [ ] Persist reactions and broadcast updates to members
`;

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export const demoSpecs: DemoSpec[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro Timer',
    tagline: 'Focus timer with sessions, stats, and notifications.',
    accent: 'emerald',
    requirements: sampleRequirements,
    design: sampleDesign,
    tasks: sampleTasks,
  },
  {
    id: 'url-shortener',
    name: 'URL Shortener API',
    tagline: 'Short links, redirects, and click analytics.',
    accent: 'purple',
    requirements: urlShortenerRequirements,
    design: urlShortenerDesign,
    tasks: urlShortenerTasks,
  },
  {
    id: 'realtime-chat',
    name: 'Realtime Chat',
    tagline: 'WebSocket messaging with presence and history.',
    accent: 'sky',
    requirements: chatRequirements,
    design: chatDesign,
    tasks: chatTasks,
  },
];

export const DEFAULT_DEMO_ID = 'pomodoro';

export function getDemoSpec(id: string | null | undefined): DemoSpec | undefined {
  return demoSpecs.find((s) => s.id === id);
}
