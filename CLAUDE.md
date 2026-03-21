# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build to dist/
npm run lint      # ESLint check
npm run preview   # Preview production build
```

No test framework is configured.

## Architecture

**terminallyonline** is a client-side React SPA that teaches Unix/Linux terminal commands through interactive lessons and a sandbox environment. No backend, no routing library, no external APIs.

### App Flow

`index.html` → `src/main.jsx` → `App.jsx` → `src/components/terminallyonline.jsx`

The entire application lives in `terminallyonline.jsx` (~1200 lines), a single stateful component managing four screens via a `screen` state variable: `"landing"` → `"menu"` → `"lesson"` | `"sandbox"`.

### Key Concepts

- **CHAPTERS array**: 9+ teaching modules (nav, read, pipe, sys, perm, ssh, tmux, docker, nginx, boss) each containing `teach[]` notes and `steps[]` with task descriptions, acceptable commands, expected output, and hints.
- **Command validation**: Case-insensitive, whitespace-normalized matching against multiple acceptable command variations per step. No actual shell execution.
- **Virtual filesystem (FS)**: In-memory object simulating a Linux directory structure, used by the sandbox. Implements `ls`, `cd`, `pwd`, `cat`, `head`, `tail`, `grep`, `wc`, `find`, `tree`, `echo`, `whoami`, `env`, `which`, `history`.
- **Keyboard-driven navigation**: Arrow keys/j/k, number keys, Tab for hints, Esc to go back, ? for help modal.

### Styling

- CSS custom properties in `src/index.css` for theming (light/dark via media query)
- Font families: `--sans`, `--heading`, `--mono`
- Responsive breakpoint at 1024px; mobile detection at 640px
- Component styles in `src/App.css`

### Path Alias

`@/` maps to `./src/` (configured in both `vite.config.js` and `jsconfig.json`).

## Adding New Lessons

Add a new object to the `CHAPTERS` array in `terminallyonline.jsx` following the existing structure: `{ id, title, icon, color, difficulty, desc, teach[], steps[] }`. Each step needs `learn`, `task`, `hint`, `ok` (array of acceptable commands), `out` (expected output), and `note`.
