# Kapso WhatsApp Setup

Replaces the Twilio sandbox with Kapso (https://kapso.ai). Free tier is
enough for the portfolio demo: 2,000 messages/month, 1 connected phone
number, real digital number (no "Twilio Sandbox:" prefix), no 6-min
delivery delays. ~10 minutes to wire up.

## Step 1 — Kapso account + connected number

1. Sign up at <https://kapso.ai>. Free plan.
2. In the dashboard, follow the onboarding to **connect a phone number** —
   Kapso provides a digital number on Free tier, or you can bring your own.
3. Once the number is provisioned, copy two values:
   - **API key** — Settings → API keys. Starts with something like `kp_live_…`.
     Name it `minegocio-demo`.
   - **Phone number ID** — visible on the phone number's detail page.
     This is what scopes the outbound URL.

## Step 2 — Webhook subscription

1. In Kapso: Settings → Webhooks → Add webhook.
2. **URL**:
   ```
   https://minegocio-plum.vercel.app/api/kapso/webhook
   ```
   Method: **POST**.
3. **Events**: subscribe to at least `whatsapp.message.received`. You can
   also subscribe to `whatsapp.message.delivered` and `whatsapp.message.failed`
   for telemetry — we log them and ack with 204.
4. After saving, copy the **webhook secret** Kapso generates. We use it for
   HMAC-SHA256 signature verification.

## Step 3 — Vercel env vars

Three env vars (plus the existing `WHATSAPP_DEMO_TENANT_SLUG`):

| Key | Value | Notes |
|---|---|---|
| `KAPSO_API_KEY` | `kp_live_…` | from Step 1 |
| `KAPSO_PHONE_NUMBER_ID` | phone-number-id | from Step 1 |
| `KAPSO_WEBHOOK_SECRET` | webhook secret | from Step 2 |

Add via Vercel dashboard → Settings → Environment Variables, or have Reggie
add them via `vercel env add` as we did for Twilio.

Optional debug-only var: `KAPSO_VALIDATE_SIGNATURE=false` disables signature
checking — leave unset in production.

## Step 4 — Verify

After adding env vars + a redeploy:

1. From your phone, WhatsApp the Kapso-provisioned number with something
   like: *"hola, quiero un corte de cabello el lunes a las 11. soy Reggie."*
2. Within ~10 seconds you should see the AI agent reply in WhatsApp.
3. Check Vercel runtime logs filtered by `kapso` to see the events fire:
   `kapso.incoming` → `kapso.step` (one per tool call) → `kapso.agent_done` →
   `kapso.outbound.sent`. Each step + outbound has elapsed_ms attached.
4. Confirm a booking row in Supabase + a confirmation email with `.ics`.

## Troubleshooting

- **AI never replies** — Check Vercel logs for `kapso.invalid_signature`
  (webhook secret wrong) or `kapso.tenant_not_found` (slug mismatch). If you
  see `kapso.incoming` but no `kapso.outbound.sent`, the agent ran but the
  outbound API call to Kapso failed — check for `kapso.outbound.failed` or
  `kapso.outbound.api_error` in the same time window.
- **Webhook 403** — `KAPSO_WEBHOOK_SECRET` doesn't match what Kapso uses.
  Regenerate in Kapso dashboard and update Vercel.
- **Outbound 401** — `KAPSO_API_KEY` wrong or revoked.
- **Outbound 422** — typically "outside 24h conversation window." For Free
  tier you may need to template-approve the first outbound to a new contact.
  Not a problem for the demo flow (we always reply within the same session).

## Removing Twilio

Once Kapso is verified green:

1. Delete the Twilio webhook config in the Twilio console.
2. Remove `app/api/whatsapp/webhook/route.ts` and `lib/whatsapp/send-message.ts`.
3. Remove env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
   `TWILIO_WHATSAPP_FROM`, `WHATSAPP_VALIDATE_SIGNATURE`.
4. Update `docs/whatsapp-demo-setup.md` to point at this file.
