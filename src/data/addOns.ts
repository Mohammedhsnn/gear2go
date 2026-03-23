export type AddOnId = "insurance" | "helmet" | "cleaning";

export type RentalAddOn = {
  id: AddOnId;
  title: string;
  description: string;
  priceCents: number;
  billing: "PER_DAY" | "PER_TRIP";
};

export const rentalAddOns: RentalAddOn[] = [
  {
    id: "insurance",
    title: "Huurverzekering",
    description: "Dekking voor schade en diefstal.",
    priceCents: 499,
    billing: "PER_DAY",
  },
  {
    id: "helmet",
    title: "MTB Helm",
    description: "Giro Source MIPS - Veiligheid eerst.",
    priceCents: 1500,
    billing: "PER_TRIP",
  },
  {
    id: "cleaning",
    title: "Reinigingsset",
    description: "Lever je gear weer blinkend in.",
    priceCents: 750,
    billing: "PER_TRIP",
  },
];

export function calculateAddOnsCents(selected: AddOnId[], rentalDays: number): number {
  return selected.reduce((sum, id) => {
    const addOn = rentalAddOns.find((x) => x.id === id);
    if (!addOn) return sum;
    if (addOn.billing === "PER_DAY") return sum + addOn.priceCents * Math.max(1, rentalDays);
    return sum + addOn.priceCents;
  }, 0);
}
