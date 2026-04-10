# db-helper-ui Agent Guide

Keep this file short on purpose. It is here to help agents work safely in this package, not to restate full product docs.

## What This App Is

`db-helper-ui` is the React/Vite frontend for the infrastructure dashboard. It talks to `go-infra` through the generated client in `src/lib/api`.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- Tailwind CSS 4
- Radix UI
- React Hook Form + Zod

## Important Paths

- `src/app/`: route-level pages
- `src/components/db-helper/`: feature UI
- `src/components/ui/`: shared primitives
- `src/lib/api/`: generated OpenAPI client and models
- `src/lib/`: auth, permissions, helpers, thin service wrappers
- `scripts/generate-api-client.mjs`: API client generation

## Working Rules

- Treat `src/lib/api/**` as generated code. Prefer regenerating over hand-editing.
- Keep feature logic close to the route or feature component unless it is clearly reusable.
- Reuse existing `src/components/ui/**` primitives before creating new base components.
- Follow existing permission/auth patterns in `auth-context.tsx`, `permission-utils.ts`, and `permission-protected-route.tsx`.
- Use Zod + React Hook Form for non-trivial forms when the surrounding feature already does.
- Keep changes narrow. This repo has a lot of generated types, so avoid large refactors unless required.

## Common Workflows

Install deps:

```bash
npm ci
```

Start dev server:

```bash
npm run dev
```

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

Regenerate API client after backend spec changes:

```bash
npm run gen-api
```

## Integration Notes

- Backend contract comes from `../go-infra/swagger.json`.
- If backend endpoints or models change, regenerate the client and then fix UI compile errors.
- Auth token handling lives in `src/lib/tokenManager.ts` and `src/lib/auth-context.tsx`.
- Permission-gated UI should match backend permission names rather than inventing frontend-only variants.

## Editing Guidance

- For route work, inspect the nearest page under `src/app/**` first.
- For roles/permissions work, start in `src/components/db-helper/roles/**`.
- For node, key, or secret CRUD, check existing table/dialog patterns before adding new ones.
- Prefer small helper functions over introducing new global abstractions.

## Verification

For most UI changes, run:

```bash
npm run lint
npm run build
```

If you changed API shapes, also run `npm run gen-api`.

## More Context

Use `README.md` for product/background details. Keep this file focused on agent execution and repo conventions.
