# MakeMyMarriage — project status

What is built in the repo. Product plans stay in the other docs. This file is only the work that has landed.

When a feature is built, update **Now**, then add a log entry at the top of **Log**.

## Now

The app shell, public landing page, and custom accounts are in place. A new account starts a wedding with the couple’s names, dates, creator’s admin membership, and seven starting events, then sees congratulations and the wedding on `/home`. The dashboard shows the couple, events, and real counts. Admins can correct names and dates and edit the guest invitation message. Family lists joined members and pending invitations; admins and joined helpers can invite family helpers and retry their unsent helper emails. Partner invitations and helper removal remain admin-only. Email uses Resend with a durable send record. `/join/<token>` preserves the invitation through login/signup and account switching, requires the invited email and explicit acceptance, and adds the wedding to that account’s home list. Pending invitations do not count as joined family. The shared shell, Outfit/Fraunces typography, global toast feedback, and Motion entrances with reduced-motion support extend to the new screens. Live email sending needs APP_URL and the existing RESEND_API_KEY and RESEND_FROM_ADDRESS environment settings; it has been tested with mocked Resend and a local preview with sending disabled, not against a live Resend account. Events is built: admins and joined helpers can add, edit, clear optional details, reorder, and delete events in a shared paged schedule. The dedicated editor supports date, time in IST, and venue name with latitude/longitude. Guest invitation selections and replies are cleaned up atomically when an event is deleted. Dashboard and the invitation preview read the updated schedule. Guests, tasks, expenses, photos, and other workspace features remain unbuilt. Password reset mail is not sent yet. Matching skeleton loading states cover account pages, the wedding list, wedding workspace, congratulations, and invitation join. Workspace section changes keep the header and sidebar in place, with a skeleton in the main column while data loads. Skeletons use a reduced-motion-safe pulse.

## Log

### 2026-10-26 - Events and schedule planning

Events follows the new Stitch desktop/mobile references inside the existing shell. Admins and joined helpers share the paged event list, full add/edit form, complete venue group, explicit optional-field clearing, immediate global Move up/Move down ordering, and confirmed deletion. The editor includes dirty-form discard confirmation, persistent errors, pending submit locks, existing toasts, and direct links. Dashboard Add an event opens the editor; saved event data updates Dashboard and Invitation. Section-specific skeletons, bounded row entrances, and reduced-motion-safe dialogs reuse the existing UI patterns. Input validation, membership checks, rate limits, and idempotent creation protect the APIs. A per-wedding transaction lock serializes schedule mutations; deletion removes event selections and RSVPs without deleting guests, with rollback on failure. The optional clearing and single-event read contracts are documented in the API design. WhatsApp, YouTube editing, map search, and guest editors remain outside this slice.

### 2026-10-25 - Skeleton page loading

Reusable skeletons and App Router loading boundaries cover login, signup, forgot password, the wedding list, the wedding workspace, congratulations, and invitation joining. Dashboard, Couple, Invitation, Family, and Invite family use matching main-column skeletons during section navigation instead of the floating loading message. The workspace shell stays available, outgoing forms remain mounted but hidden while loading, and the existing section transition restores the real content when navigation completes. Screen readers receive a loading status; placeholder shapes are decorative, and pulse animation runs only when reduced motion is off. No artificial delay or new dependency is added to the application.

### 2026-10-25 - Helpers inviting family

Joined helpers can open Invite family and invite other helpers, including after joining from another helper's invitation. Only admins see the Partner option or can request an admin membership; helper role-escalation requests return 403. Family and sidebar invite links are available to both roles. Helpers can see and retry helper email statuses, with partner rows excluded on the server. Removal, Couple, the guest Invitation editor, and Live stream remain admin-only. Permission checks, duplicate constraints, rate limiting, transaction writes, and explicit acceptance remain in place. Product, architecture, API, database, and family UI docs reflect the new permissions; tests cover all helper relations, unjoined/nonmember refusals, partner escalation, and retry isolation.

### 2026-10-25 - Resend email provider

Family invitation email now calls Resend through native server-side fetch. The Amazon SES SDK is removed. RESEND_API_KEY and RESEND_FROM_ADDRESS replace SES email configuration; APP_URL still builds the join link, and AWS credentials remain for photo storage. Existing durable send records, concurrency claims, saved-invitation failure feedback, and retry behavior remain. Retry sends are paced within each request. Tests cover successful Resend responses, rejected credentials and quota, malformed responses, network failure, and missing configuration. The architecture, database, API docs, README, and environment example reflect the provider change. Live delivery awaits local Resend configuration.

### 2026-10-25 — Family invitations and joining

Family and Invite family follow the updated Stitch desktop/mobile references inside the existing workspace. Admins invite the opposite partner as the second admin or a helper with a supported relation. Unique email and partner-slot indexes prevent duplicates under concurrency; invitation and email records are written in one MongoDB transaction. SES send failures preserve the pending invitation and show persistent feedback alongside the existing toast. Retry claims existing unsent family email rows, sends at most 50, and skips sent or joined invitations; no background worker is added. Family exposes actual email status to admins and supports paged reading for helpers and admins, plus confirmed helper removal without deleting the account. Public Join shows only invitation context, handles unavailable/temporary-failure and account-mismatch states, and grants membership only on an authenticated, matching-email acceptance. Login/signup prefill the invited email and return to Join instead of wedding setup. Existing member-list responses now include admin-only emailStatus when a send record exists. Guest/reminder retry remains for the later guest feature. The SES SDK and tests for validation, permissions, transactions, retries, rate limits, and concurrent acceptance/invitations are included.

### 2026-10-24 � Outfit and Fraunces typography

Outfit is the default interface font, including navigation, forms, functional headings, dates, amounts, toast messages, and compact wedding references. Fraunces is used for the landing hero headline and the prominent couple names on Dashboard, the invitation preview, and the congratulations card. Both variable fonts load once through Next.js. Display sizes and wrapping follow the typography guide, editable fields use 16px on mobile, and numeric columns request tabular figures. Existing imagery, copy, and animation boundaries remain in place.

### 2026-10-24 — Entrances across the existing journey

The landing hero enters as one group, its photograph softly fades, and the lower landing groups reveal once near the viewport. The shared account screen animates the heading and form together and fades its desktop photograph; mobile keeps the existing image-free layout. The wedding list title and rows enter with a capped stagger, setup enters as title, photograph, and complete form, and the congratulations card enters as one panel. Shared Motion primitives preserve semantic list items, readable server HTML, image loading, form input, and reduced-motion preferences. Typing, validation, saves, and row updates do not restart existing entrances.

### 2026-10-24 — Motion for React

The wedding workspace uses the `motion` package with reusable section and panel boundaries. Opening a different section fades the outgoing content and reveals the incoming panels; Dashboard staggers its title, events, summary cards, and detail cards within 500ms. Couple enters as one panel, and Invitation enters editor-first. Entrances replay on section changes, including returning to Dashboard, while saves and typing keep the existing animation boundary. The header and navigation stay steady. Reduced-motion preferences remove translation and stagger, and server-rendered content stays visible before hydration. The dependency and npm lockfile are included.

### 2026-10-24 — Wedding screen polish and motion

Dashboard, Couple, and Invitation follow the updated Stitch references and shared motion specification. The signed-in name appears as plain medium-weight text on the header background, admin captions align in the sidebar, and the active underline moves between sections. The dashboard reveals its content in groups on first opening; section changes fade out and rise in. Mobile navigation has larger touch targets and tighter spacing above the content. Save hover states, field focus, and reduced-motion behavior are consistent across both forms.

### 2026-10-22 — Couple and invitation

**Couple** and **Invitation** each replace the main column, and **Dashboard** returns to this wedding’s events and counts. An admin can correct the bride’s name, the groom’s name, and the first and last day, and can write the one invitation message. The preview uses the saved names, the saved dates, and the seven events. A helper cannot change either. Inviting the other admin and the family is not built yet.

### 2026-10-22 — The wedding

A wedding on `/home` opens its dashboard. The screen shows the couple, the seven events in order, and the real counts: guests, tasks, and spend start at nothing, and the family count is the people on this wedding.

### 2026-10-22 — Start the wedding

`/home` shows **Start the wedding** until this person has a wedding. The form takes the bride’s name, the groom’s name, the first date, the last date, and whether they are the bride or the groom. `POST /api/weddings` writes the wedding, the creator’s admin membership, and the seven events in order. The wedding gets a unique `publicSlug` for the future public page. Saving opens `/home/created`, the congratulations card with the couple’s names and the dates. **Continue** lists the wedding on `/home`. A repeated save returns that same wedding, and creating weddings stops after ten attempts. The setup photograph is a cream invitation on linen.

### 2026-10-20 — Accounts

Sign up, sign in, and sign out. The password is stored as a hash. The session is an httpOnly cookie whose JWT carries only the session id. `/login` and `/signup` follow the Stitch login spec. `/home` lists the signed-in person’s weddings, and a new account sees none. Forgot password is on the login screen. The reset email is not sent until Amazon SES is configured.

### 2026-10-20 — Landing page

The public home page replaces the placeholder. It has the wordmark, the hero, the Events, Guests, and Family lines, the sample task list, the coming-up list, and the footer. The images are `public/logo.png` and `public/landing-hero.jpg`.

### 2026-10-19 — App shell

Next.js app with the App Router, TypeScript, and Tailwind. The color tokens, the root layout, and `GET /api/health` are in place. The product docs are in `docs/`: the PRD, the product plan, the feature list, the architecture, the database design, the API design, and the Stitch screen prompts.
