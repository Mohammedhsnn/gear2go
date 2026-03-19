## Stitch screens → Next.js

Deze map is een Next.js project dat jouw Stitch screens omzet naar een **werkende, mobile-first site** (proof case) met een complete flow: home → zoeken → product → cart → checkout → bevestiging.

### Runnen (dev)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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
