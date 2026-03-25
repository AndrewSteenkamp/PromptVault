import { drizzle } from "drizzle-orm/mysql2";
import { courses, prompts } from "./drizzle/schema.ts";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const db = drizzle(process.env.DATABASE_URL);

// Parse prompt file content
function parsePromptFile(content, filename) {
  const lines = content.split('\n').filter(line => line.trim());
  const parsedPrompts = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;
    
    // Remove numbering like "1.", "2.", etc.
    const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim();
    if (cleaned.length > 20) {
      parsedPrompts.push({
        title: cleaned.substring(0, 200),
        content: cleaned,
        category: 'General'
      });
    }
  }
  
  return parsedPrompts;
}

// Map filename to course info
function getCourseInfo(filename) {
  const name = filename.replace('.txt', '').replace(/([A-Z])/g, ' $1').trim();
  
  // Categorize based on content
  const salesKeywords = ['Sales', 'Funnel', 'Lead', 'Customer', 'Marketing', 'Client', 'Revenue'];
  const productKeywords = ['Product', 'Digital', 'PRD', 'Development', 'Creation'];
  const toolKeywords = ['Excel', 'Google', 'Notion', 'Automation', 'Workflow'];
  
  let category = 'Business & Strategy';
  let price = 29.99;
  
  if (salesKeywords.some(kw => name.includes(kw))) {
    category = 'Sales & Marketing';
    price = 39.99;
  } else if (productKeywords.some(kw => name.includes(kw))) {
    category = 'Digital Products';
    price = 34.99;
  } else if (toolKeywords.some(kw => name.includes(kw))) {
    category = 'Productivity & Tools';
    price = 24.99;
  }
  
  return {
    title: name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    description: `Master ${name.toLowerCase()} with AI-powered prompts and strategies.`,
    category,
    price,
    difficulty: 'Intermediate',
    duration: '2-3 hours'
  };
}

async function importNewPrompts() {
  try {
    const uploadDir = '/home/ubuntu/upload';
    const files = readdirSync(uploadDir).filter(f => f.endsWith('.txt'));
    
    console.log(`Found ${files.length} prompt files to import`);
    
    let totalImported = 0;
    let coursesCreated = 0;
    
    for (const file of files) {
      const filepath = join(uploadDir, file);
      const content = readFileSync(filepath, 'utf-8');
      const courseInfo = getCourseInfo(file);
      
      // Check if course already exists
      const existingCourse = await db.select().from(courses)
        .where(eq(courses.slug, courseInfo.slug))
        .limit(1);
      
      let courseId;
      
      if (existingCourse.length > 0) {
        courseId = existingCourse[0].id;
        console.log(`Course "${courseInfo.title}" already exists, skipping...`);
        continue;
      } else {
        // Insert course
        const [result] = await db.insert(courses).values({
          ...courseInfo,
          isPublished: 1
        });
        courseId = Number(result.insertId) || 0;
        
        // If insertId is still invalid, query for the course we just created
        if (!courseId || isNaN(courseId)) {
          const newCourse = await db.select().from(courses)
            .where(eq(courses.slug, courseInfo.slug))
            .limit(1);
          courseId = newCourse[0]?.id || 0;
        }
        coursesCreated++;
        console.log(`Created course: ${courseInfo.title} (ID: ${courseId})`);
      }
      
      // Parse and insert prompts
      const parsedPrompts = parsePromptFile(content, file);
      
      if (parsedPrompts.length > 0) {
        for (const prompt of parsedPrompts) {
          await db.insert(prompts).values({
            courseId,
            title: prompt.title,
            question: prompt.content, // Use content as question
            format: prompt.category,
            content: prompt.content
          });
        }
        totalImported += parsedPrompts.length;
        console.log(`  Imported ${parsedPrompts.length} prompts`);
      }
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`   Courses created: ${coursesCreated}`);
    console.log(`   Total prompts imported: ${totalImported}`);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Add missing import
import { eq } from "drizzle-orm";

importNewPrompts();
