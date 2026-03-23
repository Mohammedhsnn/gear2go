import { Suspense } from "react";
import BerichtenClient from "@/components/BerichtenClient";

export default async function BerichtenPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; product?: string; itemId?: string }>;
}) {
  const params = await searchParams;
  const ownerName = params.owner?.trim() || "Thomas V.";
  const productTitle = params.product?.trim() || "Specialized Stumpjumper";
  const itemId = params.itemId?.trim() || "";

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <BerichtenClient
        ownerName={ownerName}
        productTitle={productTitle}
        itemId={itemId}
      />
    </Suspense>
  );
}
