import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { lessons, modules } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get Apps Build course (courseId = 1)
const allLessons = await db.select().from(lessons).where(eq(lessons.courseId, 1));
const allModules = await db.select().from(modules).where(eq(modules.courseId, 1));

console.log('Total lessons:', allLessons.length);
console.log('Total modules:', allModules.length);
console.log('\nLesson orderIndex values by module:\n');

for (const module of allModules) {
  const moduleLessons = allLessons.filter(l => l.moduleId === module.id);
  console.log(`Module ${module.orderIndex}: ${module.title}`);
  console.log(`  Lessons (${moduleLessons.length}):`);
  
  moduleLessons
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach(lesson => {
      console.log(`    - Lesson ID ${lesson.id}, orderIndex: ${lesson.orderIndex}, title: ${lesson.title}`);
    });
  console.log('');
}

await connection.end();
