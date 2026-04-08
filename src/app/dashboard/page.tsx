import Link from "next/link";
import { BookingPlanningPanel } from "@/components/BookingPlanningPanel";
import { CommunityAdminActions } from "@/components/CommunityAdminActions";
import { DashboardLoginForm } from "@/components/DashboardLoginForm";
import { LogoutButton } from "@/components/LogoutButton";
import { NavSearchBar } from "@/components/NavSearchBar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function euro(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="bg-surface text-on-surface min-h-screen">
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
            <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/hoe-het-werkt">
              HOE HET WERKT
            </Link>
            <Link className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-100" href="/berichten">
              BERICHTEN
            </Link>
            <NavSearchBar />
          </div>
          <div className="flex items-center gap-6">
            <Link className="font-headline tracking-tight uppercase text-sm font-bold bg-primary text-on-primary px-6 py-3 hover:bg-surface-dim hover:text-primary transition-colors duration-100 hidden md:inline-flex" href="/dashboard">
              INLOGGEN
            </Link>
            <Link href="/dashboard" className="material-symbols-outlined text-3xl cursor-pointer">
              account_circle
            </Link>
          </div>
        </nav>

        <main className="pt-24 min-h-screen flex items-center justify-center px-6 md:px-12">
          <section className="w-full max-w-xl bg-surface-container-low border border-outline-variant/20 p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-3">Dashboard toegang</p>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4 font-headline">Welkom terug</h1>
            <p className="text-on-surface-variant mb-8">Log in om je verhuurprestaties, aanvragen en gesprekken te beheren.</p>
            <DashboardLoginForm />
          </section>
        </main>
      </div>
    );
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [myItems, communityItems, activeRentals, monthlyIncomeAgg, avgReview, unreadNotifications] =
    await Promise.all([
      prisma.item.findMany({
        where: { ownerId: user.id },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.item.findMany({
        where: {
          ownerId: { not: user.id },
          ...(user.isAdmin ? {} : { status: "PUBLISHED" }),
        },
        include: {
          category: true,
          owner: { select: { displayName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.booking.count({
        where: {
          ownerId: user.id,
          status: "CONFIRMED",
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.booking.aggregate({
        where: {
          ownerId: user.id,
          status: "CONFIRMED",
          // Count revenue in the month the booking was actually confirmed.
          updatedAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        _sum: { totalCents: true },
      }),
      prisma.review.aggregate({
        where: { item: { ownerId: user.id }, direction: "RENTER_TO_OWNER" },
        _avg: { rating: true },
      }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    ]);

  const monthlyIncome = (monthlyIncomeAgg._sum.totalCents ?? 0) / 100;
  const rating = (avgReview._avg.rating ?? 0).toFixed(1);

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
          <div className="relative">
            <span className="material-symbols-outlined text-primary p-2">notifications</span>
            {unreadNotifications > 0 ? <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" /> : null}
          </div>
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

      <div className="flex pt-20">
        <aside className="hidden lg:flex fixed left-0 h-[calc(100vh-80px)] w-64 bg-surface-container-low flex-col">
          <div className="p-8">
            <h3 className="font-headline font-bold uppercase text-xs tracking-wider text-primary mb-1">Dashboard</h3>
            <p className="font-headline font-bold uppercase text-[10px] tracking-widest text-on-surface-variant">PRO ACCOUNT</p>
          </div>
          <nav className="flex-grow">
            <Link className="bg-primary text-on-primary px-4 py-3 flex items-center gap-3 font-headline font-bold uppercase text-xs tracking-wider" href="/dashboard">
              <span className="material-symbols-outlined">dashboard</span>
              Overview
            </Link>
            <Link className="text-on-surface-variant px-4 py-3 flex items-center gap-3 font-headline font-bold uppercase text-xs tracking-wider hover:text-primary transition-colors" href="/dashboard/my-gear">
              <span className="material-symbols-outlined">sports_kabaddi</span>
              My Gear
            </Link>
            <Link className="text-on-surface-variant px-4 py-3 flex items-center gap-3 font-headline font-bold uppercase text-xs tracking-wider hover:text-primary transition-colors" href="/dashboard#rentals">
              <span className="material-symbols-outlined">swap_horiz</span>
              Rentals
            </Link>
            <Link className="text-on-surface-variant px-4 py-3 flex items-center gap-3 font-headline font-bold uppercase text-xs tracking-wider hover:text-primary transition-colors" href="/settings">
              <span className="material-symbols-outlined">settings</span>
              Settings
            </Link>
          </nav>
        </aside>

        <main className="w-full lg:ml-64 p-6 md:p-12 min-h-screen">
          <div className="mb-16">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4 font-headline">Dashboard</h1>
            <p className="text-sm uppercase tracking-[0.2em] font-medium text-on-surface-variant">
              Welkom terug, {user.displayName ?? "Alex"}. Je gear presteert uitstekend.
            </p>
          </div>

          <section className="grid grid-cols-12 gap-6 mb-16">
            <div className="col-span-12 md:col-span-4 bg-surface-container-low p-8 flex flex-col justify-between h-48 border-l-4 border-primary">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Actieve Verhuren</span>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black font-headline tracking-tighter">{activeRentals}</span>
                <span className="text-xs font-bold uppercase text-on-surface-variant">live</span>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 bg-primary text-on-primary p-8 flex flex-col justify-between h-48">
              <span className="text-xs font-bold uppercase tracking-widest text-on-primary/60">Verdiend deze maand</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-6xl font-black font-headline tracking-tighter">{euro(monthlyIncome)}</span>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 bg-surface-container-low p-8 flex flex-col justify-between h-48">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Community Rating</span>
              <div className="flex flex-col">
                <span className="text-6xl font-black font-headline tracking-tighter">{rating}</span>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="my-gear" className="scroll-mt-28">
            <div className="flex justify-between items-end mb-8 border-b border-primary/5 pb-4">
              <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Mijn Items</h2>
              <Link className="text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-on-surface-variant" href="/dashboard/my-gear">
                Bekijk al mijn gear
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myItems.length === 0 ? (
                <div className="col-span-full bg-surface-container-low p-8">
                  <p className="uppercase text-xs tracking-widest text-on-surface-variant">Nog geen items gevonden. Plaats je eerste gear item.</p>
                </div>
              ) : (
                myItems.map((item) => (
                  <article key={item.id} className="bg-surface-container-lowest border border-outline-variant/10 overflow-hidden">
                    <Link href={`/dashboard/items/${encodeURIComponent(item.id)}`} className="block h-48 bg-surface-container overflow-hidden">
                      <img
                        alt={item.title}
                        className="w-full h-full object-cover grayscale"
                        src={item.imageUrl || "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80"}
                      />
                    </Link>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <Link href={`/dashboard/items/${encodeURIComponent(item.id)}`} className="font-bold uppercase tracking-wide text-lg hover:text-primary transition-colors">
                          {item.title}
                        </Link>
                        <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-1 uppercase tracking-tighter">
                          {item.status === "PUBLISHED" ? "Beschikbaar" : "Concept"}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-4">
                        {item.category?.label ?? "Gear"} - {euro(item.pricePerDayCents / 100)} /dag
                      </p>
                      <Link
                        href={`/dashboard/items/${encodeURIComponent(item.id)}`}
                        className="text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-primary transition-colors"
                      >
                        Bewerken
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="mt-16">
            <div className="flex justify-between items-end mb-8 border-b border-primary/5 pb-4">
              <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Community Items</h2>
              <Link className="text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:text-on-surface-variant" href="/ontdekken">
                Ontdek meer
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {communityItems.length === 0 ? (
                <div className="col-span-full bg-surface-container-low p-8">
                  <p className="uppercase text-xs tracking-widest text-on-surface-variant">
                    Nog geen community items beschikbaar.
                  </p>
                </div>
              ) : (
                communityItems.map((item) => (
                  <article key={item.id} className="bg-surface-container-lowest border border-outline-variant/10 overflow-hidden">
                    <div className="h-48 bg-surface-container overflow-hidden">
                      <img
                        alt={item.title}
                        className="w-full h-full object-cover grayscale"
                        src={item.imageUrl || "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80"}
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <h3 className="font-bold uppercase tracking-wide text-lg">{item.title}</h3>
                        <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-1 uppercase tracking-tighter">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-2">
                        {item.category?.label ?? "Gear"} - {euro(item.pricePerDayCents / 100)} /dag
                      </p>
                      <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-4">
                        Verhuurder: {item.owner.displayName ?? "Community Member"}
                      </p>
                      <Link
                        href={`/products/${encodeURIComponent(item.id)}`}
                        className="inline-flex items-center gap-2 border border-primary text-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors duration-100"
                      >
                        Bekijk item
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                      {user.isAdmin ? <CommunityAdminActions itemId={item.id} status={item.status} /> : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <div id="rentals" className="scroll-mt-28">
            <BookingPlanningPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
