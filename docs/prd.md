# MakeMyMarriage — version one product requirements

## 1. Summary

MakeMyMarriage is a web app for a family planning a North Indian Hindu wedding. The bride, the groom, and their family work in one shared wedding: events, tasks, guests, a digital invitation, wedding spend, a public wedding page, photos, and live video.

The bride and the groom are the admins. They can do everything in the wedding, including adding and removing helpers. Helpers are family members. They sign up with their own email and are linked to the wedding, the couple, and the family. Guests have no account. Each guest gets a personal digital invitation by email and RSVPs on that card, event by event.

Live video is a YouTube player embedded in the app and on the wedding website. YouTube hosts the stream and the recording. Organizers can share a schedule, an event, or a task to WhatsApp. Guests stay on email.

Many families can each plan their own wedding. The product is for those families.

## 2. Problem and goal of version one

A North Indian Hindu wedding is several events over several days, with two families and a long guest list. The plan lives in chats, spreadsheets, and memory. Tasks get lost, guests get invited to the wrong events, photos sit on different phones, and people who cannot attend have no one place to watch.

Version one gives the family one shared place for that wedding. They can keep the events, hand out the work, invite each guest to the right events, collect a yes or no for each event, track wedding spend, keep the photos together, publish a wedding page, and watch the YouTube video inside MakeMyMarriage.

## 3. Users and permissions

There are three groups. The workspace is the wedding. The bride’s side and the groom’s side share that one workspace.

**Admins.** The bride and the groom. They can do everything in the wedding, including adding and removing helpers.

**Helpers.** Family members who help organize. An admin or a joined helper invites another helper by email. The helper signs up with that email and joins the wedding. The helper is linked to the wedding, the couple, and the family. The family record is name, email, and relation to the bride or groom: mother, father, brother, sister, or other.

**Guests.** People invited to one or more events. They have no account. They open a personal digital invitation from email and RSVP on that card.

| | Admins (bride and groom) | Helpers (family) | Guests |
|---|---|---|---|
| Shared wedding workspace | Yes | Yes | Their own invitation, and the public wedding page |
| Invite helpers | Yes | Yes | No |
| Invite the partner and remove helpers | Yes | No | No |
| Rename, reorder, add, and remove events | Yes | Yes | No |
| Add, assign, and accept tasks | Yes | Yes | No |
| Budget and expenses | Yes, see and handle | Yes, see and handle | No |
| Guest list and digital invitation | Yes | Add guests and send the invitation | Open their own card and RSVP |
| Attach a YouTube video to an event | Yes | No | Watch it on the wedding page |
| Add photos | Yes | Yes, photos they have | No |
| View the photo gallery | In the app | In the app | On the wedding website |
| WhatsApp share (schedule, event, or task) | Yes | Yes | No |

## 4. Version-one scope

Version one is these nine features, for one North Indian Hindu wedding:

- Accounts and family
- Wedding and events
- Tasks
- Budget and expenses
- Guests and digital invitations
- Wedding website
- Embedded YouTube
- Photo gallery
- WhatsApp share for organizers

A new wedding starts from a default list of events. Admins and helpers can change that list. The wedding has one digital invitation design, personalized for each guest.

## 5. Requirements

### 5.1 Accounts and family

**What people can do**

1. A person can sign up with their own email and sign in.
2. Home shows the weddings that person belongs to, with the dates of each wedding.
3. The bride and the groom are both admins of their wedding.
4. An admin can do everything in the wedding.
5. An admin or a joined helper can invite another helper. Only admins can invite the partner or remove helpers.
6. A helper is invited by email, signs up with that email, and joins that wedding.

**Rules that must be true**

7. The bride, the groom, and every helper belong to the same wedding workspace.
8. Each helper is linked to the wedding, the couple, and the family.
9. Each helper’s family record is their name, their email, and their relation to the bride or groom. The relation is mother, father, brother, sister, or other.
10. Many families can each plan their own wedding. Each wedding is its own workspace.

### 5.2 Wedding and events

**What people can do**

1. An admin can create the wedding and set the wedding dates.
2. An admin or a helper can rename an event, change the order of events, add an event, and remove an event.

**Rules that must be true**

3. A new wedding starts with these events, in this order: roka / engagement, haldi, mehendi, sangeet, wedding ceremony, reception, vidaai.
4. The family can change that starting list. Admins and helpers are the people who can change it.
5. Each event has its own date, time, and venue.
6. A guest is invited per event. Each event has its own guest list and its own RSVP.
7. A guest cannot edit events.
8. Version one is for a North Indian Hindu wedding.

### 5.3 Tasks

**What people can do**

1. An admin or a helper can add a task for the wedding.
2. An admin or a helper can assign a task to a helper or to an admin.
3. An admin or a helper can accept a task.
4. Admins and helpers can see the tasks for the wedding.

**Rules that must be true**

5. Tasks belong to the one shared wedding.
6. Assigning a task means giving it to an admin or a helper.
7. Guests have no task list and cannot add, assign, or accept tasks.

### 5.4 Budget and expenses

**What people can do**

1. An admin or a helper can add an expense.
2. An admin or a helper can see and handle the wedding’s budget and expenses.
3. The wedding shows a simple budget total against what is spent.

**Rules that must be true**

4. Each expense has a category, an amount, who paid, and what is still due.
5. The category is one of: venue, caterer, decor, clothes, ritual, other.
6. Admins and helpers can see and handle expenses. A guest cannot.
7. This tracker is wedding spend. Guest travel and stay are not part of it.
8. The price a family pays to use MakeMyMarriage is separate from this tracker. It is not entered here as a wedding expense.

### 5.5 Guests and digital invitations

**What people can do**

1. An admin or a helper can add a guest with a name and an email.
2. An admin or a helper can choose which events that guest is invited to.
3. An admin can create the wedding’s digital invitation: the couple, a short message, and the events with their dates and venues.
4. An admin or a helper can send the invitation to the guest by email.
5. The guest can open the invitation in the browser with no account.
6. On that card, the guest can answer yes or no for each event they are invited to.
7. An admin or a helper can see replies on the guest list, for each event.
8. A reminder email opens the same invitation. An admin or a helper can send that reminder.

**Rules that must be true**

9. The wedding has one invitation design. Each guest gets that same design, with their own name and only the events they are invited to.
10. The invitation is a card in the product. The email leads the guest to that card.
11. A guest RSVPs per event, and only for events they are invited to.
12. The reminder uses the same card. It does not send the guest to a different invitation.
13. Admins and helpers can add guests and send the digital invitation. Admins create and edit the invitation card itself. Guests cannot edit the invitation.
14. Guests are not contacted on WhatsApp. The invitation, the reminder, and the RSVP stay on email and on the card.

### 5.6 Wedding website

**What people can do**

1. Anyone can open the wedding’s public page.
2. A guest can RSVP from their own digital invitation.

**Rules that must be true**

3. The page shows the schedule of events.
4. The page shows the venue for each event.
5. RSVP on the website is the guest’s own digital invitation. The guest replies on their card.
6. The page includes the embedded YouTube player for an event.
7. The page includes the photo gallery.

### 5.7 Embedded YouTube

**What people can do**

1. An admin can attach a YouTube video to an event.
2. People can watch that video in the app and on the wedding website.

**Rules that must be true**

3. The video plays in an embedded YouTube player inside MakeMyMarriage. It plays in the app and on the wedding website.
4. YouTube hosts the stream and the recording.
5. MakeMyMarriage does not run its own live stream.
6. Attaching the video is an admin action.

### 5.8 Photo gallery

**What people can do**

1. An admin or a helper can add photos they have.
2. The family can view the gallery in the app.
3. A guest can view the gallery on the wedding website.

**Rules that must be true**

4. The wedding has one gallery, so photos held by different people live in one place.
5. Helpers add photos they have. Guests do not add photos.

### 5.9 WhatsApp share

**What people can do**

1. An admin or a helper can use a WhatsApp share button on the schedule, on an event, and on a task.
2. The button opens WhatsApp with that detail, so the family can share it in their own chat.

**Rules that must be true**

3. The button is for organizers: admins and helpers.
4. The detail that can be shared is the schedule, a single event, or a task.
5. WhatsApp is not used to invite a guest, remind a guest, or collect an RSVP.

## 6. Out of scope

Version one does not include:

- Guest travel and stay. Guests arrange their own travel.
- Live-streaming servers run by MakeMyMarriage.
- WhatsApp for a guest invitation, a guest reminder, or a guest RSVP.
- A separate workspace for the bride’s side and another for the groom’s side.
- A planner tool for a professional running many client weddings.
- Wedding traditions other than North Indian Hindu.
- Extra digital invitation designs, or a choice of card themes.
- A price to use the app. What a family pays is still an open question, and it stays out of the wedding expense tracker.

## 7. Open questions

1. **What a family pays to use the app.** Still open. This is the price of MakeMyMarriage itself. It is separate from the wedding expense tracker. No price, free tier, or payer is decided.

## 8. What “done” means for version one

A founder can treat version one as done when all of these are true:

- The bride and the groom can sign up, sign in, and see their wedding on the home list with its dates.
- They share one wedding workspace, and both can do everything in it, including adding and removing helpers.
- A family helper can join with their own email, and their record shows name, email, and relation to the bride or groom.
- The wedding starts with roka / engagement, haldi, mehendi, sangeet, wedding ceremony, reception, and vidaai. Admins and helpers can rename, reorder, add, and remove events. Each event has a date, a time, and a venue.
- Admins and helpers can add tasks, assign them to an admin or a helper, accept them, and see the wedding’s tasks.
- Admins and helpers can record wedding expenses with category, amount, who paid, and what is still due, and can see a budget total against what is spent.
- Admins and helpers can add guests, choose their events, and send one personal invitation card by email. There is one design for the wedding. Admins create that card.
- A guest can open that card with no account and answer yes or no for each invited event. A reminder email opens the same card. Admins and helpers can see the replies per event.
- The public wedding page shows the schedule, the venue for each event, the YouTube player, and the photo gallery. RSVP stays on the guest’s own card.
- An admin can attach a YouTube video to an event, and it plays inside the app and on the wedding page. YouTube hosts the stream and the recording.
- Admins and helpers can add photos they have to one gallery. The family sees it in the app. Guests see it on the wedding page.
- Admins and helpers can share the schedule, an event, or a task to WhatsApp. Guests are not contacted on WhatsApp.
- Guest travel and stay are absent. Guests cannot edit the guest list, the invitation, or expenses. The price of the app is still unset, and it is not mixed into wedding expenses.
