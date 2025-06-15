## Implementation Plan (High-Level Steps, No Time Estimates)

### 0. Bootstrap – Project Foundation  
- Initialise GitHub repository with `.gitignore`, MIT license, `README.md`.  
- Add ESLint, Prettier, and Husky pre-commit hooks; enforce 80-char print width.  
- Configure TypeScript strict mode and path aliases.  
- Stand up GitHub Actions pipeline (lint → type-check → unit tests → artifact).  
- Add Electron, React, Vite baseline; verify “Hello World” desktop window.  
- Create `.env.example`; document secret handling per Security Checklist.

### 1. Core Graph Layer  
- Define Neo4j data model: `Connector`, `Cavity`, `Wire`, `Splice`, property indexes.  
- Implement Cypher helpers in a `graph-service` module with input validation via Zod.  
- Wire Neo4j embedded runtime into Electron main process; expose CRUD via IPC.  
- Create sample dataset + migration script for dev seeding.  
- Write unit tests covering create/read/update/delete + variant filtered query.  
- Integrate Prisma for future Postgres sync but stub adapters now.

### 2. Dual-Pane UI  
- Scaffold React routes and global Redux store.  
- Integrate TanStack Table for spreadsheet pane; build columns for ID, CSA, colour, optionCode.  
- Integrate React-Flow canvas pane; configure ELK auto-layout worker.  
- Implement two-way binding layer:  
  - Table edit → dispatch RTK mutation → IPC write → store update → canvas re-render.  
  - Canvas drag → edge position update → IPC write → table length cell refresh.  
- Add keyboard shortcuts and context menu skeleton.  
- Basic a11y sweep: tab order, focus ring, aria labels.

### 3. Variant Lens Feature  
- Extend schema with `optionCodes: string[]` on nodes/edges.  
- Build dropdown selector in toolbar; persist choice in Redux.  
- Parameterise Cypher queries with active option code list; hide/fade non-matching nodes in React-Flow.  
- Update BOM panel to re-aggregate counts per variant.  
- Unit tests: 1-code, multi-code, “ALL” scenarios.

### 4. Rule & Validation Engine  
- Embed jsonLogic runtime in a Web Worker; define message schema `{graphDelta, rules}`.  
- Ship default rule library (CSA vs current, colour standards).  
- On graph update, diff payload → worker → receive violations → store.  
- Display badge icons in table row and canvas node; tooltip shows rule text.  
- Provide Settings dialog to add/disable rules; persist in project JSON.  
- Security check: sanitize user-written jsonLogic before evaluation.

### 5. Import / Export MVP  
- CSV parser for connectors and wires using `papaparse`; map columns to graph model.  
- Wizards:  
  - Step 1: map CSV headers → internal fields.  
  - Step 2: preview and validation summary.  
- Exporters:  
  - BOM CSV (group by part number, variant).  
  - Splice tickets CSV (wire list per splice ID).  
- Error handling: collect row-level errors; show in modal, no stack traces.

### 6. Auth & Cloud Sync  
- Integrate Clerk in Electron renderer; pass session token to main via `contextBridge`.  
- Add Fastify + Apollo Server backend skeleton on AWS; secure with Clerk JWT verification.  
- Implement diff-based sync algorithm:  
  - Compute vector clock for every mutation.  
  - Push local queued diffs when online; pull remote changes; resolve conflicts (last-writer-wins).  
- Encrypt local Neo4j files with AES-256 (key from OS keychain).  
- RBAC enforcement: GraphQL directive checks for `admin`, `editor`, `viewer`.

### 7. Testing, Performance, Accessibility Hardening  
- Unit tests to ≥ 80 % coverage; snapshot tests for UI states.  
- Playwright E2E: import-generate-export happy path on Windows & Linux runners.  
- Lighthouse & Axe audits; fix color-contrast, role, name-label failures.  
- Performance profiling:  
  - React DevTools flamegraph for 5 000-node canvas.  
  - Debounce edit bursts, memoise selectors.  
- Security scanning: `npm audit`, `synk`, OWASP ZAP against local Fastify.

### 8. Packaging & Signing  
- Configure Electron-Builder for MSI (Windows) and DEB/AppImage (Linux).  
- Enable auto-updates via GitHub releases channel; enforce code signing certificates.  
- Add notarisation step for macOS (future).  
- Verify update signature validation inside app (prevent downgrade attacks).  
- Produce SBOM (Software Bill of Materials) with CycloneDX.

### 9. Beta Launch & Feedback Loop  
- Publish public beta channel; invite pilot customers.  
- In-app onboarding tour and sample project download.  
- Capture telemetry (PostHog) respecting GDPR/opt-in toggle.  
- Stand up feedback board (GitHub Discussions + upvote).  
- Tri-age incoming issues daily; label security/performance/UI.  
- Plan post-beta roadmap based on usage analytics and qualitative feedback.

Each task above concludes with:
- Pull Request merged after review and Security Checklist verification.  
- Updated documentation in `/docs` and relevant Storybook stories.
