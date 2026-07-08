SUPERSEDED 2026-07-08 — workflow retired; passes now run through the committed repo and Code sessions. Retained as record.

# Imbas Landing — Cursor Pass Pack (pre-launch)

Scoped, paste-ready prompts for the landing-page audit fixes. Ordered certainty → experiment
(copy/structure first, visual last), matching the locked Cursor discipline.

**Use the same guardrails every pass — paste this preamble before any prompt below:**

> Make ONLY the change described. Do not touch any other section, style, copy, or behavior.
> If you find yourself editing a file or selector not named here, stop and ask first.
> Before committing: send me a screenshot of the changed area rendered in the browser
> (not the diff, not a Puppeteer claim — an actual rendered screenshot). One commit, this change only.

---

## Pass A — Restore locked origin line (text, zero risk)

> In the Origin / Field Notes section, replace the origin inscription text exactly.
> FROM: "Imbas. From the old Irish: illumination of knowledge & enlightenment."
> TO:   "Imbas. From the old Irish: illumination, sudden knowing, knowledge brought to speech."
> Keep all current treatment (centered, italic Fraunces, spacing, aurora bloom, ember particle).
> Only the text changes. Allow the longer line to wrap naturally. Nothing else.

---

## Pass B — Insert the stakes beat after the hero (text/structure)

> First, confirm whether the page already contains a "stakes" paragraph between the hero and the
> "measurable record" bridge. If it does NOT, add a new section immediately after the hero,
> before the bridge, containing exactly this copy as the section body (no heading, large readable
> body type, its own breathing room):
>
> "AI is going to be making a huge amount of our decisions, or being consulted on them — a layer
> over nearly all of society. We know very little about how it thinks or behaves, and it's changing
> every day. That's what Imbas is here to help with."
>
> Match existing typography tokens. Keep it short and quiet — one quick hit, not a hero. Do not
> restyle the hero or the bridge. If the beat already exists, change nothing and tell me where it is.

---

## Pass C — Reorder "How Imbas Works" below the Volunteer Gap (structure only)

> Move the entire "How Imbas Works" five-beat section so it appears AFTER the "Three signal patterns"
> (Omission / Framing Drift / Deflection) section, before "Roadmap". Reason: it references "what
> surfaced and what didn't" before the Volunteer Gap is defined. This is a pure reorder — move the
> existing block, change no copy, no styles, no markup inside it. Re-number section labels only if
> they are hardcoded; otherwise leave numbering alone. Screenshot the new order top-to-bottom.

---

## Pass D — Soften the hero CTA button (small visual)

> The hero email submit button currently uses a saturated solid-orange fill, which conflicts with the
> site's "no saturated CTA buttons" rule and reads as a stock web form. Restyle ONLY this button to a
> restrained editorial treatment: warm-cream text/border on transparent or near-transparent fill,
> warm ember (#B46A5A) on hover only. Keep the email input, layout, label, and copy unchanged.
> Do not touch any other button or link on the page. Screenshot the hero before commit.

---

## Pass E — Global legibility tokens (kills the recurring small-text bug)

> Add global CSS custom properties and apply them site-wide instead of per-section patches:
>   --text-min-desktop: 14px;  --text-min-mobile: 13px;
>   --mono-min: 13px;          --text-min-opacity: 0.65;  --mono-min-opacity: 0.7;
> Audit EVERY text element on the page. Any body/microcopy/mono label below these sizes or opacities
> gets raised to the minimum. Pay specific attention to: hero email microcopy, archive scoring text,
> all // MONO labels, Case 005 finding text. Do not change layout, color hue, or copy — only size and
> opacity where they fall below the floor. List every element you changed, with before/after values.

---

## Pass F — Temperature relationship in the base palette (the big alive-win)

> The page currently reads monochrome-cool (navy) with warm accents painted on top, which looks flat.
> Establish a real temperature relationship in the BASE, not as accents. Two options — implement
> option 1 unless it breaks contrast: (1) warm the base background toward deep umber (#2A211E /
> #312722) and let the navy sections become the cool *contrast*, so warmth is the ground and cool is
> the counter; carry a faint warm undertone through the cool middle so the page reads as one lit field
> rather than warm→cool→warm. (2) If contrast suffers, instead push the navy genuinely deep-cool and
> make the warm ember accent truly pop against it. Change background/surface tokens only — do NOT
> restyle text, components, or layout. Screenshot hero, Volunteer Gap, and Archive so I can see the
> middle no longer goes generic-cool.

---

## Pass G — Rebuild the aurora as a real moving warm-cool field (experimental)

> Replace the current aurora background. Requirements:
>   - Implemented as 2–3 large blurred radial-gradient layers animated on transform/opacity only
>     (GPU-friendly), NOT background-position. It must visibly, slowly drift/breathe.
>   - Warm palette bleeding into a deep cool base. NEVER teal/purple. Mostly dark; the color event
>     is concentrated in ONE region per section, not wall-to-wall.
>   - Motion is slow and organic (think observed weather, ~20–40s cycles), never fast or strobing.
>   - prefers-reduced-motion: fall back to a single STATIC warm gradient. Mobile-first; verify no jank.
>   - Per-section intensity via IntersectionObserver: opacity multiplier ~0.7 → 1.0 → 0.85 as a
>     section enters viewport center. Differentiate sections by LIGHTING, not new colors.
> Keep it behind a single contained layer between background and content. Send a short screen recording
> or 3 frames ~5s apart so I can confirm it actually moves. Commit only after I approve the motion.

---

## Pass H — Firefly detection event on the Volunteer Gap line (experimental)

> In the Volunteer Gap section, add a single firefly/antenna blink that lands ON the phrase
> "what it leaves out" as that line resolves. One warm ember point, sharp against the soft aurora —
> it should be the only crisp element in the section. Slightly sharper flare than a hero blink (this
> is the payoff, the detection event with a referent). Slow, lonely timing; loops infrequently.
> prefers-reduced-motion: render it static and dim. Do not add any other animation to this section —
> keep it mostly still and dark so the one blink reads. Screenshot/clip the blink before commit.

---

## Pass I — Animate the drift diagram from the origin (experimental, earns itself)

> The thesis drift diagram should draw on scroll-in: both lines originate from the shared ORIGIN node
> and draw outward to INTENDED (cool, up) and DRIFT (warm, down); labels resolve at the endpoints.
> Emphasize the origin ANGLE — the narrowness of the initial split is the whole point (small angle →
> big end divergence), so make the shared origin tight and prominent. Fix the ORIGIN label currently
> hidden behind the node circle. Keep DRIFT warm vs INTENDED cool. prefers-reduced-motion: show the
> final drawn state, no animation. Change only this diagram. Screenshot mid-draw and final.

---

## Pass J — Bridge anchor + Signal-card highlight fix (visual cleanup)

> Two unrelated small fixes, separate commits:
> (J1) The "measurable record" bridge is two symmetric text boxes with no visual anchor and reads flat.
>      Make it asymmetric: left column the thesis line at larger weight, right column the supporting
>      text smaller/secondary — OR give it the drift diagram as a visual anchor if that's cleaner.
>      Copy unchanged; restructure layout only. Screenshot before commit.
> (J2) In the "Three signal patterns" row, the first card (Omission) has a filled highlight box that
>      looks like a stuck hover state. Remove the persistent highlight so all three cards share the
>      same resting state; highlight on hover only. Strengthen the three glyphs if they read too faint.
>      Screenshot all three cards at rest.

---

## Pass K — Fix the hero CTA frame (small visual)

> The hero "TRY IMBAS" button is sitting inside a wide empty dark bordered box — leftover styling from the old email form, which left `.hero__capture` wearing its input-field costume (border, glass background, blur, full width, left padding). In styles.css ONLY, strip that box so the lone button stands on its own, centered. No HTML change.
>
> 1. Replace the `.hero__capture` rule with exactly:
> `.hero__capture { display: inline-flex; width: auto; max-width: 100%; }`
>
> 2. Delete the `.hero__capture:focus-within` rule entirely (no box left to highlight; it re-adds a blue background on focus).
>
> 3. Replace the `.hero__capture button` rule with exactly:
> `.hero__capture button { background: #B46A5A; color: var(--ink-luminous); border: 1px solid #B46A5A; border-radius: 2px; font-family: var(--font-mono); font-size: clamp(0.7rem, 1.5vw, 0.8rem); letter-spacing: 0.18em; text-transform: uppercase; padding: 0.95rem 2.4rem; cursor: pointer; font-weight: 500; transition: background .25s ease, border-color .25s ease, transform .25s ease; white-space: nowrap; }`
>
> 4. In the `@media (max-width: 680px)` block, delete these now-obsolete rules: the `.hero__capture { flex-direction: column; align-items: stretch; padding: ...; gap: ...; }` rule, the `.hero__capture button { align-self: center; width: auto; max-width: 100%; }` rule, the `.hero__capture { padding: 0.4rem 0.55rem; }` rule, and the `.hero__capture input[type="email"] { ... }` rule.
>
> Leave `.hero__capture button:hover` and `:active` as-is. Result: a single ember TRY IMBAS pill, centered, with no surrounding frame. Screenshot the rendered hero at desktop and ~375px before commit — not the diff. One commit, this change only. Do not commit until I approve.

---

## Pass L — Security headers via vercel.json (deploy config, no page changes)

> Create a NEW file `vercel.json` at the repo root with EXACTLY the content below. Do
> not modify any .html, .css, .js, or the /api function — this pass only adds the host
> header config. The CSP is per-route on purpose: `/workbench.html` gets a relaxed block
> (it loads React/Babel from cdnjs and compiles in-browser, needing `unsafe-eval` +
> cdnjs); every other path gets the near-strict block. The two `source` patterns are
> mutually exclusive (the catch-all uses a negative lookahead so the workbench never
> receives two CSP headers). `'unsafe-inline'` is present because every page has an
> inline `<script>` (nav menu / scroll-reveal) and a few inline `style=` attributes —
> this is intentional for launch; see DEPLOY.md for the optional strict-`'self'` upgrade.
> HSTS is intentionally omitted until HTTPS on the custom domain is confirmed.
>
> File content:
>
> ```json
> {
>   "$schema": "https://openapi.vercel.sh/vercel.json",
>   "headers": [
>     {
>       "source": "/workbench.html",
>       "headers": [
>         { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://imbaslabs.com/briefing/members/api/send-magic-link" },
>         { "key": "X-Content-Type-Options", "value": "nosniff" },
>         { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
>         { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" }
>       ]
>     },
>     {
>       "source": "/((?!workbench\\.html).*)",
>       "headers": [
>         { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://imbaslabs.com/briefing/members/api/send-magic-link" },
>         { "key": "X-Content-Type-Options", "value": "nosniff" },
>         { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
>         { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" }
>       ]
>     }
>   ]
> }
> ```
>
> Verification (headers don't render, and they only take effect on a Vercel deploy — not
> a local file open or local static server). On a Vercel PREVIEW deployment, with DevTools
> open: (1) load `/` — confirm the nav menu opens and scroll-reveals fire, with ZERO CSP
> violations in the Console; in Network → the document request → Response Headers, confirm
> `Content-Security-Policy` shows `script-src 'self' 'unsafe-inline'` (no eval, no cdnjs).
> (2) Load `/workbench.html` — confirm the workbench renders (React mounts, both modes
> work), ZERO CSP errors in Console, and its CSP header shows `'unsafe-eval'` + cdnjs.
> Send me those two Console panels + the two response-header views (not a claim that it
> works — the actual DevTools output). One commit, this file only. Do not commit until I approve.

---

## Notes carried from your own locked decisions
- Aurora's one real risk is looking like a generic premium-dark AI template — restraint + the firefly
  being the only sharp thing is what keeps it yours. Loud aurora loses the instrument feel.
- "Mythic front door, rigorous back room." The Archive/Institutions credibility only pays off if a
  visitor reaches it — fixing the cool-middle sag (Passes F/G) is what gets them there.
- Verify stat consistency before launch: "25 cases · 250+ captures" should reconcile with your
  per-case capture count, and "recorded" should be defensible vs "validated."
- Discipline that's been violated before: Cursor reports done on things that don't render. Trust the
  rendered screenshot, not the diff or the Puppeteer claim. One change per commit.
