# v0 — Event Graph Visualization

Small Next.js + TypeScript app for visualizing event and participation data. It contains a collection of reusable visualization components (charts, heatmaps, timelines, etc.) intended for building dashboard-style visualizations.

> Note: This repository was initially created from a v0.app project and may still include v0-related deployment metadata.

## Key features

- Next.js (App Router) + TypeScript
- Component-based visualizations: activity chart, event timeline, heatmap, contribution graph, skills radar, and more
- Small `lib/` helpers for sample data and utilities

## Tech stack

- Next.js (app directory)
- React + TypeScript
- pnpm (package manager)
- PostCSS

## Quick start

Requirements

- Node.js 18+ (recommended)
- pnpm

Install dependencies

```bash
pnpm install
```

Run development server

```bash
pnpm dev
```

Build for production

```bash
pnpm build
pnpm start
```

Deploy

Deploy to Vercel (recommended) or any host supporting Next.js.

## Project structure (high level)

- `app/` — Next.js routes, layout and global CSS
- `components/` — Reusable UI and visualization components
- `lib/` — Data helpers and utilities (`data.ts`, `utils.ts`)
- `public/` — Static assets
- `styles/` — Global styles

Files of interest

- `app/page.tsx` — Main app entry page
- `components/event-timeline.tsx` — Timeline visualization
- `components/events-heatmap.tsx` — Heatmap visualization

## Development notes

- Keep components small and composable. Prefer typed props for components and place shared logic in `lib/`.
- To add a new visualization, create a component under `components/` and import it into a page under `app/`.

## Tests & linting

There are no tests or lint config added by default. Consider adding ESLint, Prettier and a test runner (Vitest / Jest + React Testing Library) as the project grows.

## Contributing

- Fork, create a feature branch, and open a PR with a clear description.
- Add small focused changes and include a demo page or tests for new components when possible.

## License

- No license file detected. Add a `LICENSE` to clarify usage terms.

## Contact

Open issues or PRs for questions, improvements, or feature requests.

---

Generated/updated README on behalf of repository owner.
# Event graph visualization

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/bhavyawork121-8424s-projects/v0-event-graph-visualization)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/nqSRpxGLz9V)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/bhavyawork121-8424s-projects/v0-event-graph-visualization](https://vercel.com/bhavyawork121-8424s-projects/v0-event-graph-visualization)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/nqSRpxGLz9V](https://v0.app/chat/nqSRpxGLz9V)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
