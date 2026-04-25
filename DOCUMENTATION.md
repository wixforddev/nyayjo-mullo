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
| Alert | `alert.model.ts` | জরুরী এলার্ট — message, messageBn |
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
- `GET /` — এলার্ট list
- `POST /` — নতুন এলার্ট (admin)

**Daily Snapshots** — `/api/v1/daily-snapshots`
- `GET /` — সব snapshot (`?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`)
- `GET /:date` — নির্দিষ্ট দিনের snapshot
- `POST /trigger` — manually আজকের snapshot save করুন (admin only)

### Cron Job
- **Schedule:** প্রতিদিন রাত ১১:৫৯ (Bangladesh time = UTC 17:59)
- **কাজ:** সেদিনের সব Price থেকে ৫টি essential পণ্যের গড় বের করে DailySnapshot এ save করে
- **File:** `src/index.ts`, service: `src/services/dailySnapshot.service.ts`

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
