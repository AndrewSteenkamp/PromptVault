import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { lessons } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { invokeLLM } from './server/_core/llm.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get all lessons from Apps Build course
const allLessons = await db.select().from(lessons).where(eq(lessons.courseId, 1));

console.log(`Regenerating contextual instructions for ${allLessons.length} lessons with AI tools...\n`);

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
          content: 'You are an expert instructor creating detailed, practical learning content for AI prompt engineering courses focused on no-code application building. Generate clear, actionable instructions that help students understand and use specific prompts effectively with various AI platforms.'
        },
        {
          role: 'user',
          content: `Create detailed learning content for this AI prompt lesson about no-code app building:

**Lesson Title:** ${lesson.title}

**The Prompt:**
${lesson.prompt}

Generate the following sections:

1. **Recommended AI Tools** (2-3 tools): List the best AI platforms for this specific prompt. For each tool include:
   - name: Tool name (e.g., "ChatGPT", "Claude", "Gemini")
   - description: One sentence about the tool
   - url: Use placeholder affiliate link format: "https://affiliate.link/[tool-name]"
   - why: Why this tool is good for THIS specific prompt (1 sentence)

2. **Instructions** (6-8 steps): Platform-agnostic step-by-step guide on how to use THIS specific prompt effectively. Include:
   - How to access the AI tool
   - Where to paste the prompt
   - What to customize in [brackets]
   - How to iterate on results
   Be specific to this prompt's purpose.

3. **Example Input**: A realistic example showing how a user would customize this prompt for a no-code app project. Use specific placeholder values in [brackets] like [app name], [feature description], etc.

4. **Expected Output**: Describe what kind of response the AI will generate. Be specific about format, structure, content type, and how it helps with no-code development.

5. **Pro Tips** (3-4 tips): Expert advice specific to THIS prompt. Include:
   - Best practices for no-code context
   - Common mistakes to avoid
   - Optimization suggestions
   - How to apply results in no-code platforms

Format your response as JSON with this exact structure.`
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
              tips: { type: 'string' }
            },
            required: ['recommendedTools', 'instructions', 'exampleInput', 'exampleOutput', 'tips'],
            additionalProperties: false
          }
        }
      }
    });

    const content = JSON.parse(response.choices[0].message.content);
    
    // Update lesson with generated content
    await db.update(lessons)
      .set({
        recommendedTools: JSON.stringify(content.recommendedTools),
        promptInstructions: content.instructions,
        exampleInput: content.exampleInput,
        exampleOutput: content.exampleOutput,
        tips: content.tips
      })
      .where(eq(lessons.id, lesson.id));
    
    console.log(`  ✓ Generated unique instructions with ${content.recommendedTools.length} tool recommendations\n`);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}\n`);
  }
}

console.log(`\n✅ Successfully regenerated instructions for ${count} lessons!`);
await connection.end();
