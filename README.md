# OnGod 🔥

> *Turn any claim your friend group makes in the group chat into a real-stakes prediction market in ten seconds — then let the odds settle it, and mail everyone a receipt.*

**Live demo:** [ongod.vercel.app](https://ongod.vercel.app)

---

## Table of Contents

1. [The Idea](#the-idea)
2. [Inspiration](#inspiration)
3. [How It Works — The Full Loop](#how-it-works--the-full-loop)
4. [How Bento Powers It](#how-bento-powers-it)
5. [How Anakin AI Powers It](#how-anakin-ai-powers-it)
6. [Pages & Features](#pages--features)
7. [Tech Stack](#tech-stack)
8. [Architecture & Code Structure](#architecture--code-structure)
9. [API Routes (Server-Side)](#api-routes-server-side)
10. [Local Setup](#local-setup)
11. [Environment Variables](#environment-variables)
12. [Deployment (Vercel)](#deployment-vercel)
13. [Design Philosophy](#design-philosophy)
14. [Known Limitations](#known-limitations)

---

## The Idea

Every friend group runs an informal prediction market every single day.

*"Bet he shows up late."*
*"No cap, she's getting the job."*
*"I swear he's still talking to his ex."*

These are real claims, with real social stakes, already carrying an implicit time limit. They just resolve through vibes and trash talk instead of actual odds and a payout.

**OnGod is the app that closes that gap.**

It takes that sentence from your WhatsApp group chat and turns it into a live, invite-only, on-chain prediction market in about ten seconds. No crypto vocabulary. No seed phrases. No faucet friction. Just type your claim, set a deadline, share the link, and watch your squad pile onto one side or the other.

When the deadline hits and someone marks it resolved, everyone gets a **thermal receipt** — opening odds vs closing odds, who called it right, how the bet moved — built to be screenshot and posted straight back into the group chat.

---

## Inspiration

The product is built on two observations:

**1. Gen Z/Millennials already speak in predictions.**
Slang like *"on god"* (I swear this is true) and *"cap"* / *"no cap"* (that's a lie / for real) are themselves truth/falsehood verdicts. The UI leans entirely into this language — the buttons aren't "Yes" and "No", they're **On God** and **Cap**. This is not a skin on top of a prediction market. It *is* the friend group's native vocabulary, now backed by stakes.

**2. Bento already built the settlement layer.**
The [Bento](https://bento.fun) protocol provides private invite-only prediction markets (`duels`), live odds via an AMM, on-chain settlement, managed wallets, test credits, and a full TypeScript SDK. OnGod is a *community layer* on top of Bento — it provides the social front door (the ten-second UX, the receipt card, the slang) that Bento's own interface doesn't have.

The project was built for the **Build on Bento · BLR Edition** hackathon. The brief asked builders to "add distribution, specialization, or intelligence on top of Bento — don't rebuild its plumbing." OnGod adds distribution (the shareable receipt) and specialization (the friend-group slice).

---

## How It Works — The Full Loop

```
1. CALL IT OUT  →  2. SQUAD REACTS  →  3. WATCH ODDS MOVE  →  4. RESOLVE  →  5. RECEIPT DROPS
```

### 1. Call It Out (Create)
The user types a claim into a short text template ("I bet that...") and picks a deadline. This:
- Creates a **private, invite-only prediction market (duel)** on the Bento testnet.
- Gets back a `duelId` and a unique `inviteCode`.
- Generates a shareable **invite link**: `yourapp.com/join/{inviteCode}?duelId={duelId}`.

The creator pastes this link into their group chat.

### 2. Squad Reacts (Join & Bet)
When a friend opens the invite link:
- If they're not connected, they get a one-click Bento account creation (no seed phrase — Bento manages a wallet for them).
- They land straight on the **bet card** showing the claim, a live odds bar, and two big buttons: **🔥 On God** and **🧢 Cap**.
- They pick a side. The app fetches a live price quote from the Bento AMM. They confirm. The bet is placed on-chain.

### 3. Watch Odds Move
Every 2.5 seconds, the bet card polls Bento for the latest market state. As more friends bet, the **odds bar** shifts in real-time — left is "Cap" territory, right is "On God." The numbers update live, making the market feel like a heartbeat rather than a stock chart.

### 4. Resolve (Settle the Bet)
When the deadline passes, the callout creator taps **Resolve**. They can optionally:
- Type a text update as evidence ("he walked in at 11:47").
- Paste a **URL** (tweet, article, news clip) — Anakin AI scrapes the page and extracts the content, giving the creator a factual second opinion before they settle.

The creator picks **On God** or **Cap** as the final verdict. This triggers an on-chain resolution call via the Bento SDK.

### 5. Receipt Drops
After resolution, the **Receipt** auto-generates — a thermal-printer-style card showing:
- The claim text.
- Opening odds vs closing odds.
- The verdict stamp: **"CALLED IT"** or **"CAPPED OUT"**.
- A random roast one-liner ("The squad is in shambles." / "Caught in 4K.").
- A save/share button that renders the card as a PNG image for posting.

---

## How Bento Powers It

[Bento](https://bento.fun) (`@bento.fun/sdk`) is the entire on-chain backbone of OnGod. Without it, there is no app — just a static webpage.

### Authentication — Zero Friction Onboarding

Bento's **External Link** auth flow lets OnGod give users a Bento account without them ever seeing a seed phrase or a wallet popup. The flow works like OAuth:

1. User clicks **"Connect with Bento"** on the home page.
2. OnGod calls `sdk.public.externalLink.getLinkUrl({ returnUrl, state })` — Bento generates a magic-link URL.
3. The user is redirected to Bento's own hosted onboarding page, where they connect or create an account in seconds.
4. Bento redirects back to `/connect?code=...&state=...`.
5. OnGod calls `sdk.public.externalLink.exchange({ code })` — gets back a **JWT + managed wallet address**.
6. The JWT is stored in `localStorage` (via Zustand). All subsequent API calls use it as `Authorization: Bearer <JWT>`.

**No seed phrase. No MetaMask. No gas fees.** The user goes from "never heard of Bento" to "placing on-chain bets" in under 20 seconds.

### Auto-Mint Test Credits

Before every duel creation, OnGod calls `POST /bento/auto-mint/mint` with the user's wallet address. This drops free test credits into their managed wallet on the Bento testnet — so every new user has funds to bet with instantly, with no faucet visit.

### Market Creation — `createDuel`

```ts
await sdk.user.createDuel({
  question: "I bet that Rahul shows up before midnight…",
  type: "prediction",
  category: "Football",
  optionA: "Yes",
  optionB: "No",
  startTime: new Date(Date.now() + 32 * 60 * 1000).toISOString(), // 32min minimum!
  endTime: new Date(deadline).toISOString(),
  privacyAccess: "private",    // invite-only, no public discovery
  collateralMode: "credits",   // testnet credits, not real USDC
});
```

> **Critical gotcha:** `startTime` must be at least ~30 minutes ahead of the current block time. If this value is too close to now, Bento's managed wallet runs a pre-flight simulation that will revert with a `500 "Pre-flight simulation failed"` error — even though the HTTP request succeeds. OnGod uses **32 minutes** as a safe buffer.

### Live Odds — Polling

The bet card polls `sdk.public.duels.getById({ duelId })` every 2.5 seconds to get the current market state and recalculate the odds bar.

### Placing Bets — `estimateBuy` + `placeBet`

When a user picks a side:
1. `sdk.user.estimateBuy({ duelId, optionIndex, amountIn: "1000000000000000000" })` — gets a price quote (`1000000000000000000` = 1 credit in wei, 18 decimals).
2. `sdk.user.placeBet({ duelId, optionIndex, amountIn, minSharesOut })` — executes the on-chain bet with slippage protection.

### Resolution — `duels.resolve`

```ts
await sdk.user.duels.resolve({ duelId, winnerIndex: 0 }); // 0 = Yes/OnGod, 1 = No/Cap
```

### The Proxy Layer — How the Builder Key Stays Secret

The Bento **Builder API Key** (`x-builder-api-key`) must never be exposed to the browser. OnGod routes all SDK calls through a server-side Next.js proxy at `app/api/markets/[...path]/route.ts`.

The SDK is configured with `baseUrl: "/api/markets"` in the browser — so calling `sdk.user.createDuel()` internally hits `/api/markets/bento/user/duels/create`, which the proxy forwards to `https://internal-server.bento.fun/bento/user/duels/create` with the real Builder Key injected server-side.

The proxy also sets `export const maxDuration = 60` to give Vercel **60 seconds** per request — crucial because Bento's on-chain transactions take 30–45 seconds on the testnet (vs. Vercel's default 10-second limit).

---

## How Anakin AI Powers It

[Anakin AI](https://anakin.io) provides the **Resolver Assist** feature — a factual second opinion to help settle disputed callouts.

### The Problem It Solves

*"Did he actually show up before midnight?"* — without external evidence, the creator is just arbitrarily picking a winner. Anakin lets them drop a URL (a tweet, a news article, a story link) and get the actual text content of that page back instantly, turning "my word against yours" into "here's what the tweet said."

### How It Works

When the creator pastes a URL as evidence while resolving:

1. The client sends `POST /api/evidence/fetch-link` with `{ url }`.
2. The server calls `POST https://api.anakin.io/v1/url-scraper` with `{ url, generateJson: true }` and an 8-second timeout.
3. Anakin scrapes the page and returns:
   - `markdown`: the full page content as clean, readable Markdown.
   - `generatedJson`: AI-extracted structured data (dates, headlines, key facts).
4. The content is rendered for the creator to read as actual fetched context.
5. A local rule-based **Resolve Assist** engine (`/api/resolve-assist`) scans the fetched text for outcome keywords and surfaces a **suggested verdict** with a short justification.

```
Outcome keywords:
  On God  → "arrived", "confirmed", "happened", "yes", "showed up", "won"
  Cap     → "no-show", "denied", "fake", "false", "didn't", "missed", "lost"
```

**Design principle:** Anakin handles the hard part (fetching and parsing arbitrary webpages). The verdict suggestion is done with simple, deterministic string-matching — no LLM, no per-call cost, no latency risk. The creator can always override the suggestion. If Anakin times out, the feature falls back to the creator's typed text only — the resolve flow never breaks.

### Roast Generator

The Receipt uses a separate `/api/roast` endpoint — fully local, no external calls. It picks a random one-liner from a curated list based on the verdict:

- **On God wins:** "They hated, but you waited." / "Absolute cinema." / "Bro read the script."
- **Cap wins:** "Caught in 4K." / "Delusion is a disease." / "The cap is astronomical."

Zero external dependencies means zero latency and zero failure risk in the middle of a demo.

---

## Pages & Features

| Route | What it does |
|---|---|
| `/` | Home page. Shows connected wallet, active callouts feed, and the Connect with Bento button. |
| `/create` | Create a callout. Claim text + deadline → deploys a Bento duel, generates invite link. |
| `/join/[code]` | Invite landing page. Automatically joins the duel and redirects to the bet card. |
| `/callout/[duelId]` | The main bet card. Live odds bar, On God / Cap buttons, resolve panel, Anakin evidence input. |
| `/receipt/[duelId]` | Post-resolution receipt. Shows opening vs closing odds, verdict stamp, roast line, share button. |
| `/connect` | OAuth-style callback page for Bento's external-link flow. Exchanges the `code` for a JWT. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, React 19) |
| Blockchain / Markets | **`@bento.fun/sdk` v0.7** |
| Crypto / Signing | **viem** (EOA message signing for burner wallets) |
| State Management | **Zustand** with `localStorage` persistence |
| Animations | **Framer Motion** |
| Receipt Image Export | **html-to-image** |
| Date utilities | **date-fns** |
| AI / Scraping | **Anakin AI** (`api.anakin.io`) |
| Styling | **Vanilla CSS** + CSS custom properties |
| Deployment | **Vercel** |

---

## Architecture & Code Structure

```
OnGod/
├── app/
│   ├── page.tsx                         # Home feed + Bento connect button
│   ├── create/page.tsx                  # Create callout (createDuel)
│   ├── join/[code]/page.tsx             # Invite link → auto-join → redirect to bet card
│   ├── callout/[duelId]/page.tsx        # Live bet card (poll odds, place bets, resolve)
│   ├── receipt/[duelId]/page.tsx        # Post-resolve receipt + share
│   ├── connect/page.tsx                 # Bento External Link OAuth callback
│   ├── globals.css                      # Design system (CSS vars, tokens, components)
│   └── api/
│       ├── markets/[...path]/route.ts   # 🔑 Bento API proxy (injects key, 60s timeout)
│       ├── evidence/fetch-link/route.ts # Anakin AI URL scraper endpoint
│       ├── resolve-assist/route.ts      # Local keyword verdict suggestion
│       └── roast/route.ts              # Local roast one-liner generator
├── lib/
│   ├── bento.ts        # SDK init: getBentoPublic() and createAuthedSdk(jwt)
│   ├── bento-link.ts   # External-link OAuth helpers (start connect, consume state)
│   ├── auth.ts         # EOA auth (eoaLogin / eoaRegister via signed message)
│   ├── store.ts        # Zustand store — JWT, walletAddress, myCallouts
│   └── wallet.ts       # Burner wallet generation (viem generatePrivateKey)
└── components/
    ├── OddsBar.tsx     # Animated live odds bar component
    ├── Countdown.tsx   # Deadline countdown timer
    └── Receipt.tsx     # Thermal receipt card (rendered to PNG via html-to-image)
```

### Data Flow — Creating a Callout

```
Browser (create/page.tsx)
  │
  ├─→ mintTestCredits()
  │     POST /api/markets/bento/auto-mint/mint
  │       ↓ proxy adds x-builder-api-key
  │     internal-server.bento.fun → credits land in managed wallet
  │
  └─→ sdk.user.createDuel()
        POST /api/markets/bento/user/duels/create
          ↓ proxy adds x-builder-api-key, forwards Authorization: Bearer JWT
        internal-server.bento.fun
          ↓ Bento runs pre-flight simulation (~30–40s on testnet)
          ↓ On-chain duel created
        ← duelId + inviteCode returned
  │
  └─→ addCallout() to Zustand store (persisted in localStorage)
      setResult() → show invite link
```

### Data Flow — Resolving with Evidence

```
Browser (callout/[duelId]/page.tsx)
  │
  ├─→ POST /api/evidence/fetch-link { url: "https://twitter.com/..." }
  │     ↓ server calls Anakin AI with 8s timeout
  │     ← { markdown: "...", generatedJson: {...} }
  │
  ├─→ POST /api/resolve-assist { claimText, fetchedMarkdown, fetchedJson }
  │     ↓ local keyword scoring (no external calls)
  │     ← { suggestedVerdict: "on_god", justification: "..." }
  │
  └─→ sdk.user.duels.resolve({ duelId, winnerIndex })
        POST /api/markets/bento/user/duels/resolve
          ↓ proxy
        internal-server.bento.fun → on-chain settlement
```

---

## API Routes (Server-Side)

### `POST /api/markets/[...path]` — Bento Proxy

The core of the backend. Every SDK call from the browser flows through here. It:
- Strips dangerous client headers (host, origin, content-length).
- Injects `x-builder-api-key` from the server environment.
- Forwards `Authorization: Bearer <JWT>` from the client for authenticated operations.
- Sets `export const maxDuration = 60` for Vercel — gives 60 seconds per request instead of the default 10 (crucial for Bento's on-chain simulation time).

### `POST /api/evidence/fetch-link`

Accepts `{ url: string }`. Calls `https://api.anakin.io/v1/url-scraper` with an 8-second `AbortController` timeout. Returns `{ markdown, generatedJson }` or `{ markdown: null, generatedJson: null }` on failure. Never throws to the client.

### `POST /api/resolve-assist`

Accepts `{ claimText, deadline, evidence, fetchedMarkdown, fetchedJson }`. Combines all text, runs keyword scoring, returns `{ suggestedVerdict: "on_god" | "cap" | null, justification }`. Pure local logic, zero external calls, zero failure risk.

### `POST /api/roast`

Accepts `{ verdict: "on_god" | "cap" }`. Returns `{ line: string }`. Picks a random pre-written one-liner from two curated banks. Fully local.

---

## Local Setup

### Prerequisites

- **Node.js 18+**
- A Bento Builder API Key (free at [app.bento.fun](https://app.bento.fun) → Settings → Developer → Builder API Key)
- An Anakin AI API Key (optional; free at [app.anakin.io](https://app.anakin.io) — 300 free credits, no card needed)

### 1. Clone & Install

```bash
git clone https://github.com/git791/OnGod.git
cd OnGod
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
NEXT_PUBLIC_BENTO_BUILDER_KEY=bnt_live_xxxxxxxxxxxxx

# Bento testnet (leave as-is)
NEXT_PUBLIC_BENTO_BASE_URL=https://internal-server.bento.fun
NEXT_PUBLIC_BENTO_TOURNAMENTS_URL=https://bento-fun-tournaments-backend-3nku.onrender.com

# Optional — enables URL evidence scraping
ANAKIN_API_KEY=ask_xxxxxxxxxxxxx
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BENTO_BUILDER_KEY` | ✅ Yes | Builder API key from Bento Developer Dashboard. Used server-side in the proxy — never sent to the browser. |
| `NEXT_PUBLIC_BENTO_BASE_URL` | Defaults set | Bento markets host URL. Default: `https://internal-server.bento.fun`. |
| `NEXT_PUBLIC_BENTO_TOURNAMENTS_URL` | Optional | Bento tournaments host (for leaderboard features). |
| `ANAKIN_API_KEY` | Optional | Enables Anakin AI URL scraping in the evidence panel. Without it, users can still type evidence manually. |

---

## Deployment (Vercel)

1. Push to GitHub.
2. Import at [vercel.com/new](https://vercel.com/new).
3. Add environment variables in **Project Settings → Environment Variables**.
4. Deploy.

> The proxy route has `export const maxDuration = 60` which extends Vercel's serverless function timeout from 10 seconds to 60 seconds. This is required for Bento's on-chain transactions (which take 30–45s on testnet) to complete without a 504 Gateway Timeout.

---

## Design Philosophy

OnGod's UI is built around four principles:

**1. Slang-native language.**
"On God" and "Cap" instead of "Yes" and "No." "Drop the Callout" instead of "Submit." "Squad" instead of "participants." This isn't decoration — it's the reason the app feels native rather than foreign to its target users.

**2. The Receipt is the growth loop.**
The thermal receipt card is designed to be screenshotted and posted — into the group chat, as an Instagram story, as a TikTok. Every receipt shared is a zero-cost acquisition event. All the design polish budget goes into the receipt and the live odds bar.

**3. Odds as drama, not data.**
The live odds bar is framed as a tug-of-war between friends, not a finance chart. It's animated and chunky, not precise and decimal-labeled. Someone who has never seen a prediction market instantly understands "more people are on the Cap side right now."

**4. Friction at zero.**
No seed phrases. No MetaMask popups. No faucet visits. No vocabulary the user hasn't already seen. Bento's managed wallet + auto-minted test credits means the entire onboarding — "never heard of this app" to "first on-chain bet placed" — takes under 20 seconds.

**CSS design tokens used:**
- `--cherry-stamp` — primary action red (CTA buttons, On God side)
- `--varsity-teal` — secondary accent (On God odds, links, highlights)
- `--soot-ink` — primary dark background
- `--ash` — secondary text, labels
- `--marigold-ticket` — warning / demo mode indicator

---

## Known Limitations

### Bento Testnet Performance
On-chain transactions take **30–45 seconds** on the Bento testnet due to RPC node load and block times. This is an infrastructure characteristic, not an app bug. The `maxDuration = 60` proxy config handles it on Vercel.

### The `startTime` Minimum Rule
Bento's managed wallet runs a pre-flight simulation before submitting any transaction. If `startTime` is within ~30 minutes of the current block time, the simulation reverts and the server returns `500 "Pre-flight simulation failed"`. OnGod enforces a minimum deadline of **1 hour from now** in the UI (and uses `startTime = now + 32min` internally) to stay safely above the floor.

### Demo / Fallback Mode
If the Bento testnet is completely down, OnGod falls back to **Demo Mode** — callouts are created locally only (in `localStorage`) with no on-chain market behind them. Invite links still work locally for demonstration. Demo Mode is clearly labeled with a yellow warning banner.

### Anakin AI Free Tier
The free Anakin AI account includes **300 URL scraping credits**. For a hackathon demo this is ample. A production deployment would need a paid Anakin plan.
