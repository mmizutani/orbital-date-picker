# Repository Guidelines

## Project Structure & Module Organization
- Next.js App Router lives in `src/app` (`page.tsx`, `layout.tsx`, `globals.css`) for routes and providers.
- `src/components` holds feature code (`orbital-picker.tsx`) and shadcn/ui primitives in `src/components/ui`.
- Shared hooks live in `src/hooks`; utilities such as date helpers and placeholder data are in `src/lib`.
- Docs and supporting assets are in `docs/`; global config sits in `tailwind.config.ts`, `postcss.config.mjs`, and `tsconfig.json` (`@/*` alias).

## Build, Test, and Development Commands
- `npm run dev` — start the app locally on port 9002 using Turbopack.
- `npm run build` — production build of the Next.js app.
- `npm run start` — serve the build output.
- `npm run lint` — run ESLint with Next.js rules and Tailwind plugin checks.
- `npm run typecheck` — strict TypeScript verification without emitting files.
- `npm run genkit:dev` / `npm run genkit:watch` — run Genkit workflows used by the AI helpers under `src/ai`.

## Coding Style & Naming Conventions
- TypeScript + React functional components; favor named exports where possible. Use `@/*` aliases instead of long relative paths.
- Indent with 2 spaces; keep imports ordered (React/Next, then aliases, then relatives) and prefer const over let.
- Tailwind classes belong in JSX; rely on `cn` from `src/lib/utils` to merge conditional classes.
- Component filenames use kebab-case (`orbital-picker.tsx`); shadcn primitives mirror their Radix counterparts (`button.tsx`, `dialog.tsx`).

## Testing Guidelines
- No automated tests ship yet; add `*.test.tsx` alongside code (or `src/__tests__`) using React Testing Library + Vitest/Jest once installed.
- Cover `orbital-picker` interactions (drag/hover) and date helpers in `src/lib/date-utils.ts`; mock time/randomness to stay deterministic.
- Run `npm run typecheck && npm run lint` before submitting; note skipped checks in the PR.

## Commit & Pull Request Guidelines
- Commit messages follow the existing history: short, present-tense summaries (e.g., “Adjust orbital hover state”).
- For PRs, include: purpose, notable implementation choices, and any follow-ups. Link issues if they exist.
- UI changes should include before/after screenshots or GIFs (use existing assets format). Note any accessibility considerations (focus states, keyboard paths).
- Ensure lint/typecheck pass locally before opening a PR; mention any skipped checks and why.

## Security & Configuration Tips
- Keep secrets in local `.env`; only expose `NEXT_PUBLIC_*` when strictly required on the client.
- Prefer lightweight, tree-shakeable dependencies that work with Next.js App Router and React 18.
