import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { HomeCategoryBrowsing } from "@/components/HomeCategoryBrowsing";
import { products, formatEUR } from "@/data/catalog";

export default function Home() {
  const heroProduct = products.find((p) => p.id === "trek-fuel-ex-98") ?? products[0]!;

  return (
    <div className="bg-background text-on-background font-body antialiased min-h-dvh">
      <nav className="fixed top-0 z-50 w-full flex justify-between items-center px-6 md:px-12 py-6 bg-surface bg-opacity-80 backdrop-blur-md">
        <Link className="text-3xl font-black tracking-tighter text-primary font-headline uppercase" href="/">
          GEAR2GO
        </Link>
        <div className="hidden md:flex items-center gap-12">
          <Link className="font-headline tracking-tight uppercase text-sm font-bold text-primary border-b-4 border-primary pb-1" href="/">
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

      <main className="pt-24">
        <section className="min-h-[70dvh] md:min-h-[921px] flex flex-col justify-center px-6 md:px-12 relative overflow-hidden bg-surface">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-surface-container-low -z-10 skew-x-[-12deg] translate-x-20 hidden md:block" />
          <div className="max-w-6xl z-10">
            <p className="font-headline font-bold text-sm tracking-[0.2em] mb-4 text-primary">PROJECT CARBON v1.0</p>
            <h1 className="font-headline font-black text-[clamp(4rem,10vw,120px)] leading-[0.85] -tracking-[0.05em] text-primary mb-12 uppercase">
              DEEL JE GEAR,<br />START JE AVONTUUR
            </h1>
            <div className="flex flex-wrap gap-4">
              <Link className="bg-primary text-on-primary font-headline font-bold text-xl px-12 py-8 hover:bg-surface-dim hover:text-primary transition-all duration-150 uppercase tracking-tight" href="/search">
                HUUR MATERIAAL
              </Link>
              <Link className="bg-transparent border-2 border-primary text-primary font-headline font-bold text-xl px-12 py-8 hover:bg-primary hover:text-on-primary transition-all duration-150 uppercase tracking-tight" href="/search">
                VERHUUR MATERIAAL
              </Link>
            </div>
          </div>
          <div className="absolute bottom-12 left-12 hidden md:flex items-center gap-4">
            <div className="w-1 bg-primary h-12" />
            <span className="font-label uppercase text-[10px] tracking-widest font-bold">SCROLL OM TE ONTDEKKEN</span>
          </div>
        </section>

        <section className="py-20 md:py-32 px-6 md:px-12 bg-surface-container-low">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="font-headline font-black text-4xl md:text-6xl uppercase tracking-tighter text-primary">POPULAIRE CATEGORIEËN</h2>
              <p className="font-body text-on-surface-variant mt-2 max-w-md">De meest gevraagde uitrusting voor jouw volgende professionele productie of outdoor expeditie.</p>
            </div>
            <Link className="font-headline font-bold uppercase border-b-2 border-primary pb-1 hover:text-outline transition-colors" href="/search">BEKIJK ALLES</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-6 md:h-[700px]">
            <Link className="md:col-span-8 md:row-span-2 group relative overflow-hidden bg-black" href="/search">
              <img className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBE7UgCevV6RcCfCradLsQUSz2tExk1HlkUKFy93PXU9Upnr9nn2t0qYRz_jN3KJsfuS0_ETusEPb1C4hj_T4vXM5aeIWEUBBpWEbCHUOC7GmzIc6UBj134JRWpg8-_pWJsaNvghJ9wIID_qJ-CzNh20uR8wauHOXmtKjcstxtCXmoiy3pEYWZ7lSE5Er9bo0culwixfDdYTFXXho8dUeO2BXNwSMnhOpHR3J1mcgdCSF0mOGAbhL-GMkTgy_9P2BGBt6lNNmR0Rk8" alt="camera gear" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-12 flex flex-col justify-end">
                <span className="font-label text-on-primary text-xs tracking-widest mb-2 opacity-60">01 / PROFESSIONEEL</span>
                <h3 className="font-headline font-black text-5xl text-on-primary uppercase">CAMERA GEAR</h3>
              </div>
            </Link>
            <Link className="md:col-span-4 row-span-1 group relative overflow-hidden bg-black" href="/search">
              <img className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNuDvRh1-Wd5JTQUk2RsR59EPLNPYei1CGwThSZmRRCgi6T8H7W2IYgrYYdhP1AdU1qPipdzRRqrWkk7makyRnTdSZIh_yEHNCFLVOuvpDdkWHrN5fVK0Nz3cNrs8KBrINWGP_bWZO_W1Z5DYZT0QGnaOdRJOchSGR2iD_p8inmU1utVa5zRe9seLupJk6ezMoeaUiyqOU-uJ8MG4FqzqbbXDnh_jKUPSkp7VQEVyD2dSI5YlkyUup7xJYswzBk2EqLKzm64Jl4vw" alt="outdoor" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col justify-end">
                <span className="font-label text-on-primary text-xs tracking-widest mb-1 opacity-60">02 / AVONTUUR</span>
                <h3 className="font-headline font-black text-3xl text-on-primary uppercase">OUTDOOR</h3>
              </div>
            </Link>
            <Link className="md:col-span-4 row-span-1 group relative overflow-hidden bg-black" href="/search">
              <img className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0xg8t3YtZrECEhaliBNf0DAL0vZ8wxXTqFBom2SBKTQynA_ibF9gOwK4mjfL8bGXMO6sjsPw7QVGLSAg6jL_kaDhVCRLQfHJFO5SrfCV6RnnG82i5A5nwIW4pTArdyM5_byqU9F6rYyEZ1IplUXm4zn8OgBkT4Q7HnBXLP-vBU-yWbzXHt-YHzt5HiMN0pHgRfnZsIbx_tVis-IYuIlqt50aCceC-40t8BbrxJNflisW72EpHj0HtUHVBNV4hLh0voMN9gS5IZvc" alt="audio en muziek" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col justify-end">
                <span className="font-label text-on-primary text-xs tracking-widest mb-1 opacity-60">03 / STUDIO</span>
                <h3 className="font-headline font-black text-3xl text-on-primary uppercase">AUDIO &amp; MUZIEK</h3>
              </div>
            </Link>
          </div>
        </section>

        <section className="py-20 md:py-32 px-6 md:px-12 bg-surface">
          <div className="mb-20">
            <span className="inline-block bg-primary text-on-primary px-3 py-1 font-label text-[10px] tracking-widest font-bold mb-4 uppercase">NIEUW BINNEN</span>
            <h2 className="font-headline font-black text-6xl md:text-8xl uppercase tracking-tighter leading-none">THE NEXT<br />LEVEL GEAR.</h2>
          </div>
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 aspect-video bg-surface-container-high relative overflow-hidden group">
              <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src={heroProduct.imageUrl} alt={heroProduct.title} />
              <div className="absolute top-8 right-8 bg-surface-container-lowest p-6">
                <p className="font-label font-black text-4xl">{formatEUR(heroProduct.pricePerDayCents)}<span className="text-sm font-normal">/dag</span></p>
              </div>
            </div>
            <div className="md:col-span-5 flex flex-col gap-8">
              <div>
                <h3 className="font-headline font-black text-5xl uppercase mb-4">{heroProduct.title}</h3>
                <p className="font-body text-on-surface-variant leading-relaxed text-lg">De ultieme hybride camera. Met een 33 MP sensor, verbeterde AF en 4K 60p video is dit de perfecte partner voor elke professionele shoot. Nu beschikbaar voor directe verhuur in Amsterdam.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-6"><span className="font-label text-[10px] tracking-widest text-outline uppercase block mb-2">CONDITIE</span><span className="font-headline font-bold text-xl uppercase">ALS NIEUW</span></div>
                <div className="bg-surface-container-low p-6"><span className="font-label text-[10px] tracking-widest text-outline uppercase block mb-2">LOCATIE</span><span className="font-headline font-bold text-xl uppercase">AMSTERDAM</span></div>
              </div>
              <Link href={`/products/${encodeURIComponent(heroProduct.id)}`} className="w-full bg-primary text-on-primary font-headline font-bold py-6 uppercase tracking-widest hover:bg-tertiary transition-colors text-center">BEKIJK DETAILS</Link>
            </div>
          </div>
        </section>

        <HomeCategoryBrowsing />
      </main>

      <footer className="bg-[#000000] flex flex-col md:flex-row justify-between items-center px-12 py-20 w-full">
        <div className="flex flex-col gap-4 mb-10 md:mb-0">
          <div className="text-xl font-bold text-white font-headline uppercase">GEAR2GO</div>
          <p className="font-headline text-[10px] tracking-[0.05em] uppercase text-[#c6c6c6]">© 2024 GEAR2GO. ALLE RECHTEN VOORBEHOUDEN.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-12">
          {["OVER ONS", "VOORWAARDEN", "PRIVACY", "CONTACT", "HELP"].map((x) => (
            <Link key={x} className="font-headline text-[10px] tracking-[0.05em] uppercase text-[#c6c6c6] hover:text-white" href="/">{x}</Link>
          ))}
        </div>
        <div className="flex gap-6 mt-10 md:mt-0">
          <span className="material-symbols-outlined text-on-primary cursor-pointer hover:text-white">language</span>
          <span className="material-symbols-outlined text-on-primary cursor-pointer hover:text-white">share</span>
        </div>
      </footer>

      <div className="pb-28">
        <BottomNav active="explore" />
      </div>
    </div>
  );
}
