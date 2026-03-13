## Moose Barbershop (modern site + booking)

Modernized website + account-less booking flow:

- **Structure**: Home / About / Portfolio / Pricing / Contact (pricing matches the current site)
- **Booking**: Client books a time slot with name + email + phone (no accounts)
- **Deposit**: Redirects to **Square hosted checkout** for a **$10 deposit**
- **Confirmations**: Square webhook confirms booking and sends emails to client + admin
- **Admin**: `/admin` calendar + bookings list (simple password gate)

### Tech stack (OSS)

- Next.js (App Router) + Tailwind
- Drizzle ORM + Postgres
- react-big-calendar (admin calendar)
- nodemailer (SMTP email)
- Square SDK (payments)

### Local development

1) Install deps

```bash
npm install
```

2) Create `.env.local`

Copy `.env.example` to `.env.local` and fill in values.

3) Run dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

### Square setup (deposit + webhook)

1) **Create a Square app** and get:
- `SQUARE_ACCESS_TOKEN` (sandbox for testing, production when going live)
- `SQUARE_LOCATION_ID`

2) **Set webhook URL** in Square Dashboard:
- Point it to: `https://<your-public-url>/api/square/webhook`
- Copy the webhook signature key into `SQUARE_WEBHOOK_SIGNATURE_KEY`
- Set `SQUARE_WEBHOOK_NOTIFICATION_URL` to the exact same URL you configured in Square

Square calls the webhook on payment events; this code confirms the booking when payment status is `COMPLETED`.

### Admin access

- Visit `/admin/login`
- Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `.env.local`

### Hosting a public dev preview (to show the client)

Recommended: **Vercel** (free preview deployments).

- **Option A (best)**: Push this repo to GitHub → import into Vercel → every push creates a new shareable preview URL.
- **Option B (quick demo)**: Use a tunnel like Cloudflare Tunnel or ngrok to expose your local `localhost:3000`, then set:
  - `SITE_URL` to the public tunnel URL
  - `SQUARE_WEBHOOK_NOTIFICATION_URL` to `${SITE_URL}/api/square/webhook`

For Square webhooks, you need a stable public URL (Vercel previews work well; tunnels also work for short demos).

### Instagram “latest posts” section (optional)

The homepage has an Instagram section that can show the latest posts if you set:

- `INSTAGRAM_USER_ID`
- `INSTAGRAM_ACCESS_TOKEN`

If not set, it falls back to showing the local portfolio photos and links to the Instagram profile.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
