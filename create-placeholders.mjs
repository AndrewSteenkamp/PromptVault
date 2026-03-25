import mysql from 'mysql2/promise';

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);

    console.log('\n📚 CREATING PLACEHOLDER MODULES FOR MISSING COURSES');
    console.log('====================================================\n');

    // Get all courses
    const [allCourses] = await connection.execute('SELECT id, title FROM courses WHERE id != 1 ORDER BY id');
    
    // Get courses that already have modules
    const [convertedCourses] = await connection.execute(
      'SELECT DISTINCT course_id FROM modules'
    );
    const convertedIds = new Set(convertedCourses.map(c => c.course_id));

    const missingCourses = allCourses.filter(c => !convertedIds.has(c.id));

    console.log(`Total courses: ${allCourses.length}`);
    console.log(`Already converted: ${convertedIds.size}`);
    console.log(`Missing modules: ${missingCourses.length}\n`);

    let created = 0;
    let failed = 0;

    for (let i = 0; i < missingCourses.length; i++) {
      const course = missingCourses[i];
      const progressPercent = Math.round(((i + 1) / missingCourses.length) * 100);
      
      process.stdout.write(`\r[${i + 1}/${missingCourses.length}] (${progressPercent}%) Creating placeholder for: ${course.title.substring(0, 50)}`);

      try {
        // Create placeholder module
        const [moduleResult] = await connection.execute(
          'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)',
          [
            course.id,
            `${course.title} - Getting Started`,
            `Introduction to ${course.title}. Complete this module to unlock advanced content.`,
            1
          ]
        );
        const moduleId = moduleResult.insertId;

        // Create placeholder lesson
        await connection.execute(
          `INSERT INTO lessons (
            module_id, course_id, title, content, prompt,
            prompt_instructions, example_input, example_output,
            quiz_question, quiz_options, quiz_correct_answer,
            quiz_explanation, recommended_tools, order_index
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            moduleId,
            course.id,
            `Welcome to ${course.title}`,
            `This course covers ${course.title}. More detailed content will be added soon.`,
            `Learn about ${course.title}`,
            JSON.stringify([
              'Read the course introduction',
              'Understand the key concepts',
              'Prepare for advanced lessons',
              'Complete the knowledge check'
            ]),
            'What would you like to learn about this topic?',
            'You will gain practical skills and knowledge.',
            `What is the main focus of ${course.title}?`,
            JSON.stringify([
              'Foundational concepts',
              'Practical applications',
              'Advanced techniques',
              'Real-world case studies'
            ]),
            0,
            'This course provides a comprehensive introduction to the topic.',
            JSON.stringify([
              {
                name: 'ChatGPT',
                description: 'Get instant answers and explanations',
                affiliateUrl: 'https://chat.openai.com'
              },
              {
                name: 'Perplexity AI',
                description: 'Research and learn more about this topic',
                affiliateUrl: 'https://www.perplexity.ai'
              },
              {
                name: 'Claude',
                description: 'Detailed analysis and insights',
                affiliateUrl: 'https://claude.ai'
              }
            ]),
            1
          ]
        );

        created++;
      } catch (error) {
        failed++;
        console.error(`\n❌ ${course.title}: ${error.message}`);
      }
    }

    console.log(`\n\n${'='.repeat(50)}`);
    console.log(`✅ PLACEHOLDER CREATION COMPLETE`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Created: ${created}/${missingCourses.length}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success rate: ${Math.round((created / missingCourses.length) * 100)}%\n`);

    // Final summary
    const [finalModules] = await connection.execute('SELECT COUNT(*) as count FROM modules');
    const [finalLessons] = await connection.execute('SELECT COUNT(*) as count FROM lessons');
    const [finalCourses] = await connection.execute('SELECT COUNT(*) as count FROM courses WHERE id != 1');

    console.log('📊 FINAL STATUS:');
    console.log(`  Total courses: ${finalCourses[0].count}`);
    console.log(`  Total modules: ${finalModules[0].count}`);
    console.log(`  Total lessons: ${finalLessons[0].count}\n`);

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
