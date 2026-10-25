# MakeMyMarriage — product plan

A plan for the founder to read before a product requirements document. The feature-by-feature list to approve is in the feature list. The PRD starts only after that go-ahead.

## What it is

MakeMyMarriage is a web app for planning a North Indian Hindu wedding. A family creates one wedding and works in it together: events, tasks, guests, email RSVP, wedding spend, a public wedding page, photos, and YouTube live.

The workspace is the wedding. The bride, the groom, and family helpers all work in that one shared wedding.

It is a product for families, built so many families can each plan their own wedding.

## Who it is for

The bride and the groom are the admins. Family members join as helpers, each with their own email, linked to that wedding, the couple, and the family.

Guests are invited to events. They reply by email. They do not need an account.

The product is for the family running one wedding. It is not a tool for a professional planner running many client weddings.

## The problem

A North Indian Hindu wedding is several events over several days, with two families and a long guest list. The plan lives in chats, spreadsheets, and memory. Tasks get lost, guests get invited to the wrong events, photos sit on different phones, and people who cannot attend have no one place to watch.

The family needs one shared place for that wedding.

## Decisions already made

- **Users.** Bride, groom, and multiple family members.
- **One workspace.** The wedding. No separate bride-side and groom-side workspaces.
- **Admins.** The bride and the groom. They can do everything, and they add and manage helpers.
- **Helpers.** Family organizers. They sign up with their own email and are linked to the wedding, the couple, and the family. They can add tasks, assign tasks, and accept tasks. They can rename, reorder, add, and remove events. They can see and handle the budget and expenses. They can add guests and send the digital invitation. Joined helpers can also invite other family helpers; partner invitations and helper removal are admin-only. Guests cannot edit events.
- **Wedding type in version one.** North Indian Hindu only.
- **Events.** A default set the family can edit. Guests are invited per event. RSVP is per event.
- **Guests.** A digital invitation for each guest, sent by email, with per-event RSVP. The guest opens it with no account.
- **Organizers and WhatsApp.** Organizers get a WhatsApp share button for organizing details. Guests stay on email.
- **Photos and live video.** Both are in version one. Live video is a YouTube player embedded in the app and on the wedding website, so it plays there. YouTube hosts the stream. The product does not run its own streaming.
- **Travel.** Guest travel and stay are out. Guests arrange their own travel.
- **No target date.**
- **A product for many families.**

## Version one

- Sign up and sign in with email
- Home list of weddings this person belongs to, with dates
- Create the wedding and its dates
- Events, starting from the default set
- Tasks: add, assign, accept
- Admins and helpers, with the family linked to the wedding
- Budget and expenses for wedding spend
- Guest list and a digital invitation for each guest, sent by email, with reminders and per-event RSVP
- Public wedding website: schedule, venue, RSVP, YouTube, photos
- Photo gallery
- Embedded YouTube player on events, in the app and on the wedding website
- WhatsApp share for organizers

## Out of scope

- Guest travel and stay
- The product’s own live-streaming servers
- WhatsApp invites, reminders, or RSVP for guests
- A planner product for many client weddings
- Separate bride-side and groom-side workspaces
- Other wedding traditions in version one

## Default events

The family can rename, drop, reorder, or add events.

1. Roka / engagement
2. Haldi
3. Mehendi
4. Sangeet
5. Wedding ceremony
6. Reception
7. Vidaai

Each event has its own guest list and its own RSVP.

## Roles

- **Admins (bride and groom).** They can do everything in the wedding, including adding helpers, events, guests, expenses, the website, photos, and YouTube.
- **Helpers (family organizers).** They sign up with their own email. They can add tasks, assign tasks, and accept tasks. They can rename, reorder, add, and remove events. They can see and handle the budget and expenses. They can add guests and send the digital invitation. Joined helpers can also invite other family helpers; partner invitations and helper removal are admin-only. They can add photos they have, and they can share organizing details to WhatsApp. Guests cannot edit events.
- **Guests.** They open their digital invitation from the email and RSVP. They do not get an account.

## Open points

1. **What a family pays to use the app.** Still open. This is the price of MakeMyMarriage itself, separate from the wedding expense tracker.
2. **Invitation card.** Admins create and edit the card (the couple, the message). Family members add guests and send it.

## Next step

Approve the feature list, or mark what to change. The PRD is written only after that go-ahead.
