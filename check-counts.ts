import { getDb } from './server/db.js';
import { courses, prompts, bundles, users } from './drizzle/schema.js';
import { count } from 'drizzle-orm';

async function checkCounts() {
  console.log('=== DATABASE COUNTS ===\n');
  
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }
  
  const coursesCount = await db.select({ count: count() }).from(courses);
  console.log(`Total Courses: ${coursesCount[0].count}`);
  
  const promptsCount = await db.select({ count: count() }).from(prompts);
  console.log(`Total Prompts: ${promptsCount[0].count}`);
  
  const bundlesCount = await db.select({ count: count() }).from(bundles);
  console.log(`Total Bundles: ${bundlesCount[0].count}`);
  
  const usersCount = await db.select({ count: count() }).from(users);
  console.log(`Total Users: ${usersCount[0].count}`);
  
  // Sample courses
  console.log('\n=== SAMPLE COURSES ===');
  const sampleCourses = await db.select().from(courses).limit(5);
  sampleCourses.forEach(course => {
    console.log(`${course.id}. ${course.title} (${course.category}) - $${course.price/100}`);
  });
  
  process.exit(0);
}

checkCounts().catch(console.error);
