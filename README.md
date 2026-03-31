## Stitch screens → Next.js

Deze map is een Next.js project dat jouw Stitch screens omzet naar een **werkende, mobile-first site** (proof case) met een complete flow: home → zoeken → product → cart → checkout → bevestiging.

### Runnen (dev)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### E-mail verificatie instellen

Voorkeur: gebruik Brevo API (makkelijkste setup):

```bash
APP_BASE_URL="http://localhost:3000"
BREVO_API_KEY="xkeysib-..."
BREVO_SENDER="Gear2Go <no-reply@jouwdomein.nl>"
```

Fallback: je kunt ook SMTP gebruiken:

```bash
APP_BASE_URL="http://localhost:3000"
SMTP_HOST="smtp.jouwdomein.nl"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="jouw-smtp-user"
SMTP_PASS="jouw-smtp-wachtwoord"
SMTP_FROM="Gear2Go <no-reply@jouwdomein.nl>"
```

Flow:
- Registreren stuurt een bevestigingsmail met verificatielink.
- Inloggen is geblokkeerd totdat e-mail is bevestigd.

### Routes

- **`/`**: home
- **`/search`**: zoeken/overzicht
- **`/products/[id]`**: product detail
- **`/cart`**: winkelwagen
- **`/checkout`**: afrekenen (formulier + validatie)
- **`/checkout/confirmation`**: bevestiging

### Waar staan de geïmporteerde screens?

De originele exports staan nog als referentie in:
- **HTML**: `src/screens/<slug>/code.html`
- **Preview afbeelding**: `public/screens/<slug>/screen.png`

### Opzet / structuur

- **Routes (App Router)**: `src/app/`
- **Herbruikbare componenten**: `src/components/`
- **Mock catalog**: `src/data/catalog.ts`
- **Cart state**: `src/state/cart.tsx`

### Build

```bash
npm run build
npm run start
```
