# MakeMyMarriage — project status

What is built in the repo. Product plans stay in the other docs. This file is only the work that has landed.

When a feature is built, update **Now**, then add a log entry at the top of **Log**.

## Now

The app shell, the public landing page, and accounts are in place. A person can sign up, sign in, and sign out. `/home` lists that person’s weddings and is empty until a wedding exists. Creating a wedding is not built. Password reset mail is not sent yet.

## Log

### 2026-10-20 — Accounts

Sign up, sign in, and sign out. The password is stored as a hash. The session is an httpOnly cookie whose JWT carries only the session id. `/login` and `/signup` follow the Stitch login spec. `/home` lists the signed-in person’s weddings, and a new account sees none. Forgot password is on the login screen. The reset email is not sent until Amazon SES is configured.

### 2026-10-20 — Landing page

The public home page replaces the placeholder. It has the wordmark, the hero, the Events, Guests, and Family lines, the sample task list, the coming-up list, and the footer. The images are `public/logo.png` and `public/landing-hero.jpg`.

### 2026-10-19 — App shell

Next.js app with the App Router, TypeScript, and Tailwind. The color tokens, the root layout, and `GET /api/health` are in place. The product docs are in `docs/`: the PRD, the product plan, the feature list, the architecture, the database design, the API design, and the Stitch screen prompts.
