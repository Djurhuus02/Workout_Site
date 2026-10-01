# 🏋️ LiftTracker

A clean and simple workout tracker built to log sessions, follow progress, and keep training data synced per user.

**Live app:** [LiftTracker](https://workout-site-rouge.vercel.app/#)  
**Repository:** [Workout_Site](https://github.com/Djurhuus02/Workout_Site)

---

## ✨ Features

### Strength training

- Log workouts with sets, reps, and weight, with suggested progression based on your last session
- Rest timer with sound, vibration, and optional browser notifications
- Personal records (estimated 1RM) and progress charts per exercise
- Muscle-group volume balance over time
- Quick-start templates and favorited workouts

### Running

- Log a run manually (distance + time), or track one live with GPS
- Live map with route, pace, and distance while you run
- Suggested loop routes for common distances (1K–marathon) that start and end where you are
- Personal bests for 1K, 5K, 10K, half marathon, and marathon, plus lifetime running stats

### Everything else

- Google sign-in with Supabase Auth
- Persistent, per-user workout history synced to the cloud, with offline support that queues changes until you're back online
- Body weight tracking
- Achievements for milestones, streaks, and PRs
- Friend challenges and a weekly workout goal
- Installable as a PWA, with dark/light mode and a mobile-first interface

---

## 🧱 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts (charts), Leaflet/react-leaflet (maps)
- **Auth & Database:** Supabase (with Row Level Security enforcing per-user data access)
- **Maps & Routing:** MapTiler (tiles), OSRM via the free FOSSGIS routing server (route suggestions)
- **Hosting:** Vercel, deploying automatically on every push to `main`
- **Analytics:** Vercel Web Analytics and Speed Insights

---

## 📸 Overview

LiftTracker is a small full-stack project focused on building a modern workout logging app with:

- authentication
- cloud deployment
- persistent user data
- progress tracking
- GPS-based running features
- a clean responsive UI

The goal was to build something practical while learning how React, Supabase, and a real git-based deployment flow work together.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Djurhuus02/Workout_Site.git
cd Workout_Site
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your own keys:

```bash
cp .env.example .env
```

| Variable | Where to get it |
| --- | --- |
| `VITE_SUPABASE_URL` | Your [Supabase](https://supabase.com) project's API URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase project's anon/public key |
| `VITE_MAPTILER_KEY` | Free API key from [MapTiler](https://www.maptiler.com/) (needed for the map on running pages) |

Suggested running routes use the free public [FOSSGIS OSRM server](https://routing.openstreetmap.de/) — no key or signup needed. The app still runs without `VITE_MAPTILER_KEY` — the map just shows a message asking for a key instead.

### 4. Run the dev server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
npm start
```

`npm run build` type-checks and produces a static build in `dist/`; `npm start` serves it locally via the Express server in `server.js` for a quick production preview. The live site deploys automatically through Vercel on every push to `main`, which needs the same three environment variables above set as Vercel project environment variables.

---

## 🙏 Credits

Exercise illustrations (`public/exercise_illustrations/`) are adapted from the [Everkinetic](https://github.com/everkinetic/data) project, expanded by Bryl Lim as [workout-guide](https://github.com/bryllim/workout-guide) — licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The ~19 exercises with no free illustration available (mostly Olympic lifts) were hand-drawn to match the same style.
