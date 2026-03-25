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
    `, [courseId]);

    if (prompts.length === 0) {
      console.log('⚠️  No prompts found - skipping');
      return false;
    }

    console.log(`\n📝 Found ${prompts.length} prompts\n`);

    // Group prompts into modules by analyzing their content
    console.log('🔍 Analyzing prompts to create module structure...');
    
    const moduleResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at organizing learning content into logical modules.'
        },
        {
          role: 'user',
          content: `Analyze these ${prompts.length} prompts and organize them into 3-5 logical learning modules.

Prompts:
${prompts.map((p, i) => `${i + 1}. "${p.title}"`).join('\n')}

For each module, provide:
1. Module title (clear, descriptive)
2. Module description (what students will learn)
3. Which prompt indices belong to this module (e.g., [1,2,3])

Return JSON:
{
  "modules": [
    {
      "title": "Module name",
      "description": "What students learn",
      "promptIndices": [1, 2, 3]
    }
  ]
}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'module_structure',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              modules: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    promptIndices: {
                      type: 'array',
                      items: { type: 'number' }
                    }
                  },
                  required: ['title', 'description', 'promptIndices'],
                  additionalProperties: false
                }
              }
            },
            required: ['modules'],
            additionalProperties: false
          }
        }
      }
    });

    const moduleStructure = JSON.parse(moduleResponse.choices[0].message.content);
    console.log(`✅ Created ${moduleStructure.modules.length} modules\n`);

    // Create each module and its lessons
    let totalLessonsCreated = 0;

    for (let modIdx = 0; modIdx < moduleStructure.modules.length; modIdx++) {
      const modData = moduleStructure.modules[modIdx];
      
      console.log(`\n📦 MODULE ${modIdx + 1}: ${modData.title}`);
      console.log(`   Description: ${modData.description}`);
      console.log(`   Prompts: ${modData.promptIndices.length}`);

      // Create module
      const [moduleResult] = await connection.execute(
        'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)',
        [courseId, modData.title, modData.description, modIdx + 1]
      );
      const moduleId = moduleResult.insertId;

      // Create lessons from prompts in this module
      for (let i = 0; i < modData.promptIndices.length; i++) {
        const promptIdx = modData.promptIndices[i] - 1; // Convert to 0-based
        const prompt = prompts[promptIdx];

        console.log(`   📖 Lesson ${i + 1}: ${prompt.title.substring(0, 60)}`);

        // Generate lesson content and quiz from the prompt
        const lessonResponse = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert instructor creating detailed, well-structured lessons.'
            },
            {
              role: 'user',
              content: `Create a detailed lesson based on this prompt:

PROMPT TITLE: "${prompt.title}"
PROMPT CONTENT: "${prompt.content}"

Generate:
1. A detailed lesson description (200-300 words) that:
   - Explains the concept clearly
   - Provides practical examples
   - Includes step-by-step guidance
   - Uses proper formatting with line breaks

2. A specific quiz question (NOT generic) that:
   - Tests understanding of the lesson
   - Has 4 meaningful answer options
   - Includes the correct answer index (0-3)
   - Includes an explanation

Return JSON:
{
  "lessonContent": "Detailed lesson description with proper formatting and line breaks",
  "quizQuestion": "Specific question about the lesson topic",
  "quizOptions": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "quizCorrectAnswer": 0,
  "quizExplanation": "Why this answer is correct"
}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'lesson_content',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  lessonContent: { type: 'string' },
                  quizQuestion: { type: 'string' },
                  quizOptions: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 4,
                    maxItems: 4
                  },
                  quizCorrectAnswer: { type: 'number' },
                  quizExplanation: { type: 'string' }
                },
                required: ['lessonContent', 'quizQuestion', 'quizOptions', 'quizCorrectAnswer', 'quizExplanation'],
                additionalProperties: false
              }
            }
          }
        });

        const lessonData = JSON.parse(lessonResponse.choices[0].message.content);

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
            lessonData.lessonContent, // REAL CONTENT - NOT NULL
            prompt.content,
            JSON.stringify([
              'Read the lesson carefully',
              'Understand the key concepts',
              'Apply to your situation',
              'Test your knowledge with the quiz'
            ]),
            `Apply this to: ${prompt.title}`,
            'You will understand and be able to apply this concept',
            lessonData.quizQuestion, // REAL QUESTION - NOT GENERIC
            JSON.stringify(lessonData.quizOptions),
            lessonData.quizCorrectAnswer,
            lessonData.quizExplanation,
            JSON.stringify([
              {
                name: 'ChatGPT',
                description: 'Get help understanding this concept',
                affiliateUrl: 'https://chat.openai.com'
              }
            ]),
            i + 1
          ]
        );

        totalLessonsCreated++;
      }

      // Delay between modules to avoid API rate limits
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
    console.log(`🎓 CAREFUL COURSE CONVERSION - ONE AT A TIME`);
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
      console.log(`\n[${i + 1}/${coursesWithPrompts.length}] (${progressPercent}%) Completed: ${successCount}, Failed: ${failureCount}`);

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
