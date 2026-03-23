import Link from "next/link";
import { NavSearchBar } from "@/components/NavSearchBar";

export default function HoeHetWerktPage() {
  return (
    <div className="bg-background text-on-background selection:bg-primary selection:text-on-primary">
      <nav className="fixed top-0 z-50 w-full flex justify-between items-center px-6 md:px-12 py-6 bg-surface bg-opacity-80 backdrop-blur-md">
        <Link className="text-3xl font-black tracking-tighter text-primary font-headline uppercase" href="/">
          GEAR2GO
        </Link>
        <div className="hidden md:flex items-center gap-12">
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/">
            HOME
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/ontdekken">
            ONTDEKKEN
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-primary border-b-4 border-primary pb-1" href="/hoe-het-werkt">
            HOE HET WERKT
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/berichten">
            BERICHTEN
          </Link>
          <NavSearchBar />
        </div>
        <div className="flex items-center gap-6">
          <Link className="font-headline tracking-tight uppercase text-sm font-bold bg-primary text-on-primary px-6 py-3 hover:bg-surface-dim hover:text-primary transition-colors duration-100 hidden md:inline-flex" href="/gearplaatsen">
            GEAR PLAATSEN
          </Link>
          <Link href="/cart" className="material-symbols-outlined text-3xl cursor-pointer">
            shopping_basket
          </Link>
          <Link href="/dashboard" className="material-symbols-outlined text-3xl cursor-pointer">
            account_circle
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <section className="px-6 md:px-12 mb-28">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <h1 className="text-6xl md:text-[8rem] leading-[0.85] font-black tracking-tighter uppercase font-headline md:max-w-3xl">
              HOE HET <span className="text-outline-variant">WERKT</span>
            </h1>
            <div className="max-w-md pb-4">
              <p className="text-on-surface-variant font-body text-lg leading-relaxed">
                Huur professionele gear van lokale makers. Veilig, verzekerd en zonder gedoe.
                Volg deze vijf eenvoudige stappen om direct aan de slag te gaan.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-y-20 mb-32">
          <div className="md:col-span-7 flex flex-col md:flex-row gap-8 items-start">
            <span className="text-7xl md:text-[6rem] font-black font-headline leading-none text-surface-container-highest">01</span>
            <div className="pt-4">
              <h3 className="text-3xl font-bold uppercase font-headline mb-4 tracking-tight">Account aanmaken</h3>
              <p className="text-on-surface-variant font-body leading-relaxed max-w-sm">
                Registreer je binnen enkele minuten. Verifieer je identiteit om toegang te
                krijgen tot de volledige catalogus en begin met huren of verhuren.
              </p>
            </div>
          </div>
          <div className="md:col-span-5 bg-surface-container-low h-[300px]">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBc8LxQ9497yDiQogX_OitrHygkhYUK2fi_nF28M12z_ycDdU2rfcDfMmZNYZo1eTL6668AJEzmikArQxEJAo40CBBFm1JreYd9Xia2MkJk3iQ_A07sgKaKOu6kXpJUlwoNaIl0e-AZ1r6qtqDt_aE8jCL2IwL25B3B79H_6pWxIye4-NGUTuZA1OkOYfJnUuKPKqyS0T_FxUFTumye2Sx8KwEZGpL1ZxO4m9VPrG7lMhPuIh-l0v-ZfSnHg_1gCT3IDyTM-WIcgN8')",
              }}
            />
          </div>

          <div className="md:col-start-6 md:col-span-7 flex flex-col md:flex-row-reverse gap-8 items-start text-right">
            <span className="text-7xl md:text-[6rem] font-black font-headline leading-none text-surface-container-highest">02</span>
            <div className="pt-4 text-right">
              <h3 className="text-3xl font-bold uppercase font-headline mb-4 tracking-tight">Zoek materiaal</h3>
              <p className="text-on-surface-variant font-body leading-relaxed max-w-sm ml-auto">
                Blader door listings, filter op locatie en prijs, en vind de perfecte camera,
                lens of bike voor jouw project.
              </p>
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col md:flex-row gap-8 items-start">
            <span className="text-7xl md:text-[6rem] font-black font-headline leading-none text-surface-container-highest">03</span>
            <div className="pt-4">
              <h3 className="text-3xl font-bold uppercase font-headline mb-4 tracking-tight">Aanvraag & Betaling</h3>
              <p className="text-on-surface-variant font-body leading-relaxed max-w-sm">
                Stuur een huuraanvraag. Na acceptatie betaal je veilig via het platform en wordt
                alles netjes vastgelegd.
              </p>
            </div>
          </div>
          <div className="md:col-span-6 flex items-center justify-center p-12 bg-surface-container">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-surface-container-lowest h-32 p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">Status</span>
                <span className="font-headline font-bold uppercase">Betaald</span>
              </div>
              <div className="bg-primary text-on-primary h-32 p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Action</span>
                <span className="font-headline font-bold uppercase">Bevestig</span>
              </div>
            </div>
          </div>

          <div className="md:col-start-3 md:col-span-8 flex flex-col md:flex-row gap-8 items-center bg-surface-container-low p-12">
            <span className="text-7xl md:text-[6rem] font-black font-headline leading-none text-primary">04</span>
            <div className="pt-2">
              <h3 className="text-3xl font-bold uppercase font-headline mb-2 tracking-tight">Ophalen</h3>
              <p className="text-on-surface-variant font-body leading-relaxed max-w-lg">
                Maak een afspraak met de verhuurder voor overdracht en markeer de start van de
                huurperiode in de app.
              </p>
            </div>
            <div className="ml-auto">
              <span className="material-symbols-outlined text-[5rem]">location_on</span>
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col md:flex-row gap-8 items-start">
            <span className="text-7xl md:text-[6rem] font-black font-headline leading-none text-surface-container-highest">05</span>
            <div className="pt-4">
              <h3 className="text-3xl font-bold uppercase font-headline mb-4 tracking-tight">Retour & Review</h3>
              <p className="text-on-surface-variant font-body leading-relaxed max-w-sm">
                Lever de gear op tijd in en laat een review achter zodat de community blijft
                groeien.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-6 md:mx-12 mb-32 bg-primary text-on-primary p-10 md:p-20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-shrink-0">
              <span className="material-symbols-outlined text-[6rem] md:text-[8rem]" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield
              </span>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black font-headline uppercase mb-6 tracking-tighter">GEAR2GO VERZEKERING</h2>
              <p className="text-on-primary-fixed-variant font-body text-lg md:text-xl max-w-2xl leading-relaxed mb-8">
                Elke verhuur via het platform is automatisch gedekt door onze verzekering. Schade
                of diefstal? Wij regelen het.
              </p>
              <button className="border border-on-primary px-8 py-4 font-headline font-bold uppercase tracking-widest hover:bg-on-primary hover:text-primary transition-colors duration-200">
                LEES MEER OVER DEKKING
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

