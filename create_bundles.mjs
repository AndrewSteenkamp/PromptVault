import { drizzle } from "drizzle-orm/mysql2";
import { courses, bundles, bundleCourses } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function createBundles() {
  console.log("Creating course bundles...\n");

  // Get all courses grouped by category
  const allCourses = await db.select().from(courses);
  
  const ecommerceCourses = allCourses.filter(c => 
    c.category.toLowerCase().includes("e-commerce") || 
    c.title.toLowerCase().includes("e-commerce") ||
    c.title.toLowerCase().includes("ecommerce")
  );
  
  const salesMarketingCourses = allCourses.filter(c => 
    c.category === "Sales & Marketing" || 
    c.title.toLowerCase().includes("sales") ||
    c.title.toLowerCase().includes("marketing") ||
    c.title.toLowerCase().includes("funnel")
  );
  
  const businessCourses = allCourses.filter(c => 
    c.category === "Business Strategy" ||
    c.title.toLowerCase().includes("business")
  );

  const financeCourses = allCourses.filter(c =>
    c.category === "Finance & Investing" ||
    c.title.toLowerCase().includes("crypto") ||
    c.title.toLowerCase().includes("nft") ||
    c.title.toLowerCase().includes("invest")
  );

  const customerServiceCourses = allCourses.filter(c =>
    c.category === "Customer Service" ||
    c.title.toLowerCase().includes("customer") ||
    c.title.toLowerCase().includes("service")
  );

  // Bundle 1: E-Commerce Master Bundle
  if (ecommerceCourses.length > 0) {
    const originalPrice = ecommerceCourses.reduce((sum, c) => sum + c.price, 0);
    const discountPercent = 30;
    const price = Math.round(originalPrice * (1 - discountPercent / 100));

    await db.insert(bundles).values({
      title: "E-Commerce Master Bundle",
      slug: "ecommerce-master-bundle",
      description: "Complete e-commerce toolkit with everything you need to build, launch, and scale your online store. Includes store setup, product optimization, shipping strategies, and advanced AR/VR integration.",
      category: "E-Commerce",
      price,
      originalPrice,
      discountPercent,
      isPublished: 1,
    });

    const [bundle] = await db.select().from(bundles).where(eq(bundles.slug, "ecommerce-master-bundle"));
    
    for (const course of ecommerceCourses) {
      await db.insert(bundleCourses).values({
        bundleId: bundle.id,
        courseId: course.id,
      });
    }

    console.log(`✅ Created E-Commerce Master Bundle`);
    console.log(`   ${ecommerceCourses.length} courses | R${(originalPrice/100).toFixed(2)} → R${(price/100).toFixed(2)} (${discountPercent}% off)\n`);
  }

  // Bundle 2: Sales & Marketing Pro Pack
  if (salesMarketingCourses.length > 0) {
    const originalPrice = salesMarketingCourses.reduce((sum, c) => sum + c.price, 0);
    const discountPercent = 25;
    const price = Math.round(originalPrice * (1 - discountPercent / 100));

    await db.insert(bundles).values({
      title: "Sales & Marketing Pro Pack",
      slug: "sales-marketing-pro-pack",
      description: "Master the art of selling with comprehensive sales funnel optimization, lead generation, copywriting, and conversion strategies. Perfect for entrepreneurs and marketers.",
      category: "Sales & Marketing",
      price,
      originalPrice,
      discountPercent,
      isPublished: 1,
    });

    const [bundle] = await db.select().from(bundles).where(eq(bundles.slug, "sales-marketing-pro-pack"));
    
    for (const course of salesMarketingCourses) {
      await db.insert(bundleCourses).values({
        bundleId: bundle.id,
        courseId: course.id,
      });
    }

    console.log(`✅ Created Sales & Marketing Pro Pack`);
    console.log(`   ${salesMarketingCourses.length} courses | R${(originalPrice/100).toFixed(2)} → R${(price/100).toFixed(2)} (${discountPercent}% off)\n`);
  }

  // Bundle 3: Complete Business Suite
  if (businessCourses.length > 0) {
    const originalPrice = businessCourses.reduce((sum, c) => sum + c.price, 0);
    const discountPercent = 35;
    const price = Math.round(originalPrice * (1 - discountPercent / 100));

    await db.insert(bundles).values({
      title: "Complete Business Suite",
      slug: "complete-business-suite",
      description: "Everything you need to start, grow, and scale your business. Includes business strategy, financial management, productivity tools, and growth frameworks.",
      category: "Business Strategy",
      price,
      originalPrice,
      discountPercent,
      isPublished: 1,
    });

    const [bundle] = await db.select().from(bundles).where(eq(bundles.slug, "complete-business-suite"));
    
    for (const course of businessCourses) {
      await db.insert(bundleCourses).values({
        bundleId: bundle.id,
        courseId: course.id,
      });
    }

    console.log(`✅ Created Complete Business Suite`);
    console.log(`   ${businessCourses.length} courses | R${(originalPrice/100).toFixed(2)} → R${(price/100).toFixed(2)} (${discountPercent}% off)\n`);
  }

  // Bundle 4: Finance & Crypto Mastery
  if (financeCourses.length > 0) {
    const originalPrice = financeCourses.reduce((sum, c) => sum + c.price, 0);
    const discountPercent = 30;
    const price = Math.round(originalPrice * (1 - discountPercent / 100));

    await db.insert(bundles).values({
      title: "Finance & Crypto Mastery",
      slug: "finance-crypto-mastery",
      description: "Complete guide to investing, cryptocurrency, NFTs, and financial analysis. Learn trading strategies, portfolio management, and market analysis.",
      category: "Finance & Investing",
      price,
      originalPrice,
      discountPercent,
      isPublished: 1,
    });

    const [bundle] = await db.select().from(bundles).where(eq(bundles.slug, "finance-crypto-mastery"));
    
    for (const course of financeCourses) {
      await db.insert(bundleCourses).values({
        bundleId: bundle.id,
        courseId: course.id,
      });
    }

    console.log(`✅ Created Finance & Crypto Mastery`);
    console.log(`   ${financeCourses.length} courses | R${(originalPrice/100).toFixed(2)} → R${(price/100).toFixed(2)} (${discountPercent}% off)\n`);
  }

  // Bundle 5: Customer Service Excellence
  if (customerServiceCourses.length > 0) {
    const originalPrice = customerServiceCourses.reduce((sum, c) => sum + c.price, 0);
    const discountPercent = 25;
    const price = Math.round(originalPrice * (1 - discountPercent / 100));

    await db.insert(bundles).values({
      title: "Customer Service Excellence",
      slug: "customer-service-excellence",
      description: "Build world-class customer service with comprehensive training on communication, complaint handling, AI automation, and quality assurance.",
      category: "Customer Service",
      price,
      originalPrice,
      discountPercent,
      isPublished: 1,
    });

    const [bundle] = await db.select().from(bundles).where(eq(bundles.slug, "customer-service-excellence"));
    
    for (const course of customerServiceCourses) {
      await db.insert(bundleCourses).values({
        bundleId: bundle.id,
        courseId: course.id,
      });
    }

    console.log(`✅ Created Customer Service Excellence`);
    console.log(`   ${customerServiceCourses.length} courses | R${(originalPrice/100).toFixed(2)} → R${(price/100).toFixed(2)} (${discountPercent}% off)\n`);
  }

  console.log("✨ All bundles created successfully!");
  process.exit(0);
}

createBundles().catch((error) => {
  console.error("Error creating bundles:", error);
  process.exit(1);
});
