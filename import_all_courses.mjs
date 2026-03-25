import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { courses, prompts } from './drizzle/schema.ts';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const db = drizzle(process.env.DATABASE_URL);

// Category mapping based on file content
const categoryMap = {
  // SaaS & Business
  'SaaSStart': 'SaaS',
  'SaaScompanybuild': 'SaaS',
  'SaaScontractadministration': 'SaaS',
  'BusinessPrompts': 'Business',
  'Businessexpansion': 'Business',
  'BusinessGrowth': 'Business',
  'Identifyingrecenttrends': 'Business',
  'ForecastingPrompts': 'Business',
  'CashFlowManagement': 'Business',
  'Profitgeneration': 'Business',
  
  // Sales & Marketing
  'SalesFunnelOptimization': 'Sales & Marketing',
  'SalesFunnelErrors': 'Sales & Marketing',
  'SalesFunnelOptimizationTools': 'Sales & Marketing',
  'SalesFunnelContent': 'Sales & Marketing',
  'SalesFunnelAI': 'Sales & Marketing',
  'SalesOperationsAutomation': 'Sales & Marketing',
  'SalesTeamMotivation': 'Sales & Marketing',
  'SalesTechnology&DataSystems': 'Sales & Marketing',
  'Pricing&Value': 'Sales & Marketing',
  'Pricingstrategiesbasedonsubscriptions': 'Sales & Marketing',
  'Pricingandpackaging': 'Sales & Marketing',
  'Growth&SalesInsights': 'Sales & Marketing',
  'Monetization': 'Sales & Marketing',
  'SMSMarketing': 'Sales & Marketing',
  'PersonalBrandDevelopment': 'Sales & Marketing',
  'ClientAcquisition': 'Sales & Marketing',
  'Funnel': 'Sales & Marketing',
  'CustomerEngagementforDailySales': 'Sales & Marketing',
  'High-TicketBuyerProfiles': 'Sales & Marketing',
  'LeadGeneration': 'Sales & Marketing',
  'CustomerTargeting': 'Sales & Marketing',
  'ContentStrategy': 'Sales & Marketing',
  'PipelineManagement': 'Sales & Marketing',
  'BuildingTrust&SocialProof': 'Sales & Marketing',
  'IdealClientTargeting': 'Sales & Marketing',
  'CustomerExperienceFlow': 'Sales & Marketing',
  'CreativeConsistencySystems': 'Sales & Marketing',
  'OptimizeSalesFunnelElements': 'Sales & Marketing',
  'UrgencyandTimelinessTriggers': 'Sales & Marketing',
  
  // Copywriting
  'Copywriting': 'Copywriting',
  'ClientEmailMarketing': 'Copywriting',
  'Lendingcopywriting': 'Copywriting',
  
  // Digital Products & AI
  'Digitalproduct+AI': 'Digital Products',
  'Creatingahigh-qualityproduct': 'Digital Products',
  'Creatingdigitalproducts(mistakesandsolution)': 'Digital Products',
  'ProductVision+Roadmap': 'Digital Products',
  'Creationanddevelopmentofdigitalproducts': 'Digital Products',
  'Ensuringthesecurityofdigitalproducts': 'Digital Products',
  'Scalingtheproduct': 'Digital Products',
  'ProductRequirementsDocuments(PRD)': 'Digital Products',
  'Usertestingandfeedback': 'Digital Products',
  
  // Tools & Productivity
  'Excel': 'Tools & Productivity',
  'GoogleSheet': 'Tools & Productivity',
  'UsageofNotion': 'Tools & Productivity',
  'Workoptimization': 'Tools & Productivity',
  'Increasinginvolvement': 'Tools & Productivity',
  'Automationofworkflow': 'Automation',
  
  // AI & Technology
  'ChatGPTImprovements': 'AI',
  'Generation': 'AI',
  'AudioandVisualGeneration': 'AI',
  'AI&MachineLearning': 'AI',
  'CybersecurityintheSaaSindustry': 'Technology',
  'ImplementationandDevOps': 'Technology',
  'Creatingthedatabase': 'Technology',
  
  // No-Code
  'No-Codedesigningandbuildingwebsites': 'No-Code',
  'AppsBuild': 'No-Code',
  'WebsiteDevelopment': 'No-Code',
  'No-CodeforSEO': 'No-Code',
  
  // Customer Service
  'Customerrelations': 'Customer Service',
  'CustomerFeedback': 'Customer Service',
  'Orderhandlingandtracking': 'Customer Service',
  'Empathyasatoolforworkingwithclients': 'Customer Service',
  'Mistakesincommunicatingwithclients': 'Customer Service',
  'CustomizingcustomercommunicationwithAI': 'Customer Service',
  'Customernegotiations': 'Customer Service',
  'Analysisandreport': 'Customer Service',
  'Managingtheescalationprocess': 'Customer Service',
  'Complaintshandling': 'Customer Service',
  'Ensuringthebestcustomerservice': 'Customer Service',
  'Reviewsandsurveys': 'Customer Service',
  'TrainingandQualityGuarantee': 'Customer Service',
  
  // HR & Personnel
  'Practice': 'HR & Personnel',
  'Staffinterview': 'HR & Personnel',
  'HRRequirements': 'HR & Personnel',
  'Lookingfortalent': 'HR & Personnel',
  'Recruitment': 'HR & Personnel',
  'Generalrecommendationsonworkingwithpersonnel': 'HR & Personnel',
  'Efficiencymanagement': 'HR & Personnel',
  'Benefitsandcompensation': 'HR & Personnel',
  'Communicationwithemployees': 'HR & Personnel',
  'Quarry': 'HR & Personnel',
  'Personnelmanagement': 'HR & Personnel',
  'Corporatebranding': 'HR & Personnel',
  
  // E-Commerce
  'Productlistings&descriptions': 'E-Commerce',
  'Websitedesignanduserexperience': 'E-Commerce',
  'HarnessingCustomerAnalytics': 'E-Commerce',
  'BuildingReliableSupplierPartnerships': 'E-Commerce',
  'Trendsandnewtechnologies': 'E-Commerce',
  'StreamliningE-commerceCheckoutExperience': 'E-Commerce',
  'BuildingaHigh-ConvertingOnlineStore': 'E-Commerce',
  'Asuccessfulstart.Preparation': 'E-Commerce',
  'Makethecustomerbasestronger': 'E-Commerce',
  'SmallbusinessSEO': 'E-Commerce',
  'RecoveringAbandonedCarts': 'E-Commerce',
  'E-CommerceErrorPrevention': 'E-Commerce',
  'Ordersdelivery': 'E-Commerce',
  'MaximizingSaleswithUpsellsandCross-Sells': 'E-Commerce',
  'AR&VRinE-commerce': 'E-Commerce',
  'Inventorymanagement': 'E-Commerce',
  'DiscoveringWinningProductswithAI': 'E-Commerce',
  'SpeedyandAffordableShipping': 'E-Commerce',
  'ChatbotsandAIpoweredassistants': 'E-Commerce',
  'E-CommerceStartupGuide': 'E-Commerce',
  
  // Landing Pages & Conversion
  'Landingpageoptimizing': 'Landing Pages',
  'LandingPageCommonPrompts': 'Landing Pages',
  'LandingPagesMistakes': 'Landing Pages',
  'Analyticsforgreaterproductivity': 'Analytics',
  'Convertiblesalespage': 'Landing Pages',
  "CTA's": 'Landing Pages',
  
  // Creative & Design
  'Forcreators': 'Creative',
  'CreativityPrompts': 'Creative',
  
  // Misc
  'MistakestoAvoid': 'Business',
  'High-levelPrompts': 'Business',
  'new1': 'Business',
};

// Price tiers based on value and complexity
const priceTiers = {
  'foundational': 24.99,
  'professional': 34.99,
  'advanced': 44.99,
  'premium': 49.99,
};

function getPriceForCourse(filename, category) {
  // Premium tier
  if (filename.includes('Pricing') || filename.includes('SalesF') || 
      filename.includes('Copywriting') || filename.includes('AI') ||
      filename.includes('Scaling') || filename.includes('BusinessGrowth') ||
      filename.includes('Convertible')) {
    return priceTiers.premium;
  }
  
  // Advanced tier
  if (filename.includes('Analytics') || filename.includes('Landing') ||
      filename.includes('Customer') || filename.includes('HR') ||
      filename.includes('E-Commerce') || filename.includes('SaaS')) {
    return priceTiers.advanced;
  }
  
  // Professional tier
  if (category === 'Sales & Marketing' || category === 'Digital Products' ||
      category === 'Customer Service' || category === 'HR & Personnel') {
    return priceTiers.professional;
  }
  
  // Foundational tier
  return priceTiers.foundational;
}

function parsePromptFile(content) {
  const lines = content.split('\\n');
  const prompts = [];
  let currentTitle = '';
  let currentQuestion = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and "Try with ChatGPT" lines
    if (!line || line === 'Try with ChatGPT') continue;
    
    // Check if line contains a question (has "?" and "Format:")
    if (line.includes('?') && line.includes('Format:')) {
      // Extract question and format
      const parts = line.split('(Format:');
      if (parts.length === 2) {
        currentQuestion = parts[0].trim();
        const formatPart = parts[1].replace(')', '').trim();
        
        // Use previous non-empty, non-question line as title
        if (currentTitle) {
          prompts.push({
            title: currentTitle,
            question: currentQuestion,
            format: formatPart,
          });
        }
      }
    } else if (line && !line.includes('?')) {
      // This might be a title for the next prompt
      currentTitle = line;
    }
  }
  
  return prompts;
}

async function importAllCourses() {
  const uploadDir = '/home/ubuntu/upload';
  const files = readdirSync(uploadDir);
  
  let totalCourses = 0;
  let totalPrompts = 0;
  
  for (const file of files) {
    // Skip non-text files
    if (!file.endsWith('.txt') && !file.includes('Preparation') && !file.includes('administration')) {
      continue;
    }
    
    const filePath = join(uploadDir, file);
    const content = readFileSync(filePath, 'utf-8');
    
    // Get filename without extension for mapping
    const filename = file.replace('.txt', '').replace(/\\.Preparation$/, '');
    const category = categoryMap[filename] || 'Business';
    const price = getPriceForCourse(filename, category);
    
    // Parse prompts from file
    const promptsData = parsePromptFile(content);
    
    if (promptsData.length === 0) {
      console.log(`Skipping ${file} - no prompts found`);
      continue;
    }
    
    // Create course title from filename
    const courseTitle = filename
      .replace(/([A-Z])/g, ' $1')
      .replace(/&/g, ' & ')
      .replace(/\+/g, ' + ')
      .trim();
    
    // Generate slug
    const slug = courseTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Create description
    const description = `Master ${courseTitle.toLowerCase()} with ${promptsData.length} expert prompts covering essential strategies, best practices, and advanced techniques.`;
    
    try {
      // Insert course
      const result = await db.insert(courses).values({
        title: courseTitle,
        slug: slug,
        description: description,
        category: category,
        price: price,
        isPremium: price >= priceTiers.advanced ? 1 : 0,
        isPublished: 1,
      });
      
      console.log(`✓ Created course: ${courseTitle} (${promptsData.length} prompts, $${price})`);
      totalCourses++;
      
      // Get the course ID from the last insert
      const courseResult = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
      const courseId = courseResult[0]?.id;
      
      if (!courseId) {
        console.error(`Failed to get course ID for ${courseTitle}`);
        continue;
      }
      
      // Insert prompts for this course
      for (const promptData of promptsData) {
        await db.insert(prompts).values({
          courseId: courseId,
          title: promptData.title,
          question: promptData.question,
          format: promptData.format,
          isPremium: 0,
        });
        totalPrompts++;
      }
      
    } catch (error) {
      if (error.message && error.message.includes('Duplicate entry')) {
        console.log(`⊘ Skipped ${courseTitle} - already exists`);
      } else {
        console.error(`Error importing ${file}:`, error.message);
      }
    }
  }
  
  console.log(`\\n=== Import Complete ===`);
  console.log(`Total courses created: ${totalCourses}`);
  console.log(`Total prompts imported: ${totalPrompts}`);
}

importAllCourses().catch(console.error);
