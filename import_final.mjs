import { drizzle } from "drizzle-orm/mysql2";
import { courses, prompts } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

const db = drizzle(process.env.DATABASE_URL);

// Helper to generate slug from filename
function generateSlug(filename) {
  return filename
    .replace(/\.txt$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

// Helper to categorize courses
function categorize(filename) {
  const name = filename.toLowerCase();
  
  // Finance & Investing
  if (name.includes("crypto") || name.includes("nft") || name.includes("trading") || 
      name.includes("invest") || name.includes("financial") || name.includes("portfolio") ||
      name.includes("market") || name.includes("flip") || name.includes("mining") ||
      name.includes("airdrop")) {
    return "Finance & Investing";
  }
  
  // E-Commerce
  if (name.includes("ecommerce") || name.includes("e-commerce") || name.includes("store") ||
      name.includes("checkout") || name.includes("cart") || name.includes("shipping") ||
      name.includes("inventory") || name.includes("supplier") || name.includes("product") ||
      name.includes("upsell") || name.includes("cross-sell") || name.includes("ar&vr")) {
    return "E-Commerce";
  }
  
  // Customer Service
  if (name.includes("customer") && (name.includes("service") || name.includes("support") ||
      name.includes("complaint") || name.includes("feedback") || name.includes("review") ||
      name.includes("survey") || name.includes("escalation") || name.includes("empathy") ||
      name.includes("communication"))) {
    return "Customer Service";
  }
  
  // HR & Personnel
  if (name.includes("hr") || name.includes("recruitment") || name.includes("interview") ||
      name.includes("talent") || name.includes("personnel") || name.includes("employee") ||
      name.includes("staff") || name.includes("hiring") || name.includes("compensation") ||
      name.includes("benefits") || name.includes("corporate") && name.includes("brand")) {
    return "HR & Personnel";
  }
  
  // Sales & Marketing
  if (name.includes("sales") || name.includes("funnel") || name.includes("lead") ||
      name.includes("conversion") || name.includes("marketing") || name.includes("sms") ||
      name.includes("email") && name.includes("marketing") || name.includes("client") && name.includes("acquisition")) {
    return "Sales & Marketing";
  }
  
  // Landing Pages & Conversion
  if (name.includes("landing") || name.includes("cta") || name.includes("convertible") ||
      name.includes("analytics") && name.includes("productivity")) {
    return "Landing Pages & Conversion";
  }
  
  // Content & Copywriting
  if (name.includes("copy") || name.includes("content") || name.includes("blog") ||
      name.includes("email") && name.includes("writing")) {
    return "Content & Copywriting";
  }
  
  // Digital Marketing
  if (name.includes("seo") || name.includes("digital") && name.includes("marketing")) {
    return "Digital Marketing";
  }
  
  // Business & Strategy
  if (name.includes("business") || name.includes("strategy") || name.includes("growth") ||
      name.includes("expansion") || name.includes("niche") || name.includes("network") ||
      name.includes("outsourcing") || name.includes("delegation") || name.includes("work-life")) {
    return "Business & Strategy";
  }
  
  // SaaS
  if (name.includes("saas") || name.includes("subscription") || name.includes("pricing") && name.includes("subscription")) {
    return "SaaS";
  }
  
  // AI & Technology
  if (name.includes("ai") || name.includes("chatbot") || name.includes("machine") ||
      name.includes("automation") || name.includes("image") && name.includes("ai")) {
    return "AI & Technology";
  }
  
  // Tools & Productivity
  if (name.includes("excel") || name.includes("google") && name.includes("sheet") ||
      name.includes("notion") || name.includes("tool") || name.includes("productivity") ||
      name.includes("efficiency") || name.includes("time") || name.includes("task")) {
    return "Tools & Productivity";
  }
  
  // Development & No-Code
  if (name.includes("website") && name.includes("development") || name.includes("no-code") ||
      name.includes("app") || name.includes("implementation") || name.includes("devops") ||
      name.includes("database") || name.includes("cybersecurity")) {
    return "Development & No-Code";
  }
  
  // Creative & Design
  if (name.includes("creative") || name.includes("design") || name.includes("generation") ||
      name.includes("audio") || name.includes("visual")) {
    return "Creative & Design";
  }
  
  return "Business & Strategy"; // Default category
}

// Helper to determine price based on category and content
function determinePrice(category, promptCount) {
  const basePrices = {
    "Finance & Investing": 49.99,
    "E-Commerce": 44.99,
    "Customer Service": 39.99,
    "HR & Personnel": 44.99,
    "Sales & Marketing": 44.99,
    "Landing Pages & Conversion": 44.99,
    "Content & Copywriting": 39.99,
    "Digital Marketing": 44.99,
    "Business & Strategy": 39.99,
    "SaaS": 44.99,
    "AI & Technology": 44.99,
    "Tools & Productivity": 29.99,
    "Development & No-Code": 39.99,
    "Creative & Design": 34.99
  };
  
  let price = basePrices[category] || 39.99;
  
  // Adjust based on content volume
  if (promptCount > 100) price += 10;
  else if (promptCount > 75) price += 5;
  else if (promptCount < 30) price -= 5;
  
  return Math.max(24.99, Math.min(59.99, price)); // Cap between $24.99 and $59.99
}

// Parse prompt file
function parsePromptFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  
  const prompts = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and lines with just whitespace
    if (!line || line === " ") continue;
    
    // Check if this line is a question (contains "?" and "(Format:")
    if (line.includes("?") && line.includes("(Format:")) {
      // The previous non-empty line should be the title
      let title = "";
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = lines[j].trim();
        if (prevLine && prevLine !== " " && !prevLine.includes("?")) {
          title = prevLine;
          break;
        }
      }
      
      if (title) {
        prompts.push({
          title: title,
          question: line
        });
      }
    }
  }
  
  return prompts;
}

// Generate course title from filename
function generateTitle(filename) {
  return filename
    .replace(/\.txt$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
    .replace(/&/g, "and")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Main import function
async function importAllCourses() {
  const uploadDir = "/home/ubuntu/upload";
  const files = fs.readdirSync(uploadDir);
  
  console.log(`Found ${files.length} files to process`);
  
  let coursesImported = 0;
  let promptsImported = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      
      // Skip directories
      if (!stats.isFile()) continue;
      
      // Parse prompts from file
      const parsedPrompts = parsePromptFile(filePath);
      
      if (parsedPrompts.length === 0) {
        console.log(`⚠️  No prompts found in ${file}`);
        continue;
      }
      
      const slug = generateSlug(file);
      const title = generateTitle(file);
      const category = categorize(file);
      const price = determinePrice(category, parsedPrompts.length);
      
      // Check if course already exists
      const existing = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
      
      let courseId;
      
      if (existing.length > 0) {
        courseId = existing[0].id;
        console.log(`✓ Course already exists: ${title} (${parsedPrompts.length} prompts)`);
      } else {
        // Insert course
        const result = await db.insert(courses).values({
          title,
          slug,
          description: `Comprehensive ${category.toLowerCase()} prompts covering ${parsedPrompts.length}+ strategies and techniques.`,
          category,
          price,
          isPremium: 1
        });
        
        courseId = Number(result.insertId);
        coursesImported++;
        console.log(`✓ Imported: ${title} (${parsedPrompts.length} prompts) - $${price}`);
      }
      
      // Import prompts for this course
      for (const prompt of parsedPrompts) {
        await db.insert(prompts).values({
          courseId,
          title: prompt.title,
          question: prompt.question,
          category: category
        });
        promptsImported++;
      }
      
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\\n=== Import Complete ===`);
  console.log(`Courses imported: ${coursesImported}`);
  console.log(`Prompts imported: ${promptsImported}`);
  console.log(`Errors: ${errors}`);
  
  // Get final counts
  const totalCourses = await db.select().from(courses);
  const totalPrompts = await db.select().from(prompts);
  
  console.log(`\\nTotal courses in database: ${totalCourses.length}`);
  console.log(`Total prompts in database: ${totalPrompts.length}`);
}

importAllCourses().catch(console.error);
