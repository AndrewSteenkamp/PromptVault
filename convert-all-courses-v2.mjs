import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { courses, prompts, modules, lessons } from './drizzle/schema.ts';
import { eq, ne, gt } from 'drizzle-orm';
import { invokeLLM } from './server/_core/llm.ts';
import fs from 'fs';

const PROGRESS_FILE = '/tmp/conversion-progress.json';
const LOG_FILE = '/tmp/convert-courses-v2.log';

// Comprehensive AI tool database by category
const TOOL_DATABASE = {
  video: [
    { name: 'Pictory', url: 'https://affiliate.link/pictory', description: 'AI-powered video creation from text and scripts' },
    { name: 'Runway ML', url: 'https://affiliate.link/runway', description: 'Advanced AI video editing and generation' },
    { name: 'Synthesia', url: 'https://affiliate.link/synthesia', description: 'AI avatar video generation' },
    { name: 'Descript', url: 'https://affiliate.link/descript', description: 'Video editing through text transcripts' },
  ],
  audio: [
    { name: 'ElevenLabs', url: 'https://affiliate.link/elevenlabs', description: 'Realistic AI voice generation and cloning' },
    { name: 'Murf.ai', url: 'https://affiliate.link/murf', description: 'Professional AI voiceover studio' },
    { name: 'Play.ht', url: 'https://affiliate.link/playht', description: 'Text-to-speech with natural voices' },
  ],
  image: [
    { name: 'Midjourney', url: 'https://affiliate.link/midjourney', description: 'High-quality AI image generation' },
    { name: 'DALL-E 3', url: 'https://affiliate.link/dalle', description: 'OpenAI\'s image generation model' },
    { name: 'Leonardo.ai', url: 'https://affiliate.link/leonardo', description: 'AI art and asset generation' },
  ],
  design: [
    { name: 'Canva AI', url: 'https://affiliate.link/canva', description: 'AI-powered graphic design platform' },
    { name: 'Uizard', url: 'https://affiliate.link/uizard', description: 'AI UI/UX design tool' },
    { name: 'Figma AI', url: 'https://affiliate.link/figma', description: 'Design tool with AI features' },
  ],
  presentation: [
    { name: 'Gamma', url: 'https://affiliate.link/gamma', description: 'AI-powered presentation creation' },
    { name: 'Beautiful.ai', url: 'https://affiliate.link/beautiful', description: 'Smart presentation design' },
    { name: 'Tome', url: 'https://affiliate.link/tome', description: 'AI storytelling and presentations' },
  ],
  writing: [
    { name: 'Jasper', url: 'https://affiliate.link/jasper', description: 'AI copywriting and content creation' },
    { name: 'Copy.ai', url: 'https://affiliate.link/copyai', description: 'Marketing copy generation' },
    { name: 'Writesonic', url: 'https://affiliate.link/writesonic', description: 'AI writing assistant' },
  ],
  code: [
    { name: 'GitHub Copilot', url: 'https://affiliate.link/copilot', description: 'AI pair programmer' },
    { name: 'Cursor', url: 'https://affiliate.link/cursor', description: 'AI-first code editor' },
    { name: 'Replit', url: 'https://affiliate.link/replit', description: 'AI-powered coding platform' },
  ],
  nocode: [
    { name: 'Bubble', url: 'https://affiliate.link/bubble', description: 'No-code web app builder' },
    { name: 'Adalo', url: 'https://affiliate.link/adalo', description: 'No-code mobile app builder' },
    { name: 'FlutterFlow', url: 'https://affiliate.link/flutterflow', description: 'No-code Flutter app builder' },
  ],
  automation: [
    { name: 'n8n', url: 'https://affiliate.link/n8n', description: 'Open-source workflow automation' },
    { name: 'Make (Integromat)', url: 'https://affiliate.link/make', description: 'Visual automation platform' },
    { name: 'Zapier', url: 'https://affiliate.link/zapier', description: 'App integration and automation' },
  ],
  aiagent: [
    { name: 'CrewAI', url: 'https://affiliate.link/crewai', description: 'Multi-agent AI orchestration' },
    { name: 'LangChain', url: 'https://affiliate.link/langchain', description: 'LLM application framework' },
    { name: 'AutoGPT', url: 'https://affiliate.link/autogpt', description: 'Autonomous AI agents' },
  ],
  data: [
    { name: 'Julius AI', url: 'https://affiliate.link/julius', description: 'AI data analysis and visualization' },
    { name: 'Obviously AI', url: 'https://affiliate.link/obviously', description: 'No-code predictive AI' },
    { name: 'ChatGPT Advanced Data Analysis', url: 'https://affiliate.link/chatgpt-plus', description: 'Code interpreter for data analysis' },
  ],
  chatbot: [
    { name: 'Voiceflow', url: 'https://affiliate.link/voiceflow', description: 'Conversational AI platform' },
    { name: 'Botpress', url: 'https://affiliate.link/botpress', description: 'Open-source chatbot builder' },
    { name: 'ChatGPT API', url: 'https://affiliate.link/openai-api', description: 'Build custom chatbots' },
  ],
  general: [
    { name: 'ChatGPT Plus', url: 'https://affiliate.link/chatgpt', description: 'Advanced AI assistant with GPT-4' },
    { name: 'Claude Pro', url: 'https://affiliate.link/claude', description: 'Anthropic\'s advanced AI assistant' },
    { name: 'Gemini Advanced', url: 'https://affiliate.link/gemini', description: 'Google\'s most capable AI' },
  ],
};

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (error) {
    log(`Error loading progress: ${error.message}`);
  }
  return { lastCompletedCourseId: 0, completedCount: 0 };
}

function saveProgress(courseId, completedCount) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastCompletedCourseId: courseId, completedCount }));
}

async function createConnectionWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      return connection;
    } catch (error) {
      log(`Connection attempt ${i + 1} failed: ${error.message}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
  throw new Error('Failed to connect to database after multiple attempts');
}

async function executeWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        log(`Database error (attempt ${i + 1}): ${error.message}`);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000 * (i + 1)));
          // Reconnect
          connection = await createConnectionWithRetry();
          db = drizzle(connection);
        }
      } else {
        throw error;
      }
    }
  }
  throw new Error('Operation failed after multiple retries');
}

let connection = await createConnectionWithRetry();
let db = drizzle(connection);

// Load progress
const progress = loadProgress();
log(`\n=== Resuming from course ID ${progress.lastCompletedCourseId} ===`);
log(`Already completed: ${progress.completedCount} courses\n`);

// Get all courses except Apps Build (courseId = 1) and after last completed
const allCourses = await executeWithRetry(() => 
  db.select().from(courses).where(ne(courses.id, 1))
);

const remainingCourses = allCourses.filter(c => c.id > progress.lastCompletedCourseId);

log(`Converting ${remainingCourses.length} remaining courses...\n`);

let courseCount = progress.completedCount;

for (const course of remainingCourses) {
  courseCount++;
  log(`\n[${courseCount}/${allCourses.length}] Processing course: ${course.title}`);
  
  try {
    // Get all prompts for this course
    const coursePrompts = await executeWithRetry(() =>
      db.select().from(prompts).where(eq(prompts.courseId, course.id))
    );
    
    if (coursePrompts.length === 0) {
      log(`  ⚠ No prompts found, skipping...`);
      saveProgress(course.id, courseCount);
      continue;
    }
    
    log(`  Found ${coursePrompts.length} prompts`);
    
    // Use AI to determine course category and organize into modules
    const analysisResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer and AI tool specialist.'
        },
        {
          role: 'user',
          content: `Analyze this course and organize it into learning modules.

Course: "${course.title}"
Prompts (${coursePrompts.length}):
${coursePrompts.slice(0, 10).map((p, i) => `${i + 1}. ${p.title}`).join('\n')}
${coursePrompts.length > 10 ? `... and ${coursePrompts.length - 10} more` : ''}

Tasks:
1. Determine the PRIMARY category: video, audio, image, design, presentation, writing, code, nocode, automation, aiagent, data, chatbot, or general
2. Organize prompts into 3-5 logical learning modules (beginner to advanced)
3. Each module should have 8-15 lessons

Return JSON with this structure:
{
  "category": "primary category",
  "modules": [
    {
      "title": "Module name",
      "description": "What students will learn",
      "lessonIndices": [0, 1, 2, ...] // Array of prompt indices
    }
  ]
}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'course_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              category: { type: 'string' },
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
            required: ['category', 'modules'],
            additionalProperties: false
          }
        }
      }
    });

    const { category, modules: moduleStructure } = JSON.parse(analysisResponse.choices[0].message.content);
    log(`  ✓ Category: ${category} | Created ${moduleStructure.length} modules`);

    // Get specialized tools for this category
    const categoryTools = TOOL_DATABASE[category] || TOOL_DATABASE.general;

    let globalLessonOrder = 1;

    // Create modules and lessons
    for (let modIndex = 0; modIndex < moduleStructure.length; modIndex++) {
      const modData = moduleStructure[modIndex];
      
      // Create module
      const [newModule] = await executeWithRetry(() =>
        db.insert(modules).values({
          courseId: course.id,
          title: modData.title,
          description: modData.description,
          orderIndex: modIndex,
          estimatedMinutes: modData.lessonIndices.length * 10
        })
      );

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
              content: `You are an expert instructor creating learning content for ${category} prompts.`
            },
            {
              role: 'user',
              content: `Create learning content for this ${category} prompt:

**Title:** ${prompt.title}
**Prompt:** ${prompt.question}

Generate:
1. **Recommended Tools** (2-3 from this list, most relevant to this specific prompt):
${categoryTools.map(t => `   - ${t.name}: ${t.description}`).join('\n')}

2. **Instructions** (6-8 steps): How to use this prompt with the recommended tools
3. **Example Input**: Realistic example with [placeholders]
4. **Expected Output**: What results to expect
5. **Pro Tips** (3-4): Expert advice
6. **Quiz Question**: Test understanding
7. **Quiz Options**: 4 options
8. **Correct Answer Index**: 0-3
9. **Quiz Explanation**: Why correct

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
                  recommendedToolNames: {
                    type: 'array',
                    items: { type: 'string' }
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
                required: ['recommendedToolNames', 'instructions', 'exampleInput', 'exampleOutput', 'tips', 'quizQuestion', 'quizOptions', 'quizCorrectAnswer', 'quizExplanation'],
                additionalProperties: false
              }
            }
          }
        });

        const content = JSON.parse(lessonResponse.choices[0].message.content);

        // Map tool names to full tool objects
        const recommendedTools = content.recommendedToolNames
          .map(name => categoryTools.find(t => t.name === name))
          .filter(t => t)
          .map(t => ({
            name: t.name,
            description: t.description,
            url: t.url,
            why: `Best for ${category} tasks like this`
          }));

        // Create lesson
        await executeWithRetry(() =>
          db.insert(lessons).values({
            courseId: course.id,
            moduleId: moduleId,
            title: prompt.title,
            description: `Learn how to use this prompt effectively: ${prompt.title}`,
            prompt: prompt.question,
            promptInstructions: content.instructions,
            exampleInput: content.exampleInput,
            exampleOutput: content.exampleOutput,
            tips: content.tips,
            recommendedTools: JSON.stringify(recommendedTools),
            quizQuestion: content.quizQuestion,
            quizOptions: JSON.stringify(content.quizOptions),
            quizCorrectAnswer: content.quizCorrectAnswer,
            quizExplanation: content.quizExplanation,
            xpReward: 10,
            orderIndex: globalLessonOrder
          })
        );

        globalLessonOrder++;
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      log(`    ✓ Module ${modIndex + 1}: "${modData.title}" (${modData.lessonIndices.length} lessons)`);
    }

    log(`  ✅ Converted "${course.title}" successfully!`);
    saveProgress(course.id, courseCount);
    
  } catch (error) {
    log(`  ✗ Error converting course: ${error.message}`);
    saveProgress(course.id, courseCount);
  }
}

log(`\n🎉 Successfully converted ${courseCount} courses!`);
await connection.end();
