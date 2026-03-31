import Link from "next/link";
import { redirect } from "next/navigation";
import { GearPlaatsenForm } from "@/components/GearPlaatsenForm";
import { NavSearchBar } from "@/components/NavSearchBar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES = [
  { slug: "watersport", label: "Watersporten", sortOrder: 10 },
  { slug: "wintersport", label: "Wintersporten", sortOrder: 20 },
  { slug: "bikes", label: "Bikes & MTB", sortOrder: 30 },
  { slug: "camping", label: "Camping", sortOrder: 40 },
  { slug: "camera", label: "Camera", sortOrder: 50 },
  { slug: "climbing", label: "Klimsport", sortOrder: 60 },
  { slug: "audio", label: "Audio & Muziek", sortOrder: 70 },
];

export default async function GearPlaatsenPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/register?next=/gearplaatsen");
  }

  let categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { id: true, label: true },
  });

  if (categories.length === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES,
      skipDuplicates: true,
    });

    categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: { id: true, label: true },
    });
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface px-6 md:px-12 py-10">
      <header className="flex items-center justify-between mb-12">
        <Link className="text-3xl font-black tracking-tighter font-headline uppercase" href="/">
          GEAR2GO
        </Link>
        <div className="flex items-center gap-5">
          <NavSearchBar />
          <Link href="/cart" className="material-symbols-outlined text-2xl text-on-surface-variant hover:text-primary">
            shopping_basket
          </Link>
          <Link
            href="/dashboard"
            className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary"
          >
            DASHBOARD
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4 font-headline">
          Gear Plaatsen
        </h1>
        <p className="text-on-surface-variant mb-10 max-w-2xl">
          Plaats je advertentie. Na opslaan staat je item direct in je dashboard onder &quot;Mijn Items&quot;.
        </p>

        <div className="bg-surface-container-low p-6 md:p-10">
          <GearPlaatsenForm categories={categories} />
        </div>
      </section>
    </main>
  );
}
