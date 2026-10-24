# Stitch prompt — dashboard

Follow [typography.md](typography.md) for the approved Outfit + Fraunces font system; it overrides older font-family instructions in this prompt.

For application motion, follow [animations.md](animations.md), including shared desktop/mobile behavior and animation requirements for future workspace features. Its interaction rules take precedence over this older visual prompt.

Stitch already has this dashboard. Paste the update below into that design. Do not start over.

## Scope

This is the signed-in screen for one wedding, Priya and Rahul. It keeps the current ivory layout, the mehendi photograph, and the sample numbers. A quiet sidebar makes every organizer action in version one one click away. Guests, events, and tasks stay the main content. This prompt does not draw the lists or the editors those links open.

The sidebar and the two text controls cover these actions. Admins and helpers can do both, except where the screen says Admins.

- **Guests.** Add a guest, choose that guest’s events, see replies, send the invitation, send a reminder, and retry a failed guest invitation or reminder.
- **Events.** Rename, reorder, and remove an event. Set its date, time, and venue. Share the schedule, or one event, to WhatsApp. Adding an event is the text on the events card, not a separate page.
- **Tasks.** Add a task, assign it, accept it, and share one task to WhatsApp.
- **Expenses.** Set the budget. Add, correct, or remove one line: category, amount, who paid, and what is still due. The card already shows the budget, what is spent, and what is still due.
- **Family.** See the family. **Invite family** invites a helper, or the other admin, by email. An admin can remove a helper, and can retry a failed family invite.
- **Photos.** The one gallery. Add a photo the person has.
- **Invitation.** Admins write the couple’s names and the short message for the one invitation card.
- **Dates.** Admins set the wedding dates. The screen already shows 12–14 March 2027.
- **Wedding website.** The public page.
- **Live stream.** Admins attach a YouTube URL to an event, or clear it. The family watches from Events. Everyone else watches on the wedding website.
- **Weddings.** The home list of this person’s weddings, with dates, and starting another wedding.
- **Log out** stays in the header.

Vendors are not in version one. `prd.md`, `feature-list.md`, `architecture.md`, `api-design.md`, and `database-design.md` never describe a vendor list, a vendor page, or paying a vendor. Caterer and venue are expense categories. A venue is also the place on an event. That is not a vendors feature.

These are not in version one, and this screen does not link to them:

- Payments, and the price of MakeMyMarriage. `architecture.md` has no payment system. `prd.md` and `feature-list.md` leave that price open and keep it out of wedding expenses.
- Guest travel and stay. `prd.md`, `feature-list.md`, `architecture.md`, `database-design.md`.
- A live-streaming server run by MakeMyMarriage. The live stream is a YouTube URL. `prd.md`, `architecture.md`.
- WhatsApp for a guest invitation, a guest reminder, or a guest RSVP. `prd.md`.
- A separate workspace for the bride’s side and the groom’s side. `prd.md`.
- A planner tool for many client weddings. `prd.md`.
- Any wedding tradition other than North Indian Hindu. `prd.md`.
- A second invitation design, or a choice of card themes. `prd.md`.

Sign up, sign in, a forgotten password, the family join page, and the guest’s own card are other screens. They are not added here.

## Update prompt

```
Update the existing MakeMyMarriage dashboard. Keep this screen. Do not redesign it.

Keep the ivory page #F6F3EE, the near-black text #1C1917, the warm gray #6B6560, the bronze #8C6A45, and the hairlines #E7E1D8. Cards stay surface #FFFCF8, a hairline border, 8px corners, and no shadow. Modern grotesque. English only. Desktop 1440 wide, and the same screen at 390 wide. No icons. No charts. No donut. No avatars. No search. No hamburger. No new page on this screen.

Keep the logo already in the header. Do not draw a new icon, and do not redraw the logo. Keep the mehendi photograph exactly where it is. Do not crop it, replace it, recolor it, or move it.

Header, full width. Logo on the left. On the right, only “Priya · Log out”. Nothing else in the header.

Under the header, a quiet left sidebar. Text links only, stacked, in this order, with a little space between them. No icons, no fill, no pills. The link is near-black. Where a line says Admins, that word sits to the right of the link in warm gray, same quiet type, no badge.

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

The main column stays to the right of that sidebar. Do not move what is already there.

Title, as it is now: “Priya and Rahul”, with “12–14 March 2027”.

Then the wide events card, as it is now. The mehendi photograph stays on the left. To the right of the photograph: the small label “Next”, then “Mehendi”, then “Saturday 4:00 pm”. Further on that card: “Sangeet” and “Wedding”. Do not add times, venues, or more events. At the end of that card, add only the words “Add an event” in warm gray. No fill, no border, no icon, no input, no dialog.

Then the five summary cards, one row, same cards as now. Change every “Money” label to “Expenses”. Leave the other words and numbers as they are.

- Guests — 128 — Invited
- Events — 7 — On the schedule
- Tasks — 3 — Open
- Expenses — ₹4,50,000 — Spent
- Family — 6 — Helping

On the Family card, under “Helping”, add the words “Invite family” in warm gray, then “Admins” in the same warm gray. No form.

Then the three detail cards, as they are now. Change the third card’s title from “Money” to “Expenses”.

- Guests. Yes 86. No 12. Waiting 30.
- Tasks. Keep the three rows already on the card. Do not rewrite them, and do not add a row.
- Expenses. Budget ₹12,00,000. Spent ₹4,50,000. Still due ₹80,000. Keep the thin bronze bar: about 3px, fully rounded, track #E7E1D8, bronze filling a little over a third. No other bar.

Do not add Share, a guest table, a task editor, an expense list, a photo grid, a video player, or a family form on this screen. Do not add vendors, payments, or travel.

Mobile, 390 wide. The header stays logo left and “Priya · Log out” right. Directly under the header, the same links become one wrapping line of text, in the same order, separated by a little space. No hamburger, no menu icon, no drawer. Then the title, the events card, the five summary cards in two columns with Family on the next row, then the three detail cards stacked full width. The photograph stays on the left of the events card. Text does not overflow.
```
