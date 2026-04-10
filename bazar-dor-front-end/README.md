# বাজার দর (Bazar Dor) - Next.js

Real-time market price tracking app for Bangladesh, built with Next.js 15, TypeScript, Tailwind CSS 4, and SQLite.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** SQLite (better-sqlite3)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Animations:** Motion (Framer Motion)

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local` (optional, for AI features):
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main app routes (grouped)
│   │   ├── page.tsx       # Home page
│   │   ├── Home.tsx       # Home component
│   │   ├── planner/       # /planner route
│   │   ├── result/        # /result route
│   │   ├── submit/        # /submit route
│   │   ├── profile/       # /profile route
│   │   ├── ranking/       # /ranking route
│   │   ├── heatmap/       # /heatmap route
│   │   ├── more/          # /more route
│   │   ├── settings/      # /settings route
│   │   └── change-password/  # /change-password route
│   ├── api/               # API routes
│   │   ├── prices/        # POST /api/prices
│   │   ├── planner/prices # GET /api/planner/prices
│   │   └── admin/verify   # POST /api/admin/verify
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Shared components
│   ├── Layout.tsx         # Main layout with navigation
│   ├── FoodRescue.tsx     # Food rescue recipe component
│   └── PromoBanner.tsx    # Promotional banner
├── lib/
│   └── db.ts             # Database connection & schema
├── constants/
│   └── index.ts          # Products & areas constants
└── types/
    └── index.ts          # TypeScript type definitions
```

## Features

- **Crowdsourced price reporting** - Users submit prices for verification
- **Market basket index** - Tracks daily essential costs across areas
- **Price verification system** - Median price calculation with confidence scores
- **Heatmap visualization** - Geographic price comparison
- **Food rescue** - Recipe suggestions for excess food
- **Leaderboard/Ranking** - User contribution tracking
- **Smart planner** - Budget planning with travel cost calculation

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Next.js lint
- `npm run type-check` - Run TypeScript type checking
