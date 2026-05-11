# Bazar Dor — Architecture & Development Guide

## Project Overview
**নায্যমূল্য (Nayjjo Mullo / Bazar Dor)** is a community-driven Bangladesh bazar price tracker. Users submit real market prices, vote on accuracy, and see price heatmaps across nearby markets.

## Monorepo Structure
```
bazar-dor-main/
├── bazar-dor-backend/     # Express + MongoDB API
└── bazar-dor-front-end/   # Next.js 14 App Router + RTK Query
```

---

## Frontend (`bazar-dor-front-end/`)

### Tech Stack
- **Next.js 14** — App Router, Server Components where possible
- **RTK Query** — All API calls via `src/store/api/` slices
- **Tailwind CSS** — Utility-first; custom `glass-card` class in globals
- **Recharts** — Price history line charts
- **Leaflet** — Interactive map (dynamic import, SSR disabled)

### Key Routes
| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/(main)/Home.tsx` | Home: product grid + market basket index |
| `/products` | `app/(main)/products/AllProducts.tsx` | All products with nearby bazar filter |
| `/products/[productId]` | `app/(main)/products/[productId]/ProductDetail.tsx` | Product detail: all bazar prices, time-slots, voting, chart |
| `/submit` | `app/(main)/submit/SubmitPrice.tsx` | Submit a price with photo proof |
| `/heatmap` | `app/(main)/heatmap/Heatmap.tsx` | Map + bazar ranking panel |

### RTK Query API Slices (`src/store/api/`)
| File | Key endpoints |
|------|--------------|
| `bazarApi.ts` | `useGetBazarsQuery`, `useGetNearbyBazarsQuery` |
| `priceApi.ts` | `useGetPricesQuery`, `useGetPriceHistoryQuery`, `useGetHeatmapQuery`, `useVotePriceMutation`, `useMarkStockOutMutation` |
| `productApi.ts` | `useGetProductsQuery`, `useGetProductQuery` |
| `alertApi.ts` | `useGetAlertsQuery` |
| `snapshotApi.ts` | `useGetDailySnapshotsQuery` |

### Location Pattern
All pages that need nearby data follow this dual-query pattern:
```tsx
const { data: bazarsRes } = useGetBazarsQuery({ limit: 50 }, { skip: !!userLocation });
const { data: nearbyRes } = useGetNearbyBazarsQuery(
  { lat: userLocation?.lat ?? 0, lng: userLocation?.lng ?? 0, radius: 10, limit: 50 },
  { skip: !userLocation }
);
const bazars = userLocation
  ? (nearbyRes?.data?.attributes || [])
  : (bazarsRes?.data?.attributes?.data || []);
```
The `useUserLocation` hook (`src/hooks/useUserLocation.ts`) handles geolocation + refresh.

### Bangladesh Time
Price time-slot grouping uses UTC+6 offset:
```ts
const bdHour = (new Date(dateStr).getUTCHours() + 6) % 24;
```
Slots: সকাল (5–11), দুপুর (12), বিকেল (13–16), রাত (17–4)

### Product Detail Page Logic
- **Official price**: highest-upvoted submission from today (fallback: most recent)
- **Anomaly detection**: spread > 20% with ≥3 submissions → amber warning card
- **Confidence**: `upvotes / totalVotes * 100` when `totalVotes >= 5`
- **Voting**: persisted in `localStorage` key `voted_prices` (JSON array of price IDs)

### Home Page
- Shows **one card per unique product** (deduplicated by productId, best-upvoted price wins)
- Clicking a product card navigates to `/products/[productId]`
- Market basket index (5 essentials) opens as a bottom sheet modal

---

## Backend (`bazar-dor-backend/`)

### Tech Stack
- **Express.js** + **MongoDB** (Mongoose)
- Auth: JWT tokens

### Key API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bazars` | List bazars (supports `?search=`, `?limit=`) |
| GET | `/api/bazars/nearby` | Nearby bazars (`?lat=&lng=&radius=&limit=`) |
| GET | `/api/prices` | List prices (`?productId=&bazarId=&limit=`) |
| POST | `/api/prices` | Submit price (auth required) |
| PUT | `/api/prices/:id/vote` | Vote up/down (auth required) |
| PUT | `/api/prices/:id/stock-out` | Mark stock out (auth required) |
| GET | `/api/prices/heatmap/:productId` | Avg price per bazar for a product |
| GET | `/api/prices/history` | 7-day daily averages (`?productId=&bazarId=`) |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Single product |

---

## Common Patterns

### Tailwind Responsive Order (mobile-first layout swap)
Used in SubmitPrice to reorder cards on mobile without duplicating DOM:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
  <Card className="order-1" />           {/* always left-top */}
  <Card className="order-2" />           {/* desktop: right-top */}
  <Card className="order-3" />           {/* desktop: left-bottom */}
  <Card className="order-4 lg:hidden" /> {/* mobile only */}
  <Card className="order-5" />           {/* desktop: right-bottom */}
  <Card className="order-4 hidden lg:block" /> {/* desktop: same slot as mobile-only */}
</div>
```

### API Response Shape
Most endpoints return:
```json
{ "data": { "attributes": { "data": [...], "meta": {} } } }
```
Nearby bazar endpoint returns flat array:
```json
{ "data": { "attributes": [...] } }
```

### Verified Price Badge
A price entry is "verified" when `upvotes / (upvotes + downvotes) >= 0.6` with at least 10 total votes.
