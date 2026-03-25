import { drizzle } from "drizzle-orm/mysql2";
import { courses, prompts } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

const db = drizzle(process.env.DATABASE_URL);

// Category mapping for mega-prompts
const categoryMap = {
  // Personal Development & Productivity
  "time": "Productivity & Tools",
  "goal": "Business Strategy",
  "productivity": "Productivity & Tools",
  "career": "Business Strategy",
  "skill": "Business Strategy",
  "linkedin": "Sales & Marketing",
  "resume": "Business Strategy",
  "fitness": "Productivity & Tools",
  "workout": "Productivity & Tools",
  "energy": "Productivity & Tools",
  "creativity": "Creativity",
  "mission": "Business Strategy",
  "workshop": "Business Strategy",
  "leadership": "Business Strategy",
  "networking": "Sales & Marketing",
  "excel": "Productivity & Tools",
  "project": "Business Strategy",
  "task": "Productivity & Tools",
  "workflow": "Productivity & Tools",
  "remote": "Productivity & Tools",
  "office": "Productivity & Tools",
  "feedback": "Business Strategy",
  "technical": "Business Strategy",
  "competitor": "Business Strategy",
  "crm": "Business Strategy",
  "retrospective": "Business Strategy",
  "meal": "Productivity & Tools",
};

function detectCategory(filename, content) {
  const lower = filename.toLowerCase();
  
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lower.includes(keyword)) {
      return category;
    }
  }
  
  // Default category
  return "Business Strategy";
}

function extractMegaPrompt(content, filename) {
  const lines = content.split('\n');
  
  // Extract title (first non-empty line or from # header)
  let title = filename.replace(/\.txt$/, '').replace(/([A-Z])/g, ' $1').trim();
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#') && line.length > 3) {
      title = line.trim();
      break;
    }
    if (line.startsWith('# ')) {
      title = line.replace(/^#\s*/, '').trim();
      break;
    }
  }
  
  // Extract description from <aside> section or first paragraph
  let description = '';
  const asideMatch = content.match(/<aside>[\s\S]*?💡\s*(.*?)[\s\S]*?<\/aside>/);
  if (asideMatch) {
    description = asideMatch[1].trim();
  } else {
    // Find first substantial paragraph
    for (const line of lines) {
      if (line.trim().length > 50 && !line.startsWith('#') && !line.startsWith('```')) {
        description = line.trim();
        break;
      }
    }
  }
  
  // Extract the main prompt from code block
  const promptMatch = content.match(/```[\s\S]*?#CONTEXT:([\s\S]*?)```/);
  let promptText = '';
  if (promptMatch) {
    promptText = promptMatch[1].trim();
  } else {
    // If no code block, use the whole content as the prompt
    promptText = content;
  }
  
  return {
    title,
    description: description || `Comprehensive mega-prompt for ${title.toLowerCase()}`,
    promptText,
    format: 'Mega-Prompt Template'
  };
}

async function importMegaPrompts() {
  const uploadDir = '/home/ubuntu/upload';
  const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.txt') || !f.includes('.'));
  
  console.log(`Found ${files.length} files to process\n`);
  
  let newCourses = 0;
  let skippedCourses = 0;
  let newPrompts = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      const filePath = path.join(uploadDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Skip if content is too short or doesn't look like a mega-prompt
      if (content.length < 200) {
        console.log(`⏭️  Skipping ${file} (too short)`);
        continue;
      }
      
      const megaPrompt = extractMegaPrompt(content, file);
      const category = detectCategory(file, content);
      
      // Create course slug from filename
      const slug = file
        .replace(/\.txt$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check if course already exists
      const existing = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipping ${file} (already exists)`);
        skippedCourses++;
        continue;
      }
      
      // Determine pricing based on category and content length
      let price = 29.99;
      if (content.length > 2000) price = 39.99;
      if (content.length > 4000) price = 44.99;
      if (category === "Sales & Marketing" || category === "Business Strategy") price = 49.99;
      
      // Insert course
      await db.insert(courses).values({
        title: megaPrompt.title,
        slug,
        description: megaPrompt.description,
        category,
        price,
        isPremium: 1,
        isPublished: 1,
      });
      
      // Get the course ID
      const [newCourse] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
      
      if (newCourse) {
        // Insert the mega-prompt as a single prompt
        await db.insert(prompts).values({
          courseId: newCourse.id,
          title: megaPrompt.title,
          question: megaPrompt.promptText,
          format: megaPrompt.format,
          category: category,
          isPreview: 0,
        });
        
        newCourses++;
        newPrompts++;
        console.log(`✅ Imported: ${megaPrompt.title} (${category})`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      errors++;
    }
  }
  
  // Get final totals
  const [{ count: totalCourses }] = await db.select({ count: db.fn.count() }).from(courses);
  const [{ count: totalPrompts }] = await db.select({ count: db.fn.count() }).from(prompts);
  
  console.log('\n=== Import Complete ===');
  console.log(`New courses imported: ${newCourses}`);
  console.log(`Courses skipped (already exist): ${skippedCourses}`);
  console.log(`New prompts imported: ${newPrompts}`);
  console.log(`Errors: ${errors}`);
  console.log(`\n📊 Database Totals:`);
  console.log(`Total courses: ${totalCourses}`);
  console.log(`Total prompts: ${totalPrompts}`);
  
  process.exit(0);
}

importMegaPrompts().catch(console.error);
