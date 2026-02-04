#!/usr/bin/env node

/**
 * Region Compliance Research Tool
 * Helps research legal, religious, cultural, and language requirements
 * before deploying to a new region
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

console.log('\n' + '='.repeat(70));
console.log('🌍 Region Compliance Research Tool');
console.log('='.repeat(70) + '\n');
console.log('This tool helps you research all compliance requirements');
console.log('before deploying to a new region.\n');

async function researchRegion() {
  const research = {
    region: '',
    countryCode: '',
    timestamp: new Date().toISOString(),
    legal: {},
    religious: {},
    cultural: {},
    language: {},
    complianceStatus: 'incomplete',
    blockers: [],
    warnings: [],
    nextSteps: []
  };

  // Get region info
  console.log('📋 Region Information\n');
  research.region = await question('Region/Country name: ');
  research.countryCode = await question('Country code (e.g., DE, FR, JP): ');

  // Legal Research
  console.log('\n' + '='.repeat(70));
  console.log('⚖️  LEGAL RESEARCH');
  console.log('='.repeat(70) + '\n');
  console.log('Research the following legal requirements:\n');

  const legalQuestions = [
    {
      key: 'mentalHealthContentLaws',
      question: 'Are there specific laws regulating mental health content? (Research and note key points):',
      required: true
    },
    {
      key: 'healthClaimsAllowed',
      question: 'Are health/therapeutic claims allowed? (yes/no/depends):',
      required: true
    },
    {
      key: 'requiredDisclaimers',
      question: 'What disclaimers are legally required? (List required text):',
      required: true
    },
    {
      key: 'dataProtectionLaws',
      question: 'What data protection laws apply? (GDPR, CCPA, local laws):',
      required: true
    },
    {
      key: 'advertisingRestrictions',
      question: 'Are there advertising restrictions for health content?:',
      required: false
    },
    {
      key: 'liabilityRequirements',
      question: 'What liability/insurance requirements exist?:',
      required: false
    },
    {
      key: 'legalExpertConsulted',
      question: 'Have you consulted with a local legal expert? (yes/no/planned):',
      required: true
    }
  ];

  for (const item of legalQuestions) {
    const answer = await question(`${item.question}\n  > `);
    research.legal[item.key] = answer;
    
    if (item.required && (!answer || answer.trim() === '')) {
      research.warnings.push(`Legal research incomplete: ${item.key}`);
    }
  }

  // Religious Research
  console.log('\n' + '='.repeat(70));
  console.log('🕌 RELIGIOUS CONSIDERATIONS');
  console.log('='.repeat(70) + '\n');
  console.log('Research religious considerations:\n');

  const religiousQuestions = [
    {
      key: 'dominantReligions',
      question: 'What are the dominant religions in this region? (% if known):',
      required: true
    },
    {
      key: 'religiousLaws',
      question: 'Are there religious laws that apply (e.g., Sharia)?:',
      required: false
    },
    {
      key: 'mentalHealthViews',
      question: 'What are common religious views on mental health? (Research findings):',
      required: true
    },
    {
      key: 'prohibitedConcepts',
      question: 'Are there concepts/terms we should avoid? (List if any):',
      required: false
    },
    {
      key: 'preferredApproaches',
      question: 'Are there preferred approaches (prayer, meditation, etc.)?:',
      required: false
    },
    {
      key: 'religiousHolidays',
      question: 'Are there religious holidays/observances to consider?:',
      required: false
    },
    {
      key: 'religiousExpertConsulted',
      question: 'Have you consulted with religious experts/leaders?:',
      required: false
    }
  ];

  for (const item of religiousQuestions) {
    const answer = await question(`${item.question}\n  > `);
    research.religious[item.key] = answer;
  }

  // Cultural Research
  console.log('\n' + '='.repeat(70));
  console.log('🌏 CULTURAL SENSITIVITY');
  console.log('='.repeat(70) + '\n');
  console.log('Research cultural considerations:\n');

  const culturalQuestions = [
    {
      key: 'communicationStyle',
      question: 'Communication style: (direct/indirect/formal/informal):',
      required: true
    },
    {
      key: 'culturalValues',
      question: 'Key cultural values (individual/collective, family focus, etc.):',
      required: true
    },
    {
      key: 'mentalHealthStigma',
      question: 'Mental health stigma level: (high/moderate/low):',
      required: true
    },
    {
      key: 'acceptableTerminology',
      question: 'What terminology is acceptable for mental health?:',
      required: true
    },
    {
      key: 'traditionalPractices',
      question: 'Are there traditional healing/wellness practices to acknowledge?:',
      required: false
    },
    {
      key: 'familyStructure',
      question: 'Family/community structure considerations:',
      required: false
    },
    {
      key: 'culturalExpertConsulted',
      question: 'Have you consulted with cultural experts?:',
      required: false
    }
  ];

  for (const item of culturalQuestions) {
    const answer = await question(`${item.question}\n  > `);
    research.cultural[item.key] = answer;
  }

  // Language Research
  console.log('\n' + '='.repeat(70));
  console.log('🗣️  LANGUAGE LOCALIZATION');
  console.log('='.repeat(70) + '\n');
  console.log('Research language requirements:\n');

  const languageQuestions = [
    {
      key: 'primaryLanguage',
      question: 'Primary language(s) for this region:',
      required: true
    },
    {
      key: 'dialects',
      question: 'Are there important regional dialects?:',
      required: false
    },
    {
      key: 'translationRequirements',
      question: 'Translation requirements (professional/certified):',
      required: true
    },
    {
      key: 'technicalConsiderations',
      question: 'Technical considerations (RTL, character encoding, etc.):',
      required: false
    },
    {
      key: 'translationExpertConsulted',
      question: 'Translation expert consulted or planned?:',
      required: true
    }
  ];

  for (const item of languageQuestions) {
    const answer = await question(`${item.question}\n  > `);
    research.language[item.key] = answer;
  }

  // Compliance Assessment
  console.log('\n' + '='.repeat(70));
  console.log('✅ COMPLIANCE ASSESSMENT');
  console.log('='.repeat(70) + '\n');

  // Check for blockers
  if (!research.legal.legalExpertConsulted || research.legal.legalExpertConsulted.toLowerCase() === 'no') {
    research.blockers.push('Legal expert consultation required before deployment');
  }

  if (!research.language.translationExpertConsulted || research.language.translationExpertConsulted.toLowerCase() === 'no') {
    research.blockers.push('Professional translation required before deployment');
  }

  // Determine status
  if (research.blockers.length > 0) {
    research.complianceStatus = 'blocked';
    console.log('❌ DEPLOYMENT BLOCKED');
    console.log('\nBlockers:');
    research.blockers.forEach(blocker => console.log(`  - ${blocker}`));
  } else if (research.warnings.length > 0) {
    research.complianceStatus = 'needsReview';
    console.log('⚠️  DEPLOYMENT NEEDS REVIEW');
    console.log('\nWarnings:');
    research.warnings.forEach(warning => console.log(`  - ${warning}`));
  } else {
    research.complianceStatus = 'researchComplete';
    console.log('✅ RESEARCH COMPLETE');
    console.log('   (Additional review recommended before deployment)');
  }

  // Next Steps
  console.log('\n📋 RECOMMENDED NEXT STEPS:\n');
  research.nextSteps = [
    'Review all research findings with team',
    'Consult with local legal expert',
    'Hire professional translator',
    'Create compliance checklist',
    'Test content with local users',
    'Review with cultural/religious experts',
    'Document all compliance requirements',
    'Create region-specific disclaimer',
    'Implement required technical changes',
    'Conduct final compliance review'
  ];

  research.nextSteps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step}`);
  });

  // Save research
  const outputDir = path.join(__dirname, '../logs/compliance-research');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `compliance-research-${research.countryCode}-${Date.now()}.json`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(research, null, 2));
  
  console.log(`\n💾 Research saved to: ${filepath}\n`);

  return research;
}

// Run research
researchRegion()
  .then(() => {
    console.log('\n' + '='.repeat(70));
    console.log('Research session complete!');
    console.log('='.repeat(70) + '\n');
    rl.close();
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    rl.close();
    process.exit(1);
  });


