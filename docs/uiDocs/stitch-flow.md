# Stitch prompt — connect the screens

For application transitions and entrances throughout this flow, follow [animations.md](animations.md), including the home wedding list, setup, account screens, landing, and future features. Navigation destinations remain defined below.

Paste this into the Stitch project that already has these screens. It only wires clicks. Do not redraw a screen, and do not add a screen.

## Prompt

```
Connect the existing MakeMyMarriage screens into one prototype. Do not change layout, color, type, copy, or images. Do not add a frame. English only. Wire the desktop frames. Give the mobile frames the same links as the desktop frame of that screen.

Use only these screens, by the titles already on them:

- Landing
- Log in
- Create account
- Start the wedding
- The wedding is ready
- Your weddings, if that frame is already in the file
- Dashboard, the overview with the seven events and the summary cards
- Couple
- Invitation
- Invite family, if that frame is already in the file

If Your weddings is not in the file, send every link that names it to Dashboard instead. If Invite family is not in the file, leave that sidebar link unwired. Do not design either one.

A new person, in this order:

1. Landing. “Start a wedding” in the header, and “Start a wedding” in the hero, both open Create account.
2. Landing. “Log in” opens Log in.
3. Create account. “Create account” opens Start the wedding.
4. Create account. “Log in” opens Log in.
5. Start the wedding. “Start the wedding” opens The wedding is ready.
6. The wedding is ready. “Continue” opens Your weddings.
7. Your weddings. The row “Priya and Rahul” opens Dashboard.

Someone who already has an account:

8. Log in. “Log in” opens Your weddings.
9. Log in. “Create an account” opens Create account.
10. Log in. “Forgot password” stays unwired. Do not add a page for it.

Inside the wedding, the header and the sidebar stay, and the main column changes:

11. Dashboard, Couple, Invitation, and Invite family. “Dashboard” in the sidebar opens Dashboard.
12. “Couple” opens Couple.
13. “Invitation” opens Invitation.
14. “Invite family” opens Invite family, when that frame exists.
15. “Weddings” opens Your weddings.
16. The logo on Landing, Log in, and Create account opens Landing.
17. The logo on every signed-in screen opens Your weddings.
18. “Log out” opens Landing.

Save does not leave the screen. “Save” on Couple stays on Couple. “Save” on Invitation stays on Invitation. “Send invite” stays on Invite family.

These sidebar links have no screen yet. Leave them unwired. Do not invent a page for any of them: Guests, Events, Tasks, Expenses, Family, Photos, Wedding website, Live stream.

The filled-in dashboard, the one with guests and a time on Mehendi, is not part of this path. Leave it unwired.

Play the prototype from Landing. Start a wedding, create the account, start the wedding, continue, open the row, then open Couple, then Dashboard, then Invitation, then Weddings, then Log out.
```
