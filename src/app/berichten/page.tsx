import Link from "next/link";
import { NavSearchBar } from "@/components/NavSearchBar";

export default async function BerichtenPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; product?: string }>;
}) {
  const { owner, product } = await searchParams;
  const ownerName = owner?.trim() || "Thomas V.";
  const productTitle = product?.trim() || "Specialized Stumpjumper";

  return (
    <div className="bg-surface text-on-surface overflow-hidden min-h-screen">
      <nav className="fixed top-0 z-50 w-full flex justify-between items-center px-6 md:px-12 py-6 bg-surface bg-opacity-80 backdrop-blur-md">
        <Link href="/" className="text-3xl font-black tracking-tighter text-primary font-headline uppercase">
          GEAR2GO
        </Link>
        <div className="hidden md:flex items-center gap-12">
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/">
            HOME
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/ontdekken">
            ONTDEKKEN
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/hoe-het-werkt">
            HOE HET WERKT
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-primary border-b-4 border-primary pb-1" href="/berichten">
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

      <div className="flex h-[calc(100vh-96px)] overflow-hidden pt-24">
        <aside className="bg-surface-container-low w-64 flex-col h-full py-8 hidden lg:flex">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm tracking-tight">MARK J.</h3>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-label">Verified Renter</p>
            </div>
          </div>
          <nav className="flex-grow">
            <div className="bg-primary text-on-primary flex items-center gap-4 px-6 py-4 w-full">
              <span className="material-symbols-outlined">mail</span>
              <span className="font-label text-xs uppercase tracking-widest">Berichten</span>
            </div>
            <Link className="text-on-surface-variant flex items-center gap-4 px-6 py-4 w-full hover:bg-surface-container-highest transition-all duration-100" href="/dashboard">
              <span className="material-symbols-outlined">inventory_2</span>
              <span className="font-label text-xs uppercase tracking-widest">Mijn Verhuur</span>
            </Link>
            <button className="text-on-surface-variant flex items-center gap-4 px-6 py-4 w-full hover:bg-surface-container-highest transition-all duration-100">
              <span className="material-symbols-outlined">favorite</span>
              <span className="font-label text-xs uppercase tracking-widest">Favorieten</span>
            </button>
            <button className="text-on-surface-variant flex items-center gap-4 px-6 py-4 w-full hover:bg-surface-container-highest transition-all duration-100">
              <span className="material-symbols-outlined">settings</span>
              <span className="font-label text-xs uppercase tracking-widest">Instellingen</span>
            </button>
          </nav>
          <div className="px-6 mt-auto">
            <Link href="/gearplaatsen" className="w-full inline-flex justify-center bg-primary text-on-primary py-3 font-label text-xs uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100">
              Nieuwe Advertentie
            </Link>
          </div>
        </aside>

        <main className="flex flex-1 overflow-hidden bg-background">
          <section className="w-full md:w-80 lg:w-96 bg-surface-container-low flex flex-col">
            <div className="p-6">
              <h1 className="text-3xl font-headline font-black uppercase tracking-tight mb-6">Berichten</h1>
              <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                <input className="w-full bg-surface-container-high border-none py-3 pl-10 pr-4 text-xs font-label uppercase tracking-widest focus:ring-0" placeholder="ZOEKEN..." type="text" />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto">
              <div className="bg-surface-container-lowest p-6 border-l-4 border-primary cursor-pointer">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h4 className="font-headline font-bold text-sm truncate uppercase tracking-tight">{ownerName}</h4>
                      <span className="text-[10px] text-on-surface-variant font-label">14:20</span>
                    </div>
                    <p className="text-xs text-on-surface truncate font-medium">Bericht over: {productTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-xs text-secondary">pedal_bike</span>
                  <span className="text-[9px] uppercase tracking-widest text-secondary font-label">{productTitle}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="hidden md:flex flex-col flex-grow bg-surface">
            <header className="bg-surface-container-low p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <h2 className="font-headline font-black text-xl uppercase tracking-tight">{ownerName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-xs text-primary">calendar_today</span>
                    <p className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant">
                      Huurverzoek voor: <span className="text-primary font-bold">{productTitle}</span>
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/products/specialized-enduro-mtb" className="bg-primary text-on-primary px-6 py-3 font-label text-[11px] uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100">
                Bekijk Advertentie
              </Link>
            </header>

            <div className="flex-grow p-8 overflow-y-auto flex flex-col gap-8 bg-surface-bright">
              <div className="flex justify-center mb-4">
                <span className="bg-surface-container-low px-4 py-1 text-[9px] font-label uppercase tracking-[0.2em] text-on-surface-variant">
                  MAANDAG 23 OKTOBER
                </span>
              </div>
              <div className="flex items-start gap-4 max-w-[80%]">
                <div className="w-8 h-8 bg-surface-container-high flex items-center justify-center mt-2">
                  <span className="material-symbols-outlined text-sm">person</span>
                </div>
                <div>
                  <div className="bg-surface-container-high p-5 text-sm leading-relaxed text-on-surface">
                    Hallo Mark, ik zag je advertentie voor de Specialized Stumpjumper. Is deze nog beschikbaar voor komende zondag?
                  </div>
                  <span className="text-[9px] font-label text-on-surface-variant mt-2 inline-block">14:15</span>
                </div>
              </div>
              <div className="flex items-start gap-4 max-w-[80%] self-end flex-row-reverse text-right">
                <div className="bg-primary p-5 text-sm leading-relaxed text-on-primary">
                  Hoi Thomas! Zeker, de fiets is nog beschikbaar voor zondag. De remmen zijn net nagekeken.
                </div>
              </div>
            </div>

            <footer className="p-8 bg-surface-container-low">
              <div className="bg-surface-container-lowest p-2 flex items-end gap-2 border border-outline-variant/20">
                <div className="flex flex-col flex-grow">
                  <textarea className="w-full bg-transparent border-none focus:ring-0 p-4 text-sm resize-none font-body" placeholder="TYP EEN BERICHT..." rows={1} style={{ minHeight: 56 }} />
                </div>
                <button className="bg-primary text-on-primary px-8 py-3 font-label text-xs uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100">
                  Verstuur
                </button>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}
