# Google Calendar Setup (Portfolio Demo)

Wires the booking flow to your *actual* Google Calendar via a Google Cloud
service account. ~10 minutes total. The end result: when the AI agent
confirms a booking on WhatsApp, an event appears on your Google Calendar
within seconds, and the confirmation email carries an `.ics` invite for
any other calendar.

Production multi-tenant calendar lives in Nylas per the system
architecture doc — this is a single-tenant shortcut for the demo.

## Step 1 — Create a Google Cloud project

1. Go to <https://console.cloud.google.com/projectcreate>.
2. **Project name**: `minegocio-demo` (or anything). **No organization** is
   fine for a personal Google account.
3. Click **Create**. Wait ~10 seconds.
4. Make sure the new project is selected in the top-bar project picker.

## Step 2 — Enable the Google Calendar API

1. Go to <https://console.cloud.google.com/apis/library/calendar-json.googleapis.com>.
2. Make sure `minegocio-demo` is selected in the project picker at the top.
3. Click **Enable**. Wait ~5 seconds.

## Step 3 — Create a service account

1. Go to <https://console.cloud.google.com/iam-admin/serviceaccounts>.
2. Click **Create Service Account** (top of page).
3. **Service account name**: `minegocio-booking`. **ID** auto-fills.
4. Click **Create and Continue** → skip the "Grant access" step → click **Done**.

## Step 4 — Generate a JSON key

1. Back on the service-accounts list, click `minegocio-booking@...iam.gserviceaccount.com`.
2. Click the **Keys** tab.
3. **Add Key → Create new key** → choose **JSON** → **Create**.
4. A `.json` file downloads automatically. **Keep it safe** — this is a
   service-account private key, equivalent to a password.

The JSON contents look like:

```json
{
  "type": "service_account",
  "project_id": "minegocio-demo",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "minegocio-booking@minegocio-demo.iam.gserviceaccount.com",
  ...
}
```

Copy the value of `client_email` — you'll need it in Step 5.

## Step 5 — Share your Google Calendar with the service account

The service account starts with zero access. You explicitly grant it
write access to *your* calendar.

1. Open <https://calendar.google.com> (logged in as yourself).
2. In the left sidebar, hover your name's calendar (the primary one) →
   click the **⋮** menu → **Settings and sharing**.
3. Scroll to **"Share with specific people or groups"** → **Add people and groups**.
4. Paste the service account email from Step 4:
   ```
   minegocio-booking@minegocio-demo.iam.gserviceaccount.com
   ```
5. **Permissions**: select **"Make changes to events"** (not "See all event details").
6. Click **Send**. The service account is now allowed to insert events.

You can also find your **Calendar ID** on this same Settings page (scroll
to "Integrate calendar" — it's typically your gmail address for the
primary calendar). Copy it; you'll need it in Step 6.

## Step 6 — Add env vars to Vercel

You need two env vars. Reggie can add them via Vercel CLI (paste both
values into the chat and he'll set them), or do it yourself in the
dashboard.

### `GOOGLE_SERVICE_ACCOUNT_JSON` (base64-encoded JSON key)

To get the base64 value from the JSON file you downloaded in Step 4:

**On macOS / Linux:**
```bash
base64 -i ~/Downloads/minegocio-demo-xxxx.json | tr -d '\n' | pbcopy
```

**On Windows PowerShell:**
```powershell
$bytes = [System.IO.File]::ReadAllBytes("$HOME\Downloads\minegocio-demo-xxxx.json")
[Convert]::ToBase64String($bytes) | Set-Clipboard
```

The base64 string is now in your clipboard. Paste it as the value.

### `GOOGLE_CALENDAR_ID`

The calendar email from Step 5. For your primary calendar this is just
your gmail (e.g., `reggieebryant@gmail.com`).

### Optional

| Key | Value | Purpose |
|---|---|---|
| `GOOGLE_CALENDAR_SEND_UPDATES` | `none` (default), `all`, or `externalOnly` | Whether Google itself emails attendees an invite. We already send a branded confirmation, so default is `none` to avoid double-mailing. |

## Step 7 — Verify

After setting the env vars and redeploying:

1. From WhatsApp, complete a booking with the AI (give it your email and a future date/time).
2. Within ~3 seconds, the event should appear on your Google Calendar at
   the booked time, titled like *"Corte de cabello con Maria · Salon Maria"*.
3. Your confirmation email arrives with an `.ics` attachment — clicking it
   on any device gives you the same event in whatever calendar that
   device uses.

If the event doesn't appear, check Vercel runtime logs for the
`calendar.*` events:

- `calendar.skipped reason=no_service_account` → `GOOGLE_SERVICE_ACCOUNT_JSON` missing or unparseable.
- `calendar.skipped reason=no_calendar_id` → `GOOGLE_CALENDAR_ID` missing.
- `calendar.insert_failed message=...` → the service account lacks
  write access to the calendar (re-do Step 5) or the API isn't
  enabled on the project (re-do Step 2).
- `calendar.parse_credentials_failed` → the base64 decode failed.
  Re-encode the JSON file with the commands above.

## Production: graduate to Nylas

When MiNegocio onboards its first paying business, the service-account
pattern doesn't scale — every tenant needs their own calendar linked
without sharing it with our Google account. That's what Nylas solves
(per `MiNegocio_System_Architecture.md` in Obsidian: $0.90/account/month,
covers Google + Outlook + Apple). Migrate when ready.
