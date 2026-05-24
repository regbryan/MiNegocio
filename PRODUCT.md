---
register: product
last_updated: 2026-05-23
sources:
  - 30 Projects/MiNegocio/_MiNegocio MOC.md (Obsidian)
  - 30 Projects/MiNegocio/MiNegocio_System_Architecture.md (Obsidian)
  - 30 Projects/MiNegocio/Mexico_SMB_Digital_Package_Research.md (Obsidian)
  - DESIGN.md (mascot-anchored visual identity)
  - scripts/seed.ts (Salon Maria pilot tenant)
---

# MiNegocio Digital — PRODUCT.md

> What we make, who we make it for, and how it should feel. Read this before
> designing or writing copy. If the answer isn't here, ask — don't invent.

## Current build phase: portfolio-grade live demo

Today (May 2026) the site is **a live demo, not a sign-up funnel**. The
single concrete thing it must prove, end-to-end, is:

> Send a WhatsApp message to a real number. The AI books an appointment at
> Salon Maria. An email confirmation lands in the customer's inbox.

That loop — WhatsApp → AI → calendar → email — is the entire pitch.
Everything else on the site supports that demo: the chat widget shows the
same conversation you'd have over WhatsApp, the onboarding flow proves the
same AI can set up a business in Spanish, the legal pages show that we
take privacy seriously, but **the loop is the product right now**.

Implementation today:
- **WhatsApp transport: Twilio WhatsApp sandbox** (shared sender, Twilio
  prefix shows in chat — acceptable for portfolio demo, not real product).
  Future: Meta WhatsApp Cloud API on a verified business number.
- **Email: Resend** (default `onboarding@resend.dev` sender or
  `notifications@<your-domain>` if a domain is verified; free 100/day).
  Future: Amazon SES per the system architecture doc.
- **Calendar: in-database bookings** stored in Supabase `bookings` table.
  Nylas wiring (Google/Outlook/Apple) is deferred to a later phase.

This phase ends when: (a) the WhatsApp number is approved on a real
business profile, (b) SES is verified on a real domain, (c) Nylas is
wired to a real calendar, and (d) the first paying pilot is signed.
Until then we are a portfolio piece, and the design serves *that* job.

## What it is

A multi-tenant SaaS that gives Mexican small businesses a 24/7 Spanish-speaking
AI assistant on **WhatsApp** (where 93% of Mexico already lives), plus a
booking calendar, automated email follow-ups, and a lightweight tenant
website. One platform replaces five tools the owner can't afford to wire up
themselves: a website, a chatbot, a booking system, email marketing, and a
CRM.

The thing the owner pays for is not "an AI." They pay to stop missing
appointments, stop answering "¿a qué hora abren?" forty times a day, and stop
losing customers to the salon down the street that already has a booking
link in their bio.

Pricing target: ~$45 USD/mo at Professional tier. Cost-to-serve: ~$7–9/mo.
Gross margin: ~82%. The economics let us price for a *taquería* and still
make money.

## Users

### Primary: la dueña / el dueño de un negocio chiquito (LATAM)

- 32–55, business owner in any LATAM metro: CDMX, Bogotá, Medellín, Lima,
  Santiago, Buenos Aires, San José, San Salvador, GDL, MTY, etc. Mexico is
  the first launch market because of the WhatsApp penetration data and
  Reggie's network, but the product is built for LATAM-wide expansion
  from day one.
- Runs a salon, taquería / restaurante, dental clinic, taller mecánico,
  papelería, gym, veterinaria, or any walk-in-plus-appointment business
  with 1–15 employees.
- Phone-first: most of the work day is on WhatsApp Business already, often
  on the same number as the personal account.
- Speaks Spanish, often only Spanish. English instructions read as
  "this isn't for me." We default to **neutral LATAM Spanish** —
  *tú-form*, no regional slang, no Spain-specific verbs (no *vosotros*,
  no *coger*). Avoid Mexico-specific idioms in shared copy; reserve them
  for surfaces that are explicitly Mexico-only (e.g., Salon Maria's demo
  responses are CDMX-flavored because *she* is, not because the platform is).
- Does not have a developer. Has heard the word "API" and it scared her.
  Sets up tools by following YouTube tutorials. Will abandon anything that
  asks for a credit card before showing value.
- Pays for things with **OXXO**, **SPEI**, or **tarjeta**. Stripe MX
  or Conekta handle this; the user never sees a payment method she
  doesn't recognize.
- Has lost real money to no-shows and to customers who DM'd at 11pm and
  got no answer until morning.

### Secondary: the customer who texts María

- Could be anyone in Mexico — abuelita, treintañero in jeans, college
  student. The platform's *other* user.
- Texts in Mexican Spanish, often informally (lowercase, missing acentos,
  voice notes, emojis). The AI handles all of it without correcting.
- Wants: book/reschedule, ask about prices/hours/parking, get a quick
  human if the AI gets stuck. In that order.
- Will never log in. Will never see the dashboard. Their experience is
  100% inside WhatsApp (or, for the web demo, the embedded chat widget).

### Tertiary: us / the team

Reggie is the operator. Solo founder for now, with AI help. The product
must be operable by one person — no team-of-ten admin tooling.

## What the landing page must do today

This is a **portfolio-demo landing page**, not a SMB acquisition page yet.
Its job is to put a real WhatsApp number, a real chat conversation, and a
real email confirmation in front of a visitor inside 30 seconds. No
sign-up. No pricing. No form.

In ≤ 10 seconds the visitor needs to:

1. **Understand the loop.** A short sentence: "Mándale un WhatsApp a Salon
   Maria y agenda una cita. La confirmación te llega por correo."
2. **See the WhatsApp number to text** (with a one-click `wa.me/...` link
   for desktop visitors).
3. **See the on-site demo chat** (same agent, same voice) for visitors who
   can't or won't text right now.
4. **Trust this is real** — show a live booking count, the most recent
   email subject line, or a faint live transcript.

Order on the page: **the WhatsApp number → the on-site chat demo → the
mascot and what it does → the legal/privacy footnote**. Pricing, feature
grids, testimonials, and any "Sign up free" CTA are explicitly out of
scope until the product moves out of portfolio-demo phase.

## What we're selling at /onboard and /chat

`/onboard` sells *the act of signing up itself*: a Spanish-speaking
assistant walks the owner through registering her business by asking
one thing at a time. If onboarding feels like a form, we failed.
The onboarding chat **is** a demo of the customer-facing chat —
the same UI, the same voice, the same vibe.

`/chat/[slug]` is the customer experience. María's job here is to
forward a link to a customer who's never used it, and have that
customer book a haircut without asking María a single question.

## Voice & tone (the rules the AI itself follows)

Same rules apply to UI copy, marketing copy, and the chat agent.
They're not a marketing voice; they're the product.

- **Neutral LATAM Spanish, *tú-form*.** Default. English in a user
  surface is a bug. Spain Spanish (vosotros, coger) is also a bug.
  Mexico-specific idioms are fine *inside Salon Maria's tenant responses*
  because she is a CDMX salon; not fine in shared platform copy.
- **Friendly-professional.** Warm enough that María trusts you with
  her livelihood. Not goofy. The mascot does the warmth so the copy
  doesn't have to.
- **One thing at a time.** One question per message. One CTA per
  screen. One primary metric per dashboard panel. If you're tempted to
  add a second, ask which one to cut first.
- **Specific over hype.** Not "Supercharge your business." Not
  "Revoluciona tu atención." Say what it does in nouns: "Tu asistente
  contesta WhatsApp y agenda citas, día y noche."
- **Concrete examples over abstractions.** "Salon Maria en la Condesa"
  beats "tu negocio." Salon Maria is a real seeded tenant; use her.
- **No jargon.** Not "agente," not "tool-calling," not "RAG,"
  not "multi-tenant." María doesn't know those words, and the
  customer texting her definitely doesn't.
- **No marketing English in Spanish copy.** No *boost*, no
  *engagement*, no *workflow*. There are Spanish words for everything.

## Anti-references (don't look like these)

Match-and-refuse. If a generated draft reminds you of any of these,
rework before showing it.

- **Generic LATAM-SaaS landing page** with a centered hero, two CTAs,
  three-up feature grid with icons, and a "Diseñado para
  emprendedores 🚀" line. Every Mexican fintech in 2022 looked like
  this. Avoid the entire shape, not just the copy.
- **Stripe.com / Linear.com clone in Spanish.** Beautiful, but for
  *developers*. María does not read marketing pages with that
  vocabulary. We are not Stripe; we are the *thing on top of*
  Stripe that María actually uses.
- **WhatsApp Business API marketing pages** (Twilio, Wati, MessageBird).
  Enterprise-grade dashboards, English by default, screenshots full of
  Lorem ipsum. We're the opposite end of the market.
- **Crypto / fintech-noir** dark mode with neon-on-black, animated
  gradient blobs, and a hero metric. Genre cliché.
- **Cardocalypse.** Every section a card on a card on a card. The
  bg-card-card-card stacking trap.
- **AI-marketing slop.** "Boost / Supercharge / Streamline / Unlock."
  Em-dashes as connective tissue. "Crafted with care." Italic serif
  display heroes. Banned by the global anti-slop rules already; calling
  it out again because Spanish translations of these clichés
  are just as bad.

## Strategic principles

- **The mascot is the brand mark.** No separate wordmark logo, no
  monogram, no speech-bubble icon. The smiling green phone in the
  red beanie is the only visual identifier we ship. See DESIGN.md
  → Mascot Usage.
- **Dark by default, period.** Light mode is undefined. Do not invent
  one mid-design. (DESIGN.md is explicit about this.)
- **Neutral LATAM Spanish first.** English-language surfaces ship only
  when an English-speaking audience is explicitly addressed (e.g., this
  PRODUCT.md is in English because it's for the build team). User-visible
  copy is LATAM Spanish (`es-419`), not `es-MX` strictly.
- **No pricing in portfolio-demo phase.** Pricing returns when we leave
  portfolio-demo phase and start signing pilots. Until then, "¿cuánto
  cuesta?" is answered with "estamos en piloto, escríbenos" or omitted
  entirely.
- **Demos before forms.** Every entry path leads to a working thing
  she can poke before she's asked for an email. Salon Maria seed is
  the demo; lean on her.
- **WhatsApp is the product surface for customers; the web is the
  product surface for María.** Don't conflate them. The web app
  exists for María to set up, monitor, and adjust. The customer
  almost never visits it.
- **One operator, one founder.** No admin views that require a team
  to operate. No multi-seat dashboards. If a feature needs three
  people on staff to make sense, don't build it yet.
- **Density matches surface.** The dashboard is dense (María is
  power-using a tool). The landing is generous (María is deciding
  whether to trust us). The chat widget is mid-density (a customer
  is talking to a person, not reading a report).

## What we are *not*

- Not a generic chatbot platform. We don't sell "build your own bot."
- Not a CRM. We capture customer data because the chat needs it,
  but we don't compete with HubSpot or Salesforce.
- Not a booking platform standalone. Calendly already exists. Our
  booking only matters because it's wired into the chat that takes
  the booking.
- Not a marketing automation tool. We send transactional follow-ups
  (cita en 24 horas, gracias por venir). We don't blast newsletters.
- Not international yet. CDMX → MTY → GDL → second-tier MX cities
  before we touch Colombia, Spain, US-Hispanic, anywhere.

## Open questions

These are real questions, not aspirational TODOs. Pick them up before
designing into them.

- **Twilio sandbox sender label**: the demo number will read as "Twilio
  Sandbox" in WhatsApp until we move to a Meta-verified number. The
  landing copy must own this honestly ("número de prueba", "sandbox") so
  the visitor doesn't see "Twilio" and assume the product itself is
  half-baked. Verify the chosen wording when shaping the landing page.
- **Second seeded tenant**: Salon Maria is the only seed. Adding a
  *taquería* or *consultorio dental* would let non-salon visitors
  pattern-match in the demo. Defer unless the landing redesign needs
  more than one example.
- **WhatsApp logo usage**: Meta has strict trademark rules. Saying "por
  WhatsApp" is fine; the official green-and-white icon needs a
  permission/usage review before shipping in the landing hero.
- **English entry point**: zero today. Revisit only when a US-Hispanic
  small-business segment becomes a real channel, or when we want a
  portfolio reviewer who doesn't speak Spanish to grok the page.
