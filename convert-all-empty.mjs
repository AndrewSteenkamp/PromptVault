import mysql from 'mysql2/promise';
import { invokeLLM } from './server/_core/llm.ts';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);

    console.log(`\n📚 CONVERTING ALL EMPTY COURSES WITH AI CONTENT`);
    console.log(`===============================================\n`);

    // Get all courses except Apps Build
    const [allCourses] = await connection.execute('SELECT id, title FROM courses WHERE id != 1 ORDER BY id');
    
    // Get courses that already have modules
    const [convertedCourses] = await connection.execute(
      'SELECT DISTINCT course_id FROM modules'
    );
    const convertedIds = new Set(convertedCourses.map(c => c.course_id));

    const remainingCourses = allCourses.filter(c => !convertedIds.has(c.id));

    console.log(`Total courses: ${allCourses.length}`);
    console.log(`Already converted: ${convertedIds.size}`);
    console.log(`Remaining to convert: ${remainingCourses.length}\n`);

    let successCount = convertedIds.size;
    let failureCount = 0;

    for (let i = 0; i < remainingCourses.length; i++) {
      const course = remainingCourses[i];
      const progressPercent = Math.round((successCount / allCourses.length) * 100);
      
      console.log(`\n[${successCount + 1}/${allCourses.length}] (${progressPercent}%) Processing: ${course.title}`);

      try {
        // For empty courses, generate synthetic content based on course title
        console.log(`  🤖 Generating AI content for "${course.title}"...`);

        // Generate course structure and content
        const courseResponse = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert curriculum designer creating comprehensive courses.'
            },
            {
              role: 'user',
              content: `Create a complete course structure for "${course.title}".

Generate:
1. 3-5 learning modules with progression from beginner to advanced
2. For each module, create 8-15 lesson topics
3. For the entire course, identify 5 recommended AI tools

Return JSON with this exact structure:
{
  "modules": [
    {
      "title": "Module name",
      "description": "What students learn",
      "lessons": [
        {
          "title": "Lesson title",
          "description": "What this lesson covers"
        }
      ]
    }
  ],
  "quizTemplate": {
    "question": "Generic quiz question about {topic}",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  },
  "recommendedTools": [
    {"name": "Tool", "description": "Why useful", "affiliateUrl": "https://..."}
  ]
}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'course_structure',
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
                        lessons: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              title: { type: 'string' },
                              description: { type: 'string' }
                            },
                            required: ['title', 'description'],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ['title', 'description', 'lessons'],
                      additionalProperties: false
                    }
                  },
                  quizTemplate: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      options: { type: 'array', items: { type: 'string' } },
                      correctAnswer: { type: 'number' }
                    },
                    required: ['question', 'options', 'correctAnswer'],
                    additionalProperties: false
                  },
                  recommendedTools: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        affiliateUrl: { type: 'string' }
                      },
                      required: ['name', 'description', 'affiliateUrl'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['modules', 'quizTemplate', 'recommendedTools'],
                additionalProperties: false
              }
            }
          }
        });

        const courseData = JSON.parse(courseResponse.choices[0].message.content);
        console.log(`  📦 Created ${courseData.modules.length} modules with ${courseData.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons`);

        // Create modules and lessons
        let globalLessonOrder = 1;
        for (let modIdx = 0; modIdx < courseData.modules.length; modIdx++) {
          const modData = courseData.modules[modIdx];

          // Create module
          const [moduleResult] = await connection.execute(
            'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)',
            [course.id, modData.title, modData.description, modIdx + 1]
          );
          const moduleId = moduleResult.insertId;

          // Create lessons for this module
          for (let lessonIdx = 0; lessonIdx < modData.lessons.length; lessonIdx++) {
            const lessonData = modData.lessons[lessonIdx];

            // Customize quiz question for this lesson
            const customQuestion = courseData.quizTemplate.question.replace('{topic}', lessonData.title);

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
                lessonData.title,
                lessonData.description,
                lessonData.title,
                JSON.stringify([
                  'Read the lesson carefully',
                  'Understand the core concepts',
                  'Apply to your situation',
                  'Practice and refine'
                ]),
                `Example: How would you apply ${lessonData.title}?`,
                `You will be able to ${lessonData.title.toLowerCase()}`,
                customQuestion,
                JSON.stringify(courseData.quizTemplate.options),
                courseData.quizTemplate.correctAnswer,
                'Review the lesson content to understand the correct approach.',
                JSON.stringify(courseData.recommendedTools),
                globalLessonOrder
              ]
            );

            globalLessonOrder++;
          }
        }

        successCount++;
        console.log(`  ✅ Successfully converted`);
        
        // Delay between courses to avoid API rate limits
        await delay(3000);

      } catch (error) {
        failureCount++;
        console.error(`  ❌ Error: ${error.message}`);
        // Continue to next course on error
        await delay(2000);
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ CONVERSION COMPLETE`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Total converted: ${successCount}/${allCourses.length}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Success rate: ${Math.round((successCount / allCourses.length) * 100)}%\n`);

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
