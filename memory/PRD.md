# QuickSplit — Product Requirements (v1)

**Type:** Local-first Android-first React Native (Expo) utility app.
**Scope:** Frontend is fully functional offline. Backend is scaffold only; not consumed by the frontend in v1.

## User choices captured
- Design: Agent-decided, Android-first (Swiss / high-contrast aesthetic).
- Currency: User-selectable in Settings. Supported: USD, EUR, INR (default USD).
- Seed data: Demo data seeded on first launch, fully deletable via Settings → "Clear all data". "Load demo data" re-seeds.
- Backend: Minimal FastAPI scaffold with `/api/` and `/api/health` endpoints. No frontend consumption.
- Auth: UI placeholders only — Google & Facebook buttons show info alerts.

## Core features
- **Groups:** create / rename / delete, add & remove participants.
- **Expenses:** add / edit / delete, per-expense currency, payer, date, notes.
- **Splits:** even split or custom per-participant amounts (validated to sum to total).
- **Balances:** net-per-person per group; greedy minimum-cash-flow simplification; "Settle" button records a settlement that clears the debt.
- **Recent activity:** latest expenses on Home with payer avatar, group, date.
- **Settings:** dark/light toggle, default currency picker, demo Google/Facebook buttons, load demo / clear data, About.

## Data
- AsyncStorage key: `quicksplit:state:v1`. Hydrated on app launch.
- Shape: `{ groups, expenses, settlements, currency, theme, meId }`.

## Screens / routes
- `/(tabs)/index` Home
- `/(tabs)/groups` Groups list
- `/(tabs)/balances` Balances across groups
- `/(tabs)/settings` Settings
- `/group/[id]` Group detail (people + expenses)
- `/expense` Add/Edit expense (modal-style, accepts `?id=` for edit, `?groupId=` preset)

## Backend (future)
- `GET /api/` — service banner
- `GET /api/health` — health check
- `GET /api/sync/status` — returns `{enabled: false}` placeholder.
