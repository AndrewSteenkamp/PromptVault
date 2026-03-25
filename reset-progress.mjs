import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { lessonProgress, courseProgress, users } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get user ID (assuming user ID 1 is the admin)
const userId = 1;

console.log('Resetting progress for user ID:', userId);

// Delete all lesson progress
const deletedLessons = await db.delete(lessonProgress)
  .where(eq(lessonProgress.userId, userId));

console.log('✓ Cleared all lesson progress');

// Delete all course progress
const deletedCourses = await db.delete(courseProgress)
  .where(eq(courseProgress.userId, userId));

console.log('✓ Cleared all course progress');

// Reset user stats (keep totalXp but reset streak)
await db.update(users)
  .set({
    currentStreak: 0,
    lastActivityDate: null,
  })
  .where(eq(users.id, userId));

console.log('✓ Reset user activity streak');

console.log('\n✅ Successfully reset all course progress!');
console.log('You can now start fresh and test the full learning experience.');

await connection.end();
