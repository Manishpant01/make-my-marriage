# Animation implementation guide

Typography is defined in [typography.md](typography.md): Outfit for the interface and Fraunces for selected wedding display text. Older instructions below to preserve fonts do not override that approved typography decision.

Approved direction: 24 October 2026. Read this before implementing animation on any MakeMyMarriage screen, including future features. Apply the same behavior on desktop and mobile.

## Status and scope

Motion for React is now installed (`motion` in `package.json`). Dashboard, Couple, and Invitation already use it for section transitions and panel entrances; see `docs/project-status.md` for shipped scope. The wedding list, setup, account, landing, and celebration behaviors specified below are implementation requirements, not claims that those animations have shipped. Inspect the current components before changing or duplicating existing effects.

Implement the effects directly in the application; another Stitch design is unnecessary. Preserve the existing layout, fonts, colors, content, permissions, and plain-text signed-in name. Follow `stitch-dashboard-life.md` for visual styling. This guide takes precedence over its older timing and replay instructions: cards should enter whenever a different section opens, including a return to Dashboard.

## Library and installation

Use **Motion for React**, package `motion`, with imports from `motion/react`.

```sh
npm install motion
```

The dependency already exists; installation above is reference for a checkout that lacks it. Reuse it rather than reinstalling or adding another library. Use the repository's package manager and lockfile; do not create a second lockfile or install both `motion` and `framer-motion`.

Typical client-side imports:

```tsx
"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
```

Motion's documented minimum is React 18.2. Check compatibility with the project's installed React and Next.js versions during installation. Use the installed package's TypeScript definitions rather than copying examples from a different version.

Keep data fetching and permission checks on the server. Introduce small client animation boundaries that accept serializable props or server-rendered children. A client wrapper does not require converting the dashboard's data fetching into client-side fetching.

## Shared behavior

The default entrance is opacity 0 → 1 and translateY 8px → 0 over 220ms ease-out. Use at most 40ms stagger between meaningful content groups and finish normal above-the-fold sequences within 500ms. A delayed image may use the specific timings below. Every delay is measured in seconds in Motion props: 40ms is `0.04`.

Run entrances once per genuine page/section entry. Do not replay on typing, validation, saves, filtering, pagination updates, image decoding, resizing, or unrelated rerenders. Preserve native navigation, focus, form submission, and browser history. Page transitions must not postpone navigation just to animate; use coordinated exits only where a persistent, working boundary already exists.

Below-the-fold landing sections may reveal once on approaching the viewport, without hiding essential content or making users wait. Reuse existing loaded imagery and dimensions; animation must not defer image fetching or intentionally worsen the largest contentful paint. For cached or slowly loaded images, avoid flicker and repeated entrance effects.

## Wedding workspace behavior

- Keep the header and both desktop/mobile navigation outside the animated content boundary.
- Opening Dashboard, Couple, or Invitation animates only the right-hand content.
- Fade the outgoing section over 100ms. After navigation commits, reveal the incoming panels with opacity 0 → 1 and translateY 8px → 0 over 220ms, ease-out.
- Stagger sibling panels by 40ms. Keep normal entrance sequences within approximately 500ms; group later panels when needed rather than extending delays across a long list.
- Replay card entrances when entering a different section. A click on the current section, a save, a validation error, a data refresh, or an unrelated rerender must not replay them.
- Initial opening of any section also plays its entrance. Loading data and entering content are different states: show real loading UI while waiting for data; do not add artificial network delays to demonstrate animation.
- Rapid navigation ends on the last selected destination. Do not leave invisible content, overlapping interactive forms, or a blocked interface.

## Animation units

Dashboard order:

1. Couple's title and dates as one unit.
2. Events card as one unit. Avoid separately staggering the seven event rows.
3. Each of the five summary cards, in reading order.
4. Each of the three detail cards, in reading order.

Use grouped scheduling so the last card starts no later than about 280ms after the incoming section mounts. One option is title at 0ms, events at 40ms, summaries at 80/120/160/200/240ms, and all three detail cards at 280ms. Each card still receives its own opacity/translation animation; nesting the final group keeps the total at 500ms.

Couple: animate the complete form panel once. Keep labels, fields, errors, and Save together.

Invitation: animate the editor panel, followed by the preview panel 40ms later. Retain that order when stacked on mobile. Typing in the message must not remount the preview animation.

## Wedding home list — `/home`

- Reveal “Your weddings” first, followed by the wedding list. Animate each row with the default fade/rise in reading order, 40ms apart, capping the last row's delay at 240ms. Additional rows can share that final delay rather than extending the sequence.
- Keep the account header steady. Rows retain their existing links, hover surface, focus outlines, names, and dates. Since rows share a bordered list, avoid lift/shadow effects that break its continuous edges.
- Use wedding IDs as keys. Refetching, correcting names/dates, or adding a wedding must not replay the entire list. A newly inserted row may receive one local entrance without moving focus or resetting existing rows.
- The no-weddings branch currently shows `StartWeddingForm`; apply the setup behavior below rather than inventing an extra empty-state screen.
- Desktop and mobile use the same timings and reduced-motion rules. Adapt wrapping and spacing to the layout, rather than adding a desktop-only effect.

## Wedding setup — names, dates, and role

- On entering setup, reveal the title/description, then the existing photograph, then the form as one coherent panel. Suggested starts: 0ms, 40ms, 80ms. Use the default 220ms fade/rise.
- Keep name fields, wedding dates, bride/groom choice, validation, and submit button together. Do not stagger individual controls or animate a calendar popup; leave native date-picker behavior intact.
- Role selection can transition its existing border/text colors over 160ms. A selection, date edit, failed save, or retry never restarts the page entrance or clears user input.
- Maintain fixed image dimensions/aspect ratio and the existing crop. Keep typing and submit actions usable immediately.
- On successful creation, retain the existing route to the congratulations screen.

## Log in and sign up

- Reveal the form heading and fields together as one panel with the default fade/rise. Do not delay password fields, autofill, or the submit action individually.
- On desktop, softly fade the existing photograph in over 300ms with a 60ms delay. Keep its crop, dimensions, and position unchanged. This is a one-time opacity effect, not a zoom or sliding half-page.
- If the mobile design omits the photograph, omit that effect too. If it includes one, use the same short fade without delaying form interaction.
- Preserve the current transitions between login/signup URLs, errors, password-manager behavior, and any forgot-password affordance. Invalid credentials, validation, and retries do not replay entrances.
- Use existing button hover/press/focus patterns. No shake, animated error text, or additional decoration.

## Public landing page

- Reveal the hero headline, supporting copy, and call to action as one group with the default fade/rise.
- Fade the existing hero photograph in over 320ms with an 80ms delay. Keep the image stationary with its existing crop and reserved dimensions. Do not delay loading the asset, zoom it, or add parallax.
- Keep the logo/header steady. The call to action remains immediately operable, including during the image fade.
- Reveal each existing lower section (Events/Guests/Family, task sample, coming-up list) as a meaningful group once as it approaches the viewport, using the default effect. Long sections must not create a chain of delayed rows. Returning up the page does not replay them.
- Preserve all existing content and imagery on desktop/mobile. No new illustration, carousel, countdown, or animated background.

## Wedding created / congratulations

- Reveal the existing congratulations card as one panel with the default effect. Keep its ornament, names, dates, message, and Continue button together.
- Preserve the current Continue destination. No delayed button, confetti, looping ornament, or extra success screen.

## Rules for upcoming features

Animations are part of the acceptance criteria for future Guests, Events, Tasks, Expenses, Family, Invite family, Photos, Invitation, wedding website, and live-stream screens when those features are implemented. Their mention here does not authorize building them now.

- Reuse the shared animation primitives and timing tokens instead of introducing another animation library or screen-specific timing systems.
- Enter each new screen's title, main panels, and cards using meaningful groups. Cap stagger on long lists; never animate hundreds of rows sequentially.
- Forms enter as one panel. If a feature already requires a dialog or sheet, provide a brief 160–200ms fade with at most 6px movement, focus management, and reduced-motion handling. Animation is not a reason to add a dialog.
- New local list items may enter once; edits, filtering, sorting, pagination, and refetches do not replay the whole page. Avoid animating destructive removals in a way that delays confirmation or hides failure.
- Photo grids reveal at the grid/group level; image downloads must not keep restarting it. Leave video players steady and do not autoplay media as part of an entrance.
- Add loading/error/empty states with the feature's real behavior. Animation never replaces progress or success feedback. Maintain accessibility and readable server-rendered content.
- Preserve header/navigation identity when changing sections. Document exceptions and actual shipped scope in the relevant feature docs; apply motion to both desktop and mobile.

## Integration with the existing app

Review these files before editing:

- `components/wedding-dashboard.tsx`: server-rendered workspace and content branches.
- `components/wedding-motion.tsx`: current Motion-based navigation coordination and section exits.
- `components/wedding-panel.tsx`: existing `WeddingAnimationScope`, `WeddingSection`, and `WeddingPanel` primitives.
- `components/use-workspace-reduced-motion.ts`: existing preference handling; inspect for reuse outside the workspace.
- `components/wedding-navigation.tsx`: active navigation and section links.
- `components/couple-form.tsx` and `components/invitation-panel.tsx`: preserve form state and save behavior.
- `app/home/[weddingId]/page.tsx`: current route and query handling.
- `app/globals.css`: current CSS hover/focus and reduced-motion rules; check for any legacy animation rules before migrating an element.
- `app/home/page.tsx`: wedding list and the no-weddings setup branch.
- `components/start-wedding-form.tsx` and `components/auth-forms.tsx`: setup and account forms.
- `app/page.tsx`, `app/login`, `app/signup`, and `app/home/created`: public, account, and congratulations entry points.

Sections currently use `/home/<weddingId>` and `?section=couple` / `?section=invitation`. Preserve URLs, permissions, browser history, direct links, and modified-click behavior. Replacing route navigation with local tabs is not required.

Give the content animation boundary a stable identity derived from wedding ID and section, for example `${weddingId}:${section ?? "dashboard"}`. Do not key that boundary by names, dates, invitation text, timestamps, or fetched object identity. Existing inner form keys may still serve a separate state-reset purpose; inspect them before changing them.

Create reusable client primitives for section and panel animation. Define variants outside render where practical. Parent variants can coordinate children; per-panel delays can implement the bounded dashboard schedule above. Use stable event/card IDs as list keys.

For exit animation, `AnimatePresence` must remain mounted while its keyed direct child changes. `mode="wait"` can sequence one outgoing section and one incoming section. A presence boundary inside a route subtree that is itself removed cannot retain the outgoing screen.

Verify whether the current server route structure preserves that boundary. If not, either place it in an appropriate persistent client boundary or retain coordinated navigation in `WeddingMotion`, using Motion controls to complete exit before `router.push`. Support browser back/forward and direct loads even if those paths only receive an entrance. Never claim an exit works just because `AnimatePresence` appears in the JSX.

Avoid storing stale copies of server-rendered forms solely to animate exits. Outgoing controls must not accept submissions during exit. New route content must retain fresh server props and authorization checks.

Reuse the current Motion implementation. For any remaining legacy effects, remove or scope their old owner so Motion, CSS keyframes, and direct Web Animations API calls do not animate the same opacity/transform simultaneously. Keep CSS hover/focus styles that work correctly and do not conflict. Add shared primitives with semantic HTML support where needed: a wedding row must stay a valid `li` inside `ul`, rather than inserting invalid wrapper elements.

Do not translate both the entire incoming section and its nested panels: that compounds the movement. The section can own exit opacity; individual panels own entrance opacity and translation. Do not apply one shared stagger across every descendant field or text node.

## Interaction and visual rules

- Use opacity and transform for entrances. Avoid animating height, width, margins, or top/left on whole sections.
- Keep card dimensions and grid spacing stable. Avoid clipping focus outlines with animation wrappers.
- Informational cards keep a default cursor and remain steady on hover.
- Only cards with existing destinations may lift up to 2px with the approved soft shadow over 180ms. Never invent a destination to justify an effect.
- Buttons retain bronze hover feedback over 160–180ms and at most a 1px lift. Disabled/loading controls do not lift; preserve button width and duplicate-submission protection.
- Keep visible keyboard focus and immediate touch press feedback.
- Keep the signed-in name plain, medium-weight text: no button container or animation.
- Avoid count-up values, springs with overshoot, looping effects, image zoom, parallax, and decorative animation.

## Reduced motion and resilience

Use `MotionConfig reducedMotion="user"` for the animation scope and `useReducedMotion()` to explicitly remove stagger and translation. Automatic reduced-motion configuration does not remove every opacity transition or delay.

With reduced motion enabled, show content immediately or use a single opacity change of at most 100ms, with no stagger or hover lift. Honor preference changes while the app is open. Keep existing CSS reduced-motion handling for CSS-owned interactions.

Server-rendered content must remain readable if JavaScript fails. Do not leave initial SSR markup permanently at opacity zero waiting for hydration. Choose an enhancement strategy that starts hiding/animating only after the client is ready, and verify slow hydration does not cause a flash or hide usable content.

Keep navigation and form input responsive during animation. Preserve scroll behavior and keyboard focus sensibly across section changes; never move focus on hover or steal focus on save. Handle canceled navigation and interrupted animation without leaving opacity zero. Clean up controls/listeners on unmount.

## Verification before calling this implemented

- Open Dashboard, Couple, and Invitation directly; check the entrance on each.
- Check `/home` with zero, one, and many weddings, including returning from a wedding and refetching corrected details.
- Check setup, login, signup, landing, and congratulations on desktop and mobile. Verify autofill, date inputs, role selection, validation, submit, and Continue without replay or lost input.
- Check landing images cached, loading slowly, and failing to load. Confirm reserved dimensions, usable calls to action, and no delayed image request. Lower sections reveal only once while scrolling.
- For future screens, verify panel grouping, bounded long-list stagger, and local updates before marking the feature complete.
- Follow Dashboard → Couple → Invitation → Dashboard and confirm each intended panel rises gently into place.
- Confirm the header/sidebar stay steady and cards do not move twice through nested transforms.
- Repeat-click the active link, save valid data, trigger validation, and refresh data: entrances must not restart.
- Switch rapidly and use browser back/forward, modified clicks, and keyboard navigation. Verify the final URL, selected link, and content agree.
- Test desktop and 390px mobile layouts, long names, large currency amounts, and the stacked invitation layout.
- Enable reduced motion, including while the page is open; verify no translation, lift, or stagger remains.
- Check hydration, unavailable JavaScript, and interrupted navigation for invisible content or lost form input.
- Run the project's typecheck, lint, and production build when implementing. Add targeted tests only where they cover meaningful navigation/state behavior; do not assert every animation frame or delay.

After the library and behavior land in the codebase, update **Now** and add the corresponding **Log** entry in `docs/project-status.md`. Creating this guide alone is not a feature log entry.

## Official references

Checked 24 October 2026:

- [Installation and Next.js setup](https://motion.dev/docs/react-installation)
- [Animation and variants](https://motion.dev/docs/react-animation)
- [AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [Accessibility and reduced motion](https://motion.dev/docs/react-accessibility)

These references document the library APIs. The timing, replay, and grouping rules above are MakeMyMarriage product decisions.
