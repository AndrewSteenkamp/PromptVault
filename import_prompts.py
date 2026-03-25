#!/usr/bin/env python3
"""
Import all prompt files into the AI Prompts Academy database.
This script parses all 24 prompt files and creates courses and prompts in the database.
"""

import os
import re
import json
import subprocess

# Directory containing all prompt files
UPLOAD_DIR = "/home/ubuntu/upload/"

# Category mapping for better organization
CATEGORY_MAP = {
    "SaaSStart.txt": "SaaS Development",
    "SaaScompanybuild.txt": "SaaS Development",
    "SaaScontractadministration": "SaaS Management",
    "Pricingstrategiesbasedonsubscriptions.txt": "SaaS Business",
    "CybersecurityintheSaaSindustry.txt": "SaaS Security",
    "Identifyingrecenttrends.txt": "SaaS Strategy",
    "BusinessPrompts.txt": "Business Strategy",
    "Businessexpansion.txt": "Business Growth",
    "Customerrelations.txt": "Customer Success",
    "AppsBuild.txt": "App Development",
    "WebsiteDevelopment.txt": "Web Development",
    "ImplementationandDevOps.txt": "DevOps",
    "No-Codedesigningandbuildingwebsites.txt": "No-Code",
    "No-CodeforSEO.txt": "No-Code SEO",
    "Automationofworkflow.txt": "Automation",
    "Creatingthedatabase.txt": "Database",
    "ChatGPTImprovements.txt": "AI Prompting",
    "High-levelPrompts.txt": "AI Prompting",
    "CreativityPrompts.txt": "Creative AI",
    "ForecastingPrompts.txt": "AI Analytics",
    "Forcreators.txt": "Content Creation",
    "Generation.txt": "AI Generation",
    "AudioandVisualGeneration.txt": "Media Generation",
    "MistakestoAvoid.txt": "Best Practices",
}

# Price tiers based on content value
PRICE_TIERS = {
    "SaaS Development": 4900,  # $49
    "SaaS Management": 3900,
    "SaaS Business": 4900,
    "SaaS Security": 5900,
    "SaaS Strategy": 3900,
    "Business Strategy": 4900,
    "Business Growth": 4900,
    "Customer Success": 2900,
    "App Development": 5900,
    "Web Development": 3900,
    "DevOps": 4900,
    "No-Code": 3900,
    "No-Code SEO": 2900,
    "Automation": 3900,
    "Database": 2900,
    "AI Prompting": 5900,
    "Creative AI": 2900,
    "AI Analytics": 3900,
    "Content Creation": 2900,
    "AI Generation": 4900,
    "Media Generation": 3900,
    "Best Practices": 1900,
}

def slugify(text):
    """Convert text to URL-friendly slug"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def extract_format(question):
    """Extract format type from question text"""
    format_match = re.search(r'\(Format:\s*([^)]+)\)', question)
    if format_match:
        return format_match.group(1)
    return None

def parse_prompt_file(filepath):
    """Parse a single prompt file and extract all prompts"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.strip().split('\n')
    course_title = lines[0] if lines else os.path.basename(filepath).replace('.txt', '')
    
    prompts = []
    i = 1
    order_index = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines
        if not line:
            i += 1
            continue
        
        # Check if this looks like a prompt title (not empty, not just spaces)
        if line and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            
            # If next line contains a question or format, it's a prompt
            if next_line and ('?' in next_line or 'Format:' in next_line):
                title = line
                question = next_line
                format_type = extract_format(question)
                
                prompts.append({
                    'title': title,
                    'question': question,
                    'format': format_type,
                    'order_index': order_index
                })
                order_index += 1
                i += 2
                continue
        
        i += 1
    
    return course_title, prompts

def create_course_description(title, prompt_count, category):
    """Generate a description for the course"""
    descriptions = {
        "SaaS Development": f"Master {prompt_count} essential prompts for building and scaling successful SaaS applications from scratch.",
        "SaaS Management": f"Learn {prompt_count} proven strategies for managing SaaS contracts, compliance, and operations effectively.",
        "SaaS Business": f"Discover {prompt_count} powerful prompts for SaaS pricing, monetization, and business model optimization.",
        "SaaS Security": f"Secure your SaaS platform with {prompt_count} comprehensive cybersecurity prompts and best practices.",
        "SaaS Strategy": f"Stay ahead with {prompt_count} prompts for identifying and leveraging the latest SaaS market trends.",
        "Business Strategy": f"Transform your business with {prompt_count} strategic prompts for marketing, growth, and customer engagement.",
        "Business Growth": f"Scale your business effectively using {prompt_count} prompts focused on expansion and market penetration.",
        "Customer Success": f"Build lasting customer relationships with {prompt_count} prompts for CRM, support, and retention.",
        "App Development": f"Create powerful applications with {prompt_count} prompts covering development, design, and deployment.",
        "Web Development": f"Build modern websites with {prompt_count} prompts for frontend, backend, and full-stack development.",
        "DevOps": f"Streamline your development pipeline with {prompt_count} DevOps and implementation best practices.",
        "No-Code": f"Build without coding using {prompt_count} prompts for no-code website design and development.",
        "No-Code SEO": f"Optimize your no-code sites with {prompt_count} SEO-focused prompts and strategies.",
        "Automation": f"Automate your workflows with {prompt_count} practical prompts for process optimization.",
        "Database": f"Master database design and management with {prompt_count} comprehensive prompts.",
        "AI Prompting": f"Unlock ChatGPT's full potential with {prompt_count} advanced prompting techniques and strategies.",
        "Creative AI": f"Enhance your creativity with {prompt_count} AI prompts for innovative thinking and problem-solving.",
        "AI Analytics": f"Make data-driven decisions with {prompt_count} AI-powered forecasting and analytics prompts.",
        "Content Creation": f"Create compelling content with {prompt_count} prompts designed specifically for creators.",
        "AI Generation": f"Generate amazing content with {prompt_count} prompts for AI-powered creation.",
        "Media Generation": f"Create stunning audio and visual content with {prompt_count} AI generation prompts.",
        "Best Practices": f"Avoid common pitfalls with {prompt_count} prompts highlighting mistakes to avoid in SaaS.",
    }
    return descriptions.get(category, f"Comprehensive collection of {prompt_count} curated AI prompts for {category.lower()}.")

def main():
    print("=" * 80)
    print("AI PROMPTS ACADEMY - DATA IMPORT")
    print("=" * 80)
    print()
    
    # Get all prompt files
    files = sorted([f for f in os.listdir(UPLOAD_DIR) if f.endswith('.txt') or 'SaaScontractadministration' in f])
    
    print(f"Found {len(files)} prompt files to import\n")
    
    all_courses = []
    total_prompts = 0
    
    # Parse all files
    for filename in files:
        filepath = os.path.join(UPLOAD_DIR, filename)
        course_title, prompts = parse_prompt_file(filepath)
        
        category = CATEGORY_MAP.get(filename, "General")
        price = PRICE_TIERS.get(category, 2900)
        slug = slugify(course_title)
        description = create_course_description(course_title, len(prompts), category)
        
        course_data = {
            'title': course_title,
            'slug': slug,
            'description': description,
            'category': category,
            'price': price,
            'promptCount': len(prompts),
            'prompts': prompts
        }
        
        all_courses.append(course_data)
        total_prompts += len(prompts)
        
        print(f"✓ Parsed: {course_title}")
        print(f"  Category: {category} | Prompts: {len(prompts)} | Price: ${price/100:.2f}")
        print()
    
    print("=" * 80)
    print(f"TOTAL: {len(all_courses)} courses with {total_prompts} prompts")
    print("=" * 80)
    print()
    
    # Save to JSON for import
    output_file = "/home/ubuntu/courses_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_courses, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Data exported to: {output_file}")
    print()
    print("Now importing to database...")
    print()
    
    # Import to database using Node.js script
    import_script = """
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'ai-prompts-academy', '.env') });

const { drizzle } = require('drizzle-orm/mysql2');
const { courses, prompts } = require('./ai-prompts-academy/drizzle/schema.ts');

async function importData() {
  const db = drizzle(process.env.DATABASE_URL);
  const data = JSON.parse(fs.readFileSync('/home/ubuntu/courses_data.json', 'utf-8'));
  
  console.log(`Importing ${data.length} courses...\\n`);
  
  for (const courseData of data) {
    try {
      // Insert course
      await db.insert(courses).values({
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        category: courseData.category,
        price: courseData.price,
        promptCount: courseData.promptCount,
        isPublished: 1,
      });
      
      // Get the course ID
      const [course] = await db.select().from(courses).where(eq(courses.slug, courseData.slug)).limit(1);
      
      if (course && courseData.prompts.length > 0) {
        // Insert prompts in batches
        const promptValues = courseData.prompts.map(p => ({
          courseId: course.id,
          title: p.title,
          question: p.question,
          format: p.format || null,
          orderIndex: p.order_index,
        }));
        
        await db.insert(prompts).values(promptValues);
      }
      
      console.log(`✓ Imported: ${courseData.title} (${courseData.prompts.length} prompts)`);
    } catch (error) {
      console.error(`✗ Error importing ${courseData.title}:`, error.message);
    }
  }
  
  console.log('\\n✓ Import complete!');
  process.exit(0);
}

importData().catch(console.error);
"""
    
    # Write import script
    import_script_path = "/home/ubuntu/import_to_db.mjs"
    with open(import_script_path, 'w') as f:
        f.write(import_script)
    
    print("✓ Created database import script")
    print()
    print("Running database import...")
    print()
    
    # Run the import
    try:
        result = subprocess.run(
            ['node', import_script_path],
            cwd='/home/ubuntu',
            capture_output=True,
            text=True,
            timeout=120
        )
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
        
        if result.returncode == 0:
            print()
            print("=" * 80)
            print("✓ ALL DATA IMPORTED SUCCESSFULLY!")
            print("=" * 80)
        else:
            print()
            print("=" * 80)
            print("✗ Import failed with errors")
            print("=" * 80)
    except Exception as e:
        print(f"Error running import: {e}")
        print()
        print("You can manually run the import with:")
        print(f"  node {import_script_path}")

if __name__ == "__main__":
    main()
