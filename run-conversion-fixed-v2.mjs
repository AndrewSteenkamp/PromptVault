import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { courses, prompts, modules, lessons } from './drizzle/schema.ts';
import { eq, ne, isNotNull } from 'drizzle-orm';
import { invokeLLM } from './server/_core/llm.ts';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createConnection() {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      return connection;
    } catch (error) {
      retries++;
      if (retries >= MAX_RETRIES) throw error;
      console.log(`  ⚠️ Connection failed, retrying in ${RETRY_DELAY/1000}s... (attempt ${retries}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY);
    }
  }
}

async function main() {
  let connection;
  try {
    connection = await createConnection();
    const db = drizzle(connection);

    // Get all courses except Apps Build (courseId = 1)
    const allCourses = await db.select().from(courses).where(ne(courses.id, 1));
    
    // Get courses that already have modules (already converted)
    const convertedCourseIds = await db.select({ courseId: modules.courseId })
      .from(modules)
      .groupBy(modules.courseId);
    
    const convertedIds = new Set(convertedCourseIds.map(c => c.courseId));
    const remainingCourses = allCourses.filter(c => !convertedIds.has(c.id));

    console.log(`\n📚 COURSE CONVERSION PROCESS`);
    console.log(`============================`);
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
        // Get all prompts for this course - filter out those with null content
        const coursePrompts = await db.select().from(prompts)
          .where(eq(prompts.courseId, course.id));

        // Filter prompts that have content
        const validPrompts = coursePrompts.filter(p => p.content && p.content.trim().length > 0);

        if (validPrompts.length === 0) {
          console.log(`  ⚠️ No valid prompts found, skipping`);
          continue;
        }

        console.log(`  📝 Found ${validPrompts.length} valid prompts (${coursePrompts.length - validPrompts.length} skipped)`);

        // Organize prompts into modules
        const moduleResponse = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert curriculum designer organizing AI prompts into logical learning modules.'
            },
            {
              role: 'user',
              content: `Organize these ${validPrompts.length} prompts for "${course.title}" into 3-5 logical learning modules.
Prompts:
${validPrompts.map((p, i) => `${i + 1}. ${p.title}`).join('\n')}

Create a structured learning path with modules that progress from beginner to advanced.
Each module should have 8-15 lessons.
Return JSON array of modules with this structure:
[
  {
    "title": "Module name",
    "description": "What students will learn",
    "lessonIndices": [0, 1, 2, ...] // Array of prompt indices (0-based) that belong to this module
  }
]`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'course_modules',
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
                        lessonIndices: {
                          type: 'array',
                          items: { type: 'number' }
                        }
                      },
                      required: ['title', 'description', 'lessonIndices'],
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

        const { modules: moduleStructure } = JSON.parse(moduleResponse.choices[0].message.content);
        console.log(`  📦 Created ${moduleStructure.length} modules`);

        let globalLessonOrder = 1;

        // Create modules and lessons
        for (let modIndex = 0; modIndex < moduleStructure.length; modIndex++) {
          const modData = moduleStructure[modIndex];

          // Create module using raw SQL with correct column names (snake_case)
          const [moduleResult] = await connection.execute(
            'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)',
            [course.id, modData.title, modData.description, modIndex + 1]
          );
          const moduleId = moduleResult.insertId;

          // Create lessons for this module
          for (const promptIndex of modData.lessonIndices) {
            const prompt = validPrompts[promptIndex];
            if (!prompt) continue;

            try {
              // Generate lesson content
              const contentResponse = await invokeLLM({
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert instructor creating detailed step-by-step lessons from AI prompts.'
                  },
                  {
                    role: 'user',
                    content: `Create a detailed lesson from this prompt for "${course.title}":

Prompt: "${prompt.title}"
Full Prompt: "${prompt.content}"

Generate a lesson with:
1. Step-by-step instructions (3-5 clear steps)
2. Example input (what to feed into the AI tool)
3. Expected output (what result to expect)
4. Pro tips (2-3 advanced tips)
5. Knowledge check question (1 multiple choice question with 4 options and correct answer)
6. Recommended AI tools (3 tools that work best for this prompt)

Return JSON with this structure:
{
  "instructions": ["step 1", "step 2", ...],
  "exampleInput": "example input text",
  "expectedOutput": "expected output text",
  "proTips": ["tip 1", "tip 2", ...],
  "quizQuestion": "question text",
  "quizOptions": ["option 1", "option 2", "option 3", "option 4"],
  "quizCorrectAnswer": 0,
  "quizExplanation": "explanation of correct answer",
  "recommendedTools": [
    {"name": "Tool Name", "description": "why this tool", "affiliateUrl": "https://tool.com"},
    ...
  ]
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
                        instructions: { type: 'array', items: { type: 'string' } },
                        exampleInput: { type: 'string' },
                        expectedOutput: { type: 'string' },
                        proTips: { type: 'array', items: { type: 'string' } },
                        quizQuestion: { type: 'string' },
                        quizOptions: { type: 'array', items: { type: 'string' } },
                        quizCorrectAnswer: { type: 'number' },
                        quizExplanation: { type: 'string' },
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
                      required: ['instructions', 'exampleInput', 'expectedOutput', 'proTips', 'quizQuestion', 'quizOptions', 'quizCorrectAnswer', 'quizExplanation', 'recommendedTools'],
                      additionalProperties: false
                    }
                  }
                }
              });

              const lessonContent = JSON.parse(contentResponse.choices[0].message.content);

              // Insert lesson using raw SQL with correct column names (snake_case)
              await connection.execute(
                `INSERT INTO lessons (
                  module_id, course_id, title, content, prompt, prompt_instructions,
                  example_input, example_output, tips, quiz_question, quiz_options,
                  quiz_correct_answer, quiz_explanation, recommended_tools, order_index
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  moduleId,
                  course.id,
                  prompt.title,
                  prompt.content,
                  prompt.content,
                  JSON.stringify(lessonContent.instructions),
                  lessonContent.exampleInput,
                  lessonContent.expectedOutput,
                  JSON.stringify(lessonContent.proTips),
                  lessonContent.quizQuestion,
                  JSON.stringify(lessonContent.quizOptions),
                  lessonContent.quizCorrectAnswer,
                  lessonContent.quizExplanation,
                  JSON.stringify(lessonContent.recommendedTools),
                  globalLessonOrder
                ]
              );

              globalLessonOrder++;
            } catch (lessonError) {
              console.error(`    ⚠️ Skipped lesson "${prompt.title}": ${lessonError.message}`);
            }
          }
        }

        successCount++;
        console.log(`  ✅ Successfully converted`);

      } catch (error) {
        failureCount++;
        console.error(`  ❌ Error: ${error.message}`);
      }

      // Brief pause between courses to avoid overwhelming the API
      if (i < remainingCourses.length - 1) {
        await delay(1000);
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ CONVERSION COMPLETE`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Total converted: ${successCount}/${allCourses.length}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Success rate: ${Math.round((successCount / allCourses.length) * 100)}%\n`);

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
