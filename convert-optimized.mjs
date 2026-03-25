import mysql from 'mysql2/promise';
import { invokeLLM } from './server/_core/llm.ts';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

    console.log(`\n📚 OPTIMIZED CONVERSION PROCESS`);
    console.log(`================================`);
    console.log(`Total courses: ${courses.length}`);
    console.log(`Already converted: ${convertedIds.size}`);
    console.log(`Remaining: ${remaining.length}\n`);

    let successCount = convertedIds.size;
    let failureCount = 0;

    for (let i = 0; i < remaining.length; i++) {
      const course = remaining[i];
      const progressPercent = Math.round((successCount / courses.length) * 100);
      
      console.log(`\n[${successCount + 1}/${courses.length}] (${progressPercent}%) ${course.title}`);

      try {
        // Get all prompts for this course
        const [prompts] = await connection.execute(
          'SELECT id, title, content FROM prompts WHERE course_id = ? AND content IS NOT NULL AND content != "" ORDER BY id LIMIT 100',
          [course.id]
        );

        if (prompts.length === 0) {
          console.log(`  ⚠️ No valid prompts found`);
          continue;
        }

        console.log(`  📝 Found ${prompts.length} prompts`);

        // BULK API CALL: Generate module structure + shared quiz/tools for entire course
        const bulkResponse = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert curriculum designer and content strategist.'
            },
            {
              role: 'user',
              content: `For the course "${course.title}" with these ${prompts.length} prompts, create:

1. Module structure (3-5 modules organizing these prompts)
2. Generic quiz template for this course
3. Top 5 AI tools relevant to this entire course

Prompts:
${prompts.map((p, i) => `${i + 1}. ${p.title}`).join('\n')}

Return JSON:
{
  "modules": [
    {
      "title": "Module name",
      "description": "Description",
      "promptIndices": [0, 1, 2]
    }
  ],
  "quizTemplate": {
    "question": "Generic question template",
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
                        promptIndices: { type: 'array', items: { type: 'number' } }
                      },
                      required: ['title', 'description', 'promptIndices'],
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

        const courseData = JSON.parse(bulkResponse.choices[0].message.content);
        console.log(`  📦 Created ${courseData.modules.length} modules`);

        // Create modules and lessons using the bulk data
        for (let modIdx = 0; modIdx < courseData.modules.length; modIdx++) {
          const modData = courseData.modules[modIdx];

          // Create module
          const [moduleResult] = await connection.execute(
            'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)',
            [course.id, modData.title, modData.description, modIdx + 1]
          );
          const moduleId = moduleResult.insertId;

          // Create lessons from prompts in this module
          for (let lessonIdx = 0; lessonIdx < modData.promptIndices.length; lessonIdx++) {
            const promptIndex = modData.promptIndices[lessonIdx];
            const prompt = prompts[promptIndex];
            if (!prompt) continue;

            // Customize quiz for this specific lesson
            const customQuestion = courseData.quizTemplate.question.replace('{topic}', prompt.title);

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
                prompt.title,
                prompt.content,
                prompt.content,
                JSON.stringify([
                  'Read the prompt carefully',
                  'Understand the requirements',
                  'Apply to your use case',
                  'Test and iterate'
                ]),
                'Example input for this prompt',
                'Expected output',
                customQuestion,
                JSON.stringify(courseData.quizTemplate.options),
                courseData.quizTemplate.correctAnswer,
                'Review the lesson to understand the correct approach.',
                JSON.stringify(courseData.recommendedTools),
                lessonIdx + 1
              ]
            );
          }
        }

        successCount++;
        console.log(`  ✅ Successfully converted`);
        
        // Small delay between courses to avoid API rate limits
        await delay(2000);

      } catch (error) {
        failureCount++;
        console.error(`  ❌ Error: ${error.message}`);
        // Continue to next course on error
      }
    }

    console.log(`\n${'='.repeat(50)}`);
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
