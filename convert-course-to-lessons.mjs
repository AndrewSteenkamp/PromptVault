import { getCourseBySlug, getPromptsByCourseId, createModule, bulkCreateLessons } from './server/db.js';

/**
 * Convert a course's prompts into structured lessons with modules
 * This creates a proper learning experience with instructions and examples
 */
async function convertCourseToLessons(courseSlug) {
  console.log(`\n🎓 Converting course "${courseSlug}" to structured lessons...\n`);
  
  const course = await getCourseBySlug(courseSlug);
  if (!course) {
    console.error(`❌ Course "${courseSlug}" not found`);
    process.exit(1);
  }
  
  const prompts = await getPromptsByCourseId(course.id);
  console.log(`📚 Found ${prompts.length} prompts in "${course.title}"`);
  
  // Group prompts into modules (every 10-15 prompts = 1 module)
  const promptsPerModule = 12;
  const moduleCount = Math.ceil(prompts.length / promptsPerModule);
  
  console.log(`📦 Creating ${moduleCount} modules...\n`);
  
  const modules = [];
  for (let i = 0; i < moduleCount; i++) {
    const startIdx = i * promptsPerModule;
    const endIdx = Math.min((i + 1) * promptsPerModule, prompts.length);
    const modulePrompts = prompts.slice(startIdx, endIdx);
    
    // Determine module title based on content
    const moduleTitle = getModuleTitle(i + 1, moduleCount, course.category);
    
    modules.push({
      courseId: course.id,
      title: moduleTitle,
      description: `Learn ${modulePrompts.length} essential techniques for ${course.category.toLowerCase()}`,
      orderIndex: i,
    });
  }
  
  // Create modules in database
  for (const module of modules) {
    await createModule(module);
  }
  
  console.log(`✅ Created ${modules.length} modules`);
  
  // Now convert each prompt to a lesson
  console.log(`\n📝 Converting ${prompts.length} prompts to lessons...\n`);
  
  const lessons = [];
  let moduleIndex = 0;
  
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    moduleIndex = Math.floor(i / promptsPerModule);
    const lessonIndex = i % promptsPerModule;
    
    // Generate structured lesson content
    const lesson = convertPromptToLesson(prompt, course, moduleIndex + 1, lessonIndex);
    lessons.push(lesson);
  }
  
  // Bulk create all lessons
  await bulkCreateLessons(lessons);
  
  console.log(`✅ Created ${lessons.length} structured lessons`);
  console.log(`\n🎉 Course "${course.title}" successfully converted!`);
  console.log(`   - ${modules.length} modules`);
  console.log(`   - ${lessons.length} lessons`);
  console.log(`   - Estimated duration: ${Math.round(lessons.length * 10)} minutes\n`);
  
  process.exit(0);
}

/**
 * Generate module title based on position and category
 */
function getModuleTitle(moduleNum, totalModules, category) {
  if (totalModules <= 3) {
    const titles = ['Getting Started', 'Intermediate Techniques', 'Advanced Mastery'];
    return titles[moduleNum - 1] || `Module ${moduleNum}`;
  }
  
  const progressTitles = [
    'Fundamentals',
    'Building Blocks',
    'Core Concepts',
    'Practical Applications',
    'Advanced Techniques',
    'Expert Strategies',
    'Mastery Level',
    'Pro Tips',
  ];
  
  return progressTitles[moduleNum - 1] || `Module ${moduleNum}: Advanced Topics`;
}

/**
 * Convert a raw prompt into a structured lesson with instructions
 */
function convertPromptToLesson(prompt, course, moduleId, orderIndex) {
  // Extract the actual prompt question (remove format suffix)
  const cleanQuestion = prompt.question.replace(/\s*\(Format:.*?\)\s*$/, '').trim();
  
  // Generate instructional content
  const instructions = generateInstructions(prompt.title, cleanQuestion, prompt.format);
  const exampleInput = generateExampleInput(prompt.title, cleanQuestion);
  const exampleOutput = generateExampleOutput(prompt.title, cleanQuestion);
  const tips = generateTips(prompt.title, prompt.format);
  
  return {
    moduleId,
    courseId: course.id,
    title: prompt.title,
    description: `Learn how to ${prompt.title.toLowerCase()} effectively using AI prompts`,
    content: `## Overview\n\n${cleanQuestion}\n\n## How to Use This Lesson\n\n${instructions}`,
    prompt: cleanQuestion,
    promptInstructions: instructions,
    exampleInput,
    exampleOutput,
    tips,
    videoUrl: null,
    xpReward: 10,
    orderIndex,
  };
}

/**
 * Generate step-by-step instructions for using the prompt
 */
function generateInstructions(title, question, format) {
  return `**Step 1:** Read the prompt question carefully and understand what you need to achieve.

**Step 2:** Customize the prompt by replacing any placeholders with your specific requirements (e.g., your app name, target audience, specific features).

**Step 3:** Copy the customized prompt and paste it into your AI assistant (ChatGPT, Claude, etc.).

**Step 4:** Review the AI's response and refine your prompt if needed to get better results.

**Step 5:** Apply the insights or generated content to your project.

${format ? `**Format:** This lesson provides ${format.toLowerCase()} to help you implement the concept effectively.` : ''}`;
}

/**
 * Generate example input showing how to customize the prompt
 */
function generateExampleInput(title, question) {
  const examples = {
    'custom code': 'I want to add a custom payment validation script to my no-code e-commerce app built on Bubble. How can I integrate this custom JavaScript code?',
    'API integration': 'I need to integrate the Stripe API into my no-code app built on Webflow. What are the steps to connect external APIs?',
    'application integration': 'I want to connect my no-code CRM (built on Airtable) with my email marketing tool (Mailchimp). How do I set up this integration?',
  };
  
  // Find matching example or create generic one
  for (const [key, example] of Object.entries(examples)) {
    if (title.toLowerCase().includes(key)) {
      return example;
    }
  }
  
  return `Customize this prompt with your specific details:\n\n"${question}"\n\nReplace generic terms with your actual project requirements.`;
}

/**
 * Generate example output/expected results
 */
function generateExampleOutput(title, question) {
  return `**Expected Results:**

After using this prompt, you should receive:

1. **Clear explanation** of the concept or technique
2. **Step-by-step guidance** on implementation
3. **Best practices** and common pitfalls to avoid
4. **Practical examples** you can adapt to your project
5. **Additional resources** or tools that might help

**Example Response:**
"Based on your question about ${title.toLowerCase()}, here's a comprehensive approach: [The AI will provide detailed, actionable guidance specific to your customized prompt]"`;
}

/**
 * Generate tips and best practices
 */
function generateTips(title, format) {
  const tips = [
    '💡 **Be Specific:** The more details you provide in your prompt, the better the AI response will be.',
    '🔄 **Iterate:** Don\'t expect perfect results on the first try. Refine your prompt based on the responses.',
    '📝 **Take Notes:** Save successful prompts and responses for future reference.',
    '🎯 **Stay Focused:** Keep your prompt focused on one main question or objective.',
  ];
  
  if (format?.toLowerCase().includes('strategy')) {
    tips.push('📊 **Think Long-term:** Consider how this strategy fits into your overall project goals.');
  }
  
  if (format?.toLowerCase().includes('tips')) {
    tips.push('⚡ **Quick Wins:** Look for actionable tips you can implement immediately.');
  }
  
  return tips.join('\n\n');
}

// Run the conversion
const courseSlug = process.argv[2] || 'apps-build';
convertCourseToLessons(courseSlug);
