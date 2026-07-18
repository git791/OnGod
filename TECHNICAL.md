# OnGod — Technical Design Document
Build on Bento · BLR Edition

---

## 1. Architecture overview

```
Browser (Next.js PWA, mobile-first)
   │
   ├── @bento.fun/sdk  ──HTTP──▶  Bento Markets host   (bets, pods, duels, credits)
   │                    ──HTTP──▶  Bento Tournaments host (leaderboard, chat/social — stretch)
   │                                     │
   │                                     ▼
   │                              BSC (on-chain settlement)
   │
   ├── Server routes (Next.js API) ──HTTP──▶  anakin.io (evidence-link scraping + AI extraction, job-polled)
   │                                          (Resolver Assist verdict logic + Roast Generator both run as
   │                                           free, local app code — no other external AI API, no paid tier)
   │
   ├── Local burner wallet (viem) — signs the wallet-auth challenge, never leaves the browser
   └── Client-side Receipt renderer (canvas) — builds the shareable card from odds snapshots
```

Two backends, one SDK, per Bento's own model: `createBentoSdk({ baseUrl, tournamentsBaseUrl, auth, tournamentsAuth })`. The MVP lives almost entirely on the **markets host**; the tournaments host is only touched for the pod leaderboard (stretch: chat/social).

## 2. Tech stack

- **Frontend**: Next.js + React (mobile-first, PWA-installable), Tailwind for layout only — colors/type come from the design tokens in §7, not Tailwind defaults.
- **Bento integration**: `@bento.fun/sdk` (npm), pointed at the Bento testnet server per the hackathon docs.
- **Wallet**: `viem` to generate and hold a burner keypair in `localStorage`/IndexedDB per device — used purely to sign the login challenge Bento expects (`walletAuthProvider`). No external wallet connect in the MVP; this removes the single biggest friction point for a 2-hour build and a live demo.
- **Realtime odds**: polling (every 2–3s) against the public snapshot endpoint while the callout is open — sufficient for a hackathon demo; a stretch goal swaps this for Bento's realtime/Ably channels used elsewhere in the tournaments host.
- **Receipt rendering**: `html-to-image` (canvas) run client-side against a hidden DOM node styled with the receipt tokens, exported as a PNG for download/share.
- **Deploy**: Vercel (or the Bento testnet-server pattern from the docs) for a link judges can open live.

## 3. Bento SDK modules used (real calls, mapped to the demo flow)

| Step in the product loop | SDK call | Host |
|---|---|---|
| Silent onboarding | `sdk.public.auth.eoaRegister` / `eoaLogin` | Markets |
| Fund the burner with test stakes | `sdk.public.autoMint.mint` | Markets |
| Create a private pod for the squad | `sdk.user.parentMarkets.createParentMarket` | Markets |
| Create the callout (the actual market) as a child of the pod | `sdk.user.duels.createDuel` + `sdk.user.parentMarkets.addChildDuel` | Markets |
| Generate the invite link | `sdk.user.parentMarkets.createInvitation` | Markets |
| Friend validates + joins via link | `sdk.public.parentMarkets.validateInvite` → `sdk.user.parentMarkets.join` | Markets |
| Swipe-card quote before staking | `sdk.user.bets.estimateBuy` (and `estimatedWin` for the payout preview) | Markets |
| Place the stake (On God / Cap) | `sdk.user.bets.placeBet` (`POST /bento/user/bets/create`) | Markets |
| Live odds bar | `sdk.public.publicBets.getYesPercentageSnapshots` (polled) | Markets |
| Resolve the callout | `sdk.user.duels.resolve` | Markets |
| Portfolio / "did I call it" state | `sdk.user.portfolio.getPnlChart`, `getDuelsTable` | Markets |
| Oracle Score leaderboard for the pod | `sdk.public.leaderboard.getTradersPnl` / `listTraders` | Markets |
| Shareable link preview metadata | `sdk.public.ogMetadata.getForDuel` | Markets |
| **Stretch:** trash-talk thread under a callout | `sdk.tournaments.socialChat.*` (`postMessage`, `getMessages`) | Tournaments |
| **Stretch:** "squad stories" reel | `sdk.tournaments.socialFeeds.postStory` / `getStoriesFeed` | Tournaments |

Per Bento's own model: reads (odds, catalog) need no auth; every write above (`create`, `place`, `resolve`, `join`) needs the burner wallet's JWT, obtained once at onboarding and reused. All writes are treated as **accepted, not final** — the UI shows an optimistic "settling on-chain" state and reconciles against the read endpoints, exactly as Bento's own "acceptance vs finality" model prescribes.

## 4. Data model (app-level, on top of Bento's own market/duel objects)

```
Squad (Pod)              → wraps Bento parentMarketId + invite code
Callout (Market)          → wraps Bento duelId; app-only fields: template text, deadline, resolver
Stake (Bet)               → wraps Bento bet; app-only fields: swipe direction label (On God / Cap)
Receipt (derived, not stored server-side) → opening odds, closing odds, caller, stake, generated client-side at resolution time from snapshot history
OracleScore (derived)     → correct calls / total calls per wallet within a pod, computed from resolved callouts
```

Nothing above needs its own backend — it's all a thin, Bento-native wrapper. This is the deliberate scope discipline the brief asks for: specialization and distribution on top of Bento, not new plumbing.

## 5. Screen-by-screen build plan (sequenced for a 2-hour build)

1. **Onboarding (10–15 min)** — on first load, generate a burner wallet, call `eoaRegister`, call `autoMint.mint`. No UI beyond a loading state; user lands directly in-app.
2. **Create Callout (20 min)** — one-screen form: claim text (pre-filled template), deadline picker, "invite my squad" → `createParentMarket` → `createDuel` → `addChildDuel` → `createInvitation`, then show the shareable link.
3. **Join flow (10 min)** — invite link opens the app, calls `validateInvite` → `join`, drops user straight onto the swipe card.
4. **Swipe card + live odds (35–40 min, the core build)** — card shows claim text, deadline countdown, odds bar; tapping On God/Cap runs `estimateBuy` → confirmation → `placeBet`; odds bar polls `getYesPercentageSnapshots` every 2–3s and animates width changes.
5. **Resolve + Receipt (25–30 min)** — creator-only "Resolve" button → `resolve`; on resolution, snapshot the odds history into the hidden receipt DOM node, render to PNG with `html-to-image`, show download/share sheet.
6. **Leaderboard (15 min)** — simple list pulling `getTradersPnl` for pod members, sorted, with a correct-calls tally computed client-side from resolved callouts.

Total: comfortably inside a 2-hour build for an AI coding agent (Codex/Antigravity-class) working off this spec, since every screen maps to 1–3 already-documented SDK calls with no server code of its own required.

## 6. Demo script (for the judged live moment)

1. Open the app on two devices/browser windows (You + a friend).
2. Create a callout on device A ("I bet Rahul shows up before midnight") → invite link.
3. Join on device B via the link.
4. Both devices place opposing stakes → **odds bar visibly moves** in front of the judges — this is the single most important beat, since "works live on Bento" is 40% of the score and explicitly wants odds moving / a position resolving on real data.
5. Resolve the callout → Receipt renders with the real before/after odds.
6. Show the Oracle Score leaderboard update.

## 7. UI design system

**Design plan (before/after critique):** the obvious defaults for a "prediction market for young people" app are (a) cream background + terracotta accent, or (b) near-black + a single neon-green accent, or (c) a dense broadsheet grid. All three read as generic AI output. OnGod instead leans into two textures that are true to the actual subject: the **late-night group chat** (dark, chaotic, multi-accent) and the **thermal receipt** (warm paper, monospace, perforated) — because the product's whole idea is a text-thread claim turning into a printed piece of proof. The receipt is the one deliberate risk: a warm paper surface living inside an otherwise dark, neon app, because that contrast *is* the signature moment (chat argument → hard evidence).

**Color (named tokens):**
| Token | Hex | Use |
|---|---|---|
| Ink | `#0C0F1D` | App background, cards |
| Paper | `#F5F0E6` | The Receipt surface only — never used elsewhere |
| Callout Pink | `#FF2E7E` | Primary actions, the "CALLED IT" stamp, brand accent |
| Riot Lime | `#C6FF3D` | "Cap" / winning-side odds fill |
| Cool Cyan | `#3DD9FF` | "On God" / opposing-side odds fill |
| Smoke | `#8A8FA3` | Secondary text, timestamps, metadata |

**Type:**
- **Display** — a bold, slightly condensed grotesk (e.g. Clash Display / Archivo Black), used only for the claim text on a callout card and big numbers. Used with restraint — one line per card, never body copy.
- **Body** — a clean geometric sans (e.g. General Sans / Inter) for everything conversational: labels, buttons, empty states.
- **Data/Receipt mono** — a monospace face (e.g. JetBrains Mono / IBM Plex Mono) reserved for odds numbers, countdown timers, and all receipt content — it's what makes the receipt read as "printed," not "designed."

**Layout concept:**
- Mobile-first, single-column, one callout per screen (swipe, don't scroll a list) — mirrors the card-based, single-focus attention pattern of BeReal/Tinder rather than a market "browse grid."
- The odds bar is framed as a two-sided tug-of-war (lime vs. cyan), animated on every new stake, not a percentage label alone — legible without any prediction-market literacy.
- The Receipt breaks the app's own dark palette on purpose: paper-colored, dashed rule lines, monospace ledger, a stamped verdict — designed to look correct as a cropped screenshot with no other app chrome visible.

**Motion:** one orchestrated moment, not scattered effects — the odds bar tween (200–300ms ease-out) on every new stake, and a single "unspool" animation when the Receipt generates. Everything else (buttons, nav) stays instant and unanimated, per the brief's own instruction to spend boldness in one place.

**Voice:** plain, active, no finance jargon — "On God" / "Cap" instead of "Yes" / "No"; "closes in 2h 14m" instead of "market expiry"; the Receipt's only voice moment is the stamp itself ("CALLED IT" / "CAPPED OUT").

## 8. Evidence layer add-on (anakin.io) — kept 100% free

Every external integration in OnGod besides Bento itself is anakin.io. There is no paid LLM API anywhere in this build — the whole stack runs on free tiers end to end: Bento's testnet Credits (§9) and anakin.io's free-forever Starter plan.

**anakin.io's free tier, confirmed from its own pricing page:** the **Starter** plan is free forever, no card required — 300 credits, 5 concurrent requests, reduced rate limits. Published per-request costs: a basic scrape is 1 credit, `+1` credit for an AI-generated summary of the page, `+2` credits for AI JSON extraction, and **failed or timed-out requests are never charged**. At 1–3 credits per evidence-link fetch, 300 free credits comfortably covers a 2-hour build-and-demo cycle with room to spare.

**API surface used:** `POST https://api.anakin.io/v1/url-scraper` with `{ url, generateJson: true }`, authenticated via an `X-API-Key` header. The job is async — poll `GET /v1/url-scraper/{jobId}` until `status: "completed"`, which returns `markdown` (cleaned page text) and, since `generateJson` was set, a `generatedJson` field of whatever structured facts (dates, names, headline text) the AI could infer from that specific page. There's no custom schema or prompt parameter on this endpoint — the AI decides what's extractable, not the caller — so the result reads as "useful structured facts about the page," not a targeted answer to OnGod's claim.

**1. Evidence-link fetch + lightweight Resolver Assist (anakin.io + local logic, no LLM):**
When the caller's evidence for resolving a callout is a link, the server submits it to `/url-scraper` with `generateJson: true` and shows the cleaned `markdown` plus whatever `generatedJson` facts came back right next to the manual On God / Cap toggle. On top of that, a small piece of free, deterministic app logic — not an LLM — scans the returned text and structured fields for date/time mentions and a short list of outcome keywords ("arrived," "no-show," "confirmed," "denied," etc.), compares any extracted timestamp against the callout's deadline, and surfaces a labeled **suggestion** with a visible confidence caveat (e.g. "Extracted text mentions arrival at 11:47pm, before the stated deadline — leans On God"). This is a heuristic, not language-model reasoning, and is framed to the caller as a hint they can ignore — but it delivers the original "second opinion" through anakin.io's real AI extraction plus free rule-based logic, with no paid model call anywhere.

**2. Roast Generator (fully local, zero external calls):**
Once a callout resolves, the receipt-stamp line ("cyan doubted him and cyan was wrong") is picked from a curated library of ~20–30 pre-written templates, parameterized by verdict (`on_god` / `cap`) and the size of the odds swing (e.g. "landslide," "nail-biter," "reversal" buckets), with simple string interpolation for the claim's key noun/verb where needed. This costs nothing, has zero latency, and can't fail mid-demo — trading novelty for total reliability, which is the right trade for a 2-hour live pitch.

**Server-side wiring:**
- `ANAKIN_IO_API_KEY` — the only external API key anywhere in the project, used against `https://api.anakin.io/v1` with the `X-API-Key` header.
- `POST /api/evidence/fetch-link` — accepts `{ url }`. Submits to anakin.io's `/url-scraper` with `generateJson: true`, polls with a hard client-side timeout of ~5–8s (anakin.io itself won't charge for a failed/timed-out job), and returns `{ markdown, generatedJson }` on success or `{ markdown: null }` on timeout/failure — the UI then falls back to whatever typed evidence the caller entered.
- `POST /api/resolve-assist` — runs the local heuristic described above against `{ claimText, deadline, evidenceText, fetchedMarkdown, fetchedJson }` and returns `{ suggestedVerdict, justification }`. Pure app code, no external call of its own — anakin.io already made the one external call, inside `/api/evidence/fetch-link`.
- `POST /api/roast` — looks up a template from the local library keyed on `{ verdict, oddsSwingBucket }` and returns `{ line }`. No external call at all.
- Every anakin.io call is wrapped in a try/catch with the timeout above; on any failure the client keeps its existing default (manual toggle only, typed-text-only evidence) — anakin.io is a garnish, never a dependency on the critical path to a live Bento demo.

**Sequencing relative to Bento calls:** unchanged in spirit — the evidence-link fetch (if used) and resolve-assist both run before `sdk.user.duels.resolve`; the roast lookup runs after it, once the final odds snapshot is known. Every settlement action in the demo is still a real Bento call; anakin.io only fetches context, and everything downstream of that fetch is free, local logic.

## 9. Risks & fallbacks

- If the tournaments host is flaky on testnet, the Oracle Score leaderboard falls back to a purely client-computed tally from resolved callouts (still real Bento data, just aggregated locally instead of via `getTradersPnl`).
- If burner-wallet signing has any hiccups on a given browser, fall back to Bento's `eoaRegister`/`eoaLogin` with a device-generated key stored in IndexedDB rather than requiring a browser extension mid-demo.
- If anakin.io's scrape job doesn't complete inside the ~5–8s client-side timeout (queue backlog, a JS-heavy or blocked target page, or the caller's link needing `useBrowser: true`), the evidence-link preview is simply skipped — Resolver Assist's heuristic still runs on whatever typed evidence text the caller entered, and the resolve flow never blocks on it. Failed/timed-out anakin.io jobs aren't charged, so this fallback never burns free credits.
- If the free 300-credit Starter allotment somehow runs low mid-hackathon (unlikely at this call volume), the same fallback applies automatically — no code path depends on anakin.io succeeding.
- Everything runs on Credits, never USDC, avoiding any real-money handling during the hackathon — consistent with Bento's own "never mix collateral" rule.
