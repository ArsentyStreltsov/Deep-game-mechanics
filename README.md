# HR Landing

Astro application with TypeScript strict mode and React support for interactive islands. Static output is configured. The Figma page is not implemented yet.

## Requirements

Node.js 22.12 or newer and npm. Use `nvm use` if you manage Node with nvm.

## Development

```sh
npm ci
npm run dev
```

The default development URL is http://localhost:4321. Astro reports a different port if that port is occupied.

## Validation and production build

```sh
npm run check
npm run format:check
npm run build
npm run preview
```

The build checks types before emitting the static site into `dist/`. Deploy that directory to a static host. Set the production `site` URL in `astro.config.mjs` when the domain is known.

## Structure

- `src/pages/`: routes; `index.astro` is a temporary setup page.
- `src/layouts/`: shared HTML shell and metadata.
- `src/components/ui/`: shared visual primitives.
- `src/components/sections/`: landing page sections.
- `src/components/islands/`: interactive React components.
- `src/assets/images/` and `src/assets/icons/`: imported design assets.
- `src/styles/`: global baseline and future design tokens.
- `src/data/`: typed page content and configuration.
- `src/lib/`: shared logic.
- `src/types/`: shared TypeScript types.
- `public/fonts/`: self-hosted font files.

Add client hydration directives only to components that require browser interaction. Keep secrets out of source control; only intentionally public environment variables may use Astro's `PUBLIC_` prefix.
