import Link from "next/link";
import { BookingPlanningPanel } from "@/components/BookingPlanningPanel";
import { DashboardLoginForm } from "@/components/DashboardLoginForm";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function euro(value: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-8">
        <div className="w-full max-w-md"><h1 className="text-4xl font-bold mb-3">Welkom terug</h1><DashboardLoginForm /></div>
      </main>
    );
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [myItems, communityItems, activeRentals, monthlyIncomeAgg, avgReview] = await Promise.all([
    prisma.item.findMany({ where: { ownerId: user.id }, include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.item.findMany({ where: { ownerId: { not: user.id }, status: "PUBLISHED" }, include: { owner: { select: { displayName: true } } }, take: 4, orderBy: { createdAt: "desc" } }),
    prisma.booking.count({ where: { ownerId: user.id, status: "CONFIRMED", startDate: { lte: now }, endDate: { gte: now } } }),
    prisma.booking.aggregate({ where: { ownerId: user.id, status: "CONFIRMED", createdAt: { gte: monthStart, lt: nextMonthStart } }, _sum: { totalCents: true } }),
    prisma.review.aggregate({ where: { item: { ownerId: user.id } }, _avg: { rating: true } }),
  ]);

  return (
    <main className="min-h-screen bg-surface text-on-surface p-6 md:p-12">
      <div className="flex justify-between items-center mb-8"><h1 className="text-4xl font-black">Dashboard</h1><LogoutButton className="px-4 py-2 border" /></div>
      <section className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-surface-container-low">Actieve verhuren: {activeRentals}</div>
        <div className="p-4 bg-surface-container-low">Verdiend: {euro((monthlyIncomeAgg._sum.totalCents ?? 0) / 100)}</div>
        <div className="p-4 bg-surface-container-low">Rating: {(avgReview._avg.rating ?? 0).toFixed(1)}</div>
      </section>
      <section className="mb-8"><h2 className="font-bold mb-3">Mijn Items</h2>{myItems.map((i)=> <div key={i.id}><Link href={`/dashboard/items/${encodeURIComponent(i.id)}`}>{i.title}</Link></div>)}</section>
      <section className="mb-8"><h2 className="font-bold mb-3">Community Items</h2>{communityItems.map((i)=> <div key={i.id}><Link href={`/products/${encodeURIComponent(i.id)}`}>{i.title}</Link></div>)}</section>
      <BookingPlanningPanel />
    </main>
  );
}
