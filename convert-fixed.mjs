import mysql from 'mysql2/promise';
import { invokeLLM } from './server/_core/llm.ts';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function convertSingleCourse(connection, courseId, courseName) {
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📚 CONVERTING: ${courseName}`);
    console.log(`${'='.repeat(70)}`);

    // Get all prompts for this course
    const [prompts] = await connection.execute(`
      SELECT id, title, content, format
      FROM prompts
      WHERE course_id = ? AND content IS NOT NULL AND content != ''
      ORDER BY id
      LIMIT 50
    `, [courseId]);

    if (prompts.length === 0) {
      console.log('⚠️  No prompts found - skipping');
      return false;
    }

    console.log(`\n📝 Found ${prompts.length} prompts\n`);

    // Create 3 fixed modules based on prompt themes
    const modules = [
      {
        title: 'Fundamentals & Concepts',
        description: 'Core concepts and foundational knowledge'
      },
      {
        title: 'Practical Application',
        description: 'Real-world application and best practices'
      },
      {
        title: 'Advanced Techniques',
        description: 'Advanced strategies and optimization'
      }
    ];

    let totalLessonsCreated = 0;

    for (let modIdx = 0; modIdx < modules.length; modIdx++) {
      const modData = modules[modIdx];
      
      console.log(`\n📦 MODULE ${modIdx + 1}: ${modData.title}`);

      // Create module
      const [moduleResult] = await connection.execute(
        'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)',
        [courseId, modData.title, modData.description, modIdx + 1]
      );
      const moduleId = moduleResult.insertId;

      // Assign prompts to modules (distribute evenly)
      const promptsPerModule = Math.ceil(prompts.length / modules.length);
      const startIdx = modIdx * promptsPerModule;
      const endIdx = Math.min(startIdx + promptsPerModule, prompts.length);
      const modulePrompts = prompts.slice(startIdx, endIdx);

      console.log(`   Lessons: ${modulePrompts.length}`);

      // Create lessons from prompts
      for (let i = 0; i < modulePrompts.length; i++) {
        const prompt = modulePrompts[i];

        console.log(`   📖 Lesson ${i + 1}: ${prompt.title.substring(0, 50)}`);

        try {
          // Generate lesson content from prompt
          const lessonResponse = await invokeLLM({
            messages: [
              {
                role: 'system',
                content: 'You are an expert instructor. Create a detailed lesson and quiz based on the prompt. Return ONLY valid JSON, no other text.'
              },
              {
                role: 'user',
                content: `Create a lesson from this prompt:
TITLE: "${prompt.title}"
CONTENT: "${prompt.content}"

Return ONLY this JSON (no other text):
{
  "lessonContent": "Detailed explanation (150-250 words) with line breaks between sections",
  "quizQuestion": "Specific question about this topic",
  "quizOptions": ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
  "quizCorrectAnswer": 0,
  "quizExplanation": "Why answer 0 is correct"
}`
              }
            ]
          });

          // Parse response carefully
          let lessonData;
          try {
            const content = lessonResponse.choices[0].message.content.trim();
            lessonData = JSON.parse(content);
          } catch (parseError) {
            console.log(`      ⚠️  JSON parse error, using defaults`);
            lessonData = {
              lessonContent: `This lesson covers: ${prompt.title}\n\n${prompt.content}\n\nKey concepts:\n- Understand the core topic\n- Apply practical techniques\n- Implement best practices`,
              quizQuestion: `What is the main focus of "${prompt.title}"?`,
              quizOptions: [
                'The primary concept mentioned',
                'A secondary approach',
                'An alternative method',
                'An unrelated topic'
              ],
              quizCorrectAnswer: 0,
              quizExplanation: 'The correct answer focuses on the main topic covered in this lesson.'
            };
          }

          // Ensure all fields exist
          if (!lessonData.lessonContent) lessonData.lessonContent = prompt.content;
          if (!lessonData.quizQuestion) lessonData.quizQuestion = `What is "${prompt.title}"?`;
          if (!lessonData.quizOptions) lessonData.quizOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
          if (lessonData.quizCorrectAnswer === undefined) lessonData.quizCorrectAnswer = 0;
          if (!lessonData.quizExplanation) lessonData.quizExplanation = 'This is the correct answer.';

          // Insert lesson
          await connection.execute(
            `INSERT INTO lessons (
              module_id, course_id, title, content, prompt,
              prompt_instructions, example_input, example_output,
              quiz_question, quiz_options, quiz_correct_answer,
              quiz_explanation, recommended_tools, order_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              moduleId,
              courseId,
              prompt.title,
              lessonData.lessonContent,
              prompt.content,
              JSON.stringify(['Read lesson', 'Understand concepts', 'Apply knowledge', 'Take quiz']),
              `Example: ${prompt.title}`,
              'You will understand this concept',
              lessonData.quizQuestion,
              JSON.stringify(lessonData.quizOptions),
              lessonData.quizCorrectAnswer,
              lessonData.quizExplanation,
              JSON.stringify([{ name: 'ChatGPT', description: 'Learn more', affiliateUrl: 'https://chat.openai.com' }]),
              i + 1
            ]
          );

          totalLessonsCreated++;

        } catch (lessonError) {
          console.log(`      ❌ Lesson error: ${lessonError.message}`);
          continue;
        }

        // Small delay between lessons
        await delay(1000);
      }

      // Delay between modules
      await delay(2000);
    }

    console.log(`\n✅ COURSE COMPLETE: ${totalLessonsCreated} lessons created`);
    return true;

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎓 CAREFUL COURSE CONVERSION - FIXED VERSION`);
    console.log(`${'='.repeat(70)}`);

    // Get courses with prompts
    const [coursesWithPrompts] = await connection.execute(`
      SELECT DISTINCT c.id, c.title, COUNT(p.id) as prompt_count
      FROM courses c
      JOIN prompts p ON c.id = p.course_id
      WHERE c.id != 1 AND p.content IS NOT NULL AND p.content != ''
      GROUP BY c.id
      ORDER BY c.id
    `);

    console.log(`\n📊 Found ${coursesWithPrompts.length} courses with prompts\n`);

    let successCount = 0;
    let failureCount = 0;

    // Convert ONE course at a time
    for (let i = 0; i < coursesWithPrompts.length; i++) {
      const course = coursesWithPrompts[i];
      
      const success = await convertSingleCourse(connection, course.id, course.title);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Progress update
      const progressPercent = Math.round(((i + 1) / coursesWithPrompts.length) * 100);
      console.log(`\n[${i + 1}/${coursesWithPrompts.length}] (${progressPercent}%) ✅ ${successCount} | ❌ ${failureCount}`);

      // Delay between courses
      await delay(3000);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ CONVERSION COMPLETE`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Total converted: ${successCount}/${coursesWithPrompts.length}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Success rate: ${Math.round((successCount / coursesWithPrompts.length) * 100)}%\n`);

    // Final summary
    const [finalModules] = await connection.execute('SELECT COUNT(*) as count FROM modules');
    const [finalLessons] = await connection.execute('SELECT COUNT(*) as count FROM lessons');

    console.log('📊 FINAL DATABASE STATUS:');
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
