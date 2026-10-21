# Yale Postdoc Onboarding

The web app for first-year postdocs and Office of Postdoctoral Affairs (OPA)
staff: onboarding checklist, first-year plan, workbook, IDP builder, events and
resources.

## Getting started

The app lives in `frontend/`. Run every command from there.

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

## Design tokens

Tokens live in the `@theme` block in `frontend/src/styles.css`. Their names match the
variables and text styles in the Figma file ("Yale Postdoc Senior Team" ->
Components -> Foundations), so a Figma value maps straight to a class:

| Figma                 | CSS variable        | Tailwind class                   |
| --------------------- | ------------------- | -------------------------------- |
| `palette/yale-blue`   | `--color-yale-blue` | `text-yale-blue`, `bg-yale-blue` |
| `role/link`           | `--color-link`      | `text-link`                      |
| Display/H1 text style | `--text-h1`         | `text-h1`                        |
| Body/Small text style | `--text-small`      | `text-small`                     |

- Only the Yale colors exist: Tailwind's default palette and font-size scale are
  turned off, so classes like `bg-red-500` or `text-sm` don't work. Prefer the
  `role/*` names (`text-link`, `bg-late`, `border-field-line`) when one fits.
- Text sizes shrink to the phone sizes below the `md` breakpoint (768px)
  automatically. Use one class (`text-h1`), not `text-... md:text-...`.
- Weight is separate from size: Figma's "Body/Large strong" is
  `text-large font-semibold`.
- Cardo and Source Sans 3 are stand-ins for the Yale typeface and Mallory,
  self-hosted through Fontsource.
