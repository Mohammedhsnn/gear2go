import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";
import { NavSearchBar } from "@/components/NavSearchBar";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="bg-surface text-on-surface">
      <nav className="bg-surface/80 backdrop-blur-md fixed top-0 z-50 w-full">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1440px] mx-auto">
          <Link href="/" className="text-2xl font-black tracking-tighter text-primary italic font-headline">
            Gear2Go
          </Link>
          <div className="hidden md:flex gap-8 items-center">
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-label uppercase tracking-wider font-bold text-[11px]" href="/">
              Home
            </Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-label uppercase tracking-wider font-bold text-[11px]" href="/ontdekken">
              Ontdekken
            </Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-label uppercase tracking-wider font-bold text-[11px]" href="/hoe-het-werkt">
              Hoe Het Werkt
            </Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-label uppercase tracking-wider font-bold text-[11px]" href="/berichten">
              Berichten
            </Link>
            <NavSearchBar />
            <Link className="bg-primary text-on-primary px-6 py-2 text-sm font-bold uppercase tracking-widest active:scale-95 duration-75" href="/dashboard">
              Inloggen
            </Link>
            <Link href="/cart" className="material-symbols-outlined text-2xl cursor-pointer text-primary">
              shopping_basket
            </Link>
          </div>
          <div className="md:hidden">
            <span className="material-symbols-outlined">menu</span>
          </div>
        </div>
      </nav>

      <main className="min-h-screen flex flex-col md:flex-row pt-[72px]">
        <section className="hidden md:flex flex-col justify-between w-1/2 bg-surface-container-low p-12 relative overflow-hidden">
          <div className="z-10">
            <span className="font-label uppercase tracking-[0.3em] text-[10px] text-on-surface-variant block mb-4">
              JOIN THE COMMUNITY
            </span>
            <h1 className="text-6xl lg:text-7xl font-black leading-[0.85] tracking-tighter uppercase font-headline">
              MAAK JE
              <br />
              GEAR2GO
              <br />
              PROFIEL.
            </h1>
          </div>
          <div className="mt-20 relative aspect-square w-full max-w-md self-end grayscale hover:grayscale-0 transition-all duration-500">
            <img
              alt="Action sports registration visual"
              className="object-cover w-full h-full grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0rVUXe3XgcfUVs7ekm9q33taFKbFzGLIm9IOCOfysd5kCskM4MNG_3lmH7HStkJH-KQojmKPlHyMY-adLmoy4411_lAaV9-Wi3qogLr9ngAk-xNQbE65cDY2i4pGGR5Aa8BmOOlcjL8S3qZ45kzevR3mDR3BviOXSHi9_w95MBL83vLWmDhzLGfbrXbUtIeFJoUCzEDjlNWYRhN13zEr7k0LnYPPGUG7C0hFL_18VM4ods1BNhwUShHKGiAeZ4QNPSfL8zq62_8s"
            />
            <div className="absolute bottom-4 left-4 bg-primary text-on-primary p-4">
              <p className="text-[10px] font-label tracking-widest uppercase">EST. 2024 / AMSTERDAM</p>
            </div>
          </div>
        </section>

        <section className="w-full md:w-1/2 bg-surface flex flex-col justify-center items-center p-8 md:p-24 lg:p-32">
          <div className="w-full max-w-md">
            <header className="mb-10">
              <h2 className="text-4xl font-bold tracking-tight mb-2 font-headline">Registreren</h2>
              <p className="text-on-surface-variant font-body">
                Maak je account aan en begin direct met huren of verhuren.
              </p>
            </header>

            <RegisterForm />
          </div>
        </section>
      </main>
    </div>
  );
}

