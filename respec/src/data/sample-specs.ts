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
