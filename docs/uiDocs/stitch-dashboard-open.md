# Stitch prompt — open the wedding

The filled-in dashboard already exists in Stitch. Paste this into that design. Add the three frames below. Do not redraw or replace the filled-in dashboard.

## Scope

A row on `/home` opens one wedding. These frames are that screen on the day it is created. Priya started it as the bride. Rahul is not invited yet. The wedding dates are 12–14 March 2027. The seven events are in order, and each event’s own day, time, and venue is empty.

The same screen has three states. The sidebar stays. Guests, Events, Tasks, and the other links are only a home for later pages. This prompt does not draw those pages.

1. The wedding, just opened.
2. Dates. An admin corrects the first day and the last day.
3. Invite family. An admin invites the groom, or a helper.

`/join/<token>` is the page the invited person opens. It is not drawn here.

## Prompt

```
Add three frames to the existing MakeMyMarriage dashboard. Keep the filled-in dashboard exactly as it is. Do not redraw it.

Same ivory page #F6F3EE, near-black text #1C1917, warm gray #6B6560, bronze #8C6A45, hairlines #E7E1D8. Cards stay surface #FFFCF8, a hairline border, 8px corners, and no shadow. Modern grotesque. English only. Each frame at 1440 wide, and the same frame at 390 wide. No icons. No charts. No avatars. No search. No hamburger.

Header on every frame, full width. Keep the logo already in the header. Do not draw a new icon, and do not redraw the logo. On the right, only “Priya · Log out”.

Under the header, the same quiet left sidebar on every frame. Text links only, stacked, in this order, with a little space between them. No icons, no fill, no pills. Where a line says Admins, that word sits to the right of the link in warm gray, same quiet type, no badge.

- Guests
- Events
- Tasks
- Expenses
- Family
- Invite family    Admins
- Photos
- Invitation    Admins
- Dates    Admins
- Wedding website
- Live stream    Admins
- Weddings

Frame one, the wedding just opened. Every sidebar link is near-black. The main column:

Title: “Priya and Rahul”, with “12–14 March 2027”.

Then the wide events card. Keep the mehendi photograph on the left. Do not crop it, replace it, recolor it, or move it. To the right of the photograph, seven names stacked in this order, near-black, with a little space between them. No times. No venues. No “Next”. No day of the week.

- Roka / engagement
- Haldi
- Mehendi
- Sangeet
- Wedding ceremony
- Reception
- Vidaai

Then five summary cards, one row:

- Guests — 0 — Invited
- Events — 7 — On the schedule
- Tasks — 0 — Open
- Expenses — ₹0 — Spent
- Family — 1 — Helping

On the Family card, under “Helping”, the words “Invite family” in warm gray, then “Admins” in the same warm gray. No form.

Then three detail cards.

- Guests. Yes 0. No 0. Waiting 0.
- Tasks. The title “Tasks”, then one warm gray line: “None yet.”
- Expenses. Budget, with “None yet.” in warm gray. Spent ₹0. Still due ₹0. The thin bronze bar is an empty track: about 3px, fully rounded, track #E7E1D8, no bronze fill.

Frame two, Dates. In the sidebar, “Dates” is near-black. The other links are warm gray. “Admins” stays warm gray beside Invite family, Invitation, Dates, and Live stream. The main column is only the date form. No photograph. No events. No summary cards.

- Title: “Priya and Rahul”
- A small warm gray line: “Wedding dates”
- Label “Start date”, then a field showing “12 March 2027”
- Label “End date”, then a field showing “14 March 2027”
- A bronze button, left aligned: “Save”

The two fields sit side by side. Labels above the fields. Corners about 8px. Fill #FFFCF8. Border #E7E1D8.

Frame three, Invite family. In the sidebar, “Invite family” is near-black. The other links are warm gray. The main column is only the invite form. No photograph. No events. No summary cards.

- Title: “Invite family”, with “Admins” in warm gray to its right
- One warm gray line: “Priya is the bride. Invite Rahul, or the family.”
- Label “Name”, then an empty field
- Label “Email”, then an empty field
- Label “Relation”, then the choices on two rows of quiet boxes. Hairline border, fill #FFFCF8, corners about 8px. “The groom” is selected: bronze border, near-black words, and the word “Admin” in warm gray inside that box. The others are not selected: border #E7E1D8, warm gray words. The choices are “The groom”, “Mother”, “Father”, “Brother”, “Sister”, “Other”.
- A bronze button, left aligned: “Send invite”

Mobile, each frame, 390 wide. The header stays logo left and “Priya · Log out” right. Directly under the header, the same links become one wrapping line of text, in the same order, separated by a little space. No hamburger, no menu icon, no drawer. Use the same near-black and warm gray as that frame’s sidebar. Then the main column, full width. On frame one, the five summary cards sit in two columns, with Family on the next row, and the three detail cards stack full width. The photograph stays on the left of the events card. On frame two, the date fields stack. On frame three, the fields stack and the relation choices wrap. The button is the full width of the column. Text does not overflow.

Do not add a guest table, a task editor, an expense list, a photo grid, a video player, or an event date. Do not add a place, a city, or a venue. Do not show a join page, a token, or an email preview. Do not add vendors, payments, or travel. Do not change the colors.
```
