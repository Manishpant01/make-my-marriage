# Family invitations — design flow and Stitch prompt

Approved scope: 25 October 2026. Updated permissions: joined helpers can invite other helpers; partner invitations and helper removal remain admin-only. Design specification only; no application implementation or shipped-feature log entry is implied.

Read with [typography.md](typography.md), [animations.md](animations.md), `docs/prd.md`, and the Family invite section of `docs/api-design.md`. This replaces the older Invite family sketch in `stitch-dashboard-open.md`. Family organizer access is separate from the Invitation guest-card editor.

## Flow and permissions

An admin or joined helper opens Family → Invite family → sends an email invitation. The recipient opens `/join/<token>` → logs in or signs up with the invited email → returns to that invitation → explicitly accepts → opens the wedding dashboard. The wedding also appears on their home list.

Use the existing signed-in header and navigation for Family and Invite family. Family is visible to admins and helpers. Admins and joined helpers see Invite family. Helpers can invite and retry helper invitations only. Only admins see partner invitations and remove-helper actions. Do not expose private family content on the public join page.

Only admins have a Partner option. The inviter's admin membership in this wedding determines the partner option: a groom sees Bride only; a bride sees Groom only. Set the admin role automatically, never offer an unrestricted role selector. If the partner is already pending or joined, replace the creation option with that existing entry and a View family link. Never create a third admin or another invite for the same partner slot, including after email failure. Admins cannot be removed. Helpers may be removed whether pending or joined, with confirmation; removing a pending helper invalidates their invitation link.

Helpers use Mother, Father, Brother, Sister, or Other. The current schema has no bride-side/groom-side field, so do not add a family-side selector. Partner and helper invitations both collect name and email. Partner name can be prefilled from saved wedding details and edited before sending; this does not change the wedding's saved bride/groom name.

Trim emails and compare case-insensitively. Each email must be unique within the wedding across joined and pending memberships, regardless of role. Reject self-invites, the partner's email reused for a helper, and duplicate pending invites. Existing accounts and membership in other weddings are allowed. Validate on both client and server; concurrent invitations must not bypass partner/email constraints.

## Membership and delivery states

Membership status is Pending until accepted and Joined afterward. Email delivery is a separate state: sending/pending, sent, or failed. Show Pending even if delivery failed. Say “Email sent”, not “Delivered”, since successful sending is not proof of delivery or acceptance.

On successful send, show an inline confirmation, the recipient, and View family. A failed send after membership creation says: “The invitation was created, but the email couldn't be sent.” Retry the existing email; do not create another membership. A request failure before creation preserves the form and offers retry. Duplicate errors link to Family.

The member-list API currently provides membership status, not per-recipient delivery details. Failed-email markers or retry buttons on Family require additional read-model data. Design those as conditional states backed by real data, not inferred from Pending. The documented retry endpoint retries the wedding's eligible unsent rows; do not promise a row-specific retry unless the implementation supports it. Label a broader action “Retry unsent emails” and explain its scope when necessary. On the invite result, the response already provides that recipient's send result.

## Join and authentication states

The public token read supplies the invited name/email/role/relation, wedding names/dates, and joined state. Show only those details. Venue is not collected at wedding level; omit location, other members, events, guests, tasks, and spend here.

- Signed out: Create account and Log in, with the invited email and a same-email instruction.
- Matching signed-in email: Accept invitation with a plain account identity line.
- Different signed-in email: explain both identities, offer Switch account, and prevent acceptance.
- Accepting: disable repeat acceptance and keep the action width stable.
- Accepted: show “You've joined the wedding”, saved wedding details, and Open wedding.
- Already accepted by this user: show “You're already part of this wedding” and Open wedding. Repeated acceptance is idempotent.
- Unknown token, deleted membership, missing wedding, or token used by someone else: an unavailable-link state, with a short instruction to contact the couple; no wedding access action or private details that were not safely loaded.
- Temporary lookup/accept failure: keep appropriate context and offer Try again. Do not describe a network failure as an invalid link.

Preserve invitation intent across login, signup, switching accounts, and returning to the join page. Invited signup bypasses Start the wedding and the new-wedding congratulations screen. Authentication alone does not accept the invite. Prefill the invited email on account forms; preserve existing account validation and do not expose passwords/tokens in UI. Return destinations must be validated internal paths in implementation. A valid invite to a registered person uses the existing account, not a second account.

No expiration period is defined: do not invent expiry timers, Expired labels, Decline, resend of already-sent mail, invite copying, or invite editing/cancellation features. Remove helper is the existing supported removal action.

## Layout and motion

Use desktop 1440px and actual mobile 390px frames. Reuse the full-width workspace content region: approximately 200px sidebar, 48–56px gap, 40–48px outer margins. Match the existing header and mobile navigation without redesigning them. Keep the signed-in name plain, with Log out separate.

Family uses aligned desktop list columns and stacked mobile rows, readable Pending/Joined text, and role text separate from membership status. No avatars or charts. Show a creator-only state with one joined admin; this is not an empty wedding. Pagination may follow the existing paged API without adding search or filters.

Invite family uses a spacious two-column form on desktop (name/email) and stacked fields on mobile. Show Partner to admins only and separate it from Family helper clearly, with helper relation visible only for that mode. On Join use a centered card around 560px wide with a simpler public header, no workspace sidebar, and Fraunces for the prominent couple names. Outfit remains the interface font. In signed-out headers show only the existing brand; in signed-in join states show plain name and Log out.

Preserve ivory #F6F3EE, surface #FFFCF8, ink #1C1917, muted #6B6560, bronze #8C6A45, hover #74583A, hairline #E7E1D8, and existing success/error colors only when needed. Use 8px corners, no heavy shadows, gradients, confetti, stock photo, or new ornaments. Match existing toast icons if used. The persistent inline message must communicate partial email failure even after a toast disappears.

Use shared Motion guidance: fixed shell, 100ms section exit, individual incoming panels fading/rising 8px over 220ms with bounded 40ms staggering. Form and join card each enter as a coherent unit. Do not animate each field or restart on validation/saving. Accessible focus, 44px targets, and reduced-motion handling are required. No provider library needs to be represented in product copy.

## Review checklist

Create desktop/mobile primary layouts and named state variants. Review both inviter directions, pending/joined partner slots, creator-only Family, admin/helper list permissions, email uniqueness errors, partial send failure, retry, helper removal, signed-out/matching/wrong-account Join, signup/login return, acceptance, already-joined, invalid/unavailable, and temporary failures. Confirm sidebar selection, names/dates, and sample roles remain coherent across frames. Pending members must not count as joined helpers. Preserve keyboard access and visible status text; color alone cannot carry meaning.

Backend implementation must reconcile new partner-slot rules with the more general older API description and expose any delivery state required by the final design. This document does not assert those validations or endpoints are already implemented. Update product/API docs with the actual implementation later.

## Paste into Stitch

```text
Design the FAMILY INVITATION flow in the existing MakeMyMarriage project. Add Family, Invite family, and Join invitation screens with their state variants. Produce each primary screen at desktop 1440px and mobile 390px. Use real mobile layouts, not desktop frames with mobile labels. Preserve the existing dashboard and other screens.

STYLE
Match the current shared layout, logo, and minimal premium style. Outfit is the interface font: regular body, medium functional headings/buttons. Fraunces medium is reserved for prominent couple names on Join. Palette: ivory #F6F3EE, surface #FFFCF8, ink #1C1917, muted #6B6560, bronze #8C6A45, hover #74583A, hairline #E7E1D8. Use existing green/red only for success/error feedback. Fine borders, 8px corners, generous spacing. No extra imagery, avatars, charts, gradients, confetti, decorative badges, or new navigation items.

SHELL
Family and Invite family replace the dashboard's main content; header/sidebar stay steady. Reuse existing navigation order and mobile navigation. Highlight the selected link. Keep the signed-in name plain text, never inside a button. ADMINS captions are smaller tracked text aligned separately from link names. Use the full content width with a comfortable 48–56px gap after the sidebar.

FAMILY
Title Family; sentence “The people planning the wedding together.” Admins and helpers see Invite family. Show aligned desktop columns: Person (name/email), Relation, Role, Status, Actions. Use compact stacked rows on mobile. Status is Pending or Joined, written explicitly; role Admin or Helper is separate.

Example: Priya Sharma, priya@example.com, Bride, Admin, Joined; Rahul Mehta, rahul@example.com, Groom, Admin, Pending; Meera Sharma, meera@example.com, Mother, Helper, Joined; Amit Sharma, amit@example.com, Father, Helper, Pending. This sample has two joined members and two pending invitations. Also show a creator-only variant with Priya as the only joined member.

Admins can remove helpers only. Show a restrained confirmation: “Remove Meera from this wedding? Her account will remain.” Actions Cancel and Remove helper. Also support removing a pending helper. Never show Remove for admins. The helper-view variant includes Invite family and retry for helper invitations, but no Partner option, partner-email retry, or removal actions.

INVITE FAMILY
Title Invite family for both roles; show a quiet ADMINS caption only beside the Partner option. Admins see Partner and Family helper as two clear modes. Helpers see the Family helper form only. Desktop Name and Email share a spacious row; mobile stacks them. Primary action Send invitation. A short line explains that they must join using this email.

Only admins see Partner. The current admin's membership in this wedding fixes the partner role. A bride can invite only Groom; a groom can invite only Bride. Show both scenarios as named variants, never both bride/groom choices in the same form. Use a fixed line “Invite the groom as an admin” or “Invite the bride as an admin”; no editable admin-role selector. Name may be prefilled from the wedding and corrected; email is required.

If the partner is already Pending or Joined, show their existing entry and View family instead of another partner form. Helpers remain invitable.

Family helper mode collects Name, Email, and Relation: Mother, Father, Brother, Sister, Other. Do not add bride-side/groom-side selectors. Explain “Helpers can help plan the wedding. Admins and helpers can invite family helpers. Only admins can invite a partner or remove family.”

Show inline validation variants: required fields, invalid email, self-invite, and email already pending/joined on this wedding. Email comparisons ignore letter case and outside spaces. An address must be different from every existing member/invitation in this wedding, including the partner. Existing registered users and members of other weddings are allowed.

Show Sending with repeat submit disabled; success “Invitation email sent” with recipient and View family; partial failure “The invitation was created, but the email couldn't be sent.” Preserve the pending membership and offer retry of the existing email operation, never a second invite. Pending means not joined, not email delivered. Temporary request failure preserves fields and offers retry.

Email send status and membership status are separate. Use conditional “Email not sent” feedback only when actual delivery data exists; do not infer it from Pending. Where the available retry operates on all eligible mail, label it Retry unsent emails rather than pretending it targets one row. Do not add resend for already-sent invitations.

JOIN INVITATION
Standalone /join/<token> page with a simple brand header and centered card around 560px wide. No workspace sidebar. Show “You're invited to help plan”, prominent Fraunces “Priya and Rahul”, Outfit dates “12–14 March 2027”, invited name/email, and role/relation. No venue or private workspace data. Produce partner-admin and parent-helper variants.

State variants:
1. Signed out: Create account primary, Log in secondary; “Use meera@example.com, the email this invitation was sent to.”
2. Signed in with matching email: plain identity line and Accept invitation.
3. Wrong email: “This invitation is for meera@example.com. You're signed in as another@example.com.” Offer Switch account; acceptance unavailable.
4. Accepting: Joining…; prevent repeat submission.
5. Accepted: “You've joined the wedding”, names/dates and Open wedding.
6. Already accepted by this user: “You're already part of this wedding” and Open wedding.
7. Invalid/removed/unavailable link or link used by another person: “This invitation is unavailable. Ask the couple for help.” No private workspace details or Open wedding action.
8. Temporary lookup/accept failure: appropriate context and Try again; do not call it an invalid invitation.

AUTHENTICATION AND PROTOTYPE
Reuse existing login/signup designs. Add invitation-context variants with prefilled invited email and a short instruction; preserve their current fields and styling. Login/signup returns to the same Join invitation page, not wedding setup. Authentication does not automatically accept. Switching accounts preserves the invitation. Keep token strings out of visible copy.

Wire Family → Invite family → send result → View family. Represent the recipient opening an email link as a separate prototype entry at Join; do not add a sender-side Join link or an email inbox screen. Wire signed-out Join → Log in/Create account → matching-account Join → Accept → accepted → Open wedding (existing dashboard). Wedding also appears on their home list. Connect Family and Invite family through the existing sidebar, and Dashboard back to the overview. Removal cancel returns unchanged; confirmed helper removal updates the list. Retry states update feedback without duplicates. Include helper-inviter and opposite-admin-inviter variants clearly named for review.

MOTION AND ACCESSIBILITY
Keep the shell steady. Sections exit with a 100ms fade; incoming panels fade/rise 8px over 220ms, stagger 40ms, cap total around 500ms. Forms and join cards enter as coherent units, not field by field. Do not replay on typing, validation, sending, or retries. Use existing bronze hover/press treatment, visible keyboard focus, readable errors/statuses, 44px touch targets, and no lift/stagger with reduced motion. Demonstrate supported transitions in preview and identify any handoff-only effects honestly.

Separate primary screens from their named state variants so the flow stays readable. No expiration timer, Decline, copy-invite link, invite editing, new family-side field, or unrelated features. Family invitations manage organizer access; the existing Invitation menu remains the guest-card editor.
```

Joined admins and helpers may invite family helpers with relation mother, father, brother, sister, or other. Only admins may invite the opposite bride/groom partner as an admin, and only admins may remove helpers. Pending invitees and people outside this wedding cannot invite. A helper request for role admin is refused with HTTP 403; bride/groom cannot be used with role helper. Duplicate-email, partner-slot, transaction, and rate-limit protections remain. Helpers may view email status and retry unsent helper invitations for this wedding; partner invitation status and retry stay admin-only. The Invite family link is available to both roles, while only admins see Partner in the form.
