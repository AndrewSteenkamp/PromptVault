import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { courses, prompts, modules, lessons } from './drizzle/schema.ts';
import { eq, ne } from 'drizzle-orm';
import { invokeLLM } from './server/_core/llm.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get all courses except Apps Build (courseId = 1)
const allCourses = await db.select().from(courses).where(ne(courses.id, 1));

console.log(`Converting ${allCourses.length} courses into structured learning paths...\n`);

let courseCount = 0;

for (const course of allCourses) {
  courseCount++;
  console.log(`\n[${courseCount}/${allCourses.length}] Processing course: ${course.title}`);
  
  // Get all prompts for this course
  const coursePrompts = await db.select().from(prompts).where(eq(prompts.courseId, course.id));
  
  if (coursePrompts.length === 0) {
    console.log(`  ⚠ No prompts found, skipping...`);
    continue;
  }
  
  console.log(`  Found ${coursePrompts.length} prompts`);
  
  try {
    // Use AI to organize prompts into modules
    const moduleResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer organizing AI prompts into logical learning modules.'
        },
        {
          role: 'user',
          content: `Organize these ${coursePrompts.length} prompts for "${course.title}" into 3-5 logical learning modules.

Prompts:
${coursePrompts.map((p, i) => `${i + 1}. ${p.title}`).join('\n')}

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
    console.log(`  ✓ Created ${moduleStructure.length} modules`);

    let globalLessonOrder = 1;

    // Create modules and lessons
    for (let modIndex = 0; modIndex < moduleStructure.length; modIndex++) {
      const modData = moduleStructure[modIndex];
      
      // Create module
      const [newModule] = await db.insert(modules).values({
        courseId: course.id,
        title: modData.title,
        description: modData.description,
        orderIndex: modIndex,
        estimatedMinutes: modData.lessonIndices.length * 10
      });

      const moduleId = newModule.insertId;

      // Create lessons for this module
      for (const promptIndex of modData.lessonIndices) {
        const prompt = coursePrompts[promptIndex];
        if (!prompt) continue;

        // Generate lesson content with AI
        const lessonResponse = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert instructor creating detailed learning content for AI prompt engineering courses.'
            },
            {
              role: 'user',
              content: `Create learning content for this prompt:

**Title:** ${prompt.title}
**Prompt:** ${prompt.question}

Generate:
1. **Recommended AI Tools** (2-3): name, description, url (use "https://affiliate.link/[tool-name]"), why
2. **Instructions** (6-8 steps): How to use this prompt
3. **Example Input**: Realistic example with [placeholders]
4. **Expected Output**: What the AI will generate
5. **Pro Tips** (3-4): Expert advice
6. **Quiz Question**: Multiple choice question to test understanding
7. **Quiz Options**: 4 options (array of strings)
8. **Correct Answer Index**: 0-3
9. **Quiz Explanation**: Why the answer is correct

Return as JSON.`
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
                  recommendedTools: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        url: { type: 'string' },
                        why: { type: 'string' }
                      },
                      required: ['name', 'description', 'url', 'why'],
                      additionalProperties: false
                    }
                  },
                  instructions: { type: 'string' },
                  exampleInput: { type: 'string' },
                  exampleOutput: { type: 'string' },
                  tips: { type: 'string' },
                  quizQuestion: { type: 'string' },
                  quizOptions: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  quizCorrectAnswer: { type: 'number' },
                  quizExplanation: { type: 'string' }
                },
                required: ['recommendedTools', 'instructions', 'exampleInput', 'exampleOutput', 'tips', 'quizQuestion', 'quizOptions', 'quizCorrectAnswer', 'quizExplanation'],
                additionalProperties: false
              }
            }
          }
        });

        const content = JSON.parse(lessonResponse.choices[0].message.content);

        // Create lesson
        await db.insert(lessons).values({
          courseId: course.id,
          moduleId: moduleId,
          title: prompt.title,
          description: `Learn how to use this prompt effectively: ${prompt.title}`,
          prompt: prompt.question,
          promptInstructions: content.instructions,
          exampleInput: content.exampleInput,
          exampleOutput: content.exampleOutput,
          tips: content.tips,
          recommendedTools: JSON.stringify(content.recommendedTools),
          quizQuestion: content.quizQuestion,
          quizOptions: JSON.stringify(content.quizOptions),
          quizCorrectAnswer: content.quizCorrectAnswer,
          quizExplanation: content.quizExplanation,
          xpReward: 10,
          orderIndex: globalLessonOrder
        });

        globalLessonOrder++;
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      console.log(`    ✓ Module ${modIndex + 1}: "${modData.title}" (${modData.lessonIndices.length} lessons)`);
    }

    console.log(`  ✅ Converted "${course.title}" successfully!`);
    
  } catch (error) {
    console.error(`  ✗ Error converting course: ${error.message}`);
  }
}

console.log(`\n🎉 Successfully converted ${courseCount} courses!`);
await connection.end();
