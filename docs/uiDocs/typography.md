# Typography — Outfit and Fraunces

Approved by the user on 24 October 2026 after reviewing the font comparison. Read this before changing typography or designing a new screen.

## Decision and status

Use **Outfit** as the default interface font and **Fraunces** for wedding names and selected celebratory headings. This is the approved typography for existing and future screens on desktop and mobile.

This document records the decision and implementation instructions. At approval, `app/layout.tsx` still loads Geist and `app/globals.css` maps `font-sans` to Geist. Creating this document does not apply the new fonts or count as a shipped feature.

This decision overrides earlier UI prompts that request Geist, Inter, Plus Jakarta Sans, a generic modern grotesque, or preserving existing fonts. Other layout, palette, and animation requirements remain unchanged. Do not add Newsreader or Manrope; those were comparison options.

## Where each font belongs

Use Outfit for:

- Navigation, buttons, inputs, labels, validation, toast messages, and account details.
- Dates, times, venues, event names, descriptions, numbers, budgets, and expense amounts.
- Functional headings such as Your weddings, Couple, Invitation, Guests, Events, Tasks, Expenses, Log in, Create an account, and Start the wedding.
- Landing supporting copy, the existing text wordmark, and all ordinary UI text. Preserve the existing logo asset without redrawing its lettering.

Use Fraunces selectively for:

- The couple's prominent names on the wedding dashboard, invitation preview, congratulations card, and future public wedding page.
- The existing landing hero headline, “The wedding, in one place.”
- A primary celebratory heading such as “The wedding is ready.” if it is already present. When couple names are the dominant heading on that card, keep the supporting message in Outfit instead of applying serif to every line.

Wedding-list row names, input values containing names, and compact references to the couple stay in Outfit. Fraunces is a display accent, not the default for every proper name. Do not change copy, add headings, or duplicate messages to demonstrate typography.

## Weights and scale

Use Outfit 400 for body text, descriptions, field values, and ordinary navigation. Use 500 for headings, buttons, selected navigation, and the signed-in name. Use 600 only for a small emphasis that needs it; avoid broad bold styling.

Use Fraunces 500 for the main couple names and hero headline. Use upright text by default, including the word “and”, matching the approved comparison. Italic, handwriting styling, and extra decorative font axes are not required. Do not introduce custom softness or wonk settings without a reviewed visual change.

Starting sizes; adjust only where real content or the existing layout needs it:

- Landing display: Fraunces 48px desktop / 34px mobile, line-height 1.12–1.2.
- Prominent couple names: Fraunces 36–40px desktop / 28–32px mobile, line-height 1.2.
- Invitation/congratulations display: Fraunces 28–36px desktop / 26–30px mobile, line-height 1.2–1.3.
- Functional page headings: Outfit 28–30px desktop / 24–26px mobile, line-height 1.25–1.35.
- Card headings: Outfit 16–18px, weight 500, line-height 1.4.
- Body text and field values: Outfit 14–16px, line-height 1.5–1.65. Prefer 16px for editable fields on mobile to avoid focus zoom where applicable.
- Navigation and buttons: Outfit 14–15px, line-height 1.4–1.5, with existing accessible hit targets.
- Labels and metadata: Outfit 12–14px. Existing ADMINS captions may remain 11–12px with 0.06em tracking and readable warm gray.
- Summary values: Outfit 24–30px, weight 500, line-height 1.2; adapt to keep currency values intact.

Use normal tracking for UI body text; display headings may use subtle negative tracking up to -0.02em. Avoid squeezed lettering and uppercase body copy. Allow long names to wrap naturally rather than shrinking them into unreadable text. Keep dates/currency readable and preserve Indian number grouping. Use tabular numerals for aligned numeric columns where supported; verify the actual font rendering.

## Next.js and Tailwind implementation

Use the existing `next/font/google` integration, with `Outfit` and `Fraunces`. Load fonts once in the root layout, expose CSS variables, and preserve the current providers and body classes. No new font package is needed.

Example font declarations for `app/layout.tsx`:

```tsx
import { Outfit, Fraunces } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

// Attach both .variable values to the existing body className.
// Keep font-sans as the body default; apply font-display selectively.
```

Verify options against the installed Next.js font types. Prefer variable fonts with normal style; do not load unneeded italic faces or additional font families. During build, Google font files must be available to the font loader. Runtime assets are self-hosted by Next.js; do not add a Google Fonts stylesheet link or CSS @import as a second loading system.

In the existing Tailwind v4 `@theme inline` block in `app/globals.css`, use:

```css
--font-sans: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;
--font-display: var(--font-fraunces), Georgia, "Times New Roman", serif;
```

Use `font-display` only on the selected display headings. Do not map the global serif token in a way that unintentionally changes unrelated content. Remove unused Geist imports/variables after replacing them. Search for hardcoded font families and inline overrides before declaring migration complete.

If font downloads are unavailable in the build environment, resolve that constraint or use approved local font files with `next/font/local`, preserving licensing files. Do not silently substitute another family. Keep readable fallbacks while fonts load, and reserve adequate heading space to minimize layout movement.

## Accessibility, motion, and responsive behavior

Keep the ivory, near-black, warm gray, bronze, and existing status colors. Typography must not change permissions, navigation, header behavior, or form labels. The signed-in name remains plain Outfit text with no button container.

Follow [animations.md](animations.md). Font loading must not restart entrances, animate individual letters, or leave text hidden. Respect reduced motion. Preserve semantic heading order, visible focus, browser text selection, and usability at 200% zoom.

English/Latin is the current UI scope. If future features introduce another script, verify font coverage and choose an explicit compatible fallback for that script rather than assuming these fonts contain its glyphs.

## Verification and future features

- Review landing, login, signup, wedding list, setup, congratulations, Dashboard, Couple, Invitation, and toast states.
- Inspect computed fonts to confirm Outfit/Fraunces actually load; a fallback screenshot is not approval evidence.
- Check desktop and 390px mobile, long couple/user names, rupee symbols, full expense amounts, date fields, and 200% zoom.
- Verify headings wrap gracefully, buttons do not clip, forms stay aligned, and changing fonts causes no new horizontal overflow.
- Run typecheck, lint, and production build for the implementation. Check font loading in the production build.
- Apply these same roles and tokens to future features instead of choosing fonts per screen. Existing animation work alone does not authorize a font change beyond this approved system.
- Once the fonts are actually implemented, update **Now** and add a feature entry to **Log** in `docs/project-status.md`. Do not log this documentation-only decision as shipped.

## References

- [Next.js font optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [Outfit on Google Fonts](https://fonts.google.com/specimen/Outfit)
- [Fraunces on Google Fonts](https://fonts.google.com/specimen/Fraunces)

The role assignments and size guidance above are MakeMyMarriage design decisions.
