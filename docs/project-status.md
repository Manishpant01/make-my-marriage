# MakeMyMarriage — project status

What is built in the repo. Product plans stay in the other docs. This file is only the work that has landed.

When a feature is built, update **Now**, then add a log entry at the top of **Log**.

## Now

The app shell, the public landing page, and accounts are in place. A person can sign up, sign in, and sign out. A new account lands on **Start the wedding**. Saving it writes the wedding, an admin membership, and the seven starting events, then shows the congratulations screen. **Continue** returns to `/home`, which lists that wedding with its dates. The wedding workspace is not built. Password reset mail is not sent yet.

## Log

### 2026-10-22 — Start the wedding

`/home` shows **Start the wedding** until this person has a wedding. The form takes the bride’s name, the groom’s name, the first date, the last date, and whether they are the bride or the groom. `POST /api/weddings` writes the wedding, the creator’s admin membership, and the seven events in order. The wedding gets a unique `publicSlug` for the future public page. Saving opens `/home/created`, the congratulations card with the couple’s names and the dates. **Continue** lists the wedding on `/home`. A repeated save returns that same wedding, and creating weddings stops after ten attempts. The setup photograph is a cream invitation on linen.

### 2026-10-20 — Accounts

Sign up, sign in, and sign out. The password is stored as a hash. The session is an httpOnly cookie whose JWT carries only the session id. `/login` and `/signup` follow the Stitch login spec. `/home` lists the signed-in person’s weddings, and a new account sees none. Forgot password is on the login screen. The reset email is not sent until Amazon SES is configured.

### 2026-10-20 — Landing page

The public home page replaces the placeholder. It has the wordmark, the hero, the Events, Guests, and Family lines, the sample task list, the coming-up list, and the footer. The images are `public/logo.png` and `public/landing-hero.jpg`.

### 2026-10-19 — App shell

Next.js app with the App Router, TypeScript, and Tailwind. The color tokens, the root layout, and `GET /api/health` are in place. The product docs are in `docs/`: the PRD, the product plan, the feature list, the architecture, the database design, the API design, and the Stitch screen prompts.
