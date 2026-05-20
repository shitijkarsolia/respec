# Respec Web App

Next.js implementation of the Respec visual spec-review canvas.

## Development

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run build
```

The app parses Kiro-style `requirements.md`, `design.md`, and `tasks.md` files into typed spec data, renders them as a React Flow canvas, and runs deterministic validation agents through API routes for demo reliability.
