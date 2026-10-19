# MakeMyMarriage — project status

What is built in the repo. Product plans stay in the other docs. This file is only the work that has landed.

When a feature is built, update **Now**, then add a log entry at the top of **Log**.

## Now

The app shell is up, and `/` is the public landing page. Sign-in, sign-up, and the wedding workspace are not built. The landing page links to `/login` and `/signup`, and those routes do not exist yet.

## Log

### 2026-10-20 — Landing page

The public home page replaces the placeholder. It has the wordmark, the hero, the Events, Guests, and Family lines, the sample task list, the coming-up list, and the footer. The images are `public/logo.png` and `public/landing-hero.jpg`.

### 2026-10-19 — App shell

Next.js app with the App Router, TypeScript, and Tailwind. The color tokens, the root layout, and `GET /api/health` are in place. The product docs are in `docs/`: the PRD, the product plan, the feature list, the architecture, the database design, the API design, and the Stitch screen prompts.
