# Stitch prompt — dashboard polish and motion

For the approved Outfit + Fraunces font system, follow [typography.md](typography.md). It supersedes this prompt's older instructions to retain existing fonts.

For application implementation, follow [animations.md](animations.md). Its approved per-section panel entrances supersede the older replay/timing instructions in this design prompt. Stitch changes are unnecessary for that implementation.

Approved direction, 24 October 2026. Apply this to the existing Dashboard, Couple, and Invitation designs and their mobile counterparts. This specification replaces the earlier dashboard-life prompt. It retains existing fonts and supersedes older shared header, sidebar, and motion instructions. Existing content and form requirements still apply.

## Prompt

```text
Refine the existing MakeMyMarriage Dashboard, Couple, and Invitation screens into one consistent premium experience. Produce desktop layouts at 1440px and genuine mobile layouts at 390px, with working interaction previews where supported.

VISUAL DIRECTION
Preserve the current fonts, photographs, logo, content, and minimal wedding aesthetic. Use spacing, hierarchy, alignment, and restrained motion to improve the experience.

Keep the existing palette:
Page #F6F3EE; surface #FFFCF8; primary text #1C1917; secondary text #6B6560; bronze #8C6A45; existing bronze hover #74583A; hairlines #E7E1D8.

Keep fine borders and 8px corners. Preserve existing success/error colors in toast components. Avoid additional decoration, gradients, glass effects, oversized shadows, animated backgrounds, bouncing, and continuous motion.

SHARED HEADER
Show the existing signed-in person's name as plain medium-weight near-black text directly on the header background. Remove its enclosing surface, border, rounded corners, and button-like padding. Use the name already shown in the design.

The name is informational. Give it a default cursor and no hover lift, avatar, dropdown arrow, role label, or new menu. Keep Log out as a separate quiet action, 16px away, with bronze hover feedback and a visible keyboard focus outline. On mobile, truncate long names gracefully while keeping Log out accessible. Preserve the logo and comfortable header proportions.

SHARED SIDEBAR
Use consistent navigation across all three screens. Dashboard is the first link and returns to this wedding's overview. Couple replaces Dates. Weddings opens the home wedding list. Retain the remaining existing labels and order.

Align admin-only captions in a separate right-hand column with at least 16px between label and caption. Use ADMINS, 11–12px, medium weight, letter spacing about 0.06em, existing warm gray #6B6560. Distinguish these captions through size, alignment, and tracking while keeping readable contrast. Captions remain stationary and are not separate actions.

Enabled links turn bronze on hover and draw a fine bronze underline over 160–180ms ease-out. At most 2px of horizontal movement. Selected links remain near-black with the bronze underline. Move the active indicator smoothly between existing sections without changing layout width or overlapping the hover indicator. Provide visible keyboard focus independent of hover.

Unavailable future destinations stay unavailable. Do not wire unfinished links to Dashboard or invent pages for them.

SECTION TRANSITIONS
Clicking Dashboard, Couple, or Invitation replaces the main content while the header and sidebar stay steady.

Fade outgoing content from opacity 1 to 0 over 100ms. Then fade incoming content from opacity 0 and translateY(6px) to opacity 1 and translateY(0) over 200ms ease-out. Avoid horizontal sliding, page scaling, flashing, and layout jumps.

Clicking the current section does not restart animation. Rapid switching resolves to the last selected section without overlapping panels or trapping input. Returning to Dashboard uses the short section transition, rather than replaying the complete dashboard entrance.

FIRST DASHBOARD ENTRANCE
On first opening the wedding, reveal the couple's title and dates, then events, then summary cards, then detail cards. Use opacity and a maximum 6–8px rise over 200–240ms, with approximately 30ms stagger. Group lower cards so the entire sequence finishes within 500ms. Show accurate values immediately; avoid counting numbers up.

Keep the couple's names in the current typeface with clear title weight and balanced spacing from dates and events. Do not add a greeting, illustration, subtitle, or ornament.

CARDS AND SPACING
Informational cards remain steady on hover with a default cursor. Only an existing card with a real destination receives a maximum 2px hover lift and a soft shadow: 0 8px 24px rgba(28,25,23,0.06), over 180ms ease-out. Give it equivalent visible keyboard focus. Do not turn every card into a button or invent destinations.

Keep desktop expense amounts on one line. Adjust grid sizing or value font size carefully without truncating financial values. Remove the unnecessary mobile blank gap above the couple's names. Keep comfortable separation between sidebar and content and consistent spacing between cards.

COUPLE AND INVITATION
Retain the full-width Couple form and the existing Invitation editor and preview. Apply the same header, sidebar, transitions, and button states to both. Keep existing fields, names, dates, messages, and permissions. Save stays in the current section.

BUTTONS AND FIELDS
Primary buttons transition from #8C6A45 to #74583A on hover over 160–180ms, with at most a 1px lift. Pressing settles them back. Provide visible keyboard focus. Loading preserves button width and prevents repeat submission; disabled controls do not lift on hover. Preserve existing save feedback and toast behavior.

Fields use a clear bronze focus border and accessible focus outline using the existing palette. Keep labels above fields. Avoid moving labels, shaking forms, and decorative focus glows.

MOBILE AND ACCESSIBILITY
Create actual 390px layouts rather than stretched desktop screens. Keep the existing mobile navigation approach usable, with no large blank gaps, page overflow, or overlapping header elements. Stack forms and preview panels as needed. Aim for 44px touch targets.

Touch controls provide immediate press feedback without depending on hover. Respect prefers-reduced-motion: remove translation, lift, and stagger, and display content immediately or with a brief opacity change. Keep every action usable when motion is disabled.

REVIEWABLE OUTPUT
Show Dashboard, Couple, and Invitation with their mobile counterparts. Demonstrate resting, hover, selected, focus, and pressed states. Connect Dashboard → Couple → Invitation → Dashboard. Build these transitions into the interactive preview where supported. If an effect cannot work in the preview, describe that limitation clearly in the handoff.

Preserve the palette and minimal content. Avoid extra features, decorative badges, new menu items, and replacement imagery.
```
