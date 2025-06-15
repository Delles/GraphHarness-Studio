# GraphHarness Studio – Technical Blueprint

---

## 1. Product Design Requirements (PDR)

### 1.1 Vision  
GraphHarness Studio flips the traditional “draw, then annotate” harness-CAD workflow.  
Engineers enter data once, the application auto-generates the schematic, and all edits stay in sync across data and graphics.

### 1.2 Target Users  
- Wire-harness design engineers in automotive, aerospace, rail.  
- Engineering service providers needing rapid variant turn-around.  
- CAD administrators looking for open APIs and modern tech.

### 1.3 Core Features  
- Dual-pane authoring: spreadsheet table ↔ auto-layout canvas.  
- Graph database model (Neo4j) for connectors, wires, splices.  
- Variant “lenses” for option-code filtering.  
- jsonLogic rule/validation engine.  
- Assisted auto-routing and deterministic wire numbering.  
- Export: CSV/BOM, splice tickets, DXF/STEP, IPC-2581.  
- Plugin SDK (TS/Python) for custom automation.

### 1.4 Functional Requirements  
- Importers: CSV, IPC-2581 v1-B.  
- CRUD operations on nodes/edges with live sync.  
- Real-time validation badges.  
- Sub-100 ms variant filter response on a 10 000-wire harness.  
- Role-based access control (RBAC) for project sharing (admin, editor, viewer).  
- Offline-first desktop app with periodic cloud sync.

### 1.5 Non-Functional Requirements  
- Desktop performance: render 5 000 nodes ≤ 60 fps on mid-range GPU.  
- Autosave every 10 s, crash-recovery ≤ 30 s.  
- Accessibility: WCAG 2.1 AA for the entire UI.  
- Security: comply with OWASP Top 10 and the checklist in section 9.  
- Extensibility: public plugin API with semantic-versioning.

### 1.6 Problem Solved  
Late-stage changes currently require redrawing entire schematics, inviting errors. GraphHarness’s data-first model lets engineers modify a single wire attribute and instantly propagate updates to drawings, BOM, and variants—slashing rework time and defect risk.

---

## 2. Tech Stack

| Layer | Technology | Why |
| ----- | ---------- | --- |
| Desktop shell | Electron 25 (Chromium 125) | Cross-platform, offline-first, auto-updates |
| UI | React 19 + TypeScript | Component model, rich ecosystem |
| State | Redux Toolkit + RTK Query | Predictable state, caching, optimistic updates |
| Styling | Tailwind CSS + Headless UI | Rapid prototyping, a11y-focused components |
| Canvas | React-Flow + ElkJS worker | Node-edge rendering with auto-layout |
| Graph DB | Neo4j 5 (embedded via Neo4j-Desktop) | Native graph queries, ACID, Cypher |
| Local store | SQLite (better-sqlite3) | Small config blobs, offline user prefs |
| API layer | Apollo GraphQL (local + remote) | Unified schema for plugins and sync |
| IPC/Security | Electron contextBridge + Zod validation | Strong type-safe boundaries |
| Auth (cloud sync) | Clerk (OAuth, MFA) | Battle-tested, RBAC, session management |
| Packaging | Electron-Builder | Code-signing (Windows, macOS) |
| CI/CD | GitHub Actions → Vercel Artifacts | Lint, test, build, sign |
| Testing | Vitest, React-Testing-Library, Playwright | Unit, integration, E2E |
| Telemetry | PostHog (self-host) | Anonymous usage analytics |

---

## 3. App Flowchart

```mermaid
graph LR
    A[User Launches App] --> B{Auth?}
    B -- Cached Session --> C[Load Local Project List]
    B -- First Time --> D[OAuth via Clerk]
    C --> E[Open Project]
    E --> F[Load Graph from Neo4j]
    F --> G[Redux Store Hydrate]
    G --> H[Dual-Pane UI]
    H -->|Table Edit| I[Dispatch RTK Mutation]
    H -->|Canvas Drag| J[Update Edge Geometry]
    I --> K[Write to Neo4j]
    J --> K
    K --> L[Rule Engine Evaluate]
    L --> M[Validation Badges]
    H -->|Select Variant| N[Filter Cypher Query]
    N --> O[Canvas/Table Refresh]
    H -->|Export| P[Generate CSV/DXF/STEP]
    H -->|Cloud Sync| Q[Apollo Client --> Remote API]
    Q --> R[Encrypted Storage (AWS S3 + Aurora)]
```

Key data flows  
- State sync: UI → RTK Query → neo4j-driver → Neo4j.  
- Variant lens: Cypher query with optionCode filter → React-Flow node visibility.  
- Validation: jsonLogic rules run in a worker → send badge status to Redux.

---

## 4. Project Rules

### 4.1 Coding Standards  
- TypeScript strict mode, no `any`.  
- ESLint + Prettier (80-char print width) enforce style.  
- Commit messages follow Conventional Commits.

### 4.2 Git Strategy  
- Trunk-based with short-lived feature branches.  
- Protected `main` branch; squash merge via PR.  
- Tags: `vMAJOR.MINOR.PATCH` mapped to Electron auto-update channels.

### 4.3 Testing  
- Unit ≥ 80 % coverage.  
- Playwright E2E on Windows, Linux via GitHub runners.  
- Contract tests between GraphQL schema and plugins.

### 4.4 Code Reviews  
- At least one senior reviewer.  
- Mandatory security checklist cross-check.  
- PR template includes performance and a11y sections.

### 4.5 Performance & Accessibility  
- Use React-Flow node virtualization.  
- Prefer WebGL for heavy canvas ops.  
- Enforce keyboard navigation, aria-labels, color-contrast ≥ 4.5:1.

---

## 5. Implementation Plan

| Phase | Duration | Key Tasks | Dependencies |
| ----- | -------- | --------- | ------------ |
| 0. Bootstrap | 1 wk | Repo setup, ESLint/Prettier, CI skeleton | – |
| 1. Core Graph | 3 wk | Integrate Neo4j-driver, schema for nodes/edges, Cypher helpers | Phase 0 |
| 2. Dual-Pane UI | 4 wk | Table (TanStack Grid), Canvas (React-Flow), two-way binding | 1 |
| 3. Variant Lens | 2 wk | OptionCode model, filter UI, Cypher paramization | 2 |
| 4. Rule Engine | 3 wk | jsonLogic worker, default rule set, badge UI | 2 |
| 5. Import/Export MVP | 2 wk | CSV parser/emitter, BOM generator | 1 |
| 6. Auth & Cloud Sync | 2 wk | Clerk, GraphQL remote API, diff-based sync | 0 |
| 7. Testing/A11y Harden | 3 wk | Write suites, lighthouse audit, fix issues | 2–4 |
| 8. Packaging & Sign | 1 wk | Electron-Builder, auto-updates, MSI/DEB | 6 |
| 9. Beta Launch | 2 wk | Docs, tutorial videos, feedback loop | All |

Critical path: Phases 1 → 2 → 3 → 4.  
Total MVP: 23 weeks with 15 % buffer ≈ 26 weeks.

---

## 6. Frontend Guidelines

### 6.1 Design Principles  
- Mobile-aware but optimized for 1920 × 1080 desktops.  
- Responsive using CSS Grid/Flex; min-zoom 125 % still readable.  
- Light + dark themes via Tailwind’s `data-theme` attribute.

### 6.2 Component Architecture  
- Feature-folder structure: `harness/`, `variant/`, `rules/`.  
- Co-located component, test, and style files.  
- State colocated at lowest possible level; global share via Redux slices.

### 6.3 State Management  
- RTK Query for server mutations/queries.  
- Local UI state with `useState`/`useReducer`.  
- Persist Redux subset (recent files) via electron-store.

### 6.4 Styling Standards  
- Tailwind with `@apply` for shared utilities.  
- No inline styles except canvas coords for perf.  
- Use CSS variables for theme colors.

### 6.5 Performance Practices  
- Code-split routes with React-lazy.  
- Canvas rendered in a `BrowserWindow` with contextIsolation.  
- Debounced table edits (300 ms) to reduce DB writes.  
- Memoize heavy selectors with Reselect.

---

## 7. Backend Guidelines

### 7.1 Server Architecture  
Because it is a desktop-first app, the “backend” is split:  
- Local embedded services inside Electron.  
- Remote sync API (Node.js 20 + Fastify + Apollo-Server).

### 7.2 API Design  
- GraphQL schema versioned (`x-harness-studio-schema: 1`).  
- Mutations idempotent, return optimistic payload shape.  
- Depth-limit rule (10) to block expensive queries.

### 7.3 Data Storage  
- Local: Neo4j database files in user profile, encrypted with AES-256 (key from OS keystore).  
- Cloud: AWS Aurora PostgreSQL + PostGIS for spatial wire data; nightly backup.  
- Cache layer: Redis Cluster for sync diff queues.

### 7.4 Security & Scalability  
- Clerk JWT verified in Fastify pre-handler.  
- Row-level security in Aurora: tenant-id column predicate.  
- WSS subscription channel throttled (max 30 req/s per user).  
- Horizontal scaling via AWS Fargate; stateless containers.

### 7.5 Integration with Frontend  
- Electron uses `ipcRenderer.invoke('graphql', query)` bridging to Apollo client.  
- Conflict resolution on sync: last-writer-wins with vector clock metadata.

---

## 8. Optimised React Code Guidelines

### 8.1 Common Pitfall  
```typescript
// BAD: inline obj recreated every render, breaks memoised children
function WireRow({ wire }: { wire: Wire }) {
  return (
    <div style={{ display: 'flex' }}>
      <span>{wire.id}</span>
      <input
        defaultValue={wire.csa}
        onChange={(e) => updateCsa(wire.id, e.target.value)}
      />
    </div>
  )
}
```

### 8.2 Optimised Solution  
```typescript
function WireRow({ wire }: { wire: Wire }) {
  const containerStyle = useMemo(
    () => ({ display: 'flex' }),
    [] // stable
  )

  const handleCsaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      updateCsa(wire.id, e.target.value),
    [wire.id]
  )

  return (
    <div style={containerStyle}>
      <span>{wire.id}</span>
      <input defaultValue={wire.csa} onChange={handleCsaChange} />
    </div>
  )
}

export default React.memo(WireRow)
```

### 8.3 Best Practices  
- Wrap heavy components (`Canvas`) in `React.memo`.  
- Pull derived data with `useMemo` to avoid recalculation.  
- Avoid anonymous functions in JSX; prefer `useCallback`.  
- Batch rapid state updates with `unstable_batchedUpdates`.  
- Use Suspense + `React.lazy` for modal dialogs.  
- Keep props shallow; pass primitive IDs, fetch full objects via selectors.

### 8.4 Structure for Scalability  
```
src/
  components/
  features/
    harness/
      HarnessCanvas.tsx
      harnessSlice.ts
    rules/
    variant/
  hooks/
  plugins/
  ui/
```
- Features are self-contained, easing team parallelisation.  
- Public API (exported types) lives in `index.ts` of each feature.

---

## 9. Security Checklist (Enforced)

1. Use Clerk for auth; all session handling, MFA, password resets delegated.  
2. Fastify pre-handler verifies JWT on every protected endpoint.  
3. Secrets (`CLERK_SECRET_KEY`, `AWS_ACCESS_KEY_ID`, DB creds) live only in `process.env` on the server; never exposed to preload scripts.  
4. `.env`, `*.pem`, `neo4j.conf` are git-ignored by default.  
5. Global error handler strips stack traces; client sees `{"error":"Unexpected server error"}`.  
6. Middleware auth guard wraps every IPC and HTTP route.  
7. RBAC roles: `admin`, `editor`, `viewer`; privilege checks in service layer.  
8. Database access via Prisma ORM (Postgres) and Neo4j-OGM; no raw SQL in product code.  
9. Deployed on Vercel Edge + AWS; both provide automatic DDoS mitigation and WAF.  
10. HTTPS enforced via HSTS; Electron auto-updates served over TLS only.  
11. File uploads (DXF/STEP) scanned by ClamAV lambda; MIME-type and 25 MB size cap.

All engineering tasks include a DoD item: “Passes Security Checklist”.

---

### Concise Summary  
GraphHarness Studio delivers a data-first, variant-aware wire-harness CAD tool.  
Using Electron, React, and Neo4j, it provides engineers a synced table-and-canvas experience, instant rule validation, and industrial-grade exports—while strictly adhering to modern security and performance standards.
