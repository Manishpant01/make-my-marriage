# MakeMyMarriage — project status

What is built in the repo. Product plans stay in the other docs. This file is only the work that has landed.

When a feature is built, update **Now**, then add a log entry at the top of **Log**.

## Now

The app shell, the public landing page, and accounts are in place. A person can sign up, sign in, and sign out. A new account lands on **Start the wedding**. Saving it writes the wedding, an admin membership, and the seven starting events, then shows the congratulations screen. **Continue** returns to `/home`, which lists that wedding. Opening it shows the dashboard: the couple, the events, and the real counts. An admin can correct the couple’s names and the wedding dates, and can write the one invitation message. Dashboard, Couple, and Invitation share the updated signed-in header and aligned admin captions. Motion for React controls workspace transitions and entrances across the landing page, account forms, wedding list, setup, and congratulations card, with reduced-motion support. The interface uses Outfit, with Fraunces reserved for the landing headline and prominent couple names. The wedding workspace beyond those screens is not built. Password reset mail is not sent yet.

## Log

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
