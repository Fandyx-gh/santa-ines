# Santa Inés Discovery

Premium discovery questionnaire for Santa Inés furnished apartments in Barranquilla. This is a private, token-based discovery flow, not a booking engine or public hotel website.

## 1. Install

```bash
npm install
```

## 2. Create Supabase project

1. Create a project at [supabase.com](https://supabase.com/).
2. Open the project SQL Editor.
3. Paste and run [`supabase/schema.sql`](./supabase/schema.sql).
4. In Project Settings > API, copy the project URL and the public anon key.

The table is `discovery_submissions`. It stores separate rows for `(token, is_test)`, so a test submission can never overwrite the real client flow. Its token-scoped RLS policies let a client read and update only the row associated with the token sent in the `x-discovery-token` header. The internal view uses the separate MVP access-key gate and an internal header policy.

For a project that already has the original single-token table, run [`supabase/migration_test_mode.sql`](./supabase/migration_test_mode.sql) instead of recreating the table. It adds `is_test` and safely replaces the old unique-token constraint with a composite `(token, is_test)` constraint.

## 3. Configure the environment

Copy `.env.example` to `.env.local` and fill in:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DEFAULT_DISCOVERY_TOKEN=optional-local-token
VITE_INTERNAL_ACCESS_KEY=your-private-internal-key
```

Do not commit `.env.local`. The `VITE_DEFAULT_DISCOVERY_TOKEN` fallback is only used when the local URL has no `?t=` query parameter.

## 4. Create a Santa Inés token

Generate a secure token from this project directory:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

The first visit with that token creates the row in Supabase automatically. The client link is:

```text
https://YOUR-DOMAIN/santa-ines?t=PASTE_THE_TOKEN_HERE
```

## 5. Run locally

```bash
npm run dev
```

Open `http://localhost:5173/santa-ines?t=YOUR_TOKEN`. If no query token is supplied, the app uses `VITE_DEFAULT_DISCOVERY_TOKEN`.

Use the isolated test flow with:

```text
http://localhost:5173/santa-ines?t=YOUR_TOKEN&testMode=true
```

Test mode displays a `Modo de prueba` badge, writes `is_test = true`, has independent local and Supabase state, and exposes `Reiniciar prueba` after submission. Normal client links omit `testMode=true` and always write `is_test = false`.

## 6. Build

```bash
npm run lint
npm test
npm run build
```

The production files are written to `dist/`.

## 7. Deploy tonight

Vercel is the recommended target for this Vite app:

```bash
npx vercel login
npx vercel --prod
```

When prompted, choose the `discovery` directory as the project root, keep the detected Vite settings, and add the four `VITE_*` variables in the Vercel project settings. The included [`vercel.json`](./vercel.json) keeps `/santa-ines` and `/internal/responses` working on refresh. After adding or changing environment variables, redeploy:

```bash
npx vercel --prod
```

## 8. Inspect submitted responses

Open:

```text
https://YOUR-DOMAIN/internal/responses
```

Enter the value configured in `VITE_INTERNAL_ACCESS_KEY`. The view shows completion, last update, submission time, and answers grouped by the seven discovery sections. It defaults to real responses and can be filtered to `Pruebas` or `Todos`. Test records are visibly marked `MODO PRUEBA`. It is intentionally not a CRM or dashboard.

## Assets and branding

- Exact logo used: `C:\Users\ciber\santa ines\assets\logo.png`, copied unchanged to `public/assets/logo.png`.
- Exact facade photograph used: `C:\Users\ciber\santa ines\assets\front.png`, copied unchanged to `public/assets/front.png`.
- The paths are configured in [`src/config/santaInes.ts`](./src/config/santaInes.ts) as `logoPath` and `facadePath`.
- To swap the logo later, place the new unchanged asset in `public/assets/` and update only `logoPath`.
- To swap the facade later, place the new unchanged asset in `public/assets/` and update only `facadePath`.

## Editing questions

Question wording, options, conditions, section names, and the default Santa Inés branding are primarily in [`src/config/santaInes.ts`](./src/config/santaInes.ts). The generic renderer in `src/components/QuestionRenderer.tsx` supports numbers, apartment counters, occupancy, single select, multi-select, short text, textareas, context cards, and separators. Add or remove configuration entries without creating a component per question.

Required-step rules, conditional visibility, generic `Otro` fields, and Colombian Spanish validation messages are in [`src/lib/validation.ts`](./src/lib/validation.ts). The same configured answer summaries power the client review screen, post-submission read-only summary, and internal response view.

The domain question contains naming directions rather than confirmed registrations. Every option is subject to availability, price, transfer conditions, trademark conflicts, and social-media handle checks with a registrar before choosing or purchasing a domain. The current options favor a short Santa Inés brand first, followed by descriptive apartment, furnished-apartment, and Barranquilla variants.

## Creating another discovery client later

1. Add another configuration file beside `santaInes.ts` using the same `DiscoveryConfig` shape.
2. Point its logo and facade paths at that client’s assets.
3. Add a client slug and select the configuration at the page entry point.
4. Keep the shared wizard, persistence layer, renderer, and review/success screens.

The current app deliberately ships only the Santa Inés client route and does not add accounts, authentication, analytics, booking, payments, or a multi-client admin system.
