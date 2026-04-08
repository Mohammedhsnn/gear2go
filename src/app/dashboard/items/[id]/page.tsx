import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardItemEditForm } from "@/components/DashboardItemEditForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardItemEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const item = await prisma.item.findFirst({
    where: {
      id,
      ...(user.isAdmin ? {} : { ownerId: user.id }),
    },
    select: {
      id: true,
      title: true,
      subtitle: true,
      description: true,
      location: true,
      imageUrl: true,
      pricePerDayCents: true,
      status: true,
    },
  });

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface px-6 md:px-12 py-10">
      <header className="flex items-center justify-between mb-12">
        <Link className="text-3xl font-black tracking-tighter font-headline uppercase" href="/">
          GEAR2GO
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary"
          >
            TERUG NAAR DASHBOARD
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-3 font-headline">
          Item Bewerken
        </h1>
        <p className="text-on-surface-variant mb-2">Pas je item aan en sla je wijzigingen op.</p>
        <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-10">
          Status: {item.status}
        </p>

        <div className="bg-surface-container-low p-6 md:p-10">
          <DashboardItemEditForm item={item} canDelete={true} />
        </div>
      </section>
    </main>
  );
}
