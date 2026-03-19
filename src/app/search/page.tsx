import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { products } from "@/data/catalog";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const queryRaw = (q ?? "").trim();

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
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/ontdekken">
            VERHUUR
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/dashboard">
            DASHBOARD
          </Link>
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/hoe-het-werkt">
            HOE HET WERKT
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link className="font-headline tracking-tight uppercase text-sm font-bold bg-primary text-on-primary px-6 py-3 hover:bg-surface-dim hover:text-primary transition-colors duration-100 hidden md:inline-flex" href="/ontdekken">
            GEAR PLAATSEN
          </Link>
          <span className="material-symbols-outlined text-3xl cursor-pointer">account_circle</span>
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

        <section className="px-6 md:px-12 mb-24 md:mb-32">
          <div className="grid grid-cols-12 grid-rows-2 gap-4 h-[760px] md:h-[800px]">
            <Link className="col-span-12 md:col-span-7 row-span-2 relative overflow-hidden group cursor-pointer bg-surface-container" href="/search">
              <img className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSlWJ6q-AyR7UQ4WJPHGQ1FP023ENzAfWubMGAZ1EX5RDioqU9aYEgw-EfMyE2VXwfiPlkg_pOh5GrAXjpxqqqOzNTCT-gZZQgJh_9gLWKXMRA41e2a6dMdC2ZV8_F3JIt1D-4C9N96gT4Eig_M1jf9Bvlht4fZbz6_5M-JM5HYdim07r79jQcQtK_-ni16CLVofWg9c3DCMrkupCoPbLEB9k5G--dHmGYY8RqOHWQgU2MYkpczGde8agN1oqpZEJvBMgjYwd0MMA" alt="berg en klimsport" />
              <div className="absolute bottom-0 left-0 p-10 w-full bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="font-headline text-4xl md:text-5xl font-black text-white uppercase mb-2">BERG- &amp; KLIMSPORT</h3>
                <p className="text-white/70 font-label tracking-widest text-xs uppercase">142 ITEMS BESCHIKBAAR</p>
              </div>
            </Link>
            <Link className="col-span-6 md:col-span-5 row-span-1 relative overflow-hidden group cursor-pointer bg-surface-container-low" href="/search">
              <img className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPvLUOowhcP1At1bRFmijBeUDycHgDAtd_P568kbKahkedyQU7cXQxMAtn1-PCoFHqNiOEiBaTwNJA_FpeeMO5a102EFUc7hJy1pHW-32Odv349vVhi0u0M-MmgORuNVDVAj8w7xKhp-UwATSnxMq6jNABLu2tiquo4izgNWNq6qB9_E6b0i6y1x8F1QFUsNnpVzWU6yg7X3GUbgCX3wGxnLV6QHT769kQ_Jth11RrB1s6YzJij9dvw9neF0JwbcKAM_3wxutyYmQ" alt="wielersport" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors"><h3 className="font-headline text-3xl font-black text-white uppercase">WIELERSPORT</h3></div>
            </Link>
            <Link className="col-span-6 md:col-span-2 row-span-1 relative overflow-hidden group cursor-pointer bg-surface-container-highest" href="/search">
              <img className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD66Qmw6TPCsaMw7-paAPGBmItiZ8HhfBGJxxe7bi-eEpqsdCSdoXYxqoFx1dhu92YIe7ogXcUaF6KzatdW47jky2DMsJPa2eA7E1MwjSjv34HYBCUeXMVLICLcNWxNTLTrc_nRWhVKG_whHWmUJ-VwNYhKKmroIEZ-ucGDMXkNWEC8G5DGwWCQEf75-vzutHGOhjnvY1aAls_oHDGRGKjkJp6WEsbqAvwhAIeeaFVu_0Vf3VHpoj9S423rDwqKDPARpyK6E94kxEE" alt="wintersport" />
              <div className="absolute bottom-6 left-6"><h3 className="font-headline text-xl font-black text-white uppercase">WINTERSPORT</h3></div>
            </Link>
            <Link className="col-span-12 md:col-span-3 row-span-1 relative overflow-hidden group cursor-pointer bg-surface-container-low" href="/search">
              <div className="absolute inset-0 bg-primary opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full flex flex-col justify-between p-8">
                <span className="material-symbols-outlined text-on-primary text-5xl">surfing</span>
                <div><h3 className="font-headline text-2xl font-black text-on-primary uppercase">WATERSPORTEN</h3><p className="text-on-primary/60 text-xs mt-2 uppercase tracking-tighter">SURF / SUP / DIVING</p></div>
              </div>
            </Link>
          </div>
        </section>

        <section className="px-6 md:px-12">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-headline text-4xl font-black uppercase tracking-tight">TRENDING NU</h2>
            <div className="flex space-x-4">
              <button className="w-12 h-12 flex items-center justify-center bg-surface-container hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined">arrow_back</span></button>
              <button className="w-12 h-12 flex items-center justify-center bg-surface-container hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined">arrow_forward</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {products.slice(0, 4).map((p) => (
              <Link key={p.id} className="group cursor-pointer" href={`/products/${encodeURIComponent(p.id)}`}>
                <div className="aspect-[4/5] bg-surface-container-low mb-6 relative overflow-hidden">
                  <img className="w-full h-full object-cover grayscale mix-blend-multiply group-hover:scale-110 transition-transform duration-500" src={p.imageUrl} alt={p.title} />
                  <div className="absolute top-4 left-4 bg-primary text-on-primary px-3 py-1 font-label text-[10px] tracking-widest uppercase">POPULAIR</div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-headline font-bold text-xl uppercase">{p.title}</h4>
                    <p className="text-on-surface-variant text-sm font-label tracking-tight">{p.subtitle}</p>
                  </div>
                  <p className="font-headline font-black text-xl">€{Math.round(p.pricePerDayCents / 100)}<span className="text-xs font-normal">/dag</span></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
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

