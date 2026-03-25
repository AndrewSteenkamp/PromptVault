import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { lessons } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get all lessons from Apps Build course (courseId = 1)
const allLessons = await db.select().from(lessons).where(eq(lessons.courseId, 1));

console.log(`Found ${allLessons.length} lessons to add quizzes to...`);

for (const lesson of allLessons) {
  // Generate a quiz question based on the lesson content
  const quizData = generateQuiz(lesson);
  
  await db.update(lessons)
    .set({
      quizQuestion: quizData.question,
      quizOptions: JSON.stringify(quizData.options),
      quizCorrectAnswer: quizData.correctAnswer,
      quizExplanation: quizData.explanation,
    })
    .where(eq(lessons.id, lesson.id));
  
  console.log(`✓ Added quiz to: ${lesson.title}`);
}

console.log(`\n✅ Successfully added quizzes to ${allLessons.length} lessons!`);
await connection.end();

function generateQuiz(lesson) {
  // Extract key concept from lesson title and content
  const title = lesson.title.toLowerCase();
  
  // Generate contextual quiz based on lesson topic
  if (title.includes('api')) {
    return {
      question: "What is the main purpose of integrating external APIs in no-code applications?",
      options: [
        "To make the app look more professional",
        "To connect your app with external services and data sources",
        "To increase the app's file size",
        "To slow down the application"
      ],
      correctAnswer: 1,
      explanation: "APIs allow your no-code application to connect with external services, fetch data, and integrate powerful third-party functionality without writing code."
    };
  } else if (title.includes('database') || title.includes('data')) {
    return {
      question: "Why is proper data structure important in no-code applications?",
      options: [
        "It makes the app more colorful",
        "It ensures efficient data storage, retrieval, and scalability",
        "It's only important for developers",
        "It has no real impact on the app"
      ],
      correctAnswer: 1,
      explanation: "Proper data structure is crucial for efficient storage, quick retrieval, and the ability to scale your application as it grows."
    };
  } else if (title.includes('user') || title.includes('authentication')) {
    return {
      question: "What is the primary benefit of implementing user authentication?",
      options: [
        "To make login forms look nice",
        "To protect user data and provide personalized experiences",
        "To increase app loading time",
        "To collect email addresses"
      ],
      correctAnswer: 1,
      explanation: "User authentication secures user data, enables personalized experiences, and ensures only authorized users can access specific features."
    };
  } else if (title.includes('workflow') || title.includes('automation')) {
    return {
      question: "What is the main advantage of automating workflows in no-code platforms?",
      options: [
        "It makes the app slower",
        "It reduces manual work and increases efficiency",
        "It requires more coding",
        "It makes the app more expensive"
      ],
      correctAnswer: 1,
      explanation: "Workflow automation eliminates repetitive manual tasks, reduces errors, and allows you to focus on higher-value activities."
    };
  } else if (title.includes('design') || title.includes('ui') || title.includes('interface')) {
    return {
      question: "Why is user interface design important in no-code applications?",
      options: [
        "It only matters for large companies",
        "It directly impacts user experience and adoption rates",
        "It's not important if the app works",
        "It only affects the developer"
      ],
      correctAnswer: 1,
      explanation: "Good UI design ensures users can easily navigate and use your app, leading to better user satisfaction and higher adoption rates."
    };
  } else if (title.includes('payment') || title.includes('monetiz')) {
    return {
      question: "What should you consider when integrating payment processing?",
      options: [
        "Only the payment gateway fees",
        "Security, user experience, and compliance with regulations",
        "Just pick the cheapest option",
        "Payment processing doesn't need consideration"
      ],
      correctAnswer: 1,
      explanation: "Payment integration requires careful consideration of security (PCI compliance), user experience, fees, and legal requirements to protect both you and your customers."
    };
  } else if (title.includes('test') || title.includes('debug')) {
    return {
      question: "Why is testing important before launching a no-code application?",
      options: [
        "It's optional and wastes time",
        "To identify and fix issues before users encounter them",
        "Only developers need to test",
        "Testing makes the app slower"
      ],
      correctAnswer: 1,
      explanation: "Testing helps you catch bugs, ensure features work as expected, and provide a smooth experience for your users from day one."
    };
  } else if (title.includes('deploy') || title.includes('launch') || title.includes('publish')) {
    return {
      question: "What is an important step before deploying your no-code application?",
      options: [
        "Delete all test data",
        "Test thoroughly, backup data, and prepare support documentation",
        "Deploy immediately without checking",
        "Only worry about deployment after launch"
      ],
      correctAnswer: 1,
      explanation: "Before deployment, ensure thorough testing, clean test data, backup important information, and prepare documentation to support your users."
    };
  } else {
    // Generic quiz for other lessons
    return {
      question: `What is the key concept covered in this lesson about "${lesson.title}"?`,
      options: [
        "Understanding the core functionality and how to implement it effectively",
        "Memorizing technical jargon without application",
        "Avoiding the use of this feature entirely",
        "Only using it in specific edge cases"
      ],
      correctAnswer: 0,
      explanation: `This lesson teaches you how to effectively use and implement ${lesson.title.toLowerCase()} in your no-code applications for practical results.`
    };
  }
}
