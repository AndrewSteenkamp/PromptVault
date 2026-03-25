import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database('./storage/db.sqlite');

console.log('=== DATABASE CHECK ===\n');

// Check courses
const coursesCount = db.prepare('SELECT COUNT(*) as count FROM courses').get();
console.log(`Total Courses: ${coursesCount.count}`);

// Check prompts
const promptsCount = db.prepare('SELECT COUNT(*) as count FROM prompts').get();
console.log(`Total Prompts: ${promptsCount.count}`);

// Check bundles
const bundlesCount = db.prepare('SELECT COUNT(*) as count FROM bundles').get();
console.log(`Total Bundles: ${bundlesCount.count}`);

// Check users
const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
console.log(`Total Users: ${usersCount.count}`);

// Show sample courses
console.log('\n=== SAMPLE COURSES ===');
const sampleCourses = db.prepare('SELECT id, title, category, price, promptCount FROM courses LIMIT 5').all();
sampleCourses.forEach(course => {
  console.log(`${course.id}. ${course.title} (${course.category}) - $${course.price/100} - ${course.promptCount} prompts`);
});

// Check if courses have slugs
console.log('\n=== CHECKING SLUGS ===');
const coursesWithoutSlugs = db.prepare('SELECT COUNT(*) as count FROM courses WHERE slug IS NULL OR slug = ""').get();
console.log(`Courses without slugs: ${coursesWithoutSlugs.count}`);

db.close();
