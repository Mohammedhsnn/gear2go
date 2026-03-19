export type CategoryId =
  | "watersport"
  | "wintersport"
  | "bikes"
  | "camping"
  | "camera";

export type Product = {
  id: string;
  title: string;
  subtitle: string;
  categoryId: CategoryId;
  location: string;
  pricePerDayCents: number;
  depositCents: number;
  tags: string[];
  imageUrl: string;
};

export const categories: { id: CategoryId; label: string }[] = [
  { id: "watersport", label: "Watersporten" },
  { id: "wintersport", label: "Wintersporten" },
  { id: "bikes", label: "Bikes & MTB" },
  { id: "camping", label: "Camping" },
  { id: "camera", label: "Camera" },
];

// NOTE: Proof-case catalog. Replace with API later.
export const products: Product[] = [
  {
    id: "trek-fuel-ex-98",
    title: "Trek Fuel EX 9.8",
    subtitle: "Mountainbike / Trail",
    categoryId: "bikes",
    location: "Amsterdam",
    pricePerDayCents: 4500,
    depositCents: 15000,
    tags: ["Premium", "MTB"],
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDPd0SpYeEcu_I67Jasb4pdXSWdLtiH6_CBFdIba64aAuKFKrjdjkJu920bIKcBcGcE_03AvS36B_eB3_LCvzd3iLWFbnXWmR4QcPXdHs_hwbFspOjs5zGcPdjTjOPpb9_A5unyEoOPtMaKXGQAhU_WO7tcljpIQvUR4uu1CTR4TOVJ765luOhV5yu4T4r2Qx0VLpOa0f0V_GLhax0HhCZYrj74Vh4c5aswR1MKDpH5UgQSavQK_wAit-fM1OwI09-5u6oXgNCUBdA",
  },
  {
    id: "specialized-enduro-mtb",
    title: "Specialized Enduro MTB",
    subtitle: "High-end Enduro",
    categoryId: "bikes",
    location: "Amsterdam",
    pricePerDayCents: 4500,
    depositCents: 15000,
    tags: ["Premium", "MTB"],
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCWTDTR2LKVCMtmyGmJvYYrtVyBR4B06-RG0UUEqGcPEY4NUVJSrbHPTLZ22adj_SUrW8ONbZj_fBsbExOh5csoSLudz2OZQiQawiAP8LL0IVi4ZoYUCcMj-YRgaSXk5oWN0FHipIx4eZYOsaWsUogI2A_rTr5bpyPOqhfVrVB-RbZ-1bCPX6crAN9fXhZcZfKQVl5BgL77eawOHeMPYTqoAeCQ1_xfpjh5D3jV7G3saEQPpSJ2ctbD3llNJpBDrDneKVCxfQs-BEs",
  },
  {
    id: "expedition-tent",
    title: "Expedition Tent",
    subtitle: "Outdoor Essentials",
    categoryId: "camping",
    location: "Eindhoven",
    pricePerDayCents: 2500,
    depositCents: 10000,
    tags: ["Hiking", "Camping"],
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeDbnzOXQNGzXmC2XnpEils_0iv3UiWyfOiROPC5hCrUXZgpyDnEOJU38agbqvy16a67Ik0mFw_q3j-cnBIh3wEmxtBYnrKrDYQSxCiqgF6GOusTHbnHxXQ5-LFqveVLoRkmSgFe7v-KhkrA-tUdO9rYJ_D7S7-3FUtIklrlFanNZi3rxiJqNm0_BG1ihSPZa_0FphJnlzHjav3iDe0o3e3faZQ-e4p86Td6tE7rUGdg5qNduOO9Y23GomKWEIeraN9tm_5wMdoVc",
  },
  {
    id: "sea-kayak-pro2",
    title: "Sea Kayak Pro-2",
    subtitle: "Watersport",
    categoryId: "watersport",
    location: "Rotterdam",
    pricePerDayCents: 5500,
    depositCents: 20000,
    tags: ["Watersport"],
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCyMLGOI7_GoeTSBUL0iaEWIN5pwaSLMnqGukGioAl8tzjmIpiLYQFzihXY5V06LfVqunBeUah4gyUagUaRom3VOVtSsqWViQVCzhSVFfsAOU05qTPq4NPAqaBWt8xRS0ZVOymRq53ebnGVSBNdL11K9G9CkSJT_HFaylUfeEIXS7YtOrmG1itTTGajTdB6c4pXnThtjHa3BXwdOKjvKhdlpxl2h0ln4G_GkZ7g0Tmu1PW6umu_kAiJnPa9tkJ3obhwQe02oYKb4xY",
  },
  {
    id: "burton-custom-board",
    title: "Burton Custom Board",
    subtitle: "Snowboard",
    categoryId: "wintersport",
    location: "Utrecht",
    pricePerDayCents: 3000,
    depositCents: 10000,
    tags: ["Pro Gear"],
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHm9g5ddK1AXUxYKypibpKBzFtNkpCJUxd214OZPS7BOsYxQwfmm23aE-97Wz8EmRJc_-JcV7cQseMBxJV9PvJN14LhamDiBhPM4bMyKh-WFK75t8yrGxDj1j22AF6tfv_pwJJH3cGiXm7Q4-5VQ-vqYSSr8HGDKQo29FjAljgsBQ9yQU6oUD5kf4yvcNLWWJffQcihpdd1eqoeo9krLiVvxrZFNhDuuF-5hzMzEWFLBne2VeMDLMyjDKGlZ5n36aGoEJC0oinf20",
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function formatEUR(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function clampToPositiveInt(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

export function daysBetweenInclusive(startISO: string, endISO: string): number {
  // Expect yyyy-mm-dd (from <input type="date">)
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

