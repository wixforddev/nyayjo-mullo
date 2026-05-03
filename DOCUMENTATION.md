# বাজার দর — Project Documentation

> এই ফাইলে প্রজেক্টের সব feature, logic এবং technical decision লেখা থাকবে।
> নতুন কাজ হলে এখানে যোগ করতে হবে।

---

## Project Structure

```
bazar-dor-main/
├── bazar-dor-backend/       # Node.js + Express + MongoDB API
├── bazar-dor-front-end/     # Next.js (App Router) — User App
└── bazar-dor-admin/         # React + Vite — Admin Panel
```

---

## Backend (`bazar-dor-backend`)

### Stack
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Passport JWT auth
- node-cron (scheduled jobs)

### Models

| Model | File | বিবরণ |
|-------|------|--------|
| User | `user.model.ts` | ব্যবহারকারী, role: user/vendor/admin, location {lat,lng} |
| Product | `product.model.ts` | পণ্য — name, nameBn, unit, icon, defaultPrice |
| Bazar | `bazar.model.ts` | বাজার — name, nameBn, area, lat, lng, isActive |
| Price | `price.model.ts` | দাম এন্ট্রি — price, upvotes, downvotes, voters[], isVerified, expiresAt (24h) |
| Alert | `alert.model.ts` | জরুরী এলার্ট — type, message, messageBn, severity, productId, bazarId, isActive, expiresAt |
| DailySnapshot | `dailySnapshot.model.ts` | দৈনিক বাজার সূচক স্ন্যাপশট |

### DailySnapshot Model (বিস্তারিত)
```ts
{
  date: "YYYY-MM-DD",          // unique index
  chicken: { avg, count },
  beef:    { avg, count },
  oil:     { avg, count },
  potato:  { avg, count },
  onion:   { avg, count },
  basketTotal: Number           // 5টি পণ্যের avg এর যোগফল
}
```

### API Endpoints (v1)

**Auth** — `/api/v1/auth`
- `POST /register` — নতুন ব্যবহারকারী
- `POST /login` — লগইন, JWT token return করে

**Users** — `/api/v1/users`
- `GET /me` — নিজের profile
- `PATCH /:id` — profile update (location সহ)
- `GET /leaderboard` — সর্বোচ্চ contributor list
- `GET /my-stats` — নিজের submission stats

**Products** — `/api/v1/products`
- `GET /` — সব পণ্য (paginated)
- `POST /` — নতুন পণ্য (admin)

**Bazars** — `/api/v1/bazars`
- `GET /` — সব বাজার
- `POST /` — নতুন বাজার (admin)

**Prices** — `/api/v1/prices`
- `GET /` — দাম list (filter: bazarId, productId, isVerified)
- `POST /` — নতুন দাম submit (auth required)
- `POST /:id/vote` — ভোট দেওয়া (up/down), 409 if already voted
- `POST /:id/stock-out` — স্টক আউট রিপোর্ট
- `GET /history/:productId` — একটি পণ্যের দামের ইতিহাস (7-day avg)
- `GET /heatmap` — বাজার অনুযায়ী গড় দাম

**Alerts** — `/api/v1/alerts`
- `GET /` — active এলার্ট list (filter: isActive, severity, type)
- `POST /` — নতুন এলার্ট (admin manual)
- `PUT /:id` — এলার্ট update (admin)
- `DELETE /:id` — এলার্ট delete (admin)

**Daily Snapshots** — `/api/v1/daily-snapshots`
- `GET /` — সব snapshot (`?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`)
- `GET /:date` — নির্দিষ্ট দিনের snapshot
- `POST /trigger` — manually আজকের snapshot save করুন (admin only)

### Cron Job
- **Schedule:** প্রতিদিন রাত ১১:৫৯ (Bangladesh time = UTC 17:59)
- **কাজ:** সেদিনের সব Price থেকে ৫টি essential পণ্যের গড় বের করে DailySnapshot এ save করে
- **File:** `src/index.ts`, service: `src/services/dailySnapshot.service.ts`

---

### Auto-Alert System (স্বয়ংক্রিয় মূল্য সতর্কতা)

**Files:**
- Logic: `src/services/alert.service.ts` → `detectPriceSpike()`
- Trigger: `src/services/price.service.ts` → `createPrice()`
- Model: `src/models/alert.model.ts`

#### কিভাবে কাজ করে

প্রতিবার নতুন দাম submit হলে `createPrice()` শেষে `detectPriceSpike()` **non-blocking** ভাবে call হয়।
Alert system fail করলেও price submission fail হয় না।

#### Alert এর Constants
```ts
SPIKE_THRESHOLD      = 0.30   // ৩০% বৃদ্ধি হলে spike ধরা হয়
DUPLICATE_WINDOW_MS  = 6h     // একই পণ্যে ৬ ঘণ্টার মধ্যে duplicate alert হয় না
REF_WINDOW_DAYS      = 7      // reference median হিসাব: গত ৭ দিনের দাম
TODAY_CONFIRM_COUNT  = 2      // alert তৈরিতে কমপক্ষে ২ জন আলাদা user confirm করতে হবে
```

#### Spike Detection Step-by-Step

```
Step 1 — Reference Median বের করা
  গত ৭ দিনের দাম নেওয়া হয় (আজকের দাম বাদে)
  কারণ: আজকের spike দাম median এ ঢুকলে reference inflate হয়ে যাবে
  কমপক্ষে ৩টি historical price না থাকলে → বন্ধ (insufficient data)

Step 2 — Spike Check
  changeRatio = (newPrice - median) / median
  changeRatio < 0.30 → বন্ধ (spike না)

Step 3 — Confirmation Check (false alert রোধ)
  আজকে কতজন আলাদা user এই পণ্যের spike দাম (≥ median × 1.30) submit করেছে?
  uniqueUsers < 2 → বন্ধ (একজনের ভুল entry হতে পারে)

Step 4 — Duplicate Check
  একই productId এ গত ৬ ঘণ্টায় active price_spike alert আছে? → বন্ধ

Step 5 — Alert তৈরি
  severity নির্ধারণ:
    30–40% বৃদ্ধি → "low"
    40–60% বৃদ্ধি → "medium"
    60–80% বৃদ্ধি → "high"
    80%+  বৃদ্ধি → "critical"
  expiresAt = ৪৮ ঘণ্টা পরে
  message ও messageBn বাংলায় auto-generate
```

#### উদাহরণ
```
আলুর median (গত ৭ দিন) = ৳৪০
Spike threshold          = ৳৪০ × ১.৩০ = ৳৫২

User A → ৳৫৮ submit করল  (৪৫% বৃদ্ধি) ✅ spike — কিন্তু ১ জন, alert নেই
User B → ৳৬০ submit করল  (৫০% বৃদ্ধি) ✅ spike — ২ জন confirmed

→ Alert তৈরি: severity = "medium"
→ messageBn: "আলু-এর দাম অস্বাভাবিকভাবে ৪৭% বৃদ্ধি পেয়েছে (৳৪০ → ৳৫৮)"
```

#### Global vs Local Alert (কোন scope এ alert?)

```
একই পণ্যে spike →

  ১–২ বাজারে confirmed  → 📍 Bazar-specific alert (bazarId = ঐ বাজার)
  ৩+ বাজারে confirmed   → 🌐 Global alert (bazarId = null)
                           + পুরনো local alert গুলো deactivate হয়
```

`GLOBAL_BAZAR_COUNT = 3` — এই constant দিয়ে threshold control করা যায়।

#### Duplicate Prevention
- Local alert: একই product + bazar এ ৬h এর মধ্যে duplicate হয় না
- Global alert: একই product এ ৬h এর মধ্যে global duplicate হয় না

#### Multiple Product Spike (একই দিনে একাধিক পণ্য)
- আলু এবং তেল একই দিনে spike করলে → **দুটো আলাদা alert** তৈরি হয়
- Backend sort: `severity: -1, createdAt: -1`
- বাকি সব alert `/alerts` page এ দেখা যায়

#### Frontend Display Logic (`src/app/(main)/Home.tsx`)
```ts
// দুটো query চলে:
useGetAlertsQuery({ limit: 10 })          // global alerts (bazarId = null)
useGetAlertsQuery({ bazarId, limit: 5 })  // user এর বাজারের local alerts

// Merge করে priority দেওয়া হয়:
alerts = [...localAlerts, ...globalAlerts]
topAlert = alerts[0]  // local alert আগে, তারপর global

// Banner:
topAlert আছে + bazarId আছে  → 📍 বাজারের নাম সহ লাল banner
topAlert আছে + bazarId নেই  → 🌐 সারাদেশে লাল banner
topAlert নেই                → ✅ সবুজ banner: "বাজারের দাম স্বাভাবিক আছে"
```

#### Alert Model Fields
```ts
type      : "price_spike" | "stock_out" | "market_closed" | "general"
severity  : "low" | "medium" | "high" | "critical"
productId : ObjectId (ref: Product)
bazarId   : ObjectId (ref: Bazar) | null
message   : English message
messageBn : বাংলা message
isActive  : Boolean (default: true)
expiresAt : Date (auto-alert: ৪৮h, manual: ৭ দিন)
createdBy : ObjectId (ref: User) — manual alert এ admin এর id
```

---

---

### OpenStreetMap Bazar Geocaching System

**License:** ODbL (Open Database License) — সম্পূর্ণ বিনামূল্যে, permanently store করা allowed।
**Attribution:** App এ কোথাও `© OpenStreetMap contributors` লিখতে হবে।

**Files:**
- Service:    `src/services/osmPlaces.service.ts`
- Model:      `src/models/bazarCacheCell.model.ts`
- Script:     `src/scripts/seedBangladeshBazars.ts`
- Controller: `src/controllers/bazar.controller.ts` → `seedCell`, `getCacheStatus`
- Routes:     `POST /api/v1/bazars/seed/cell`, `GET /api/v1/bazars/seed/status`

#### সমস্যা ও সমাধান

Admin থেকে manually বাজার add করলে গ্রামের দিকের ছোট বাজার miss হয়।
OpenStreetMap Overpass API দিয়ে user location এর কাছের সব বাজার automatically DB তে cache করা হয়।
একবার cache হলে আর কোনো external API call নেই — সব নিজের DB থেকে serve হয়।
কোনো API key বা credit card লাগে না।

#### Grid-Based Cache Architecture

```
Bangladesh → 0.05° × 0.05° grid cell (~5.5km × 5.5km)
প্রতিটি cell এর একটি unique gridKey: "23.80_90.40"

User location → gridKey বের করা → DB check → নেই বা expire → Overpass API call → DB save
```

#### Cache Constants
```ts
RADIUS_M     = 5000      // 5km radius per Overpass query
CACHE_TTL_MS = 90 দিন   // 90 দিন পরে cell refresh হয়
GRID_STEP    = 0.05°     // ~5.5km grid resolution
```

#### Overpass Query (কী খোঁজা হয়)
```
node/way/relation with:
  shop=marketplace          → OSM এ registered marketplace
  amenity=marketplace       → OSM এ registered marketplace
  name ~ "বাজার|হাট|Bazar|Market"  → নামে বাজার/হাট আছে এমন সব জায়গা
```

#### Flow: getNearbyBazars() যখন call হয়

```
Request: GET /api/v1/bazars/nearby?lat=23.81&lng=90.41

Step 1 — Grid cell বের করা
  gridKey = "23.80_90.40"   (lat/lng কে nearest 0.05° এ round)

Step 2 — Cache check (BazarCacheCell collection)
  cell আছে এবং fetchedAt < 90 দিন → DB থেকে সরাসরি return করো
  cell নেই বা expire → Step 3

Step 3 — Overpass API call (3টি mirror, failover আছে)
  POST https://overpass-api.de/api/interpreter
  Query: node+way+relation ["shop"="marketplace" OR name~"বাজার"] around 5km

Step 4 — MongoDB upsert (placeId = "osm_node_12345" দিয়ে duplicate avoid)
  Bazar.findOneAndUpdate({ placeId: "osm_node_..." }, { $set: {...} }, { upsert: true })

Step 5 — BazarCacheCell update
  { gridKey, fetchedAt: now, bazarCount: N, status: 'success'|'empty' }

Step 6 — $nearSphere query (MongoDB 2dsphere index)
  Bazar.find({ isActive: true, location: { $nearSphere: { maxDistance: 5000m } } })

Return: distance সহ বাজার list (কাছ থেকে দূর sort)
```

#### Bazar Model নতুন Fields
```ts
source   : 'admin' | 'osm' | 'google'   // কোথা থেকে এল
placeId  : string | null                  // OSM: "osm_node_123456" (sparse unique index)
cachedAt : Date | null                    // কখন OSM থেকে আনা হয়েছে
gridKey  : string | null                  // কোন grid cell এর data
location : GeoJSON Point                  // [lng, lat] — 2dsphere index, pre-save auto-sync
```

#### BazarCacheCell Model
```ts
gridKey    : string                          // unique — "23.80_90.40"
centerLat  : number
centerLng  : number
fetchedAt  : Date
bazarCount : number                          // কতটি বাজার এই cell এ পাওয়া গেছে
status     : 'success' | 'empty' | 'error'
```

#### Bangladesh-Wide Seeding Script (একবার run করলেই হবে)

```bash
# Dry run — শুধু cell count দেখাবে, কোনো API call নেই
npm run seed:bazars:dry

# Full seeding — পুরো Bangladesh seed করবে (~3-6 ঘণ্টা)
npm run seed:bazars

# Interrupted হলে resume করুন (আগের cell skip হবে)
START_LAT=23.5 npm run seed:bazars

# Cell delay কমাতে (Overpass server respectful usage: ≥1000ms)
DELAY_MS=1500 npm run seed:bazars
```

**Bangladesh grid:**
- Latitude:  20.74° — 26.63°
- Longitude: 88.01° — 92.68°
- মোট cells: ~11,000 (land + water) — land cells ~5,000-6,000
- Estimated time: 3–6 ঘণ্টা (2s delay per cell)
- **Cost: $0 (সম্পূর্ণ বিনামূল্যে)**

#### Admin Endpoints
```
POST /api/v1/bazars/seed/cell
Body: { "lat": 23.81, "lng": 90.41 }
→ নির্দিষ্ট cell force-refresh (TTL ignore করে)

GET /api/v1/bazars/seed/status?lat=23.81&lng=90.41
→ cell এর cache status দেখায়
```

#### Non-blocking Design
```ts
// bazar.service.ts
await osmPlacesService.ensureCellCached(lat, lng).catch(err => {
  console.error('[BazarService] OSM cache-fill failed:', err?.message);
});
// Overpass fail করলেও user DB তে থাকা বাজার পাবে
// প্রথম request একটু slow হতে পারে — পরেরগুলো instant (DB থেকে)
```

#### Overpass Mirror Failover
```ts
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',     // primary
  'https://overpass.kumi.systems/api/interpreter', // mirror 1
  'https://lz4.overpass-api.de/api/interpreter',  // mirror 2
];
// একটি fail করলে পরেরটি try করে — higher availability
```

---

### DailySnapshot Logic
1. সেদিনের (00:00–23:59) সব Price fetch করে
2. productId.nameBn/name দিয়ে regex match: মুরগি, গরু, তেল, আলু, পেঁয়াজ
3. প্রতিটির গড় (avg) ও count save করে
4. basketTotal = সব avg এর যোগ
5. `findOneAndUpdate` + `upsert:true` — একই দিনে আবার run হলে overwrite হয়

---

## Frontend — User App (`bazar-dor-front-end`)

### Stack
- Next.js 14 App Router
- Redux Toolkit + RTK Query
- Tailwind CSS
- Leaflet.js (map)
- Recharts (chart)

### Redux Store

| Slice/API | File | বিবরণ |
|-----------|------|--------|
| authSlice | `store/slices/authSlice.ts` | user, token, isAuthenticated |
| locationSlice | `store/slices/locationSlice.ts` | lat/lng, loading, settled |
| bazarApi | `store/api/bazarApi.ts` | বাজার data |
| priceApi | `store/api/priceApi.ts` | দাম, ভোট, history |
| productApi | `store/api/productApi.ts` | পণ্য |
| userApi | `store/api/userApi.ts` | profile update, stats, leaderboard |
| alertApi | `store/api/alertApi.ts` | এলার্ট |

### Layout (`src/components/Layout.tsx`)

- **Location auto-update:** Mount এ `navigator.geolocation.getCurrentPosition` চালায়, location পেলে Redux `locationSlice` এ save করে এবং `useUpdateProfileMutation` দিয়ে backend এ PATCH করে
- `patchedRef` দিয়ে একই location বারবার PATCH হওয়া রোধ করে
- **Navbar (header):** Bell icon → `/alerts`, Info icon → disclaimer modal, Login button (লগইন না থাকলে)
- **Sidebar:** হোম, মানচিত্র, দাম যোগ করুন (primary), প্ল্যানার, প্রোফাইল
- **Bottom nav (mobile):** একই navItems

### Pages

#### Home (`/`)
**File:** `src/app/(main)/Home.tsx`

**Default view (বাজার select না করলে):**
- `useGetPricesQuery({ limit: 100 })` — সব বাজারের দাম
- গত ৭ দিনের মধ্যে submit হওয়া দাম filter করে
- User location থাকলে ১০ কি.মি. এর মধ্যের বাজারের দাম filter করে

**বাজার select করলে:**
- `useGetPricesQuery({ bazarId, limit: 100 })` — শুধু সেই বাজারের দাম

**Product cards:**
- Desktop: ৮টি দেখায় (idx ≥ 6 হলে `hidden md:flex`)
- Mobile: ৬টি দেখায়
- "সব দেখুন (N)" button → `/products?bazar_id=xxx`
- প্রতিটি card এ: নাম, দাম, বাজারের নাম (all-bazar view এ), কতক্ষণ আগে submit

**Verified badge logic:**
```ts
const isVerifiedPrice = (p) => {
  const total = (p?.upvotes || 0) + (p?.downvotes || 0);
  return total >= 10 && (p?.upvotes || 0) / total >= 0.6;
};
```
→ ১০+ ভোট এবং ৬০%+ upvote হলে ✓ badge দেখায়

**Product modal:**
- দাম + 7-day sparkline (Recharts LineChart)
- "সঠিক" button → upvote + `isPriceConfirmed = true`
- "আপডেট করুন" button → `/submit` এ navigate (ভোট দেওয়া না থাকলে)
- ভোট দেওয়া থাকলে: দুটো button ই disabled, "আপনি ইতিমধ্যে ভোট দিয়েছেন" message
- 409 error → already voted popup

**Vote tracking (localStorage):**
```ts
localStorage.getItem('voted_prices') // JSON array of price IDs
```
Page load এ Set এ load হয়, vote দিলে add হয়।

**দৈনিক বাজার সূচক card:**
- ৫টি essential পণ্য: মুরগি, গরু, তেল, আলু, পেঁয়াজ
- আজকের দামের গড় + গতকালের সাথে তুলনা (change)
- basketTotal = ৫টির today avg এর যোগ
- Click করলে modal খোলে বিস্তারিত দেখায়

**timeAgo helper:**
```ts
// মিনিট আগে / ঘণ্টা আগে / দিন আগে
```

#### All Products (`/products`)
**File:** `src/app/(main)/products/AllProducts.tsx`
- Home এর মতো, কিন্তু সব পণ্য দেখায় (limit 200)
- উপরে back button (`router.back()`)
- বাজার selector — URL `?bazar_id=xxx` থেকে initial value
- Same product modal, same vote logic

#### Heatmap (`/heatmap`)
**File:** `src/components/HeatmapMapInner.tsx`
- Leaflet map এ বাজার markers — রঙ দিয়ে দামের tier বোঝায়
  - 🟢 সস্তা (ratio < 0.4), 🟡 মাঝারি (< 0.7), 🔴 দামি
- User location blue dot (pulse animation)
- বাজার select করলে OSRM route draw হয় (dashed green polyline)
- Popup এ "🗺️ Google Maps" + "📍 ম্যাপে রুট" button

#### Bazar Map (`/` home right column link)
**File:** `src/components/BazarMapInner.tsx`
- Same OSRM route feature
- `window.__bazarMapRoute` global handler for popup button

**OSRM Route (উভয় map এ):**
```ts
const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
// GeoJSON coordinates → L.latLng → L.polyline
// color: '#064E3B', dashArray: '10, 6'
```

#### Profile (`/profile`)
**File:** `src/app/(main)/profile/Profile.tsx`
- লগইন না থাকলে login/register prompt
- Stats: মোট submission, verified, নির্ভুলতা %
- সাম্প্রতিক submission list
- লিডারবোর্ড modal
- Settings, এলার্ট, Notification toggle, Logout

#### Planner (`/planner`)
**File:** `src/app/(main)/planner/Planner.tsx`
- **শুধু আজকের (২৪ ঘণ্টার) দাম submit হওয়া পণ্য দেখায়**
- `useGetPricesQuery({ limit: 200 })` → filter: `age < 24h`
- একই productId এর মধ্যে সবচেয়ে recent টা রাখে (deduplicate)
- বাজার select করলে সেই বাজারের আজকের পণ্য
- পণ্য select করে quantity set করা যায়
- যাতায়াত খরচ যোগ করে total calculate
- ফুড রেসকিউ tab

#### Submit (`/submit`)
- নতুন দাম submit করার form
- URL params: `?product_id=xxx&bazar_id=xxx` → form pre-fill

---

## Admin Panel (`bazar-dor-admin`)

### Stack
- React + Vite + TypeScript
- Redux Toolkit + RTK Query
- Tailwind CSS
- Recharts
- React Router DOM

### Pages

| Page | Route | বিবরণ |
|------|-------|--------|
| Dashboard | `/` | stats cards + static charts |
| Products | `/products` | পণ্য CRUD |
| Bazars | `/bazars` | বাজার CRUD |
| Prices | `/prices` | দাম list |
| Alerts | `/alerts` | এলার্ট CRUD |
| Users | `/users` | ব্যবহারকারী list |
| **Market Index** | `/market-index` | **বার্ষিক বাজার সূচক** |

### Market Index Page (বিস্তারিত)
**File:** `src/pages/MarketIndex.tsx`

**Features:**
- Year selector dropdown (current year থেকে ৫ বছর পিছনে)
- `GET /api/v1/daily-snapshots?startDate=&endDate=` দিয়ে data আনে
- সব snapshot মাস অনুযায়ী group করে monthly avg বের করে
- **Summary cards:** বার্ষিক গড় ঝুড়ি দাম + প্রতিটি পণ্যের trend
- **Line chart:** ১২ মাসের monthly avg, toggle করে প্রতিটি পণ্য দেখা যায়
- **Monthly table:** প্রতি মাসে প্রতিটি পণ্যের গড় + কতদিনের ডেটা
- **"আজকের ডেটা সংরক্ষণ" button:** `POST /api/v1/daily-snapshots/trigger` call করে manually snapshot নেয়

**Monthly grouping logic (frontend):**
```ts
// date "YYYY-MM-DD" থেকে মাস বের করে
// সেই মাসের সব snapshot এর avg নিয়ে গড় বের করে
```

---

## Key Technical Decisions

### Location Update
- Layout mount এ একবার geolocation নেয়
- RTK Query `useUpdateProfileMutation` দিয়ে PATCH — Bearer token auto-inject হয়
- `patchedRef` দিয়ে duplicate PATCH রোধ করা হয়েছে
- Raw `fetch` ব্যবহার করা হয় না কারণ token inject হয় না

### Vote Deduplication
- Backend: `voters[]` array + 409 status code
- Frontend: `localStorage['voted_prices']` Set — page reload এও persist থাকে

### Nearby Filter (10km)
```ts
distanceKm(userLat, userLng, bazarLat, bazarLng) <= 10
// Haversine formula — src/lib/distance.ts
```

### Price Expiry
- প্রতিটি Price এ `expiresAt` = submit থেকে ২৪ ঘণ্টা পর
- Frontend ৭ দিনের filter করে (backend expiry আলাদা)

### Daily Snapshot vs Live Calculation
- **Live (frontend):** Home page এর দৈনিক সূচক — API থেকে আনা দাম দিয়ে real-time calculate
- **Snapshot (backend):** রাত ১১:৫৯ এ cron job save করে — historical/yearly analysis এর জন্য

---

## Environment Variables

**Backend:**
```env
BACKEND_IP=...
MONGODB_URL=...
JWT_SECRET=...
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=...
```

**Admin:**
```env
VITE_API_URL=...
```
