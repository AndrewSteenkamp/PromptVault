import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { courses, prompts } from './drizzle/schema.ts';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '.env') });

async function importData() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  const data = JSON.parse(fs.readFileSync('/home/ubuntu/courses_data.json', 'utf-8'));
  
  console.log(`Importing ${data.length} courses...\n`);
  
  for (const courseData of data) {
    try {
      await db.insert(courses).values({
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        category: courseData.category,
        price: courseData.price,
        promptCount: courseData.promptCount,
        isPublished: 1,
      });
      
      const [course] = await db.select().from(courses).where(eq(courses.slug, courseData.slug)).limit(1);
      
      if (course && courseData.prompts.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < courseData.prompts.length; i += batchSize) {
          const batch = courseData.prompts.slice(i, i + batchSize);
          const promptValues = batch.map(p => ({
            courseId: course.id,
            title: p.title,
            question: p.question,
            format: p.format || null,
            orderIndex: p.order_index,
          }));
          
          await db.insert(prompts).values(promptValues);
        }
      }
      
      console.log(`✓ Imported: ${courseData.title} (${courseData.prompts.length} prompts)`);
    } catch (error) {
      console.error(`✗ Error: ${courseData.title}:`, error.message);
    }
  }
  
  console.log('\n✓ Import complete!');
  process.exit(0);
}

importData().catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});
