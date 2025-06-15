# GraphHarness Studio

GraphHarness Studio delivers a data-first, variant-aware wire-harness CAD tool. Using Electron, React, and Neo4j, it provides engineers a synced table-and-canvas experience, instant rule validation, and industrial-grade exports—while strictly adhering to modern security and performance standards.

## Core Features

- Dual-pane authoring: spreadsheet table ↔ auto-layout canvas.
- Graph database model (Neo4j) for connectors, wires, splices.
- Variant “lenses” for option-code filtering.
- jsonLogic rule/validation engine.
- Assisted auto-routing and deterministic wire numbering.
- Export: CSV/BOM, splice tickets, DXF/STEP, IPC-2581.
- Plugin SDK (TS/Python) for custom automation.

## Tech Stack

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

## Getting Started

GraphHarness Studio is a desktop application. Detailed installation instructions and usage guides will be available upon the official release. The application is designed for wire-harness design engineers and will provide a seamless experience for creating and managing harness schematics.

## Running the Project

This section describes how to build and run the GraphHarness Studio application from the source code.

### Building the Project

To build the application, which includes compiling the TypeScript code for both the main process and the renderer, run the following command from the project root:

```bash
npm run build
```
This command typically bundles the code and prepares it for execution.

### Running the Application

There are a couple of ways to run the application:

1.  **Development Mode:**
    For a development environment with hot-reloading for the renderer (React UI):
    ```bash
    npm run dev
    ```
    This command usually starts a development server for the renderer and runs the Electron main process. Changes to the renderer code (typically in `src/renderer`) will automatically reload the UI. Changes to the main process code (in `src/main.ts` or other files under `src/`) will likely require you to stop and restart the `npm run dev` command.

2.  **Production-like Mode (after building):**
    After building the project using `npm run build`, you can start the application using:
    ```bash
    npm start
    ```
    This command runs the built version of the application.

### Logging

The application uses Winston for logging. Log files can be found in the `logs/` directory at the root of the project. The primary log file is:

-   `logs/app.log`

This file contains logs from both the main Electron process and can be helpful for debugging and tracking application behavior.

## Contributing

Currently, GraphHarness Studio is developed by an internal team. If the project transitions to an open-source model in the future, detailed contribution guidelines will be provided.

Our development process follows these key principles:
- **Coding Standards:** TypeScript strict mode, no `any`, ESLint + Prettier (80-char print width).
- **Git Strategy:** Trunk-based development with short-lived feature branches, squashing merges via PRs to a protected `main` branch. Commits follow Conventional Commits.
- **Testing:** Aim for ≥ 80% unit test coverage, with E2E tests on Windows and Linux. Contract tests between the GraphQL schema and plugins are also maintained.
- **Code Reviews:** At least one senior reviewer, a mandatory security checklist cross-check, and PR templates that include performance and accessibility considerations.

## License

[License Name/Details To Be Determined]

## Security

Security is a top priority for GraphHarness Studio. The application is designed with a strong emphasis on protecting user data and ensuring a secure environment. Key security measures include:

- Adherence to OWASP Top 10 security risks.
- A comprehensive internal security checklist (detailed in our technical blueprint) that is enforced for all development tasks.
- Secure authentication and session management via Clerk.
- Encryption of sensitive data both locally and in the cloud.
- Regular security audits and updates.

## Project Status & Implementation Plan

GraphHarness Studio is currently under active development. The project follows a phased implementation plan:

- **Phase 0: Bootstrap** (Repo setup, CI/CD)
- **Phase 1: Core Graph** (Neo4j integration, schema)
- **Phase 2: Dual-Pane UI** (Table, Canvas, two-way binding)
- **Phase 3: Variant Lens** (OptionCode filtering)
- **Phase 4: Rule Engine** (jsonLogic validation)
- **Phase 5: Import/Export MVP** (CSV, BOM)
- **Phase 6: Auth & Cloud Sync** (Clerk, GraphQL API)
- **Phase 7: Testing/A11y Harden** (Test suites, audits)
- **Phase 8: Packaging & Sign** (Electron-Builder, auto-updates)
- **Phase 9: Beta Launch** (Docs, tutorials, feedback)

The Minimum Viable Product (MVP) is estimated to be completed in approximately 26 weeks. We are committed to delivering a high-quality, reliable tool for wire harness design engineers.

## Environment Variables and Secrets

This project uses `.env` files to manage environment-specific variables and secrets.

1.  Create a file named `.env` in the root of the project.
2.  Copy the contents of `.env.example` into your new `.env` file.
3.  Replace the placeholder values in `.env` with your actual configuration values.

**Important:** The `.env` file is listed in `.gitignore` and should **never** be committed to version control. It often contains sensitive information.

### Security Checklist (Placeholder)

Always handle secrets responsibly:
- Do not hardcode secrets in your source code.
- Use environment variables for all secrets and configurations that vary between environments.
- Ensure your `.env` file (or any file containing actual secrets) is not tracked by Git.
- Regularly review and rotate secrets as necessary.
- For production builds, ensure secrets are injected securely through your deployment pipeline or environment configuration, not bundled with the application artifact if possible.
