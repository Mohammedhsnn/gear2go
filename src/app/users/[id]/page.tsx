import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function toOneDecimal(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-";
  return value.toFixed(1);
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) notFound();

  const [aggregate, reviews] = await Promise.all([
    prisma.review.aggregate({
      where: {
        subjectUserId: user.id,
        direction: "OWNER_TO_RENTER",
      },
      _avg: {
        rating: true,
        punctualityRating: true,
        carefulnessRating: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.review.findMany({
      where: {
        subjectUserId: user.id,
        direction: "OWNER_TO_RENTER",
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <main className="min-h-screen bg-surface text-on-surface px-6 md:px-12 py-10">
      <header className="flex items-center justify-between mb-12">
        <Link className="text-3xl font-black tracking-tighter font-headline uppercase" href="/">
          GEAR2GO
        </Link>
        <Link
          href="/dashboard"
          className="font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary"
        >
          Terug naar dashboard
        </Link>
      </header>

      <section className="max-w-5xl mx-auto">
        <div className="bg-surface-container-low p-6 md:p-10 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName || "Gebruiker"} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined">account_circle</span>
              )}
            </div>
            <div>
              <h1 className="font-headline text-3xl font-black uppercase tracking-tight">
                {user.displayName || "Gebruiker"}
              </h1>
              <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-1">
                Huurderprofiel
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-low p-6 border-l-4 border-primary">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Gemiddelde score</p>
            <p className="font-headline text-5xl font-black tracking-tight">{toOneDecimal(aggregate._avg.rating)}</p>
          </div>
          <div className="bg-surface-container-low p-6">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Punctualiteit</p>
            <p className="font-headline text-5xl font-black tracking-tight">{toOneDecimal(aggregate._avg.punctualityRating)}</p>
          </div>
          <div className="bg-surface-container-low p-6">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Zorgvuldigheid</p>
            <p className="font-headline text-5xl font-black tracking-tight">{toOneDecimal(aggregate._avg.carefulnessRating)}</p>
          </div>
        </div>

        <div className="mb-6 text-xs uppercase tracking-widest text-on-surface-variant">
          {aggregate._count._all} review(s) van verhuurders
        </div>

        {reviews.length === 0 ? (
          <div className="bg-surface-container-low p-8 text-xs uppercase tracking-widest text-on-surface-variant">
            Nog geen reviews voor deze huurder.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="bg-surface-container-low p-5 border border-outline-variant/20">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <p className="text-sm font-bold uppercase tracking-wider">
                    {review.author.displayName || "Verhuurder"}
                  </p>
                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">
                    {new Date(review.createdAt).toLocaleDateString("nl-NL")}
                  </p>
                </div>
                <div className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                  Punctualiteit: {review.punctualityRating ?? "-"} • Zorgvuldigheid: {review.carefulnessRating ?? "-"}
                </div>
                <p className="text-sm leading-relaxed">{review.text || "-"}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
