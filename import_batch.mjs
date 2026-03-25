import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { courses, prompts } from "./drizzle/schema.ts";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const db = drizzle(process.env.DATABASE_URL);

// Simple parser - extract lines as prompts
function parseFile(content) {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 30 && !line.match(/^#+/)) // Skip headers and short lines
    .map(line => line.replace(/^\d+\.\s*/, '')); // Remove numbering
}

async function main() {
  const uploadDir = '/home/ubuntu/upload';
  const files = readdirSync(uploadDir).filter(f => f.endsWith('.txt'));
  
  console.log(`Processing ${files.length} files...`);
  
  for (const file of files) {
    try {
      const content = readFileSync(join(uploadDir, file), 'utf-8');
      const title = file.replace('.txt', '').replace(/([A-Z])/g, ' $1').trim();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Check if exists
      const existing = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
      if (existing.length > 0) {
        console.log(`✓ Skip: ${title}`);
        continue;
      }
      
      // Determine category
      let category = 'Business';
      let price = 2999; // $29.99
      if (title.match(/Sales|Funnel|Lead|Marketing/i)) {
        category = 'Sales & Marketing';
        price = 3999;
      } else if (title.match(/Product|Digital|Development/i)) {
        category = 'Digital Products';
        price = 3499;
      } else if (title.match(/Excel|Google|Notion|Automation/i)) {
        category = 'Tools & Productivity';
        price = 2499;
      }
      
      // Insert course
      const [courseResult] = await db.insert(courses).values({
        title,
        slug,
        description: `Master ${title.toLowerCase()} with AI-powered prompts.`,
        category,
        price,
        isPublished: 1
      });
      
      // Get the course ID
      const [newCourse] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
      const courseId = newCourse.id;
      
      // Parse and insert prompts
      const promptLines = parseFile(content);
      let inserted = 0;
      
      for (const line of promptLines) {
        try {
          await db.insert(prompts).values({
            courseId,
            title: line.substring(0, 200),
            question: line,
            format: 'Text',
            content: line
          });
          inserted++;
        } catch (err) {
          // Skip duplicates or errors
        }
      }
      
      console.log(`✓ ${title}: ${inserted} prompts`);
      
    } catch (error) {
      console.error(`✗ ${file}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Import complete!');
}

main().catch(console.error);
