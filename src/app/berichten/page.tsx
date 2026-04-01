import { Suspense } from "react";
import Link from "next/link";
import BerichtenClient from "@/components/BerichtenClient";
import { NavSearchBar } from "@/components/NavSearchBar";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BerichtenPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; product?: string; itemId?: string; conversationId?: string }>;
}) {
  const user = await getCurrentUser();

  const params = await searchParams;
  const ownerName = params.owner?.trim() || "Thomas V.";
  const productTitle = params.product?.trim() || "Specialized Stumpjumper";
  const itemId = params.itemId?.trim() || "";
  const conversationId = params.conversationId?.trim() || "";

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* Fixed Navigation */}
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

      {/* Main Content - with top padding for navbar */}
      <main className="flex-1 pt-24 overflow-hidden">
        {!user ? (
          <div className="flex items-center justify-center h-full px-6 md:px-12">
            <section className="w-full max-w-2xl bg-surface-container-low border border-outline-variant/20 p-8 md:p-12 relative overflow-hidden">
              <div className="absolute -top-24 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <span className="font-label uppercase tracking-[0.25em] text-[10px] text-on-surface-variant block mb-4">
                  PRIVATE CHAT
                </span>
                <h1 className="font-headline font-black text-4xl md:text-6xl uppercase tracking-tighter text-primary leading-[0.9] mb-4">
                  LOG IN OM JE
                  <br />
                  BERICHTEN TE LEZEN
                </h1>
                <p className="font-body text-on-surface-variant max-w-xl mb-8">
                  Je berichten zijn persoonlijk en alleen zichtbaar voor jouw account. Log in om je gesprekken en updates te bekijken.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/dashboard"
                    className="bg-primary text-on-primary px-8 py-4 font-headline font-bold uppercase tracking-widest hover:bg-surface-dim hover:text-primary transition-all duration-100"
                  >
                    Naar Inlogscherm
                  </Link>
                  <Link
                    href="/register"
                    className="border-2 border-primary text-primary px-8 py-4 font-headline font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all duration-100"
                  >
                    Account Aanmaken
                  </Link>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <Suspense fallback={<div className="min-h-screen bg-surface" />}>
            <BerichtenClient
              ownerName={ownerName}
              productTitle={productTitle}
              itemId={itemId}
              conversationId={conversationId}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
