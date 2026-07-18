# OnGod — Product Requirements Document
**Build on Bento · BLR Edition**
Angle: Community layer (per the brief: "add distribution, specialization, or intelligence on top of Bento, don't rebuild its plumbing")

---

## 1. One-liner

Turn any claim your friend group makes in the group chat into a real-stakes prediction market in ten seconds — then let the odds settle it, and mail everyone a receipt.

## 2. The insight

Millennials, Gen Z, and Gen Alpha already run an informal prediction market every day, inside their group chats. "Bet he's late again." "No cap, she's getting that job." "I swear he's still talking to his ex." Every one of these is a claim, a timeframe, and an implicit wager — it just currently resolves through vibes and trash talk instead of stakes and a payout.

Bento already has the settlement layer for exactly this: on-chain markets, private invite-only pods (`parentMarkets`), duels, live odds, chat, and social feeds. What's missing is a front door built for the way friend groups actually talk — fast, funny, screenshot-native, built around beef and bragging rights instead of tickers and candles.

OnGod is that front door: a community-layer app, not a new market engine.

## 3. Target users

- **Gen Z / Millennials (18–30)** in tight friend groups, group chats, hostel/flatmate circles, college WhatsApp groups — people who already send "bet" as a reflex.
- **Gen Alpha-adjacent** (older teens) drawn to the swipe-to-bet, streak, and shareable-card mechanics that mirror BeReal/TikTok/Poparazzi UX.
- Secondary: creators and micro-communities who want a paid, private "prediction pod" for their Discord/group.

## 4. Core loop

1. **Call it out** — someone types a claim into a template ("I bet ___ that ___ happens by ___") and picks a deadline. This creates a private, invite-only pod market.
2. **Squad reacts** — friends get pulled in via an invite link/code, land on a Tinder-style swipe card, and tap **On God** (yes) or **Cap** (no) to stake test credits. Each stake nudges the live odds bar.
3. **Watch it move** — the odds bar animates in real time as the squad piles on one side or the other; a chat thread under the card fills with trash talk.
4. **It resolves** — the caller (or the group, by vote) marks it settled when the deadline hits.
5. **Receipts drop** — a shareable, thermal-receipt-style card auto-generates: opening odds, closing odds, who called it right, stake size, stamped "CALLED IT" or "CAPPED OUT." Built to be screenshotted straight into the group chat or an Instagram/TikTok story.
6. **Oracle Score** — a running leaderboard of who's actually right most often in the pod, turning bragging rights into a stat.

## 5. Why this has a wow factor

- **Ten-second creation**: no market-builder form, no category picker — just a sentence template, because that's how the claim already exists in the chat.
- **The Receipt**: a single, unmistakable, ownable visual signature — a printed-tape receipt that becomes the artifact people actually share. This is the thing that makes OnGod spread (Spread = 15% of the score) — it's built to be posted, not just used.
- **Odds as drama, not data**: the live bar is framed as a heartbeat/tug-of-war between the squad, not a stock chart. It's legible to someone who's never seen a prediction market.
- **Slang-native UI**: "On God" / "Cap" instead of "Yes" / "No" — the product speaks the target user's actual language rather than translating finance vocabulary at them.

## 6. MVP scope (buildable in ~2 hours with an AI coding agent)

**Must ship, and must be real on Bento (not mocked):**
1. Auto-onboarding: silent burner-wallet registration + auto-minted test credits, so a new user is betting within seconds, no seed phrase, no faucet friction.
2. Create a Callout: claim text + deadline → creates a private pod (`parentMarket`) with one child market (`duel`), plus an invite link.
3. Join via invite link → lands straight on the swipe card.
4. Swipe-to-bet: tap On God / Cap → live quote → place bet on-chain via the SDK.
5. Live odds bar that visibly moves as the demo places bets from two or more browser sessions.
6. Resolve the callout (creator marks the outcome) → payout settles.
7. Auto-generated Receipt card (client-side image) with real opening/closing odds pulled from the market.
8. A minimal Oracle Score leaderboard for the pod.

**Explicitly out of scope for the hackathon demo (stretch only):**
- Full trash-talk chat UI (Bento's chat endpoints exist and are wired for later, not required for the demo path).
- Push notifications.
- Public/discoverable pods — MVP is invite-only pods only.
- Real USDC — demo runs entirely on Credits (free-to-play stack), per Bento's own rule that a market runs on exactly one collateral type.

## 7. Success metrics (mapped to judging criteria)

- **Works live on Bento (40%)**: every step above is a real SDK call against the Bento markets host and, for the pod/leaderboard pieces, the tournaments host — demoed with two live browser sessions moving real odds during the pitch.
- **Useful (25%)**: solves a genuine, repeated friend-group behavior (settling bets/claims) with zero new vocabulary to learn.
- **Craft (20%)**: the Receipt card and the odds bar are the two places all polish budget goes; everything else stays plain.
- **Spread (15%)**: the Receipt is designed explicitly to be re-shared outside the app — that's the growth loop.

## 8. Evidence layer add-on: anakin.io — kept 100% free

The hackathon brief names three winning angles — vertical app, community layer, intelligence layer. OnGod is a community-layer product; this add-on borrows a slice of the intelligence layer without adding any paid dependency, by leaning entirely on **anakin.io** (a web-scraping API with a free-forever tier: 300 credits, no card required) plus a bit of free, local app logic — no LLM API, no subscription, nothing metered beyond anakin.io's own free allotment.

1. **Resolver Assist** — when the caller taps "Resolve," they can paste either a typed update ("he walked in at 11:47") or a link (a tweet, a story, a news post) as evidence. If it's a link, the app uses anakin.io to fetch and clean that page's actual content server-side, plus pull whatever structured facts (dates, headline text) its AI extraction can infer from the page — both shown to the caller as real fetched context, not a paraphrase. On top of that, a small piece of free rule-based logic — not an LLM — checks any extracted date/time against the deadline and a short list of outcome keywords, and surfaces a labeled suggestion the caller can take or leave. It's a heuristic hint, not model reasoning, but it still gives the caller a second opinion grounded in a real source instead of adjudicating their friend's bet off a bare claim — which directly matters for the "did he actually show up before midnight" ambiguity flagged in §9.
2. **Roast Generator** — the moment that makes the Receipt (§5) sharper: once a callout resolves, the receipt-stamp line ("cyan doubted him and cyan was wrong") is picked from a curated library of pre-written one-liners, parameterized by verdict and how big the odds swing was, in place of the plain "CALLED IT" default. This needs no external call at all — it's free, instant, and can't fail mid-demo, which is the right trade for a live pitch. It's still a craft/spread upgrade over a generic stamp, just delivered without any paid AI dependency.

Both are additive: if anakin.io's fetch times out, the app falls back to the plain toggle (using only typed text, if any); the Roast Generator, being fully local, effectively can't fail. Neither touches Bento's own settlement path — the actual `resolve` call still goes through the Bento SDK exactly as in §6.

Note on scope: anakin.io is a scraping/data-fetch API — `POST /url-scraper` submits a URL with an optional `generateJson: true` flag, a polled job returns cleaned Markdown plus AI-inferred structured facts about that page, auth is a plain `X-API-Key` header against `https://api.anakin.io/v1`. There's no custom prompt or schema parameter, so it can surface facts about a page but can't be asked a targeted question like "does this support the claim" — that gap is closed with free, deterministic app logic on top, not a second paid service.

## 9. Risks

- **Wallet friction** → mitigated by burner-wallet auto-onboarding + `autoMint` credits; no user ever sees a seed phrase during the demo.
- **Odds not moving live** → mitigated by scripting the demo with two pre-loaded sessions that both act during the pitch, not relying on real audience participation.
- **Resolution being subjective** ("did he actually show up before midnight?") → MVP treats the caller as the resolver (creator-resolves pattern already in the SDK); a "group vote to resolve" mode is a clearly labeled stretch goal, not promised in the demo.
- **Evidence-link fetch being slow or blocked** → anakin.io's scrape is job-based (poll a `jobId`, typically 3–15s but async), so the client enforces a short (~5–8s) timeout; past that, the app just skips the fetched preview and runs Resolver Assist's heuristic on the caller's typed text alone. Failed or timed-out anakin.io jobs aren't charged, so this can't burn through the free 300-credit allotment.
