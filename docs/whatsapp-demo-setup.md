# WhatsApp + Email Demo Setup

How to wire the portfolio-demo loop: Twilio WhatsApp sandbox → MiNegocio AI →
Supabase booking → Resend email confirmation. ~15 minutes start to finish.

## What you'll need

- A phone with WhatsApp (yours).
- A Twilio account (free trial, no credit card to start).
- A Resend account (free tier: 100 emails/day).
- Vercel project access (you have it; it's `prj_UHRZITA67i7qQXwqeZJo9XdfLF21`).

## Step 1 — Twilio account + WhatsApp sandbox

1. Sign up at <https://www.twilio.com/try-twilio>. Verify your email + phone.
2. In the Twilio Console, go to **Messaging → Try it out → Send a WhatsApp
   message**. (Direct URL once logged in:
   <https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn>.)
3. The page shows:
   - A sandbox sender number (the shared one is `+1 415 523 8886`,
     `whatsapp:+14155238886` in webhook format).
   - A join code unique to your account, e.g. `join harbor-foggy`.
4. **From your phone's WhatsApp**, send the join code as a message to
   `+1 415 523 8886`. You'll get a reply confirming you've joined. You're now
   whitelisted to message the sandbox from this phone.
5. Click **Sandbox settings** at the top of that page (or go directly to
   <https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox>).
6. Set **"When a message comes in"** to:

   ```
   https://minegocio-plum.vercel.app/api/whatsapp/webhook
   ```

   HTTP method: **POST**. Save.

7. Copy these three values — you'll paste them into Vercel in Step 3:
   - **Account SID** (top of any Console page, starts with `AC...`)
   - **Auth Token** (top of any Console page — click to reveal)
   - **Sandbox sender** (the `whatsapp:+14155238886` value; same for every
     trial account)

## Step 2 — Resend account + API key

1. Sign up at <https://resend.com>. Verify your email.
2. **Dashboard → API Keys → Create API Key**. Name it `minegocio-demo`,
   permission **Full access** (or `Sending access` if you prefer).
3. Copy the key — it starts with `re_...`. **Save it now**; the dashboard only
   shows it once.

For the portfolio demo we use Resend's default sender
`onboarding@resend.dev`. This works without any DNS setup, but it can only
deliver to **the email you used to register your Resend account**.
The webhook is wired so every booking also CCs `reggieebryant@gmail.com`
(set via the `RESEND_OPERATOR_CC` env var below) so you'll always see the
proof land.

When you're ready to send to arbitrary customer emails, follow Resend's
[domain verification guide](https://resend.com/docs/dashboard/domains/introduction)
and set `RESEND_FROM` to `MiNegocio <hola@your-domain.com>`.

## Step 3 — Add env vars to Vercel

In the Vercel dashboard for project `minegocio`:

**Settings → Environment Variables → Add**

| Key | Value | Environments |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | `AC…` (from Twilio Console) | Production, Preview |
| `TWILIO_AUTH_TOKEN` | (from Twilio Console — reveal first) | Production, Preview |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` | Production, Preview |
| `WHATSAPP_DEMO_TENANT_SLUG` | `salon-maria` | Production, Preview |
| `RESEND_API_KEY` | `re_…` (from Resend) | Production, Preview |
| `RESEND_OPERATOR_CC` | `reggieebryant@gmail.com` | Production, Preview |

Optional (when you have a verified Resend domain later):

| Key | Value |
|---|---|
| `RESEND_FROM` | `MiNegocio <hola@minegocio.app>` |

After adding the env vars, redeploy the latest commit so the production
runtime picks them up. (Vercel → Deployments → latest → ⋯ → Redeploy.)

## Step 4 — Verify the loop

From your phone's WhatsApp, message `+1 415 523 8886`:

```
Hola, quiero hacer una cita
```

Expected:

1. **AI replies in Spanish** within 5–10 seconds — asks which service, when, etc.
2. Continue the booking flow naturally. Try: *"Un corte de cabello, mañana a las 11"*.
3. When the agent confirms the booking, **a Supabase row** appears in the
   `bookings` table (visible in the Supabase dashboard or via the dev tools at
   `/dev/schema`).
4. **An email lands** in your Resend account email + a CC at
   `reggieebryant@gmail.com`, branded MiNegocio dark mode, in Spanish.

If any step fails, check Vercel runtime logs for the project — every error
in the WhatsApp pipeline is logged with the `whatsapp.*` prefix (the route
hashes phone numbers; you'll see `from_hash: <12 chars>` rather than the
number itself).

## Common gotchas

- **AI never replies.** Likely the webhook URL is wrong in Twilio's
  sandbox settings, OR `TWILIO_AUTH_TOKEN` is missing on Vercel (the route
  rejects unsigned requests by default). Set
  `WHATSAPP_VALIDATE_SIGNATURE=false` temporarily to bypass during debugging.
- **Email never arrives.** `RESEND_API_KEY` missing on Vercel, or the
  recipient address is one Resend's free tier won't deliver to (only your
  registered email + CC works with `onboarding@resend.dev`). Check
  Resend dashboard → Logs.
- **Phone shows "Twilio Sandbox" in the chat name.** That's expected for
  the sandbox; the production Meta-verified number is a later phase.
- **WhatsApp says "session expired".** Twilio sandbox sessions time out
  after 24 hours of inactivity. Re-send the `join <code>` message to
  re-enter the sandbox.

## Future: leaving the sandbox

The Twilio sandbox is a portfolio-demo tool, not a production WhatsApp
channel. When MiNegocio signs its first paying pilot:

1. Apply for Meta Business verification.
2. Provision a real WhatsApp business number through Twilio (or migrate to
   Meta WhatsApp Cloud API directly, which the system architecture doc
   prefers).
3. Submit message templates (e.g., 24-hour reminder, cancellation notice)
   for pre-approval.
4. Update `TWILIO_WHATSAPP_FROM` (or swap the route over to Meta's API).
5. Update `RESEND_FROM` to a verified domain so customer emails work
   beyond your own inbox.
