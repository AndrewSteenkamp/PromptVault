import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { lessons } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { invokeLLM } from './server/_core/llm.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get all lessons from Apps Build course
const allLessons = await db.select().from(lessons).where(eq(lessons.courseId, 1));

console.log(`Regenerating contextual instructions for ${allLessons.length} lessons using AI...\n`);

let count = 0;

for (const lesson of allLessons) {
  count++;
  console.log(`[${count}/${allLessons.length}] Processing: ${lesson.title}`);
  
  try {
    // Use AI to generate contextual instructions based on the actual prompt
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert instructor creating detailed, practical learning content for AI prompt engineering courses. Generate clear, actionable instructions that help students understand and use specific prompts effectively.'
        },
        {
          role: 'user',
          content: `Create detailed learning content for this AI prompt lesson:

**Lesson Title:** ${lesson.title}

**The Prompt:**
${lesson.prompt}

Generate the following (keep each section concise but informative):

1. **Instructions** (5-7 steps): Step-by-step guide on how to use THIS specific prompt effectively. Be specific to this prompt's purpose and structure.

2. **Example Input**: A realistic example showing how a user would customize this prompt with their specific details. Use placeholder values in [brackets].

3. **Expected Output**: Describe what kind of response the AI will generate when using this prompt. Be specific about format, structure, and content type.

4. **Pro Tips** (3-4 tips): Expert advice specific to THIS prompt. Include best practices, common mistakes to avoid, and optimization suggestions.

Format your response as JSON:
{
  "instructions": "1. Step one\\n2. Step two\\n3. Step three...",
  "exampleInput": "Example with [placeholders]...",
  "exampleOutput": "Description of expected AI response...",
  "tips": "💡 Tip one\\n\\n🎯 Tip two\\n\\n⚡ Tip three..."
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
              instructions: { type: 'string' },
              exampleInput: { type: 'string' },
              exampleOutput: { type: 'string' },
              tips: { type: 'string' }
            },
            required: ['instructions', 'exampleInput', 'exampleOutput', 'tips'],
            additionalProperties: false
          }
        }
      }
    });

    const content = JSON.parse(response.choices[0].message.content);
    
    // Update lesson with generated content
    await db.update(lessons)
      .set({
        promptInstructions: content.instructions,
        exampleInput: content.exampleInput,
        exampleOutput: content.exampleOutput,
        tips: content.tips
      })
      .where(eq(lessons.id, lesson.id));
    
    console.log(`  ✓ Generated unique instructions\n`);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}\n`);
  }
}

console.log(`\n✅ Successfully regenerated instructions for ${count} lessons!`);
await connection.end();
