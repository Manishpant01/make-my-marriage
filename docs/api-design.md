# MakeMyMarriage — version one API design

This is the API for version one. The screens and these routes live in one Next.js app. Route Handlers on Node.js are the backend. There is no second server, and there is no public API for other products. Paths start with `/api`. The app speaks JSON.

Sign-in is our own email and password. The app does not use Auth.js or another auth vendor. Login creates a session in Atlas and sets an httpOnly cookie. The cookie is sent only over HTTPS. It holds a JWT signed with the app secret. The JWT contains only the session id: not the role, and not the wedding list. Each signed-in request checks the JWT, loads that session, and loads the user. Logout deletes the session, so the JWT stops working. An expired session is treated as signed out. The password is stored only as a one-way hash and is never returned.

Every handler that writes checks the input with Zod before it writes. A value that fails that check is refused, and nothing is saved.

Every wedding read or write loads the caller’s membership for that wedding id and checks the role. The wedding id in the path is used only after that membership is found. A guest request starts from the guest token and stays inside that guest. The public page does not require a session.

A missing session, a wrong role, a bad token, or an unknown id is refused with a short error. The database is left as it was. Responses omit secrets: the password hash, the session id, invite tokens, guest tokens, and password-reset tokens.

List routes are paged. The caller passes `page` (starting at 1) and `pageSize`. The server caps the page size. The response includes that page of items and the total, so a wedding of about 500 guests or about 1000 photos is never returned in one call.

Three addresses are pages, not API routes. `/join/<token>` is the family invite page. `/invite/<token>` is the guest card. `/w/<slug>` is the public wedding page. Each page calls the API described under its section.

WhatsApp share is built in the browser. It is not an API. On the schedule, on one event, or on one task, the app opens `https://wa.me/?text=...` with that item’s text. Admins and helpers use it. The text never includes a guest token.

## Who may call a route

| Caller | How they are known |
|---|---|
| Public | No session. The route is open, or it looks up one record by a token or a public slug. |
| Signed-in user | A live session. Used for account routes that are not inside one wedding yet. |
| Admin | A membership on this wedding with role `admin`. The bride and the groom. |
| Helper | A membership on this wedding with role `helper`. |
| Guest token | The token on one guest. The guest has no account and no session. |

An admin can do everything in the wedding. A helper can edit events, tasks, and the budget, add and update guests, send invitations and reminders, and add photos. A helper can invite helpers but cannot remove them or invite an admin partner, cannot edit the invitation card wording (the couple’s names and the short message), and cannot set a YouTube URL. A guest can open their own card and RSVP. Anyone can read the public page.

Couple names, a person’s name, and wedding dates are display fields. No route finds a wedding by those values.

## Accounts

### POST /api/auth/signup

**Who.** Public.

**Does.** Creates an account and signs the person in. The server stores the email in lowercase, stores the password as a hash, writes a session, and sets the cookie.

**Request.** `name`, `email`, `password`.

**Response.** The user’s id, name, and email.

The same email cannot be registered twice. Signing up does not join a wedding. A new person continues to the family accept route when they arrived from an invite link. They sign up with the invited email.

### POST /api/auth/login

**Who.** Public.

**Does.** Checks the email and password. On success the server writes a session and sets the cookie.

**Request.** `email`, `password`.

**Response.** The user’s id, name, and email.

A wrong email or password is refused. A person who already has an account uses this route, then the family accept route, when they arrived from an invite link.

### POST /api/auth/logout

**Who.** Signed-in user.

**Does.** Deletes that session from Atlas and clears the cookie.

**Request.** None. The cookie identifies the session.

**Response.** Signed out.

### POST /api/auth/forgot-password

**Who.** Public.

**Does.** Starts a password reset. If an account exists for the email, the server writes one `emailSends` row with kind `password_reset`, a new reset token, and status `pending`, then asks Resend to send it. The row is marked `sent` or `failed`. The mail’s link carries only that reset token. The row has the user id and no wedding id.

**Request.** `email`.

**Response.** The same short acknowledgement whether or not that email has an account.

This mail is one recipient, so the batch size is one. A person may request a reset again later; that writes a new row. Rows already marked `sent` are left as they are.

### POST /api/auth/reset-password

**Who.** Public. The reset token is the credential.

**Does.** Loads the `emailSends` row by that reset token only. Saves a new password hash on the user and clears the reset token, so the link works once.

**Request.** `resetToken`, `password`.

**Response.** The password is updated.

The person then logs in with the login route. This route does not create a session. An unknown or already used token is refused, and the password stays as it was.

## Home and the wedding

### GET /api/weddings

**Who.** Signed-in user.

**Does.** Lists the weddings this person belongs to. Home reads memberships for this user, then the dates of those weddings. A person who has not joined a wedding yet gets an empty list. Paged.

**Request.** `page`, `pageSize`.

**Response.** Each item has the wedding id, `brideName`, `groomName`, `startDate`, `endDate`, `publicSlug`, and this person’s `role` and `relation`.

### POST /api/weddings

**Who.** Signed-in user. The caller becomes an admin of the new wedding.

**Does.** Creates the workspace. The server writes the wedding, an admin membership for the caller, and the seven starting events in this order: roka / engagement, haldi, mehendi, sangeet, wedding ceremony, reception, vidaai. Event date, time, and venue start empty. The server chooses a unique `publicSlug`. The creator’s membership has their user id, their account name and email, role `admin`, and relation `bride` or `groom`. It has no invite token.

**Request.** `brideName`, `groomName`, `startDate`, `endDate`, and `relation` (`bride` or `groom`). `endDate` is on or after `startDate`. Dates are calendar dates (`YYYY-MM-DD`).

**Response.** The wedding id, couple names, dates, `publicSlug`, the caller’s role and relation, and the seven events with their ids, names, and order.

### GET /api/weddings/<weddingId>

**Who.** Admin or helper.

**Does.** Returns the workspace the family edits. Spent and still due are calculated from the expense documents when this route runs. They are not stored on the wedding.

**Request.** The wedding id in the path.

**Response.** `brideName`, `groomName`, `invitationMessage`, `startDate`, `endDate`, `budgetTotal`, `publicSlug`, the sum of expense amounts, and the sum still due.

The response does not include the guest list, photos, events, tasks, or expenses. Those have their own routes.

### PATCH /api/weddings/<weddingId>

**Who.** Admin or helper, and the fields differ.

**Does.** Updates the wedding record. This is where an admin writes the invitation card wording: the couple’s names and the short message. The card has one design for the wedding. There is no separate card document and no card image. A helper cannot change that wording. An admin or a helper sets the budget total in whole rupees. An admin can also change the wedding dates.

**Request.** An admin may send `brideName`, `groomName`, `invitationMessage`, `startDate`, `endDate`, and `budgetTotal`. A helper may send `budgetTotal` only. A helper who sends any other field is refused, and nothing is saved.

**Response.** The same wedding shape as the wedding read, including the calculated sums.

Family invitation implementation: the Node.js Route Handler calls `POST https://api.resend.com/emails` with native server-side fetch, using `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, and `APP_URL`. AWS credentials are used only for photo storage. The existing membership and emailSends records, Pending/Joined state, retry claims, and sent/failed statuses are unchanged. A successful response must contain an email id; provider errors, timeouts, missing configuration, and quota failures leave a retryable failed row. Family retry processes at most 50 rows sequentially with 600ms between calls in that request; concurrent requests can still encounter provider limits and remain retryable. Future guest bulk sends may use Resend batch sending with the existing application cap of 50 recipients per batch. Password-reset email remains unimplemented. See https://resend.com/docs/api-reference/emails/send-email and https://resend.com/docs/api-reference/rate-limit.

## Family invite

An admin or joined helper invites a helper by email. Only an admin can invite the opposite bride/groom partner. The server creates a membership and a long random invite token, then sends `/join/<token>` through the email rules below. The join page loads that membership by the token only. After the person signs up or logs in, accept links the membership to that user. The account email must be the invited email. Two weddings with the same names and the same dates stay separate, because each link is its own token.

The invite call sends the helper or partner email itself: one `emailSends` row, kind `helper_invite`, then one Resend send. If Resend fails, the membership remains, the row is `failed`, and an authorized member retries it with the retry route (helpers may retry helper invitations only). Inviting the same email again on this wedding is refused.

### GET /api/weddings/<weddingId>/members

**Who.** Admin or helper.

**Does.** Lists the family on this wedding, including people who have not finished joining. The task screen uses this list when it assigns work. Paged.

**Request.** `page`, `pageSize`.

**Response.** Each item has the membership id, `name`, `email`, `role`, `relation`, and whether they have joined (`userId` is set). The invite token is not included. emailStatus is supplied when a send record exists and the caller may retry it: admins see all family email statuses; helpers see helper invitation statuses only.

### POST /api/weddings/<weddingId>/invites

**Who.** Admin or joined helper.

**Does.** Admins may invite the opposite partner as admin or a helper. Joined helpers may invite helpers only; a helper request for role admin returns 403 before any writes. The server writes the membership with `userId` empty, stores the invite token, and sends the join link by email.

**Request.** `name`, `email`, `role`, and `relation`. Role `admin` uses relation `bride` or `groom`. Role `helper` uses relation `mother`, `father`, `brother`, `sister`, or `other`. Any other pairing is refused.

**Response.** The membership id, `name`, `email`, `role`, `relation`, and joined false. Also the email result for that one recipient: `sent` or `failed`, and a short error when it failed.

### DELETE /api/weddings/<weddingId>/members/<membershipId>

**Who.** Admin.

**Does.** Removes a helper. The server deletes that membership. The user’s account stays, so another wedding they belong to still works. Expenses they already paid still show the name stored on those expenses.

**Request.** The membership id in the path.

**Response.** Removed.

The membership must be a helper on this wedding. Removing an admin is refused.

### GET /api/join/<token>

**Who.** Public. No session is required.

**Does.** Backs the page `/join/<token>`. Loads the membership by the invite token only, then reads that membership’s wedding. It does not search by couple name, person name, or wedding date.

**Request.** The token in the path.

**Response.** The invited person’s `name`, `email`, `role`, and `relation`; the wedding’s `brideName`, `groomName`, `startDate`, and `endDate`; and whether the invite is already joined.

An unknown token is refused. The response does not include other members, guests, tasks, or expenses.

### POST /api/join/<token>/accept

**Who.** Signed-in user. The invite token is the only lookup.

**Does.** Links that membership to the signed-in user. The user’s email must equal the membership email. The server sets `userId`. The wedding then appears on their home list. If this user has already accepted, the call returns the same result. Accept does not create a second membership.

**Request.** None beyond the token and the session cookie.

**Response.** The wedding id, couple names, dates, and this person’s `role` and `relation`.

A different email is refused, and the membership stays unlinked. A token already linked to someone else is refused.

## Events

Each event has its own date, time, and venue. The venue is a name, a latitude, and a longitude, written together. Date is `YYYY-MM-DD`. Time is `HH:mm` in India Standard Time, the same local time the card and the public page show. Latitude and longitude are decimal degrees. They stay empty until the family sets the place.

The event list for members includes `youtubeUrl` so the app can show the player. Setting that URL is the YouTube route, and only an admin can call it.

### GET /api/weddings/<weddingId>/events

**Who.** Admin or helper.

**Does.** Returns the schedule in the family’s order. Paged.

**Request.** `page`, `pageSize`.

**Response.** Each item has the event id, `name`, `order`, `date`, `time`, `venueName`, `latitude`, `longitude`, and `youtubeUrl`.

### POST /api/weddings/<weddingId>/events

**Who.** Admin or helper.

**Does.** Adds an event at the end of the schedule.

**Request.** `name`. Optionally `date`, `time`, and the venue (`venueName`, `latitude`, `longitude` together).

**Response.** The new event, including its id and `order`.

### PATCH /api/weddings/<weddingId>/events/<eventId>

**Who.** Admin or helper.

**Does.** Renames an event, moves it, or sets its date, time, and venue. A new `order` places the event at that position, and the server rewrites the other events so the schedule stays one sequence.

**Request.** Any of `name`, `order`, `date`, `time`, `venueName`, `latitude`, `longitude`. The venue fields are sent together.

**Response.** The updated event.

This route does not accept `youtubeUrl`.

### DELETE /api/weddings/<weddingId>/events/<eventId>

**Who.** Admin or helper.

**Does.** Deletes that event. The server also removes that event’s id from guests’ invited events and from their RSVPs in this wedding.

**Request.** The event id in the path.

**Response.** Removed.

The call does not delete guests, helpers, tasks, expenses, or photos.

## Tasks

Tasks belong to the one wedding. Status is `open` or `accepted`. A new task is `open`. The assignee is an admin or a helper who has already joined this wedding.

### GET /api/weddings/<weddingId>/tasks

**Who.** Admin or helper.

**Does.** Lists the wedding’s tasks. Paged.

**Request.** `page`, `pageSize`.

**Response.** Each item has the task id, `title`, `assigneeId`, the assignee’s name from their membership, and `status`.

### POST /api/weddings/<weddingId>/tasks

**Who.** Admin or helper.

**Does.** Adds a task and assigns it. The server checks that `assigneeId` is a user with a membership on this wedding.

**Request.** `title`, `assigneeId`.

**Response.** The task, with status `open` and the assignee’s name.

### PATCH /api/weddings/<weddingId>/tasks/<taskId>

**Who.** Admin or helper.

**Does.** Changes the title, reassigns the task, or accepts it. Any admin or helper may set the status to `accepted`. Reassigning uses the same membership check as creating a task.

**Request.** Any of `title`, `assigneeId`, and `status` (`accepted`).

**Response.** The updated task.

## Expenses

This is wedding spend in whole rupees. A value of `250000` means 2,50,000 rupees. The category is `venue`, `caterer`, `decor`, `clothes`, `ritual`, or `other`. Guest travel and stay are absent. The price of MakeMyMarriage is absent and has no field.

Who paid is the name of a person in this wedding. The server checks that a membership on this wedding has that name, then stores the name. If that person later leaves, the line still shows it.

The wedding read shows `budgetTotal` against the sum of the amounts, and the sum still due.

### GET /api/weddings/<weddingId>/expenses

**Who.** Admin or helper.

**Does.** Lists the expense lines. Paged.

**Request.** `page`, `pageSize`.

**Response.** Each item has the expense id, `category`, `amount`, `paidBy`, and `amountStillDue`.

### POST /api/weddings/<weddingId>/expenses

**Who.** Admin or helper.

**Does.** Adds one line of wedding spend.

**Request.** `category`, `amount`, `paidBy`, `amountStillDue`. Amounts are whole rupees. `amountStillDue` may be zero.

**Response.** The new expense.

### PATCH /api/weddings/<weddingId>/expenses/<expenseId>

**Who.** Admin or helper.

**Does.** Corrects a line. The same checks apply to category, amounts, and who paid.

**Request.** Any of `category`, `amount`, `paidBy`, `amountStillDue`.

**Response.** The updated expense.

### DELETE /api/weddings/<weddingId>/expenses/<expenseId>

**Who.** Admin or helper.

**Does.** Removes one line. The next wedding read calculates the sums without it.

**Request.** The expense id in the path.

**Response.** Removed.

## Guests

A guest has no account. The server creates a long random token on the guest and keeps it as that guest’s only credential. Guest routes for the family do not return the token. The same email cannot be added twice to one wedding. The same email may be a guest of a different wedding, with a different token.

Adding a guest does not send mail. Sending is its own press, described in the next section.

### GET /api/weddings/<weddingId>/guests

**Who.** Admin or helper.

**Does.** Lists guests and their replies, event by event. Paged. This is the list behind about 500 people.

**Request.** `page`, `pageSize`.

**Response.** Each item has the guest id, `name`, `email`, `invitedEventIds`, `rsvps` (each entry is an event id and `yes` or `no`; a missing event means they have not answered), `invitationSentAt`, and `reminderSentAt`.

### POST /api/weddings/<weddingId>/guests

**Who.** Admin or helper.

**Does.** Adds a guest and chooses the events they are invited to. Every event id must belong to this wedding. The server generates the token.

**Request.** `name`, `email`, `invitedEventIds`.

**Response.** The guest id, `name`, `email`, and `invitedEventIds`. Replies are empty. The token is not included.

### PATCH /api/weddings/<weddingId>/guests/<guestId>

**Who.** Admin or helper.

**Does.** Corrects the guest’s name or email, or changes which events they are invited to. Event ids must belong to this wedding. When an event is taken off the invitation, the server drops that event’s RSVP. Replies for events that remain stay as they were. Newly invited events have no reply yet.

**Request.** Any of `name`, `email`, `invitedEventIds`.

**Response.** The updated guest, without the token.

## Invitation, reminder, and retry

Nothing here runs on a schedule. An admin or a helper presses send. The handler writes the rows, talks to Resend, and answers when that send is finished. There is no cron and no second mail service.

Email rules for every wedding send:

- One `emailSends` row per recipient. The row holds the recipient, the kind, the status, and the wedding id. A helper invite also stores the membership id. A guest invitation or a reminder also stores the guest id. The link is built from the token that already lives on the membership or the guest. That token is not copied onto the row.
- The handler asks Resend to send at most 50 rows at a time. Each guest still receives their own link. A hundred guests is two batches. Five hundred is ten. The from-address is the verified address.
- Each row in the batch is marked `sent` or `failed`. A failed row keeps a short error. A failed send leaves the guest, or the membership, in place.
- A retry selects `pending` and `failed`, and skips `sent`.
- When a guest invitation row becomes `sent`, that guest’s `invitationSentAt` is set. When a reminder row becomes `sent`, `reminderSentAt` is set.

The guest link is `/invite/<token>`. The family link is `/join/<token>`. The email leads to that page. The page is the card.

For a guest invitation, the send writes a row only when that guest does not already have a `guest_invitation` row. A guest who already has one is skipped. If that row is `pending` or `failed`, the retry route sends it. A reminder is always a new row of kind `reminder`. It uses the same token and opens the same card. It does not create a second guest.

### POST /api/weddings/<weddingId>/invitations

**Who.** Admin or helper.

**Does.** Sends the personal invitation to the chosen guests, using the email rules above.

**Request.** `guestIds`. Each id must be a guest of this wedding.

**Response.** For each guest: the guest id, and `sent`, `failed`, or `skipped`. Failed items include the short error. Also the counts of sent, failed, and skipped.

### POST /api/weddings/<weddingId>/reminders

**Who.** Admin or helper.

**Does.** Sends a reminder to the chosen guests. The link is the same card. The server writes one new `reminder` row per guest on this press, then sends in batches of up to 50.

**Request.** `guestIds`. Each id must be a guest of this wedding.

**Response.** For each guest: the guest id, and `sent` or `failed`, with the short error when it failed. Also the counts.

### POST /api/weddings/<weddingId>/emails/retry

**Who.** Admin or helper, with a different set of mail.

**Does.** Sends this wedding’s unsent rows again. The server selects `pending` and `failed` and skips `sent`. An admin’s retry includes `helper_invite`, `guest_invitation`, and `reminder`. A helper’s retry includes helper-role `helper_invite` rows plus future `guest_invitation` and `reminder` rows; partner/admin membership invitation rows remain untouched. The current implementation handles family invitation rows only. Password-reset rows have no wedding id, so this route never selects them. Successful guest rows update `invitationSentAt` or `reminderSentAt` as in the email rules.

**Request.** None. The wedding id in the path chooses the rows.

**Response.** The counts of sent, failed, and skipped, plus each retried row’s recipient, kind, and status.

## Guest card and RSVP

The card is the page `/invite/<token>`. One design serves every guest. When the page renders, it fills in that guest’s name and only the events they are invited to. Dates, times, and venues come from the event documents, so a later change to a venue shows on the card. The couple’s names and the message stay as the admin wrote them.

These routes do not take a wedding id. They load the guest by token, then stay inside that guest.

### GET /api/invite/<token>

**Who.** Guest token. No session.

**Does.** Backs the card page. Loads the guest by token only, then that guest’s wedding and invited events.

**Request.** The token in the path.

**Response.** The guest’s `name`; `brideName`, `groomName`, and `invitationMessage`; and only the invited events, each with its id, name, date, time, venue name, latitude, longitude, and the current reply (`yes`, `no`, or unanswered).

The response does not include other guests, tasks, expenses, photos, or memberships.

### POST /api/invite/<token>/rsvp

**Who.** Guest token. No session.

**Does.** Saves yes or no for events this guest is invited to. Each answer replaces that event’s reply. Invited events left out of the request stay as they were. An event that is not on this guest’s invited list refuses the call, and nothing is saved.

**Request.** `replies`: a list of event id and `yes` or `no`. Each event id appears once.

**Response.** The invited events with their replies, in the same shape as the card read.

## Public wedding page

The page is `/w/<slug>`. Anyone with the address can open it. The slug is the lookup. The page shows the schedule, the venue for each event, the YouTube player for every event that has a URL, and the photo gallery. It does not collect RSVPs and it does not ask for an email. RSVP stays on the guest’s own card.

The gallery is its own paged route so the schedule call stays small at about 1000 photos.

### GET /api/w/<slug>

**Who.** Public. No session.

**Does.** Loads the wedding by `publicSlug` and returns the public shape.

**Request.** The slug in the path.

**Response.** `brideName`, `groomName`, `startDate`, `endDate`, and the events in order. Each event has its name, date, time, venue name, latitude, longitude, and `youtubeUrl`. An empty URL means the page shows no player for that event.

The response does not include the guest list, replies, tasks, expenses, memberships, the invitation message, or any token.

### GET /api/w/<slug>/photos

**Who.** Public. No session.

**Does.** Returns one page of the wedding gallery. The picture address is built from the stored key and the CloudFront host when the route runs. Paged.

**Request.** The slug in the path. `page`, `pageSize`.

**Response.** Each item is the picture address. The total is included.

## Photos

The wedding has one gallery. An admin or a helper adds photos they have. The browser does not post the bytes to this API. It uploads them to S3, then confirms.

The upload URL expires in a few minutes, names one object key under this wedding, and accepts only jpeg, png, or webp, up to 10 MB. The server chooses the key. A confirm writes the photo document only after S3 has the object and the type and size are allowed. A failed upload leaves no gallery row.

### POST /api/weddings/<weddingId>/photos/upload-url

**Who.** Admin or helper.

**Does.** Checks the caller’s membership, chooses the object key, and returns a presigned upload URL for that key.

**Request.** `contentType`: jpeg, png, or webp.

**Response.** The upload URL, the `s3Key`, and how soon the URL expires.

### POST /api/weddings/<weddingId>/photos

**Who.** Admin or helper.

**Does.** Confirms a finished upload. The server checks that this key is the one it issued for this wedding, checks the object’s type and size, and saves `s3Key` and `uploadedBy`.

**Request.** `s3Key`.

**Response.** The photo id, the picture address, and `uploadedBy`.

A key from another wedding, or an object that is missing or too large or the wrong type, is refused, and no photo row is written.

### GET /api/weddings/<weddingId>/photos

**Who.** Admin or helper.

**Does.** Lists the gallery in the app. Picture addresses are built the same way as on the public page. Paged.

**Request.** `page`, `pageSize`.

**Response.** Each item has the photo id, the picture address, and `uploadedBy`. The total is included.

## YouTube

### PATCH /api/weddings/<weddingId>/events/<eventId>/youtube

**Who.** Admin.

**Does.** Sets the YouTube URL on one event, or clears it. The server checks that a URL it stores is a YouTube address. The app and the public page render YouTube’s own player for that URL. An empty value means no player. MakeMyMarriage does not upload video and does not run a stream.

**Request.** `youtubeUrl`. Send an empty value to clear it.

**Response.** The event id and `youtubeUrl`.

A helper, a guest, and the public cannot call this route. They can watch a URL that is already set: members on the event list, and everyone else on the public wedding read.

Joined admins and helpers may invite family helpers with relation mother, father, brother, sister, or other. Only admins may invite the opposite bride/groom partner as an admin, and only admins may remove helpers. Pending invitees and people outside this wedding cannot invite. A helper request for role admin is refused with HTTP 403; bride/groom cannot be used with role helper. Duplicate-email, partner-slot, transaction, and rate-limit protections remain. Helpers may view email status and retry unsent helper invitations for this wedding; partner invitation status and retry stay admin-only. The Invite family link is available to both roles, while only admins see Partner in the form.
