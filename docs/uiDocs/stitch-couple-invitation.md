# Stitch prompt — Couple and Invitation

Paste this into the existing MakeMyMarriage dashboard. It replaces the Couple frame and the Invitation frame. The header stays. The sidebar gains a Dashboard link, and the form uses the full main column.

## Scope

Dashboard, at the top of the sidebar, returns to this wedding’s overview: the events and the summary cards. Weddings, at the bottom, is the list of this person’s weddings. Those are different.

Couple corrects the bride’s name, the groom’s name, the first day, and the last day. Invitation writes the one short message for the one card.

## Prompt

```
Update the Couple frame and the Invitation frame on the existing MakeMyMarriage dashboard. Keep the header, the logo, and the wedding overview frame. Do not redraw the overview. English only.

The Couple frame as it is now is too tight and too narrow. A small card sits near the sidebar, and the right side of the page is empty. Rebuild both frames so the main column uses the width of the page.

Colors, nothing else:
- Page: warm ivory #F6F3EE
- Text: near-black #1C1917
- Secondary text: warm gray #6B6560
- Bronze: #8C6A45
- Button hover: #74583A, label #FFFCF8
- Hairlines: #E7E1D8
- Cards and fields: #FFFCF8

Cards keep a hairline border, 8px corners, and no shadow. Modern grotesque. Desktop 1440 wide. Mobile 390 wide. No icons. No charts. No avatars. No search. No hamburger. No pills.

Header on both frames. Logo on the left. On the right, only “Priya · Log out”.

Under the header, the page is two columns. The sidebar is about 200 wide, with about 40px of ivory to its left. Then about 56px of ivory between the sidebar and the main column. The main column then runs to about 48px from the right edge of the frame. The sidebar and the form must not sit against each other.

Sidebar, text only, stacked, with space between the links. Add Dashboard as the first link. Remove Dates if it is still there. “Admins” stays in warm gray to the right of Invite family, Invitation, Couple, and Live stream.

- Dashboard
- Guests
- Events
- Tasks
- Expenses
- Family
- Invite family    Admins
- Photos
- Invitation    Admins
- Couple    Admins
- Wedding website
- Live stream    Admins
- Weddings

Dashboard and Weddings are different. Dashboard shows this wedding: the events card, the five summary cards, and the three detail cards. Weddings is the list of this person’s weddings. Clicking Dashboard does not leave the wedding.

Clicking a sidebar link keeps the header and the sidebar. The main column changes.

Motion, on both frames. 180ms, ease-out.

- Hover any sidebar link. The word turns bronze #8C6A45, the word moves 4px to the right, and a 1px bronze line draws from left to right under that word. Leaving reverses it.
- The selected link stays near-black, with the bronze line already drawn, and does not slide. “Admins” never moves and never changes color.
- Hover a bronze button. The fill deepens to #74583A and the button rises 2px. Pressing settles it back.
- Changing the main column. The old column fades out. The new column fades in and rises 8px into place.

Frame one, Couple. “Couple” is selected. Dashboard and the other links are warm gray until hovered. The main column holds one card, and that card is the full width of the main column. It starts about 40px below the header and stretches from the 56px gap to about 48px from the right edge. It is not a narrow card. It is not centered in a field of empty ivory.

Inside the card, padding about 40px:

- Title “Couple” on the left. “Admins” in warm gray on the right of the same line.
- One warm gray line: “The names on the invitation, and the first and last day.”
- A short bronze rule, 48px wide, 1px.
- Then a row of two equal fields, with about 40px between them. Each field is the full width of its half. Label “Bride’s name”, field showing “Priya”. Label “Groom’s name”, field showing “Rahul”.
- Then a second row, the same width and the same gap. Label “Start date”, field showing “12 March 2027”. Label “End date”, field showing “14 March 2027”.
- Then “Save”, bronze, left aligned, with about 28px of space above it. No Cancel.

Labels sit above the fields. Fields are tall enough to type in, about 48px, fill #FFFCF8, border #E7E1D8, corners about 8px. The rows use the full inner width of the card, so the right field ends at the card’s right padding. Empty ivory does not remain inside the card to the right of the fields.

Frame two, Invitation. “Invitation” is selected. The main column is the same width as on Couple, with the same 56px gap after the sidebar and the same 48px page margin on the right. Two equal parts, side by side, about 32px between them. Both parts are the full height of their content. Together they fill the main column. Neither part floats in the center.

Left part, a card with about 40px of padding:
- Title “Invitation” on the left. “Admins” in warm gray on the right.
- One warm gray line: “One card for every guest. The names are corrected on Couple.”
- Label “Message”, then a tall empty field, about six lines, the full width of this card. No sample text inside it.
- “Save”, bronze, left aligned. No Cancel.

Right part, the card they are writing. It fills the right half. Fill #FFFCF8, 8px corners, a hairline, and a second hairline inset by about 12px. No shadow. Padding about 40px. Everything inside is centered:
- One small marigold stem, fine bronze line, a few leaves, a soft ivory-bronze flower. No gold, no glitter.
- “Priya and Rahul”
- “12–14 March 2027” in warm gray
- A warm gray line: “The message appears here.”
- A hairline
- The seven names, small, stacked, near-black: Roka / engagement, Haldi, Mehendi, Sangeet, Wedding ceremony, Reception, Vidaai. No times. No venues.

Mobile, 390 wide, both frames. Header: logo left, “Priya · Log out” right. Under it, the same links wrap on one line, Dashboard first, with the same hover. No hamburger. Then the main column, full width, with about 20px side margins. On Couple, the four fields stack and each field is the full width. Save is the full width. On Invitation, the message card comes first, then the preview card below it, both full width. Text does not overflow. Touch targets are easy to tap.

Prototype. Hover each sidebar link, including Dashboard. Hover Save. Click Dashboard and return the events and the cards, with the column motion. Click Couple and play the column change. Click Invitation and play it again.

Do not add a second card design, a theme picker, a guest name, a place, or an event date. Do not add confetti, balloons, or icons. Do not leave a wide empty region to the right of the form. Do not change the colors.
```
