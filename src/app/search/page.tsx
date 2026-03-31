import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { HomeCategoryBrowsing } from "@/components/HomeCategoryBrowsing";
import { NavSearchBar } from "@/components/NavSearchBar";
import { getCurrentUser } from "@/lib/auth";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const queryRaw = (q ?? "").trim();
  const user = await getCurrentUser();

  return (
    <div className="bg-surface text-on-surface min-h-dvh">
      <nav className="fixed top-0 z-50 w-full flex justify-between items-center px-6 md:px-12 py-6 bg-surface bg-opacity-80 backdrop-blur-md">
        <Link className="text-3xl font-black tracking-tighter text-primary font-headline uppercase" href="/">
          GEAR2GO
        </Link>
        <div className="hidden md:flex items-center gap-12">
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/">
            HOME
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-primary border-b-4 border-primary pb-1" href="/ontdekken">
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
          <Link href="/cart" className="material-symbols-outlined text-3xl cursor-pointer">
            shopping_basket
          </Link>
          <Link href="/dashboard" className="w-10 h-10 bg-surface-container-high flex items-center justify-center overflow-hidden rounded-full flex-shrink-0 hover:ring-2 hover:ring-primary transition-all cursor-pointer">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.displayName || "Avatar"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-xl">account_circle</span>
            )}
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <section className="px-6 md:px-12 mb-20 md:mb-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="max-w-4xl">
              <p className="font-label text-xs tracking-[0.2em] uppercase mb-4 text-on-surface-variant">PREMIUM GEAR RENTAL</p>
              <h1 className="font-headline text-6xl md:text-[10rem] font-black leading-[0.85] tracking-tighter uppercase">EQUIPMENT<br />FOR PROS</h1>
            </div>
            <form className="w-full md:w-1/3" action="/search">
              <div className="relative group">
                <input className="w-full bg-surface-container-high border-none p-6 font-headline font-bold text-lg placeholder:text-on-surface-variant focus:ring-0" defaultValue={queryRaw} name="q" placeholder="ZOEK APPARATUUR..." type="text" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  <span className="material-symbols-outlined text-primary text-3xl cursor-pointer">tune</span>
                  <button className="material-symbols-outlined text-primary text-3xl cursor-pointer" type="submit">search</button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <HomeCategoryBrowsing />
      </main>

      <footer className="bg-primary text-on-primary flex flex-col md:flex-row justify-between items-center px-12 py-20 w-full mt-20">
        <div className="flex flex-col mb-12 md:mb-0">
          <div className="text-xl font-bold text-white font-headline mb-4 uppercase">GEAR2GO</div>
          <p className="font-headline text-[10px] tracking-[0.05em] uppercase text-[#c6c6c6]">© 2024 GEAR2GO. ALLE RECHTEN VOORBEHOUDEN.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {["OVER ONS", "VOORWAARDEN", "PRIVACY", "CONTACT", "HELP"].map((x) => (
            <Link key={x} className="font-headline text-[10px] tracking-[0.05em] uppercase text-[#c6c6c6] hover:text-white transition-colors" href="/">{x}</Link>
          ))}
        </div>
      </footer>

      <BottomNav active="explore" />
    </div>
  );
}

