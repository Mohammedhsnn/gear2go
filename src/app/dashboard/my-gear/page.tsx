import Link from "next/link";
import { NavSearchBar } from "@/components/NavSearchBar";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function euro(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function MyGearPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="bg-surface text-on-surface min-h-screen">
        <nav className="fixed top-0 z-50 w-full flex justify-between items-center px-6 md:px-12 py-6 bg-surface bg-opacity-80 backdrop-blur-md">
          <Link className="text-3xl font-black tracking-tighter text-primary font-headline uppercase" href="/">
            GEAR2GO
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="bg-primary text-on-primary font-headline font-bold text-sm px-6 py-3 hover:bg-surface-dim hover:text-primary transition-colors duration-100 uppercase tracking-tight">
              INLOGGEN
            </Link>
          </div>
        </nav>
        <main className="pt-24 flex items-center justify-center min-h-screen">
          <p className="text-center">Je moet ingelogd zijn voor deze pagina.</p>
        </main>
      </div>
    );
  }

  const myItems = await prisma.item.findMany({
    where: { ownerId: user.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <header className="fixed top-0 z-50 w-full flex justify-between items-center px-6 md:px-12 py-6 bg-surface bg-opacity-80 backdrop-blur-md">
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
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/hoe-het-werkt">
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
          <LogoutButton className="hidden md:inline-flex font-headline tracking-tight uppercase text-sm font-bold border border-primary text-primary px-6 py-3 hover:bg-primary hover:text-on-primary transition-colors duration-100 disabled:opacity-60" />
          <Link href="/cart" className="material-symbols-outlined text-primary p-2">
            shopping_basket
          </Link>
          <Link href="/settings" className="w-10 h-10 bg-surface-container-high flex items-center justify-center overflow-hidden rounded-full flex-shrink-0 hover:ring-2 hover:ring-primary transition-all">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.displayName || "Avatar"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-xs">{user.displayName?.slice(0, 1).toUpperCase() || "U"}</span>
            )}
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-20">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-primary transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Terug naar dashboard
          </Link>
          <div className="flex justify-between items-end mb-4">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none font-headline">Mijn Gear</h1>
            <Link href="/gearplaatsen" className="bg-primary text-on-primary font-headline font-bold text-sm px-6 py-3 hover:bg-tertiary transition-colors uppercase tracking-tight">
              + GEAR TOEVOEGEN
            </Link>
          </div>
          <p className="text-sm uppercase tracking-[0.2em] font-medium text-on-surface-variant">
            Je hebt {myItems.length} {myItems.length === 1 ? "item" : "items"} geregistreerd
          </p>
        </div>

        {myItems.length === 0 ? (
          <div className="bg-surface-container-low p-16 text-center">
            <span className="material-symbols-outlined text-primary text-6xl block mb-4" style={{ fontSize: "3rem" }}>box</span>
            <p className="uppercase text-sm tracking-widest text-on-surface-variant mb-8">Je hebt nog geen gear items geplaatst</p>
            <Link href="/gearplaatsen" className="inline-block bg-primary text-on-primary font-headline font-bold px-8 py-4 uppercase tracking-tight hover:bg-tertiary transition-colors">
              PLAATS JE EERSTE GEAR
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myItems.map((item) => (
              <article key={item.id} className="bg-surface-container-lowest border border-outline-variant/10 overflow-hidden hover:border-primary/30 transition-all">
                <Link href={`/dashboard/items/${encodeURIComponent(item.id)}`} className="block h-48 bg-surface-container overflow-hidden">
                  <img
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 grayscale"
                    src={item.imageUrl || "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80"}
                  />
                </Link>
                <div className="p-6">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <Link href={`/dashboard/items/${encodeURIComponent(item.id)}`} className="font-bold uppercase tracking-tight text-lg hover:text-primary transition-colors flex-1">
                      {item.title}
                    </Link>
                    <span className={`text-[10px] font-bold px-2 py-1 uppercase tracking-tighter flex-shrink-0 ${
                      item.status === "PUBLISHED" 
                        ? "bg-primary text-on-primary" 
                        : "bg-surface-container-low text-on-surface-variant"
                    }`}>
                      {item.status === "PUBLISHED" ? "Beschikbaar" : "Concept"}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-2">
                    {item.category?.label ?? "Gear"}
                  </p>
                  <p className="text-lg font-black text-primary mb-4">
                    {euro(item.pricePerDayCents / 100)}<span className="text-xs font-normal text-on-surface-variant">/dag</span>
                  </p>
                  <Link
                    href={`/dashboard/items/${encodeURIComponent(item.id)}`}
                    className="inline-block text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-primary transition-colors"
                  >
                    Bewerken
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
