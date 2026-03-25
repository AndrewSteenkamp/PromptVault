import mysql from 'mysql2/promise';
import { eq, ne } from 'drizzle-orm';

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);

    // Get all courses except Apps Build
    const [courses] = await connection.execute('SELECT id, title FROM courses WHERE id != 1');
    
    // Get already converted courses
    const [converted] = await connection.execute('SELECT DISTINCT course_id FROM modules');
    const convertedIds = new Set(converted.map(c => c.course_id));
    
    const remaining = courses.filter(c => !convertedIds.has(c.id));

    console.log(`\n📚 FAST CONVERSION PROCESS`);
    console.log(`===========================`);
    console.log(`Total courses: ${courses.length}`);
    console.log(`Already converted: ${convertedIds.size}`);
    console.log(`Remaining: ${remaining.length}\n`);

    let successCount = convertedIds.size;
    let failureCount = 0;

    for (let i = 0; i < remaining.length; i++) {
      const course = remaining[i];
      const progressPercent = Math.round((successCount / courses.length) * 100);
      
      process.stdout.write(`\r[${successCount + 1}/${courses.length}] (${progressPercent}%) ${course.title.substring(0, 50)}`);

      try {
        // Get all prompts for this course
        const [prompts] = await connection.execute(
          'SELECT id, title, content FROM prompts WHERE course_id = ? AND content IS NOT NULL AND content != ""',
          [course.id]
        );

        if (prompts.length === 0) {
          failureCount++;
          continue;
        }

        // Create 1 module per course (simple approach)
        const [moduleResult] = await connection.execute(
          'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)',
          [course.id, `${course.title} - Module 1`, `Complete guide to ${course.title}`, 1]
        );
        const moduleId = moduleResult.insertId;

        // Insert all prompts as lessons
        for (let j = 0; j < prompts.length; j++) {
          const prompt = prompts[j];
          
          await connection.execute(
            `INSERT INTO lessons (
              module_id, course_id, title, content, prompt, 
              quiz_question, quiz_options, quiz_correct_answer, 
              quiz_explanation, recommended_tools, order_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              moduleId,
              course.id,
              prompt.title,
              prompt.content,
              prompt.content,
              'What did you learn from this prompt?',
              JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
              0,
              'Review the lesson content.',
              JSON.stringify([]),
              j + 1
            ]
          );
        }

        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`\n❌ ${course.title}: ${error.message}`);
      }
    }

    console.log(`\n\n${'='.repeat(50)}`);
    console.log(`✅ CONVERSION COMPLETE`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Total converted: ${successCount}/${courses.length}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Success rate: ${Math.round((successCount / courses.length) * 100)}%\n`);

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
