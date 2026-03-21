## Architecture Audit

**Scope:** Full project (all source files)
**Doctrine source:** ARCHITECTURE.md (last updated 2026-03-03)
**Files scanned:** 16

### Violations

#### TOKENS — medium
- `src/App.css:179` — Hardcoded `2px` gap in `.util-demo`. Use `var(--space-xs)`.

#### SIZE — info
- `src/App.css` — 513 lines. Doctrine limit is 200. Consider splitting into per-component CSS files.

### Passing
- **LAYER** — All source files belong to the correct architectural layer. No logic in UI, no API calls in components, no DOM in core.
- **IMPORT** — Import direction is correct throughout. UI imports from core and services. Services import from services. Core has no outward imports except React (for Context/useReducer, which is the declared state pattern).
- **NAMING** — All files follow declared conventions: PascalCase for components, camelCase for utilities, kebab-case for CSS.
- **STATE** — Context + useReducer pattern in `core/store.jsx` with split contexts. `useState` used for UI-only state in components. No unauthorized state libraries.
- **TOKENS** — No hardcoded colors, font sizes, or spacing in JSX or CSS (except one `2px` value noted above). All design values reference `var(--token-name)`.

### Summary
- High: 0 | Medium: 1 | Low: 0 | Info: 1
- Architecture health: **CLEAN**
