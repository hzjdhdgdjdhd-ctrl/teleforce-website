# Teleforce Technology — Enterprise Website

Human-powered BPO and business operations, presented for enterprise
decision-makers. React · TypeScript · Tailwind CSS v4 · Framer Motion.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
npm run lint
```

---

## ⚠️ Read this before the site goes live

The site deliberately makes **no claim that cannot be evidenced**. There are no
invented statistics, testimonials, client logos or certifications anywhere in
it. Several values are placeholders, and they are all marked `TODO:` in source.

```bash
grep -rn "TODO:" src/
```

### Must fix before launch

| # | Item | Where |
|---|------|-------|
| 1 | **Logo descriptor reads `SYETEMS & SERVICES`** — reproduced verbatim from the supplied artwork. If that is a typo for `SYSTEMS`, change the one constant. | `src/assets/Logo.tsx` → `DESCRIPTOR` |
| 2 | **Contact email is a Gmail address.** A personal Gmail on an enterprise BPO site undercuts every trust signal the rest of the site builds. Move to a domain address. | `src/config/company.ts` → `email` |
| 3 | **No published phone number.** Left blank rather than invented; the UI hides the field while it is empty. | `src/config/company.ts` → `phone` |
| 4 | **Confirm the live domain** (used in `robots.txt` and structured data). | `src/config/company.ts`, `public/robots.txt`, `index.html` |
| 5 | **Verify every service line** describes work you actually staff today. | `src/data/services.ts` |
| 6 | **Verify every technology capability.** This is the easiest section to over-claim. | `src/data/technology.ts` |
| 7 | **Verify every safeguard** in the data protection measures. Delete any line you could not demonstrate to a client auditor. | `src/data/dataProtection.ts` → `measures` |
| 8 | **Confirm the coverage hours** you will commit to contractually. | `src/config/company.ts` → `coverage` |
| 9 | **Wire up the contact form** (see below). | `.env` |

### Company data

All statutory values come from the MCA / ROC public register and are held in
one place, `src/config/company.ts`:

- **Tele Force Technology Private Limited**
- CIN `U72900WB2016PTC217414` · Registration `217414` · ROC Kolkata
- Incorporated 2 September 2016 · Private company limited by shares
- NIC 7290 — other computer related activities
- Registered office: Webel IT Park, 3rd Floor, Phase 2, Paribahan Nagar,
  Matigara, Siliguri, West Bengal 734010, India

Nothing beyond the public register is asserted anywhere on the site.

---

## Contact form

Submission is **not** wired to a backend by default, and deliberately so — a
form that silently pretends to send is worse than one that does not.

- **With `VITE_CONTACT_ENDPOINT` set**, the form `POST`s JSON to that URL and
  shows a genuine success or failure state.
- **Without it**, the form validates, composes the enquiry, and hands it to the
  visitor's mail client — then tells them exactly that.

```bash
echo 'VITE_CONTACT_ENDPOINT=https://your-endpoint.example/enquiries' > .env.local
```

The form includes client-side validation and a honeypot field. It does **not**
include a CAPTCHA — add server-side rate limiting on whatever endpoint you use.

---

## Data protection page

`src/data/dataProtection.ts` carries an editorial rule in its header comment.
In short:

> This page claims **no** certifications, audit outcomes or accreditations. It
> describes how the business is designed to operate. If Teleforce later obtains
> a certification, add it here **with its registration number and expiry** — and
> not before.

The page also states plainly that delivery is from India and that personal data
may be processed outside the UK. That is a material fact for a UK controller,
and burying it would be the wrong call commercially as well as ethically.

---

## Architecture

```
src/
├── assets/Logo.tsx           Vector logo — primary + reversed lockups
├── config/company.ts         Single source of truth for company facts
├── data/                     All page copy, separated from presentation
│   ├── services.ts           Service lines, pillars, engagement stages
│   ├── teams.ts              Team models, pod roles
│   ├── technology.ts         Front end / back end capability
│   └── dataProtection.ts     Principles, measures, rights
├── components/
│   ├── layout/               Navbar (mega menu), Footer, Layout, ScrollManager
│   ├── sections/             Hero, Philosophy, TechSplit, ContactForm, CtaBand
│   ├── ui/                   Button, Card, Section, Reveal, Icons
│   └── visuals/
│       ├── Globe.tsx         Canvas 3-D globe, great-circle route arcs
│       └── HumanNetwork.tsx  Human silhouettes + connection lines
├── hooks/useSeo.ts           Per-route title and meta description
└── index.css                 Design tokens, primitives, keyframes
```

### The globe

A real orthographic projection rather than an image: a graticule sphere with
depth-sorted near/far hemispheres, delivery-hub nodes at genuine coordinates,
and great-circle arcs carrying travelling pulses along the UK ⇄ India corridor.

It **sways ±24° around that corridor** instead of rotating fully, so the
delivery story stays legible while the mark still moves. It pauses when
scrolled out of view and freezes under `prefers-reduced-motion`.

### Design system

Brand tokens live in the `@theme` block of `src/index.css`:

| Token | Value | Role |
|-------|-------|------|
| `obsidian` | `#050A14` | Page ground |
| `navy` | `#0B1B2B` | Panels and cards |
| `exec` | `#123A63` | Structure, gradients, graticule |
| `gold` | `#D4AF37` | Rare accent — hairlines, eyebrows, primary CTA |
| `pearl` | `#EAF2FA` | Primary text |

Type: **Inter Tight** (display) · **Inter** (body) · **IBM Plex Mono** (technical
micro-labels). Gold is treated as precious — used for a hairline, a label or a
single CTA, never as a fill.

### Accessibility

- All body text meets **WCAG AA** contrast on its background (audited; the
  muted tones were lifted from 4.36:1 to 5.95:1 during build).
- Full `prefers-reduced-motion` support — animation is disabled globally in CSS
  and every Framer Motion component checks `useReducedMotion()`.
- Skip-to-content link, semantic landmarks, visible focus rings, labelled form
  fields with inline errors, `aria-live` status messaging.
- Keyboard-navigable nav; `Escape` closes menus.

---

## Deployment

Static SPA — build `dist/` and serve it. Deep links need a catch-all rewrite to
`index.html`; configs for the two common hosts are included:

- Netlify → `public/_redirects`
- Vercel → `vercel.json`

Output is split into three cached chunks (app ≈ 28 kB, Framer Motion ≈ 44 kB,
React ≈ 79 kB gzipped) so a copy edit does not invalidate the vendor bundles.
