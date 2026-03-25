import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { lessons, modules } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get Apps Build course (courseId = 1)
const allLessons = await db.select().from(lessons).where(eq(lessons.courseId, 1));
const allModules = await db.select().from(modules).where(eq(modules.courseId, 1));

console.log('Fixing orderIndex to be sequential across entire course...\n');

// Sort modules by their orderIndex
const sortedModules = allModules.sort((a, b) => a.orderIndex - b.orderIndex);

let globalOrderIndex = 1;

for (const module of sortedModules) {
  const moduleLessons = allLessons
    .filter(l => l.moduleId === module.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  
  console.log(`Module ${module.orderIndex}: ${module.title} (${moduleLessons.length} lessons)`);
  
  for (const lesson of moduleLessons) {
    await db.update(lessons)
      .set({ orderIndex: globalOrderIndex })
      .where(eq(lessons.id, lesson.id));
    
    console.log(`  ✓ Lesson ${lesson.id}: "${lesson.title}" → orderIndex ${globalOrderIndex}`);
    globalOrderIndex++;
  }
  console.log('');
}

console.log(`✅ Successfully updated ${globalOrderIndex - 1} lessons with sequential orderIndex!`);

await connection.end();
