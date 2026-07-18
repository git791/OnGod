# OnGod — Brand & Design System v2
Replaces the Neon Pink/Cyan/Lime direction from the technical doc's §7. This doc is the source of truth for color, type, iconography, textures, and motion going forward — treat §7 of TECHNICAL.md as superseded by this file.

---

## 1. Why we're moving off neon

The original palette (Ink `#0C0F1D` + Callout Pink + Riot Lime + Cool Cyan) reads as "AI dark-mode dashboard" — competent, but it's the same silhouette as every crypto/trading app and every AI-generated demo right now: near-black canvas, one or two glowing accents. It doesn't say anything specific about *this* product.

2026 research on where Gen Z / young-Millennial design is actually heading points the opposite direction from glow:

- **Retro-referential, not futuristic.** The dominant 2026 thread across independent trend reports is Y2K/early-internet revival — scrapbook collage, handwritten labels, "naive" wobbly linework, and DIY zine energy, explicitly framed as a *rebellion against clean, corporate, overly-polished interfaces*. That's the opposite instinct from a glowing neon dashboard.
- **Signage-driven, tactile lettering is trending over sterile digital sans.** 2026 type trend reports call out lettering "inspired by grocery storefronts, roadside stands, and hand-brushed display boards" — chunky terminals, compressed widths, uneven baselines — over generic geometric sans.
- **Maximalism and "controlled chaos" over safe minimalism** — but the winning executions pair that energy with a *grounded, tactile* material (paper, stickers, ink), not with screen-glow.

OnGod's own signature — the Receipt — is already a printed, paper, ink-stamped object. Keeping the rest of the app in glowing dark-mode neon fought the one thing that made the product distinctive. So v2 leans all the way into the receipt's own material world instead: **paper, ink stamps, ticket-stub perforation, hand-stamped imperfection.** Not glassmorphism (too glossy/corporate-tech), not Frutiger Aero chrome (wrong emotional register — that's optimistic tech-nostalgia, OnGod is scrappy friend-group beef), not a second neon palette. Paper and ink.

## 2. Direction name: "Ticket Stub"

Think: the stub torn off a raffle ticket, a punch card, a corner-store receipt, a varsity patch stitched on a jacket. Every visual element in the app should look like it could exist as a physical object in someone's pocket — because that's exactly the emotional job the Receipt already does (a screenshot-able piece of proof). We're extending that one idea to the whole product instead of contradicting it with a second, unrelated visual language.

## 3. Color palette (replaces the neon trio entirely)

| Token | Hex | Role |
|---|---|---|
| Ticket Cream | `#F4ECD8` | Base surface — replaces Ink as the primary background. Warm paper, not black. |
| Soot Ink | `#211D17` | Primary text, line art, the app's "ink" — replaces pure black/near-black. |
| Cherry Stamp | `#C8102E` | Primary accent — On God / confirm / primary CTA. Reads as a rubber ink stamp, not a screen glow. |
| Marigold Ticket | `#E8A13D` | Secondary accent — Cap / decline / caution. A ticket-stub yellow-orange, not a neon warning color. |
| Varsity Teal | `#1F6F5C` | Tertiary accent — links, trim, the logo's hand-drawn underline, secondary data series. |
| Ash | `#8C8474` | Muted text, timestamps, metadata, dashed rule lines. |

Dark-mode variant (device/system dark mode, not a "dark app theme" — the brand itself is a light, paper-toned brand): invert to Soot Ink `#211D17` background with Ticket Cream `#F4ECD8` text, keep Cherry Stamp / Marigold Ticket / Varsity Teal identical (they're saturated enough to hold up on a dark ground unchanged) — do not introduce new dark-mode-only accent colors.

## 4. Typography

| Role | Face | Why |
|---|---|---|
| Display (headlines, the wordmark, big odds numbers) | **Anton** (Google Fonts) | Condensed, heavy, poster/signage weight — matches the 2026 "hand-brushed display board" trend and gives the claim text on a callout card real shout-it-across-the-room presence. Used sparingly, one line at a time, never for body copy. |
| Body (UI copy, buttons, descriptions, empty states) | **Inter** | Stays the workhorse — legible at small sizes, currently the dominant UI font for exactly that reason. Warmth in this system comes from color and texture, not from the body face. |
| Data / receipt ledger (odds, timers, the Receipt itself) | **Courier Prime** (replaces JetBrains Mono) | An actual typewriter-style monospace rather than a coder's monospace — reads as "printed by a machine," which is precisely what the Receipt is supposed to look like. |
| Hand accent (sticker captions, doodle annotations, empty-state asides — used *very* sparingly, never for anything functional) | **Permanent Marker** (Google Fonts) | Covers the "naive/handwritten" trend explicitly — a scribbled aside next to a stamp, not a load-bearing UI element. One or two words at a time, max.|

Google Fonts import: `Anton`, `Inter`, `Courier Prime`, `Permanent Marker` are all free/open and available directly from `fonts.googleapis.com`, no licensing step needed before the demo.

## 5. Custom icons — On God / Cap

Both replace the ✊/🧢 emoji with a matched pair: a circular "ink stamp" badge with a perforated, ticket-stub edge (12 punch-holes via an SVG mask, so it reads as torn/stamped rather than a plain circle), a glyph in the center, and a dashed inner ring for extra "stamped impression" texture.

- **On God** — Cherry Stamp fill, a bold checkmark glyph. File: `icon-on-god.svg`.
- **Cap** — Marigold Ticket fill, a bold X glyph. File: `icon-cap.svg`.

```svg
<!-- icon-on-god.svg -->
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="On God stamp icon">
  <defs>
    <mask id="perf-ongod">
      <circle cx="32" cy="32" r="29" fill="#fff"/>
      <g fill="#000">
        <circle cx="32" cy="3" r="2.6"/><circle cx="46.5" cy="6.9" r="2.6"/>
        <circle cx="57.1" cy="17.5" r="2.6"/><circle cx="61" cy="32" r="2.6"/>
        <circle cx="57.1" cy="46.5" r="2.6"/><circle cx="46.5" cy="57.1" r="2.6"/>
        <circle cx="32" cy="61" r="2.6"/><circle cx="17.5" cy="57.1" r="2.6"/>
        <circle cx="6.9" cy="46.5" r="2.6"/><circle cx="3" cy="32" r="2.6"/>
        <circle cx="6.9" cy="17.5" r="2.6"/><circle cx="17.5" cy="6.9" r="2.6"/>
      </g>
    </mask>
  </defs>
  <circle cx="32" cy="32" r="29" fill="#C8102E" mask="url(#perf-ongod)"/>
  <circle cx="32" cy="32" r="23" fill="none" stroke="#F4ECD8" stroke-width="1.2" stroke-dasharray="2.5 3.5" opacity="0.55"/>
  <path d="M19.5 33.5 L27.5 41.5 L45 21.5" fill="none" stroke="#F4ECD8" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

```svg
<!-- icon-cap.svg -->
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cap stamp icon">
  <defs>
    <mask id="perf-cap">
      <circle cx="32" cy="32" r="29" fill="#fff"/>
      <g fill="#000">
        <circle cx="32" cy="3" r="2.6"/><circle cx="46.5" cy="6.9" r="2.6"/>
        <circle cx="57.1" cy="17.5" r="2.6"/><circle cx="61" cy="32" r="2.6"/>
        <circle cx="57.1" cy="46.5" r="2.6"/><circle cx="46.5" cy="57.1" r="2.6"/>
        <circle cx="32" cy="61" r="2.6"/><circle cx="17.5" cy="57.1" r="2.6"/>
        <circle cx="6.9" cy="46.5" r="2.6"/><circle cx="3" cy="32" r="2.6"/>
        <circle cx="6.9" cy="17.5" r="2.6"/><circle cx="17.5" cy="6.9" r="2.6"/>
      </g>
    </mask>
  </defs>
  <circle cx="32" cy="32" r="29" fill="#E8A13D" mask="url(#perf-cap)"/>
  <circle cx="32" cy="32" r="23" fill="none" stroke="#211D17" stroke-width="1.2" stroke-dasharray="2.5 3.5" opacity="0.4"/>
  <path d="M21 21 L43 43 M43 21 L21 43" fill="none" stroke="#211D17" stroke-width="5.5" stroke-linecap="round"/>
</svg>
```

Both icons share the exact same badge geometry (only fill color and center glyph change) so they always read as a matched pair, the way a real "approved"/"rejected" stamp set would.

## 6. Brand logo

A wordmark, not a text label: the same perforated stamp badge (small, with a check) sits to the left of "ON GOD" set in Anton, tilted -3° with a hand-drawn Varsity Teal underline swash — the tilt and the imperfect underline are the deliberate nod to the "naive/wobbly linework" trend, signaling a hand-stamped object rather than a manufactured logotype.

```svg
<!-- logo-wordmark.svg -->
<svg width="320" height="100" viewBox="0 0 320 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OnGod logo">
  <defs>
    <mask id="perf-logo">
      <circle cx="34" cy="50" r="27" fill="#fff"/>
      <g fill="#000">
        <circle cx="34" cy="23" r="2.3"/><circle cx="48" cy="26.6" r="2.3"/>
        <circle cx="58" cy="36.6" r="2.3"/><circle cx="61" cy="50" r="2.3"/>
        <circle cx="58" cy="63.4" r="2.3"/><circle cx="48" cy="73.4" r="2.3"/>
        <circle cx="34" cy="77" r="2.3"/><circle cx="20" cy="73.4" r="2.3"/>
        <circle cx="10" cy="63.4" r="2.3"/><circle cx="7" cy="50" r="2.3"/>
        <circle cx="10" cy="36.6" r="2.3"/><circle cx="20" cy="26.6" r="2.3"/>
      </g>
    </mask>
  </defs>
  <circle cx="34" cy="50" r="27" fill="#C8102E" mask="url(#perf-logo)"/>
  <path d="M22 51 L30 59 L47 38" fill="none" stroke="#F4ECD8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="rotate(-3 190 50)">
    <text x="76" y="63" font-family="Anton, Impact, sans-serif" font-size="42" fill="#211D17" letter-spacing="1">ON GOD</text>
    <path d="M77 72 Q140 78 180 73 Q230 68 300 74" fill="none" stroke="#1F6F5C" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>
```

Use this SVG directly in the top nav in place of the plain-text wordmark. At favicon/app-icon size, crop to just the stamp badge (the check-mark circle) — it holds up at 32px where the full lockup won't.

## 7. Background texture

No mesh gradients, no frosted-glass panels. Two textures only, both literal paper/print references, both very low-opacity so they never compete with content:

**Grain** — a subtle paper-grain noise, applied as a full-bleed overlay at 4–6% opacity in `multiply` blend mode over Ticket Cream surfaces (or `screen` blend mode over Soot Ink in dark mode):

```svg
<!-- texture-grain.svg — reusable filter, drop once in a hidden <svg> and reference by id -->
<svg width="0" height="0">
  <filter id="grain-texture" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0"/>
  </filter>
</svg>
```
```css
.app-background {
  background-color: var(--ticket-cream);
}
.app-background::after {
  content: "";
  position: absolute;
  inset: 0;
  filter: url(#grain-texture);
  mix-blend-mode: multiply;
  opacity: 0.5;
  pointer-events: none;
}
```

**Halftone dots** — a tiny repeating dot pattern (also in `texture-grain.svg` as `#halftone-dots`), used only as a card background fill behind the Oracle Score leaderboard and empty states — a direct newsprint/zine reference, at 6% opacity max, never behind body text.

Explicitly excluded: gradient mesh blur, drop-shadow glow, frosted/blurred glass panels — all read as "generic AI app" per the design skill's own calibration notes, and none of them belong to the paper/ink material world this brand lives in.

## 8. Motion language

Every animation should feel like something physical happening to a paper object, not a digital glow effect:

- **Stamp-slam (resolve action)** — when the creator taps Resolve, the chosen icon (On God / Cap) scales from 1.4x to 1x over 120ms with a hard ease-out (no bounce), simulating a stamp hitting paper. Pair with a single, short haptic tick on mobile. No glow, no particle burst.
- **Sticker peel (tap feedback)** — buttons and swipe-card actions scale to 0.96x and rotate 1–2° on press, spring back on release — the feeling of peeling/repositioning a sticker, not a flat digital press-state.
- **Ticket tear (screen transitions)** — moving from the swipe feed into a resolved callout uses a short (180ms) horizontal "tear" wipe with a jagged clip-path edge, rather than a fade or slide — a direct callback to tearing a ticket stub.
- **Receipt unspool (existing signature moment, unchanged in spirit)** — the Receipt still prints downward like a thermal receipt when a callout resolves; keep this as the one deliberately elaborate animation in the whole app, per "spend your boldness in one place."
- **Confetti-of-stubs (big win state, optional/stretch)** — if a resolution is a decisive blowout (e.g. closing odds beyond 80/20), a handful of small torn-ticket-stub shapes (reuse the perforated badge edge as a shape) fall and settle — never a generic digital confetti/particle effect.

Everything else — nav, lists, form fields — stays instant and unanimated. One orchestrated motion moment (the Receipt) plus a few small tactile confirmations (stamp-slam, sticker peel) is the full motion budget; resist adding more.

## 9. Migration notes for the existing build

- Replace `--ink`, `--callout-pink`, `--riot-lime`, `--cool-cyan`, `--smoke` CSS variables with `--ticket-cream`, `--soot-ink`, `--cherry-stamp`, `--marigold-ticket`, `--varsity-teal`, `--ash` per §3.
- Swap the odds-bar fill colors from Riot Lime/Cool Cyan to Cherry Stamp/Marigold Ticket; keep the same tween timing already implemented, only the colors change.
- Replace the JetBrains Mono import with Courier Prime; add Anton and Permanent Marker; keep Inter.
- Drop the ✊/🧢 emoji buttons in favor of `icon-on-god.svg` / `icon-cap.svg`.
- Replace the plain-text nav wordmark with `logo-wordmark.svg`.
- Add the grain/halftone texture defs once, globally, per §7.
