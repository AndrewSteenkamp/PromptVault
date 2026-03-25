import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { lessons, courses } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const allLessons = await db.select().from(lessons);
const allCourses = await db.select().from(courses);

console.log('Total lessons:', allLessons.length);
console.log('Total courses:', allCourses.length);

if (allLessons.length > 0) {
  const courseIds = [...new Set(allLessons.map(l => l.courseId))];
  console.log('Course IDs with lessons:', courseIds);
  
  for (const courseId of courseIds) {
    const course = allCourses.find(c => c.id === courseId);
    const lessonCount = allLessons.filter(l => l.courseId === courseId).length;
    console.log(`  - Course ${courseId} (${course?.title}): ${lessonCount} lessons`);
  }
}

await connection.end();
