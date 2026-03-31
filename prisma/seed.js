const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  // Get or create the first user
  let user = await prisma.user.findFirst();

  if (!user) {
    console.log("❌ Geen user gevonden. Registreer eerst een account.");
    process.exit(1);
  }

  console.log(`📍 Toevoegen aan account: ${user.email}`);

  // Get existing categories (use their actual IDs from DB)
  const existingCategories = await prisma.category.findMany();
  const categoryMap = {};
  for (const cat of existingCategories) {
    categoryMap[cat.slug] = cat.id;
  }
  console.log("📚 Bestaande categorieën gebruiken");

  // Create categories if they don't exist
  const categoryData = [
    { id: "watersporten", slug: "watersporten", label: "Watersporten", sortOrder: 0 },
    { id: "wintersport", slug: "wintersport", label: "Wintersport", sortOrder: 1 },
    { id: "fietssporten", slug: "fietssporten", label: "Fietssporten", sortOrder: 2 },
    { id: "balsporten", slug: "balsporten", label: "Balsporten", sortOrder: 3 },
    { id: "overige_sporten", slug: "overige_sporten", label: "Overige Sporten", sortOrder: 4 },
    { id: "transport_baggage", slug: "transport_baggage", label: "Transport & Baggage", sortOrder: 5 },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { label: cat.label, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log("✅ Categorieën aangemaakt/bijgewerkt");

  // Catalog products
  const products = [
    {
      title: "Trek Fuel EX 9.8",
      subtitle: "Mountainbike / Trail",
      categoryId: "fietssporten",
      location: "Amsterdam",
      pricePerDayCents: 4500,
      depositCents: 15000,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDPd0SpYeEcu_I67Jasb4pdXSWdLtiH6_CBFdIba64aAuKFKrjdjkJu920bIKcBcGcE_03AvS36B_eB3_LCvzd3iLWFbnXWmR4QcPXdHs_hwbFspOjs5zGcPdjTjOPpb9_A5unyEoOPtMaKXGQAhU_WO7tcljpIQvUR4uu1CTR4TOVJ765luOhV5yu4T4r2Qx0VLpOa0f0V_GLhax0HhCZYrj74Vh4c5aswR1MKDpH5UgQSavQK_wAit-fM1OwI09-5u6oXgNCUBdA",
    },
    {
      title: "Specialized Enduro MTB",
      subtitle: "High-end Enduro",
      categoryId: "fietssporten",
      location: "Amsterdam",
      pricePerDayCents: 4500,
      depositCents: 15000,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCWTDTR2LKVCMtmyGmJvYYrtVyBR4B06-RG0UUEqGcPEY4NUVJSrbHPTLZ22adj_SUrW8ONbZj_fBsbExOh5csoSLudz2OZQiQawiAP8LL0IVi4ZoYUCcMj-YRgaSXk5oWN0FHipIx4eZYOsaWsUogI2A_rTr5bpyPOqhfVrVB-RbZ-1bCPX6crAN9fXhZcZfKQVl5BgL77eawOHeMPYTqoAeCQ1_xfpjh5D3jV7G3saEQPpSJ2ctbD3llNJpBDrDneKVCxfQs-BEs",
    },
    {
      title: "Expedition Tent",
      subtitle: "Outdoor Essentials",
      categoryId: "overige_sporten",
      location: "Eindhoven",
      pricePerDayCents: 2500,
      depositCents: 10000,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBeDbnzOXQNGzXmC2XnpEils_0iv3UiWyfOiROPC5hCrUXZgpyDnEOJU38agbqvy16a67Ik0mFw_q3j-cnBIh3wEmxtBYnrKrDYQSxCiqgF6GOusTHbnHxXQ5-LFqveVLoRkmSgFe7v-KhkrA-tUdO9rYJ_D7S7-3FUtIklrlFanNZi3rxiJqNm0_BG1ihSPZa_0FphJnlzHjav3iDe0o3e3faZQ-e4p86Td6tE7rUGdg5qNduOO9Y23GomKWEIeraN9tm_5wMdoVc",
    },
    {
      title: "Sea Kayak Pro-2",
      subtitle: "Watersport",
      categoryId: "watersporten",
      location: "Rotterdam",
      pricePerDayCents: 5500,
      depositCents: 20000,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCyMLGOI7_GoeTSBUL0iaEWIN5pwaSLMnqGukGioAl8tzjmIpiLYQFzihXY5V06LfVqunBeUah4gyUagUaRom3VOVtSsqWViQVCzhSVFfsAOU05qTPq4NPAqaBWt8xRS0ZVOymRq53ebnGVSBNdL11K9G9CkSJT_HFaylUfeEIXS7YtOrmG1itTTGajTdB6c4pXnThtjHa3BXwdOKjvKhdlpxl2h0ln4G_GkZ7g0Tmu1PW6umu_kAiJnPa9tkJ3obhwQe02oYKb4xY",
    },
    {
      title: "Burton Custom Board",
      subtitle: "Snowboard",
      categoryId: "wintersport",
      location: "Utrecht",
      pricePerDayCents: 3000,
      depositCents: 10000,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDHm9g5ddK1AXUxYKypibpKBzFtNkpCJUxd214OZPS7BOsYxQwfmm23aE-97Wz8EmRJc_-JcV7cQseMBxJV9PvJN14LhamDiBhPM4bMyKh-WFK75t8yrGxDj1j22AF6tfv_pwJJH3cGiXm7Q4-5VQ-vqYSSr8HGDKQo29FjAljgsBQ9yQU6oUD5kf4yvcNLWWJffQcihpdd1eqoeo9krLiVvxrZFNhDuuF-5hzMzEWFLBne2VeMDLMyjDKGlZ5n36aGoEJC0oinf20",
    },
    {
      title: "Petzl Climb Kit Pro",
      subtitle: "Klimset",
      categoryId: "overige_sporten",
      location: "Arnhem",
      pricePerDayCents: 2800,
      depositCents: 9000,
      imageUrl:
        "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Roland GO:KEYS Studio",
      subtitle: "Synth / Keys",
      categoryId: "overige_sporten",
      location: "Rotterdam",
      pricePerDayCents: 3200,
      depositCents: 11000,
      imageUrl:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  // Create items
  let createdCount = 0;
  let skippedCount = 0;
  for (const product of products) {
    try {
      // Map slug to actual categoryId
      const actualCategoryId = categoryMap[product.categoryId];
      if (!actualCategoryId) {
        console.log(`⚠️ Categorie "${product.categoryId}" niet gevonden, item overgeslagen`);
        continue;
      }

      const existingItem = await prisma.item.findFirst({
        where: {
          title: product.title,
          ownerId: user.id,
        },
      });

      if (!existingItem) {
        await prisma.item.create({
          data: {
            ...product,
            categoryId: actualCategoryId,
            ownerId: user.id,
            status: "PUBLISHED",
          },
        });
        console.log(`✅ ${product.title} toegevoegd`);
        createdCount++;
      } else {
        console.log(`⏭️  ${product.title} bestaat al`);
        skippedCount++;
      }
    } catch (err) {
      console.error(`❌ Error creating "${product.title}":`, err.message);
    }
  }

  console.log(`\n✅ ${createdCount} nieuwe producten toegevoegd!`);
  if (skippedCount > 0) console.log(`⏭️  ${skippedCount} producten bestonden al`);
}

main()
  .catch((e) => {
    console.error("❌ Fout:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
