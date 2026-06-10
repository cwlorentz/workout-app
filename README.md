# 💪 MyLift — Your Personal Workout Planner

A private, offline-friendly workout app that lives entirely on your own device.
No accounts, no servers, no internet required once it's on your phone.

---

## What it does

- **Welcome setup** — enter your name, age, height, weight, and gender to seed a plan.
- **Weekly schedule** — auto-built training + rest days (full-body, upper/lower, or push/pull/legs depending on how many days you train).
- **Equipment search** — tick the gym gear you own; the plan only ever suggests exercises you can actually do. Add or remove gear anytime and the plan updates instantly.
- **Today's workout** — your exercises with sets/reps, tappable set-trackers, and a built-in **rest timer** (presets, +/−15s, pause, beep + vibrate when it ends).
- **Adjust** — mark a muscle as sore (it's avoided for ~2 days) or mark a workout day unavailable (it shifts to your next rest day).
- **Settings** — change any of your details, units (lb/ft or kg/cm), goal, days per week, or rest-timer defaults. Or reset everything.

---

## Try it right now on this PC

1. You need Python (you already have it). In a terminal, go to this folder and run:
   ```
   python -m http.server 5577
   ```
2. Open your browser to **http://localhost:5577**

That's it — it runs locally.

> You can also just double-click `index.html` to open it directly. Everything works
> except the "install to home screen / offline" feature, which needs a real web address (below).

---

## Put it on your phone (the recommended way)

To install it on your phone's home screen and use it offline at the gym, the files
need to live at a web address (https). The easiest free option, no coding:

### Option A — Netlify Drop (2 minutes, no account needed to start)
1. Go to **https://app.netlify.com/drop**
2. Drag this whole **`Workout App`** folder onto the page.
3. Netlify gives you a link like `https://your-name.netlify.app`.
4. Open that link **on your phone**, then:
   - **iPhone (Safari):** tap the Share button → **Add to Home Screen**.
   - **Android (Chrome):** tap the **⋮** menu → **Install app** / **Add to Home screen**.
5. Done — it's now an app icon. Open it anytime, even with no signal.

### Option B — GitHub Pages (free, a bit more setup)
This folder is already a git repository. If you'd like, I can walk you through pushing
it to GitHub and turning on Pages — just ask.

---

## Your data & privacy

Everything (profile, plan, equipment, soreness, progress) is saved in your browser's
local storage **on that one device**. It is never uploaded anywhere. If you install on
your phone, your phone keeps its own copy; the PC version keeps its own. Clearing your
browser data, or using **Settings → Reset all data**, erases it.

---

## Want to tweak the exercises?

Open `data/exercises.js` — it's plain English. Each exercise is a short block you can
copy, edit, and save. Add your favorite moves, change the default sets/reps, or tag them
with the equipment they need. No coding knowledge required.

---

## How it's built (for the curious)

Plain HTML, CSS, and JavaScript — no frameworks, no build step, no dependencies.

```
index.html            the app shell
manifest.json         makes it installable as an app
service-worker.js     makes it work offline
css/styles.css        the look & feel
data/exercises.js     the exercise + equipment database (editable)
js/storage.js         saves/loads your data on the device
js/planner.js         builds the weekly plan & picks exercises
js/timer.js           the rest timer
js/app.js             the screens and navigation
icons/                app icons
```
