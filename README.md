# MakeMyMarriage

MakeMyMarriage is a web app for a family planning a North Indian Hindu wedding. The bride, the groom, and their helpers share one wedding: events, tasks, guests, a digital invitation, wedding spend, a public wedding page, photos, and an embedded YouTube player.

Guests do not get an account. Each guest opens a personal invitation from email and replies yes or no for each event they are invited to.

## Stack

One Next.js app, TypeScript, the App Router, and Node.js. Screens and Route Handlers live in that app.

- Tailwind CSS
- Zod for input checks
- MongoDB Atlas through the official driver
- Email and password sign-in, with the session stored in Atlas
- Private Amazon S3 for photos, served by CloudFront
- Amazon SES for email
- YouTube as an embed, WhatsApp as a `wa.me` link

Product decisions are in `docs/`.

## Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app opens at [http://localhost:3000](http://localhost:3000). It boots before those environment values are filled in. The home page is a placeholder. `GET /api/health` returns `{ "ok": true }`.

| Script | Does |
|---|---|
| `npm run dev` | Start the local app |
| `npm run build` | Production build |
| `npm run start` | Run that build |
| `npm run typecheck` | Typecheck |
| `npm run lint` | Lint |
