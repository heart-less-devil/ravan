const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import database connection
const connectDB = require('./config/database');

// Import models
const User = require('./models/User');
const BDTracker = require('./models/BDTracker');
const VerificationCode = require('./models/VerificationCode');

// Helper function to check MongoDB connection
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

const app = express();
const PORT = process.env.PORT || 3005;

// Initialize Stripe with proper configuration
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let stripe = null;
if (stripeSecretKey && stripeSecretKey !== 'sk_live_your_stripe_secret_key_here') {
  stripe = require('stripe')(stripeSecretKey);
  console.log('✅ Stripe initialized successfully');
  console.log('🔧 Using live Stripe key');
} else {
  console.log('⚠️ Stripe not configured - payment features will be disabled');
}

// ============================================================================
// AI DEAL SCANNER FUNCTIONS
// ============================================================================

// Web scraping dependencies
// const puppeteer = require('puppeteer'); // Disabled - too heavy for Render free tier
const cheerio = require('cheerio');
const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let openaiClient = null;
if (OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  console.log('✅ OpenAI client initialized for AI Deal Scanner web search');
} else {
  console.log('⚠️ OPENAI_API_KEY not set. AI Deal Scanner web search will be limited to NewsAPI results.');
}

// News sources configuration
const NEWS_SOURCES = {
  biospace: {
    name: 'BioSpace',
    url: 'https://www.biospace.com',
    searchUrl: 'https://www.biospace.com/search', 
    selectors: {
      articles: '.article-item, .news-item',
      title: 'h3 a, h2 a',
      link: 'h3 a, h2 a',
      date: '.date, .publish-date',
      content: '.article-content, .news-content'
    }
  },
  fiercebiotech: {
    name: 'Fierce Biotech',
    url: 'https://www.fiercebiotech.com',
    searchUrl: 'https://www.fiercebiotech.com/search',
    selectors: {
      articles: '.article, .news-item',
      title: 'h3 a, h2 a',
      link: 'h3 a, h2 a',
      date: '.date, .publish-date',
      content: '.article-content, .news-content'
    }
  },
  prnewswire: {
    name: 'PR Newswire',
    url: 'https://www.prnewswire.com',
    searchUrl: 'https://www.prnewswire.com/news-releases',
    selectors: {
      articles: '.newsreleaseconsolidatelink',
      title: 'h3 a, h2 a',
      link: 'h3 a, h2 a',
      date: '.date, .publish-date',
      content: '.article-content, .news-content'
    }
  }
};

const PREFERRED_DOMAIN_LABELS = {
  'biospace.com': 'BioSpace',
  'fiercebiotech.com': 'Fierce Biotech',
  'biotechnetworks.org': 'Biotech Networks',
  'biocom.org': 'Biocom California',
  'lifescivc.com': 'LifeSci VC',
  'sdbn.org': 'San Diego Biotech Network',
  'cellandgene.com': 'Cell & Gene',
  'emjreviews.com': 'EMJ Reviews',
  'biocentury.com': 'BioCentury',
  'bioxconomy.com': 'Bio x Conomy',
  'pullanconsulting.com': 'Pullan Consulting',
  'prnewswire.com': 'PR Newswire'
};
const PREFERRED_DOMAINS = Object.keys(PREFERRED_DOMAIN_LABELS);

// AI-powered deal extraction function
async function extractDealInformation(articleText, sourceUrl) {
  try {
    // Enhanced patterns for better extraction
    const dealPatterns = {
      buyer: [
        /(?:acquired by|licensed to|partnered with|collaboration with|signed with|announced with)\s+([A-Z][a-zA-Z\s&,.-]+?)(?:\s|$|,|\.|,)/gi,
        /([A-Z][a-zA-Z\s&,.-]+?)\s+(?:acquires|licenses|partners with|collaborates with|signed with|announced)/gi,
        /([A-Z][a-zA-Z\s&,.-]+?)\s+(?:and|&)\s+([A-Z][a-zA-Z\s&,.-]+?)\s+(?:announce|sign|partner)/gi
      ],
      seller: [
        /([A-Z][a-zA-Z\s&,.-]+?)\s+(?:acquires|licenses|partners with|collaborates with|signed with|announced)/gi,
        /(?:acquired by|licensed to|partnered with|collaboration with|signed with|announced with)\s+([A-Z][a-zA-Z\s&,.-]+?)(?:\s|$|,|\.|,)/gi
      ],
      drugName: [
        /(?:drug|candidate|compound|therapy|treatment|program|asset)\s+([A-Z][a-zA-Z0-9\s-]+?)(?:\s|$|,|\.|,)/gi,
        /([A-Z][a-zA-Z0-9\s-]+?)\s+(?:drug|candidate|compound|therapy|treatment|program)/gi,
        /(?:RNAi|mRNA|CAR-T|ADC|antibody|vaccine|gene therapy|cell therapy)/gi
      ],
      therapeuticArea: [
        /(?:oncology|cancer|cardiovascular|neurology|immunology|infectious|respiratory|dermatology|ophthalmology|rare disease|orphan|metabolic|diabetes|alzheimer|parkinson)/gi,
        /(?:cancer|tumor|cardiac|brain|immune|lung|skin|eye|liver|kidney|heart)/gi
      ],
      stage: [
        /(?:pre-clinical|preclinical|phase\s*[I1]|phase\s*[II2]|phase\s*[III3]|marketed|approved|clinical|IND|NDA|BLA)/gi,
        /(?:Phase\s*[I1]|Phase\s*[II2]|Phase\s*[III3]|Phase\s*[IV4])/gi
      ],
      financials: [
        /(\$[\d,]+(?:M|B|million|billion)?(?:\s*(?:upfront|milestone|royalty|total|deal|value|worth))?)/gi,
        /(?:upfront|milestone|royalty|total|deal|value|worth)\s*:?\s*(\$[\d,]+(?:M|B|million|billion)?)/gi,
        /(\d+(?:\.\d+)?\s*(?:M|B|million|billion))/gi
      ]
    };

    const extractedData = {
      buyer: '',
      seller: '',
      drugName: '',
      therapeuticArea: '',
      stage: '',
      financials: '',
      dealDate: new Date().toISOString().split('T')[0],
      sourceUrl: sourceUrl
    };

    // Extract information using multiple patterns
    for (const [key, patterns] of Object.entries(dealPatterns)) {
      for (const pattern of patterns) {
        const matches = articleText.match(pattern);
        if (matches && matches.length > 0) {
          const match = matches[0].trim();
          if (match && match.length > 2) { // Avoid very short matches
            extractedData[key] = match;
            break; // Use first good match
          }
        }
      }
    }

    // If no specific data found, try to extract company names from the text
    if (!extractedData.buyer && !extractedData.seller) {
      const companyPattern = /([A-Z][a-zA-Z\s&,.-]{3,30}?)\s+(?:and|&|announces|signs|partners|collaborates)/gi;
      const companies = articleText.match(companyPattern);
      if (companies && companies.length > 0) {
        extractedData.buyer = companies[0].trim();
      }
    }

    // If no therapeutic area found, try common medical terms
    if (!extractedData.therapeuticArea) {
      const medicalTerms = ['oncology', 'cancer', 'cardiovascular', 'neurology', 'immunology', 'diabetes', 'alzheimer', 'parkinson'];
      for (const term of medicalTerms) {
        if (articleText.toLowerCase().includes(term)) {
          extractedData.therapeuticArea = term.charAt(0).toUpperCase() + term.slice(1);
          break;
        }
      }
    }

    // If no financials found, look for any monetary values
    if (!extractedData.financials) {
      const moneyPattern = /\$[\d,]+(?:M|B|million|billion)?/gi;
      const moneyMatches = articleText.match(moneyPattern);
      if (moneyMatches && moneyMatches.length > 0) {
        extractedData.financials = moneyMatches[0];
      }
    }

    return extractedData;
  } catch (error) {
    console.error('Error extracting deal information:', error);
    return null;
  }
}

function buildFallbackNarrative(searchQuery, dateRangeDays) {
  const timeframeLabel = dateRangeDays === 1 ? 'the past 24 hours' : `the past ${dateRangeDays} days`;
  return [
    `I couldn't reach the live research service just now, so here's a manual game plan for digging into "${searchQuery}" from ${timeframeLabel}.`,
    'Start with dependable aggregators such as Google News and Fierce Biotech\'s site search to scan for breaking licensing, M&A, or financing headlines.',
    'Check PR Newswire or Business Wire for company-issued releases—those usually include deal values, milestones, and partner quotes you can reuse.',
    'If you need deeper context, filings in the SEC\'s EDGAR database or investor presentations often spell out deal economics and pipeline stage detail.'
  ].join(' ');
}

function buildFallbackDeals(searchQuery) {
  const todayIso = new Date().toISOString().split('T')[0];
  const encodedQuery = encodeURIComponent(searchQuery);
  return [
    {
      buyer: '',
      seller: '',
      drugName: '',
      therapeuticArea: '',
      stage: '',
      financials: '',
      dealDate: todayIso,
      title: `Latest headlines for "${searchQuery}"`,
      summary: 'Aggregated coverage from global outlets. Filter by "Deals" or "Business" inside Google News to spot recent transactions.',
      source: 'Google News',
      sourceUrl: `https://news.google.com/search?q=${encodedQuery}`,
      tags: ['news', 'aggregator'],
      isFallback: true
    },
    {
      buyer: '',
      seller: '',
      drugName: '',
      therapeuticArea: '',
      stage: '',
      financials: '',
      dealDate: todayIso,
      title: `Trade-press coverage for "${searchQuery}"`,
      summary: 'Fierce Biotech frequently reports on licensing, partnerships, and M&A activity with quick analysis.',
      source: 'Fierce Biotech Search',
      sourceUrl: `https://www.fiercebiotech.com/search?search_api_fulltext=${encodedQuery}`,
      tags: ['trade-press', 'biotech'],
      isFallback: true
    },
    {
      buyer: '',
      seller: '',
      drugName: '',
      therapeuticArea: '',
      stage: '',
      financials: '',
      dealDate: todayIso,
      title: `Press releases mentioning "${searchQuery}"`,
      summary: 'Company-issued releases on PR Newswire often include deal values, milestone structures, or partner comments.',
      source: 'PR Newswire Search',
      sourceUrl: `https://www.prnewswire.com/news-releases/news-releases-list/?keyword=${encodedQuery}`,
      tags: ['press-release', 'primary'],
      isFallback: true
    }
  ];
}

function extractResponseText(response) {
  if (!response) return '';

  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const textSnippets = [];

  const collectFromContent = (content) => {
    if (!content) return;

    if (typeof content === 'string' && content.trim()) {
      textSnippets.push(content.trim());
      return;
    }

    if (typeof content.text === 'string' && content.text.trim()) {
      textSnippets.push(content.text.trim());
    }

    if (Array.isArray(content) && content.length) {
      content.forEach(collectFromContent);
    }

    if (Array.isArray(content.content) && content.content.length) {
      content.content.forEach(collectFromContent);
    }

    if (Array.isArray(content.annotations) && content.annotations.length) {
      content.annotations.forEach(collectFromContent);
    }
  };

  const visit = (node) => {
    if (!node) return;

    if (typeof node === 'string') {
      collectFromContent(node);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (typeof node === 'object') {
      if (typeof node.text === 'string') {
        collectFromContent(node.text);
      }

      if (Array.isArray(node.content)) {
        node.content.forEach(collectFromContent);
      }

      Object.values(node).forEach((value) => {
        if (value !== node.text && value !== node.content) {
          visit(value);
        }
      });
    }
  };

  visit(response.output);
  visit(response.content);
  visit(response.choices);

  const combined = textSnippets.join('\n').trim();
  return combined;
}

async function searchDealsWithOpenAI(searchQuery, dateRangeDays, userEmail) {
  if (!openaiClient) {
    return { deals: [], sources: [] };
  }

  try {
    // FIXED: Always use 12 months (365 days) for drug deals
    const fixedDateRangeDays = 365;
    const timeframeLabel = `the last 12 months (${fixedDateRangeDays} days)`;
    const MIN_DEALS_TARGET = 20; // Reduced from 25 for faster response
    const MAX_DEALS_TARGET = 30; // Reduced from 40 for faster response
    const MAX_ATTEMPTS = 2; // Reduced from 3 to improve response time
    
    // Get current date for context
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.toLocaleString('en-US', { month: 'long' });
    const currentDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Calculate minimum date (12 months ago - 365 days)
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - fixedDateRangeDays);
    const minDateStr = minDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get month names for the date range
    const monthsInRange = [];
    for (let i = 0; i < Math.min(dateRangeDays / 30, 3); i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      monthsInRange.push(date.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
    }

    const basePrompt = `
You are a pharmaceutical and biotechnology deal analyst. You MUST find AT LEAST ${MIN_DEALS_TARGET} unique DRUG DEALS (ideally ${MAX_DEALS_TARGET}, but minimum ${MIN_DEALS_TARGET}) (licensing, M&A, partnerships, acquisitions) published within ${timeframeLabel} (last 12 months only).

🚨 CRITICAL REQUIREMENT: YOU MUST RETURN AT LEAST ${MIN_DEALS_TARGET} DEALS. RETURNING ONLY 3-5 DEALS IS NOT ACCEPTABLE. YOU MUST SEARCH EXTENSIVELY AND FIND ${MIN_DEALS_TARGET}-${MAX_DEALS_TARGET} DEALS.

🚨 MANDATORY: ONLY DEALS FROM THE LAST 12 MONTHS (${minDateStr} to ${currentDateStr})
- DO NOT include deals older than 12 months
- DO NOT include deals from 2024, 2023, or earlier years unless they fall within the last 12 months
- ONLY search for deals announced between ${minDateStr} and ${currentDateStr}

🚫 ABSOLUTE PROHIBITION - THESE DEALS MUST NEVER APPEAR IN RESULTS (COMPLETELY FORBIDDEN):
- Medical devices, diagnostic devices, surgical instruments, medical equipment, implants, catheters, stents, pacemakers - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW
- ANY deal mentioning "device", "diagnostic device", "surgical instrument", "medical equipment" - ABSOLUTELY FORBIDDEN
- Energy/oil/gas deals - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW
- Automotive deals - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW
- Food/beverage deals - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW (including nutraceutical deals)
- Wikipedia articles (wikipedia.org, wikipedia.com) - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW
- Political news (Trump, Biden, elections, politics, president) - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW
- General news articles that are not drug deal announcements - ABSOLUTELY FORBIDDEN
- Deals without disclosed buyer AND seller - ABSOLUTELY FORBIDDEN, NEVER INCLUDE

🚨 CRITICAL: ONLY DRUG DEALS - NO DEVICES:
- You MUST ONLY include deals for DRUGS, DRUG CANDIDATES, PHARMACEUTICAL COMPOUNDS, or THERAPEUTIC BIOLOGICS
- DO NOT include deals for medical devices, diagnostic devices, surgical equipment, or any non-drug medical products
- Every deal MUST involve a pharmaceutical drug, drug candidate, or therapeutic biologic product
- If a deal involves a device or equipment, EXCLUDE it completely - it is FORBIDDEN
These restrictions are STRICTLY PROHIBITED and must NEVER appear in your results. If you encounter any deals from these categories, IMMEDIATELY EXCLUDE them and DO NOT include them in the output.

🚫 CRITICAL: ONLY ACTUAL DRUG DEAL ANNOUNCEMENTS - EXCLUDE ALL GENERAL NEWS ARTICLES:
You MUST ONLY include actual DRUG DEAL announcements (licensing agreements, M&A transactions, partnerships, acquisitions). 
DO NOT include general medical news articles, health articles, or educational content. Examples of what to EXCLUDE:
- General health news articles (e.g., "cancer symptoms", "disease prevention tips", "health advice")
- Educational articles (e.g., "medical education", "exam information", "training programs")
- Lists and rankings (e.g., "influential people in oncology", "top doctors", "key opinion leaders")
- Conference presentations or research updates (unless they specifically announce a deal)
- General disease information articles
- News about medical procedures or treatments (unless it's part of a deal announcement)
- Articles about medical conferences or events (unless they announce a deal)
- Any article that does NOT specifically announce a drug deal, licensing agreement, partnership, M&A, or acquisition

ONLY include articles that specifically announce:
- Drug licensing agreements between companies
- Drug acquisition deals
- Pharmaceutical M&A transactions
- Drug partnership/collaboration announcements
- Biotech deal announcements
- Therapeutic asset transactions

If an article is just general news about a disease, health information, education, or people - EXCLUDE IT COMPLETELY. Only actual deal announcements are acceptable.

CRITICAL RESTRICTION: ONLY MEDICAL/PHARMACEUTICAL/BIOTECH FIELD DEALS ARE ALLOWED. 
- You MUST ONLY return deals from pharmaceutical, biotech, or medical fields
- DO NOT include any deals from technology, finance, retail, manufacturing, energy, automotive, or any other non-medical industries
- Every deal MUST involve drugs, drug candidates, pharmaceutical products, or medical/biotech companies
- If a deal is not clearly from the medical/pharmaceutical/biotech field, EXCLUDE it completely

USER QUERY: "${searchQuery}"
${searchQuery && searchQuery.trim() ? `The user is searching for DRUG DEALS related to: "${searchQuery}". 

🚨 ABSOLUTE CRITICAL: "${searchQuery}" IS ALWAYS A DISEASE/CONDITION, NEVER A DRUG NAME.

The user can search for ANY DISEASE in the world (e.g., pain, oncology, cancer, inflammation, autoimmune, diabetes, Alzheimer's, Parkinson's, COVID-19, arthritis, lupus, MS, etc.). 
You MUST ALWAYS treat "${searchQuery}" as a DISEASE or MEDICAL CONDITION, NOT as a drug name.

CRITICAL SEARCH PRIORITY - DISEASE-BASED SEARCH ONLY:
- "${searchQuery}" = DISEASE/CONDITION (e.g., if user searches "pain", search for drug deals related to pain treatment, NOT a drug named "pain")
- "${searchQuery}" = DISEASE/CONDITION (e.g., if user searches "oncology", search for oncology/cancer drug deals, NOT a drug named "oncology")
- "${searchQuery}" = DISEASE/CONDITION (e.g., if user searches "inflammation", search for inflammation/autoimmune drug deals, NOT a drug named "inflammation")
- ALWAYS assume "${searchQuery}" is a disease/condition - this applies to ANY search term the user enters
- PRIORITIZE disease-focused searches: "${searchQuery} drug deals", "drugs for ${searchQuery} deals", "${searchQuery} treatment deals", "${searchQuery} pharmaceutical licensing deals"
- Focus on finding DRUG DEALS for drugs targeting "${searchQuery}" disease/condition
- Search for deals where the therapeutic area/disease indication matches "${searchQuery}"
- DO NOT search for a drug named "${searchQuery}" - "${searchQuery}" is ALWAYS a disease/condition
- Always return DRUG DEALS as results, prioritizing deals where the disease/condition matches "${searchQuery}"` : 'The user has not specified a particular search term, so search broadly for all drug deals within the timeframe.'} 

CURRENT DATE CONTEXT: Today is ${currentDateStr} (${currentMonth} ${currentYear}). 

CRITICAL DATE FILTERING - LAST 12 MONTHS ONLY:
- ONLY include deals with publication dates between ${minDateStr} and ${currentDateStr} (last 12 months / ${fixedDateRangeDays} days)
- EXCLUDE any deals older than ${minDateStr} (12 months ago)
- EXCLUDE deals from 2024, 2023, or any year before ${currentYear} unless they fall within the last 12 months
- PRIORITIZE deals from ${monthsInRange.join(', ')} - these are the months within the last 12 months
- Do NOT include deals from months outside the last 12 months range
- If a deal date is not specified, only include it if the article publication date is within the last 12 months

🚨 CRITICAL DATE ACCURACY REQUIREMENTS:
- dealDate MUST be the EXACT date from the article, NOT today's date (${currentDateStr})
- DO NOT use current date, today's date, or guess the date
- You MUST extract the actual date from the article text or metadata
- Look for dates in formats like "Dec 7, 2024", "December 7, 2024", "2024-12-07", "Nov 15, 2024"
- Check article publication date, press release date, or announcement date mentioned in the article
- If article says "announced on February 3, 2024", use "2024-02-03" - NOT today's date
- If article says "signed in July 2024", look for the specific day or use the first day of that month
- DO NOT assume dates - if you cannot find the exact date in the article, DO NOT make up a date
- Dates must be between ${minDateStr} and ${currentDateStr} (last 12 months)
- Dates MUST NOT be in the future - if you see a future date, it's likely wrong, check the article again
- Example: If today is ${currentDateStr} and article says "announced February 3, 2024", use "2024-02-03", NOT "${currentDateStr}"

🚨 CRITICAL: You MUST return AT LEAST ${MIN_DEALS_TARGET} deals (ideally ${MAX_DEALS_TARGET}). 
- DO NOT stop at 3-5 deals - this is NOT ACCEPTABLE
- DO NOT stop at 10 deals - you MUST find MORE
- You MUST search EXTENSIVELY across MULTIPLE sources
- Search ONLY within ${timeframeLabel} (${minDateStr} to ${currentDateStr}), and PRIORITIZE THE LATEST DEALS FIRST
- If you only find a few deals, EXPAND your search - try different keywords, different companies, different therapeutic areas
- Search EACH source MULTIPLE times with DIFFERENT search terms
- Return ${MIN_DEALS_TARGET}-${MAX_DEALS_TARGET} deals - this is MANDATORY

MANDATORY SEARCH STRATEGY - Perform AT LEAST 10-12 different web searches based on the user's query "${searchQuery}":
IMPORTANT: Include date range "${minDateStr} to ${currentDateStr}" or "${timeframeLabel}" in your searches to ensure you only get recent deals.

DYNAMIC SEARCHES BASED ON USER QUERY - ALWAYS TREAT AS DISEASE/CONDITION:
🚨 CRITICAL: "${searchQuery}" IS ALWAYS A DISEASE/CONDITION, NEVER A DRUG NAME.
The user can search for ANY disease worldwide (pain, oncology, inflammation, autoimmune, diabetes, etc.).
You MUST search for DRUG DEALS related to treating "${searchQuery}" disease, NOT for a drug named "${searchQuery}".

Prioritize these disease-focused searches (treat "${searchQuery}" as disease in ALL searches):

1. "${searchQuery} drug deals ${timeframeLabel}" (HIGHEST PRIORITY - search for drug deals targeting ${searchQuery} disease)
2. "drugs for ${searchQuery} deals ${timeframeLabel}" (HIGHEST PRIORITY - search for drugs treating ${searchQuery} disease)
3. "${searchQuery} treatment deals ${timeframeLabel}" (HIGHEST PRIORITY - search for treatment deals for ${searchQuery} disease)
4. "${searchQuery} pharmaceutical deals ${timeframeLabel}" (HIGH PRIORITY - pharmaceutical deals for ${searchQuery} disease)
5. "${searchQuery} biotech deals ${timeframeLabel}" (HIGH PRIORITY - biotech deals for ${searchQuery} disease)
6. "${searchQuery} licensing deals ${currentYear}" (HIGH PRIORITY - licensing deals for ${searchQuery} disease treatments)
7. "${searchQuery} M&A deals ${timeframeLabel}" (HIGH PRIORITY - M&A deals related to ${searchQuery} disease)
8. "${searchQuery} partnership deals ${timeframeLabel}" (HIGH PRIORITY - partnership deals for ${searchQuery} disease)
9. "${searchQuery} drug acquisition deals ${timeframeLabel}" (HIGH PRIORITY - drug acquisition deals for ${searchQuery} disease)
10. "pharmaceutical deals ${searchQuery} ${timeframeLabel}" (HIGH PRIORITY - pharmaceutical deals for ${searchQuery} disease)
11. "${searchQuery} therapeutic area deals ${timeframeLabel}" (HIGH PRIORITY - deals in ${searchQuery} therapeutic area)
12. "drug deals ${searchQuery} indication ${timeframeLabel}" (HIGH PRIORITY - drug deals with ${searchQuery} indication)

🚨 ABSOLUTE RULE: Do NOT search for deals involving a drug named "${searchQuery}". 
"${searchQuery}" is ALWAYS a disease/condition. Search for drug deals where the disease indication or therapeutic area matches "${searchQuery}".

GENERAL COMPREHENSIVE SEARCHES (to find all relevant deals - perform these in addition to disease-specific searches):
13. "latest pharmaceutical licensing deals ${currentMonth} ${currentYear} ${timeframeLabel}"
14. "recent biotech M&A deals ${currentYear} since ${minDateStr}"
15. "newest drug partnership announcements ${timeframeLabel}"
16. "latest therapeutic asset acquisitions ${currentMonth} ${currentYear}"
17. "recent oncology licensing deals ${timeframeLabel}"
18. "latest immunology drug deals ${currentMonth} ${currentYear}"
19. "recent biotech collaboration deals ${timeframeLabel}"
20. Search by month (ONLY months in range: ${monthsInRange.join(', ')}): "pharmaceutical deals ${currentMonth} ${currentYear}", then other months in range

CRITICAL: ALWAYS TREAT "${searchQuery}" AS A DISEASE/CONDITION, NOT AS A DRUG NAME.

SEARCH STRATEGY - DISEASE-BASED APPROACH:
- ALWAYS assume "${searchQuery}" is a disease/condition (e.g., cancer, diabetes, Alzheimer's, etc.)
- PRIORITIZE disease-focused searches (see DYNAMIC SEARCHES above)
- Focus on finding DRUG DEALS for drugs targeting "${searchQuery}" disease/condition
- Search for pharmaceutical deals, licensing deals, and partnerships related to "${searchQuery}" disease treatments
- Look for deals where the therapeutic area or disease indication matches "${searchQuery}"
- The results MUST be drug deals, but they should be related to "${searchQuery}" as a disease/condition
- DO NOT search for deals involving a specific drug named "${searchQuery}" - treat it as a disease instead

Always perform general searches as well to ensure comprehensive coverage of all drug deals within ${timeframeLabel}, but prioritize results where the disease/condition matches "${searchQuery}".

CRITICAL: When performing general searches, ONLY search for pharmaceutical/biotech/medical field deals. Do NOT include any deals from other industries (technology, finance, retail, etc.). All deals MUST be from the medical/pharmaceutical/biotech field.

🚨 MANDATORY SOURCES - Search ALL of these EXTENSIVELY (you MUST search each source MULTIPLE times):
- PR Newswire (search AT LEAST 3-5 times with different keywords to find MORE deals)
- Business Wire (search AT LEAST 3-5 times with different keywords to find MORE deals)
- BioSpace (search AT LEAST 3-5 times with different keywords to find MORE deals)
- Fierce Biotech (search AT LEAST 3-5 times with different keywords to find MORE deals)
- BioPharma Dive (search AT LEAST 3-5 times with different keywords to find MORE deals)
- Reuters (search AT LEAST 3-5 times with different keywords to find MORE deals)
- GlobeNewswire (search AT LEAST 3-5 times with different keywords to find MORE deals)
- Company press releases (search major pharma companies - search MULTIPLE companies)

CRITICAL: For EACH source, perform MULTIPLE searches with DIFFERENT keywords to maximize the number of deals found. Do NOT search each source only once - you MUST search multiple times to reach ${MIN_DEALS_TARGET}-${MAX_DEALS_TARGET} deals.

EXTRACTION RULES:
${searchQuery && searchQuery.trim() ? `- PRIORITIZE DEALS MATCHING USER QUERY: The user query "${searchQuery}" should be your PRIMARY focus. 

🚨 CRITICAL: "${searchQuery}" IS ALWAYS A DISEASE/CONDITION, NEVER A DRUG NAME.
The user can search for ANY disease worldwide (pain, oncology, inflammation, autoimmune, diabetes, etc.).

DISEASE-BASED EXTRACTION (ALWAYS APPLY THIS):
- "${searchQuery}" = DISEASE/CONDITION (e.g., "pain" = pain disease, "oncology" = cancer/oncology disease, "inflammation" = inflammation disease)
- ALWAYS treat "${searchQuery}" as a disease/condition - this applies to ANY search term
- 🚨 CRITICAL STRICT MATCHING: ONLY include deals where "${searchQuery}" disease is mentioned in the INDICATION/THERAPEUTIC AREA field
- DO NOT match on title or summary - ONLY match on indication/therapeutic area field
- DO NOT include deals where "${searchQuery}" appears only in company names (buyer/seller) - this is NOT a match
- DO NOT include deals where "${searchQuery}" appears only in drug names - this is NOT a match
- DO NOT include deals where "${searchQuery}" appears only in title/summary but NOT in indication/therapeutic area - this is NOT a match
- ONLY include deals where the therapeuticArea/indication field contains "${searchQuery}" disease
- Example: If user searches "oncology", ONLY include deals where therapeuticArea/indication field mentions "oncology" (e.g., "oncology", "cancer", "tumor"), NOT deals where "oncology" appears only in title
- Example: If user searches "pain", ONLY include deals where indication mentions "pain" (e.g., "chronic pain", "acute pain"), NOT deals where "pain" appears only in company name like "Royalty Pharma"
- The indication/therapeutic area field is the ONLY matching criteria - all other fields are ignored for matching purposes

🚨 CRITICAL: When extracting deal data:
- Extract ACTUAL company names, drug names, and disease names from articles whenever possible
- DO NOT use placeholder values like "Not disclosed", "Undisclosed", "N/A", "Unknown" - if data is not available, leave field empty
- 🚨 MANDATORY: Every deal MUST have BOTH buyer AND seller disclosed with actual company names
- If buyer or seller is "Not disclosed", "Undisclosed", "N/A", "Unknown", empty, or missing - DO NOT include that deal in results
- Only include deals where BOTH buyer and seller are actual named companies (e.g., "Pfizer", "Merck", "Novartis")
- IMPORTANT: Include deals even if some other fields are empty (drugName, financials, etc.) - as long as buyer and seller are disclosed
- Only exclude deals if buyer or seller is missing/undisclosed, or if it's NOT an actual drug deal announcement
- Each deal MUST have exactly ONE valid sourceUrl - do not include multiple URLs for the same deal
- 🚨 CRITICAL: If search query is provided, ONLY include deals where the indication/therapeutic area field matches the search query (disease-based matching)
- DO NOT match on title, summary, or any other field - ONLY match on indication/therapeutic area field
- The indication column is the PRIMARY and ONLY matching field for search keywords

Always ensure you return ${MIN_DEALS_TARGET}-${MAX_DEALS_TARGET} total drug deals, but ONLY include deals where the indication/therapeutic area field matches "${searchQuery}".` : ''}
🚨 CRITICAL EXTRACTION REQUIREMENTS:
- You MUST extract AT LEAST ${MIN_DEALS_TARGET} deals - returning fewer is a FAILURE
- PRIORITIZE LATEST DEALS: Start by extracting deals from ${currentMonth} ${currentYear}, then work backwards through previous months
- Extract deals from EACH search result - do NOT skip any qualifying deals
- Extract deals from EVERY source you search - PR Newswire, Business Wire, BioSpace, Fierce Biotech, BioPharma Dive, Reuters, GlobeNewswire
- Search across the ENTIRE ${timeframeLabel} period, but FOCUS ON THE MOST RECENT DEALS FIRST
- If ${timeframeLabel} includes multiple months, search EACH month separately, starting with ${currentMonth} ${currentYear} first, then previous months
- When returning deals, prioritize deals with dates closest to ${currentDateStr} (most recent first)
- You MUST reach ${MIN_DEALS_TARGET}-${MAX_DEALS_TARGET} deals before stopping
- Do NOT return only 3-5 deals - this is COMPLETELY UNACCEPTABLE
- Do NOT return only 10 deals - you MUST find MORE
- IMPORTANT: Include as many deals from ${currentMonth} ${currentYear} and recent months as possible - do NOT focus only on old deals
- If you're not finding enough deals, search MORE sources, use MORE keywords, try MORE search variations
- Extract deals from MULTIPLE pages of search results, not just the first page
- Search each source MULTIPLE times with DIFFERENT keywords to find more deals

CRITICAL: ONLY MEDICAL/PHARMACEUTICAL/BIOTECH FIELD DEALS - STRICT FILTERING REQUIRED:

ONLY include deals that involve:
- Specific drugs, drug candidates, pharmaceutical products, or therapeutic assets
- Drug licensing agreements (pharmaceutical/biotech companies only)
- Drug acquisition deals (pharmaceutical/biotech companies only)
- Drug partnership/collaboration deals (pharmaceutical/biotech companies only)
- Drug-related M&A transactions (pharmaceutical/biotech companies only)
- Medical device deals ONLY if they are related to drug delivery or pharmaceutical use
- Biotech deals involving drug development, drug discovery, or pharmaceutical research

MANDATORY EXCLUSIONS - DO NOT INCLUDE ANY OF THESE (STRICTLY FORBIDDEN):
- 🚫 General medical news articles - ABSOLUTELY FORBIDDEN (e.g., "cancer symptoms", "disease information", "health tips", "medical advice")
- 🚫 Educational articles - ABSOLUTELY FORBIDDEN (e.g., "medical education", "exam information", "training programs", "qualification requirements")
- 🚫 Lists and rankings - ABSOLUTELY FORBIDDEN (e.g., "influential people", "top doctors", "key opinion leaders", "100 influential women")
- 🚫 Conference presentations/research updates - ABSOLUTELY FORBIDDEN (unless they specifically announce a deal transaction)
- 🚫 General disease information articles - ABSOLUTELY FORBIDDEN (articles that just provide information about diseases without announcing a deal)
- 🚫 News about medical procedures/treatments - ABSOLUTELY FORBIDDEN (unless it's part of a specific deal announcement)
- 🚫 Articles about medical conferences/events - ABSOLUTELY FORBIDDEN (unless they announce a deal)
- General company news without specific drug/pharmaceutical deal announcements
- General business news from non-medical fields
- Technology deals (software, IT, tech startups) - UNLESS they are specifically for pharmaceutical/drug development
- Finance/banking deals - COMPLETELY EXCLUDED
- Real estate deals - COMPLETELY EXCLUDED
- Retail deals - COMPLETELY EXCLUDED
- Manufacturing deals (unless pharmaceutical manufacturing)
- 🚫 Energy/oil/gas deals - ABSOLUTELY FORBIDDEN, COMPLETELY EXCLUDED, NEVER INCLUDE, NEVER SHOW - THESE MUST NOT APPEAR IN RESULTS
- 🚫 Automotive deals - ABSOLUTELY FORBIDDEN, COMPLETELY EXCLUDED, NEVER INCLUDE, NEVER SHOW - THESE MUST NOT APPEAR IN RESULTS
- 🚫 Food/beverage deals - ABSOLUTELY FORBIDDEN, COMPLETELY EXCLUDED, NEVER INCLUDE, NEVER SHOW - THESE MUST NOT APPEAR IN RESULTS (even nutraceutical deals are excluded)
- Non-drug related partnerships
- General industry trends without deal specifics
- Deals from companies NOT in pharmaceutical, biotech, or medical fields
- ANY article that does NOT specifically announce a drug deal, licensing agreement, partnership, M&A, or acquisition
- ANY deals with publication dates BEFORE ${minDateStr} (${dateRangeDays} days ago)
- Deals from 2024, 2023, or any year before ${currentYear} unless the deal date is between ${minDateStr} and ${currentDateStr}
- Old deals from months outside ${monthsInRange.join(', ')}

VERIFICATION: Before including any deal, verify that:
1. The article SPECIFICALLY ANNOUNCES a drug deal, licensing agreement, partnership, M&A, or acquisition (NOT just general news)
2. The deal involves pharmaceutical/biotech/medical companies
3. The deal is specifically about drugs, drug candidates, or pharmaceutical products
4. 🚫 The article is NOT a general medical news article (e.g., symptoms, health tips, disease information) - IF IT IS, EXCLUDE IT IMMEDIATELY
5. 🚫 The article is NOT an educational article (e.g., medical education, exams, training) - IF IT IS, EXCLUDE IT IMMEDIATELY
6. 🚫 The article is NOT a list/ranking article (e.g., influential people, top doctors) - IF IT IS, EXCLUDE IT IMMEDIATELY
7. 🚫 The article is NOT a conference presentation or research update (unless it announces a deal) - IF IT IS, EXCLUDE IT IMMEDIATELY
8. The deal is NOT from technology, finance, retail, energy/oil/gas, automotive, food/beverage, or other non-medical industries
9. 🚫 The deal is NOT an energy/oil/gas deal - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW - IF IT IS, EXCLUDE IT IMMEDIATELY
10. 🚫 The deal is NOT an automotive deal - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW - IF IT IS, EXCLUDE IT IMMEDIATELY
11. 🚫 The deal is NOT a food/beverage deal - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW - IF IT IS, EXCLUDE IT IMMEDIATELY (including nutraceutical deals)
12. If unsure whether a deal is medical/pharmaceutical, EXCLUDE it - only include deals that are clearly pharmaceutical/biotech/medical field related
13. 🚫 CRITICAL: If the article does NOT specifically announce a drug deal transaction, DO NOT INCLUDE IT - only actual deal announcements are acceptable
14. 🚫 CRITICAL: If the deal is from energy/oil/gas, automotive, or food/beverage industries, DO NOT INCLUDE IT - these deals MUST NEVER appear in results

Always prefer primary announcements (PR Newswire, company press releases), reputable trade publications (BioSpace, Fierce Biotech, BioPharma Dive), and verified financial press. Be thorough and comprehensive - this is your ONLY attempt, so search extensively and extract all available deals.

FINAL FILTER: Before returning any deal, verify it is STRICTLY from the medical/pharmaceutical/biotech field. 

🚫 ABSOLUTELY DO NOT INCLUDE deals from (THESE MUST NEVER APPEAR IN RESULTS):
- 🚫 Energy/oil/gas industry - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW - EXCLUDE IMMEDIATELY
- 🚫 Automotive industry - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW - EXCLUDE IMMEDIATELY
- 🚫 Food/beverage industry (including nutraceutical) - ABSOLUTELY FORBIDDEN, NEVER INCLUDE, NEVER SHOW - EXCLUDE IMMEDIATELY
- Technology industry (unless specifically for pharmaceutical/drug development)
- Finance/banking industry
- Retail industry
- Real estate industry
- Any other non-medical industries

🚫 CRITICAL: If ANY deal is from energy/oil/gas, automotive, or food/beverage industries, DO NOT include it. These deals MUST NEVER appear in results. Only medical/pharmaceutical/biotech deals are acceptable.

🚫 FINAL CHECK BEFORE OUTPUT - ABSOLUTELY VERIFY:
Before including ANY deal in the "deals" array, you MUST verify:
- This article SPECIFICALLY ANNOUNCES a drug deal transaction (NOT just general medical news) - IF IT DOES NOT, EXCLUDE IT IMMEDIATELY
- This article is NOT a general medical news article (symptoms, health tips, disease info) - IF IT IS, EXCLUDE IT IMMEDIATELY
- This article is NOT an educational article (medical education, exams, training) - IF IT IS, EXCLUDE IT IMMEDIATELY
- This article is NOT a list/ranking article (influential people, top doctors) - IF IT IS, EXCLUDE IT IMMEDIATELY
- This article is NOT a conference presentation (unless it announces a deal) - IF IT IS, EXCLUDE IT IMMEDIATELY
- This deal is NOT from energy/oil/gas industry - IF IT IS, EXCLUDE IT IMMEDIATELY
- This deal is NOT from automotive industry - IF IT IS, EXCLUDE IT IMMEDIATELY  
- This deal is NOT from food/beverage industry - IF IT IS, EXCLUDE IT IMMEDIATELY
- This deal IS from pharmaceutical/biotech/medical field - IF IT IS NOT, EXCLUDE IT IMMEDIATELY

If ANY deal in your results is:
- A general news article (NOT a deal announcement) - REMOVE IT COMPLETELY
- From energy/oil/gas, automotive, or food/beverage industries - REMOVE IT COMPLETELY
- An educational article, list, or conference presentation (without deal announcement) - REMOVE IT COMPLETELY

These types of articles MUST NEVER appear in the results. Only actual drug deal announcements are acceptable.

Return a strictly valid JSON object with exactly these top-level fields: "narrative", "deals", "sources".
- "narrative": Brief 2-3 paragraph summary of the drug deal activity found. Mention source names in [square brackets].
- "deals": array (${MIN_DEALS_TARGET}-${MAX_DEALS_TARGET} unique items) of objects. Each deal MUST include: buyer (Buyer/Licensee company name - MUST be actual company name, NOT "Not disclosed" or "Undisclosed"), seller (Seller/Licensor company name - MUST be actual company name, NOT "Not disclosed" or "Undisclosed"), drugName (specific drug/candidate name - MUST be actual drug name, NOT "Undisclosed" or "N/A"), therapeuticArea (indication/disease area - MUST be actual disease/condition name, NOT "N/A"), stage (Preclinical/Phase I/Phase II/Phase III/Marketed - actual stage if available), financials (upfront, milestones, total value - actual financial terms if available), dealDate (🚨 CRITICAL: ISO-8601 date format YYYY-MM-DD - MUST be the EXACT publication date from the article. DO NOT use today's date (${currentDateStr}). DO NOT use current date. You MUST extract the actual date from the article - look for dates in the article text like "Dec 7, 2022", "December 7, 2022", "2022-12-07", or dates in article metadata/URL. The dealDate MUST be the date when the article was published, NOT when you are reading it. Format: YYYY-MM-DD. Example: If article says "Dec 7, 2022", use "2022-12-07". If article says "Nov 15, 2025", use "2025-11-15". The dealDate MUST be between ${minDateStr} and ${currentDateStr}. DO NOT include deals with dates before ${minDateStr} or after ${currentDateStr}), title (deal headline - MUST be actual headline from article), summary (1-2 sentence deal description - MUST be actual description from article), sourceUrl (HTTPS article URL - MUST be actual URL), source (publication name - MUST be actual publication name). 

🚨 CRITICAL DATA EXTRACTION REQUIREMENTS:
- Extract ACTUAL data from articles whenever possible
- DO NOT use placeholder values like "Not disclosed", "Undisclosed", "N/A", "Unknown" - if data is not available, leave the field empty
- buyer and seller: Extract actual company names if mentioned in the article, otherwise leave empty
- drugName: Extract actual drug/candidate name if mentioned, otherwise leave empty
- therapeuticArea: Extract actual disease/indication if mentioned, otherwise leave empty
- IMPORTANT: Include deals even if some fields are empty - as long as the deal is REAL and has a valid title/summary, include it
- Only exclude deals if they are NOT actual drug deal announcements (e.g., general news, educational articles, etc.)
- It's better to include a deal with partial data than to exclude it completely

🚨 CRITICAL DATE EXTRACTION REQUIREMENTS:
- Extract the EXACT publication date from each article - look for dates in article text, metadata, or URL
- DO NOT use today's date (${currentDateStr}) - this is WRONG
- DO NOT use current date - this is WRONG  
- DO NOT guess the date - extract it from the article
- Look for date patterns in article: "Dec 7, 2022", "December 7, 2022", "2022-12-07", "Nov 15, 2025", etc.
- Convert dates to ISO format: YYYY-MM-DD (e.g., "Dec 7, 2022" → "2022-12-07")
- If article date is outside ${timeframeLabel} (${minDateStr} to ${currentDateStr}), DO NOT include that deal
- Example: If article says "Dec 7, 2022" but you're searching for deals from ${timeframeLabel}, exclude it because 2022 is outside the date range
- Only include deals with dates between ${minDateStr} and ${currentDateStr}

Ensure dates are within ${timeframeLabel} (${minDateStr} to ${currentDateStr}). Do not reuse the same article, URL, or title. NEVER use today's date or current date - always extract the actual article publication date, but ONLY if it falls within the date range.
- "sources": array of objects with keys name, url, note.

Only output valid JSON that matches this shape—no markdown fences or extra commentary. 

🚨 FINAL REMINDER - ABSOLUTELY CRITICAL: You MUST return AT LEAST ${MIN_DEALS_TARGET} deals (ideally ${MAX_DEALS_TARGET}) in the "deals" array. 
- Returning only 3-5 deals is COMPLETELY UNACCEPTABLE
- Returning only 10 deals is NOT ENOUGH
- This is NOT optional - you MUST find ${MIN_DEALS_TARGET}-${MAX_DEALS_TARGET} deals
- If you only find a few deals, you MUST search MORE sources, use MORE keywords, try MORE search variations
- Search EVERY source listed (PR Newswire, Business Wire, BioSpace, Fierce Biotech, BioPharma Dive, Reuters, GlobeNewswire) MULTIPLE times
- Search by different months, different companies, different therapeutic areas
- DO NOT stop until you have found at least ${MIN_DEALS_TARGET} unique drug deals
- The minimum is ${MIN_DEALS_TARGET} deals - returning fewer is a FAILURE 

CRITICAL PRIORITY: 
- Focus on finding the LATEST and MOST RECENT deals first - deals from ${currentMonth} ${currentYear} and recent months (${monthsInRange.join(', ')})
- Do NOT return old deals from months outside ${monthsInRange.join(', ')}
- ONLY include deals with dates between ${minDateStr} and ${currentDateStr}
- EXCLUDE any deals with dates before ${minDateStr}
- Search for "latest", "recent", "newest" deals first, then work backwards within the date range
- Search more sources, use different keywords, search by month (starting with ${currentMonth} ${currentYear}), search by company - do whatever it takes to find ${MIN_DEALS_TARGET}-${MAX_DEALS_TARGET} unique drug deals from ${timeframeLabel} (${minDateStr} to ${currentDateStr}), with emphasis on the most recent ones

User query: ${searchQuery}`.trim();

    const jsonSchema = {
      name: 'DealScraperResponse',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          narrative: {
            type: 'string',
            minLength: 20,
            description: 'Conversational multi-paragraph answer in natural language with inline source brackets.'
          },
          deals: {
            type: 'array',
            minItems: 1,
            maxItems: MAX_DEALS_TARGET,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                buyer: { type: 'string', default: '' },
                seller: { type: 'string', default: '' },
                drugName: { type: 'string', default: '' },
                therapeuticArea: { type: 'string', default: '' },
                stage: { type: 'string', default: '' },
                financials: { type: 'string', default: '' },
                dealDate: { type: 'string', minLength: 4 },
                title: { type: 'string' },
                summary: { type: 'string' },
                source: { type: 'string' },
                sourceUrl: { type: 'string' },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  default: []
                }
              },
              required: ['buyer', 'seller', 'drugName', 'therapeuticArea', 'stage', 'financials', 'dealDate', 'title', 'summary', 'source', 'sourceUrl', 'tags']
            }
          },
          sources: {
            type: 'array',
            minItems: 0,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                url: { type: 'string' },
                note: { type: 'string' }
              },
              required: ['name', 'url', 'note']
            }
          }
        },
        required: ['narrative', 'deals', 'sources']
      }
    };

    const ensureIsoDate = (value, sourceUrl = '') => {
      if (!value || value.trim() === '') {
        console.warn('⚠️ Missing dealDate, attempting to extract from URL or using empty:', sourceUrl);
        // Try to extract date from URL if it contains date patterns
        const urlDateMatch = sourceUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})/);
        if (urlDateMatch) {
          return `${urlDateMatch[1]}-${urlDateMatch[2]}-${urlDateMatch[3]}`;
        }
        // Return empty string instead of today's date to avoid confusion
        return '';
      }

      // Try parsing as Date object
      const parsedDate = new Date(value);
      if (!Number.isNaN(parsedDate.getTime())) {
        const isoDate = parsedDate.toISOString().split('T')[0];
        // Validate date is not in the future (more than 1 day ahead)
        const today = new Date();
        const maxFutureDate = new Date(today);
        maxFutureDate.setDate(today.getDate() + 1);
        if (parsedDate > maxFutureDate) {
          console.warn('⚠️ Date is in the future, using empty:', value, 'from', sourceUrl);
          return '';
        }
        return isoDate;
      }

      // Try ISO format match
      const isoMatch = /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value.trim());
      if (isoMatch) {
        const dateStr = value.trim().split('T')[0];
        // Validate it's not in the future
        const parsed = new Date(dateStr);
        const today = new Date();
        const maxFutureDate = new Date(today);
        maxFutureDate.setDate(today.getDate() + 1);
        if (parsed > maxFutureDate) {
          console.warn('⚠️ ISO date is in the future, using empty:', value, 'from', sourceUrl);
          return '';
        }
        return dateStr;
      }

      console.warn('⚠️ Invalid date format, using empty:', value, 'from', sourceUrl);
      return '';
    };

    // Multiple attempts to get more deals (up to 3 attempts)
    const allDeals = [];
    const allSources = [];
    let finalNarrative = '';
    const seenDealKeys = new Set();
    
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`🔄 Attempt ${attempt} of ${MAX_ATTEMPTS}...`);
      
      // Early return if we already have enough deals
      if (allDeals.length >= MIN_DEALS_TARGET && attempt > 1) {
        console.log(`✅ Already have ${allDeals.length} deals, skipping remaining attempts`);
        break;
      }
      
      try {
        // Add timeout to prevent hanging (60 seconds max per attempt)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API timeout after 60 seconds')), 60000)
        );
        
        const apiPromise = openaiClient.responses.create({
          model: 'gpt-4o',
          input: basePrompt,
          tools: [{ type: 'web_search' }],
          max_output_tokens: 8000, // Reduced from 12000 for faster processing
          temperature: 0.2,
          text: {
            format: {
              name: jsonSchema.name,
              type: 'json_schema',
              schema: jsonSchema.schema
            }
          },
          metadata: {
            feature: 'ai_deal_scraper',
            userEmail,
            attempt: attempt.toString()
          }
        });
        
        const response = await Promise.race([apiPromise, timeoutPromise]);

        let rawOutput = extractResponseText(response);

        if (!rawOutput) {
          console.warn(`⚠️ Attempt ${attempt}: OpenAI response had no text payload.`);
          continue; // Try next attempt
        }

        rawOutput = rawOutput.trim();
        console.log(`📦 Attempt ${attempt} - OpenAI raw output (first 500 chars):`, rawOutput.substring(0, 500));

        const sanitized = rawOutput
          .replace(/^```json\s*/i, '')
          .replace(/^```json-schema\s*/i, '')
          .replace(/^```js\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();

        let parsed = null;
        try {
          parsed = JSON.parse(sanitized);
        } catch (jsonError) {
          console.error(`❌ Attempt ${attempt}: Error parsing JSON:`, jsonError.message);
          continue; // Try next attempt
        }

        const dealsArray = Array.isArray(parsed?.deals) ? parsed.deals : [];
        console.log(`✅ Attempt ${attempt}: Found ${dealsArray.length} deals`);
        
        // Collect narrative from first successful attempt
        if (attempt === 1 && parsed?.narrative) {
          finalNarrative = parsed.narrative;
        }
        
        // Collect sources
        if (Array.isArray(parsed?.sources)) {
          allSources.push(...parsed.sources);
        }

        // Normalize deals from this attempt
        const normalizedDeals = dealsArray.map((deal) => {
      const sourceUrl = deal.sourceUrl || deal.url || '';
      let domain = 'openai_web_search';
      if (sourceUrl) {
        try {
          domain = new URL(sourceUrl).hostname.replace(/^www\./i, '');
        } catch (urlError) {
          domain = 'openai_web_search';
        }
      }

      // Clean up placeholder values
      const cleanValue = (value) => {
        if (!value || typeof value !== 'string') return '';
        const cleaned = value.trim();
        // Reject placeholder values
        const placeholders = ['not disclosed', 'undisclosed', 'n/a', 'na', 'unknown', 'tbd', 'to be determined', 'not available'];
        if (placeholders.some(p => cleaned.toLowerCase() === p)) {
          return '';
        }
        return cleaned;
      };

      return {
        buyer: cleanValue(deal.buyer || deal.acquirer || ''),
        seller: cleanValue(deal.seller || deal.partner || ''),
        drugName: cleanValue(deal.drugName || deal.asset || ''),
        therapeuticArea: cleanValue(deal.therapeuticArea || deal.indication || ''),
        stage: cleanValue(deal.stage || ''),
        financials: cleanValue(deal.financials || deal.value || ''),
        totalValue: cleanValue(deal.totalValue || deal.financials || deal.value || ''),
        dealDate: ensureIsoDate(deal.dealDate || deal.date || '', sourceUrl),
        source: deal.source || deal.sourceName || domain || 'OpenAI Web Search',
        sourceId: domain || 'openai_web_search',
        sourceUrl,
        title: deal.title || `${deal.buyer || 'Deal'} - ${deal.seller || 'Counterparty'}`,
        summary: deal.summary || deal.overview || '',
        rawText: deal.rawText || deal.summary || '',
        tags: Array.isArray(deal.tags) ? deal.tags : [],
        searchQuery,
        userEmail
      };
    }).filter((deal) => {
      // Clean placeholder values but don't reject the deal if it has other valid data
      // Only reject if ALL critical fields are placeholders or empty
      
      // Check if critical fields have real data (not placeholders)
      const hasRealBuyer = deal.buyer && !deal.buyer.toLowerCase().includes('not disclosed') && !deal.buyer.toLowerCase().includes('undisclosed') && deal.buyer.trim().length > 0;
      const hasRealSeller = deal.seller && !deal.seller.toLowerCase().includes('not disclosed') && !deal.seller.toLowerCase().includes('undisclosed') && deal.seller.trim().length > 0;
      const hasRealDrug = deal.drugName && !deal.drugName.toLowerCase().includes('undisclosed') && deal.drugName.trim().length > 0;
      const hasRealTherapeuticArea = deal.therapeuticArea && deal.therapeuticArea.toLowerCase() !== 'n/a' && deal.therapeuticArea.toLowerCase() !== 'na' && deal.therapeuticArea.trim().length > 0;
      const hasRealTitle = deal.title && deal.title.trim().length > 0;
      const hasRealSummary = deal.summary && deal.summary.trim().length > 0;
      
      // Require at least 2 fields with real data OR a valid title + summary
      const realDataCount = [hasRealBuyer, hasRealSeller, hasRealDrug, hasRealTherapeuticArea].filter(Boolean).length;
      const hasMinimumData = realDataCount >= 2 || (hasRealTitle && hasRealSummary);
      
      // Only reject if deal has no meaningful data at all
      if (!hasMinimumData && !hasRealTitle) {
        console.log(`⚠️ Filtered out deal with insufficient data:`, deal.title);
        return false;
      }
      
      // CRITICAL: If searchQuery is provided, filter deals to only include those where the disease is mentioned in indication/therapeutic area
      // Do NOT include deals where the disease keyword appears only in company names or other fields
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = searchQuery.toLowerCase().trim();
        const therapeuticAreaLower = (deal.therapeuticArea || '').toLowerCase();
        const summaryLower = (deal.summary || '').toLowerCase();
        const titleLower = (deal.title || '').toLowerCase();
        const drugNameLower = (deal.drugName || '').toLowerCase();
        
        // Check if disease is mentioned in indication/therapeutic area (primary check - MOST IMPORTANT)
        const diseaseInIndication = therapeuticAreaLower.includes(searchTerm);
        
        // Also check summary and title for disease mention (secondary check)
        const diseaseInSummary = summaryLower.includes(searchTerm);
        const diseaseInTitle = titleLower.includes(searchTerm);
        
        // Exclude if disease appears ONLY in company names (buyer/seller) but NOT in indication/summary/title
        const buyerLower = (deal.buyer || '').toLowerCase();
        const sellerLower = (deal.seller || '').toLowerCase();
        const diseaseInCompanyName = buyerLower.includes(searchTerm) || sellerLower.includes(searchTerm);
        
        // Exclude if disease appears ONLY in drug name but NOT in indication
        const diseaseInDrugName = drugNameLower.includes(searchTerm);
        
        // CRITICAL: Only include if disease is mentioned in indication/therapeutic area OR summary/title
        // Exclude if disease appears ONLY in company names or drug names
        if (diseaseInCompanyName && !diseaseInIndication && !diseaseInSummary && !diseaseInTitle) {
          console.log(`⚠️ Filtered out deal - disease "${searchTerm}" found only in company name, not in indication:`, deal.title, `| Indication: ${deal.therapeuticArea}`);
          return false;
        }
        
        // Exclude if disease appears only in drug name but not in indication
        if (diseaseInDrugName && !diseaseInIndication && !diseaseInSummary && !diseaseInTitle) {
          console.log(`⚠️ Filtered out deal - disease "${searchTerm}" found only in drug name, not in indication:`, deal.title, `| Indication: ${deal.therapeuticArea}`);
          return false;
        }
        
        // If disease is not mentioned in indication/therapeutic area, summary, or title, exclude it
        if (!diseaseInIndication && !diseaseInSummary && !diseaseInTitle) {
          console.log(`⚠️ Filtered out deal - disease "${searchTerm}" not found in indication/summary/title:`, deal.title, `| Indication: ${deal.therapeuticArea}`);
          return false;
        }
      }
      
      return true;
    });

    console.log(`📊 Attempt ${attempt} - Parsed deals:`, normalizedDeals.length);

    // Deduplicate and aggregate deals from this attempt
    for (const deal of normalizedDeals) {
      const key = `${(deal.sourceUrl || '').toLowerCase()}|${(deal.title || '').toLowerCase()}`;
      if (key.trim() && !seenDealKeys.has(key)) {
        seenDealKeys.add(key);
        allDeals.push(deal);
      }
    }
    
    console.log(`📊 Attempt ${attempt} - Total unique deals so far: ${allDeals.length}`);
    
    // If we have enough deals, we can stop early
    if (allDeals.length >= MIN_DEALS_TARGET) {
      console.log(`✅ Reached target of ${MIN_DEALS_TARGET} deals after ${attempt} attempts. Stopping.`);
      break;
    }
    
      } catch (attemptError) {
        console.error(`❌ Attempt ${attempt} failed:`, attemptError.message);
        // Continue to next attempt
        continue;
      }
    }
    
    console.log(`🎯 Final result: ${allDeals.length} unique deals from ${MAX_ATTEMPTS} attempts`);

    // Deduplicate sources
    const aggregatedSources = new Map();
    for (const source of allSources) {
      const sourceKey = `${source.name || ''}|${source.url || ''}`;
      if (!aggregatedSources.has(sourceKey)) {
        aggregatedSources.set(sourceKey, {
          name: source.name || 'OpenAI Web Search',
          url: source.url || '',
          note: source.note || ''
        });
      }
    }

    console.log(`✅ Total unique deals found: ${allDeals.length}`);

    // Filter deals by date range (remove old deals outside the range)
    const filterToday = new Date();
    const filterMinDate = new Date(filterToday);
    filterMinDate.setDate(filterToday.getDate() - dateRangeDays);
    filterMinDate.setHours(0, 0, 0, 0);
    
    const filteredDeals = allDeals.filter((deal) => {
      // If no date, include the deal (don't filter it out - let it through)
      if (!deal.dealDate) {
        console.log(`⚠️ Deal without date included: ${deal.title}`);
        return true;
      }
      
      try {
        const dealDate = new Date(deal.dealDate);
        if (isNaN(dealDate.getTime())) {
          // Invalid date - include the deal anyway
          console.log(`⚠️ Deal with invalid date included: ${deal.dealDate} - ${deal.title}`);
          return true;
        }
        
        dealDate.setHours(0, 0, 0, 0);
        
        // Only include deals within the date range
        const isWithinRange = dealDate >= filterMinDate && dealDate <= filterToday;
        
        if (!isWithinRange) {
          console.log(`⚠️ Filtered out deal outside date range: ${deal.dealDate} - ${deal.title}`);
        }
        
        return isWithinRange;
      } catch (error) {
        // If date parsing fails, include the deal anyway
        console.log(`⚠️ Deal with date parsing error included: ${deal.dealDate} - ${deal.title}`);
        return true;
      }
    });

    console.log(`✅ Deals after date filtering: ${filteredDeals.length} (removed ${allDeals.length - filteredDeals.length} old deals)`);

    // If we don't have enough deals within the date range, include deals from current year
    if (filteredDeals.length < MIN_DEALS_TARGET) {
      console.log(`⚠️ Only ${filteredDeals.length} deals found within ${dateRangeDays} days, expanding to current year...`);
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1); // January 1st of current year
      
      const additionalDeals = allDeals.filter((deal) => {
        if (!deal.dealDate) return false;
        
        try {
          const dealDate = new Date(deal.dealDate);
          if (isNaN(dealDate.getTime())) return false;
          
          // Include deals from current year that weren't already included
          const isInCurrentYear = dealDate >= yearStart && dealDate <= filterToday;
          const alreadyIncluded = filteredDeals.some(d => 
            d.sourceUrl === deal.sourceUrl && d.title === deal.title
          );
          
          return isInCurrentYear && !alreadyIncluded;
        } catch (error) {
          return false;
        }
      });
      
      filteredDeals.push(...additionalDeals);
      console.log(`✅ Added ${additionalDeals.length} deals from current year. Total: ${filteredDeals.length}`);
    }

    // Sort deals by date (most recent first)
    filteredDeals.sort((a, b) => {
      const dateA = a.dealDate ? new Date(a.dealDate) : new Date(0);
      const dateB = b.dealDate ? new Date(b.dealDate) : new Date(0);
      return dateB - dateA; // Most recent first
    });

    return {
      deals: filteredDeals.slice(0, MAX_DEALS_TARGET),
      sources: Array.from(aggregatedSources.values()),
      narrative: finalNarrative
    };
  } catch (error) {
    console.error('Error fetching deals via OpenAI:', error?.response?.data || error.message || error);
    return { deals: [], sources: [] };
  }
}

// ============================================================================
// AUTO-CUT SUBSCRIPTION FUNCTIONS
// ============================================================================

// 1. CREATE CUSTOMER WITH PAYMENT METHOD
async function createCustomerWithPaymentMethod(customerData) {
  try {
    console.log('🔧 Creating customer with payment method...');
    
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      metadata: {
        userId: customerData.userId,
        planId: customerData.planId
      }
    });
    
    console.log('✅ Customer created:', customer.id);
    return customer;
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    throw error;
  }
}

// 2. ATTACH PAYMENT METHOD TO CUSTOMER
async function attachPaymentMethodToCustomer(customerId, paymentMethodId) {
  try {
    console.log('🔧 Attaching payment method to customer...');
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    
    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    console.log('✅ Payment method attached and set as default');
    return true;
  } catch (error) {
    console.error('❌ Error attaching payment method:', error);
    throw error;
  }
}

// 3. CREATE SUBSCRIPTION WITH AUTO-RENEWAL
async function createSubscriptionWithAutoRenewal(customerId, priceId, paymentMethodId) {
  try {
    console.log('🔧 Creating subscription with auto-renewal...');
    
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      trial_period_days: 1, // First day free, billing starts from day 2
      expand: ['latest_invoice.payment_intent'],
    });
    
    console.log('✅ Subscription created:', subscription.id);
    console.log('📊 Subscription status:', subscription.status);
    
    return subscription;
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    throw error;
  }
}

// 4. COMPLETE SUBSCRIPTION SETUP
async function completeSubscriptionSetup(subscriptionId) {
  try {
    console.log('🔧 Completing subscription setup...');
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.status === 'incomplete') {
      // If subscription is incomplete, we need to handle the payment
      const latestInvoice = subscription.latest_invoice;
      
      if (latestInvoice && latestInvoice.payment_intent) {
        const paymentIntent = latestInvoice.payment_intent;
        
        if (paymentIntent.status === 'requires_payment_method') {
          console.log('⚠️ Payment method required for subscription');
          return { status: 'requires_payment_method', subscription };
        }
        
        if (paymentIntent.status === 'requires_confirmation') {
          await stripe.paymentIntents.confirm(paymentIntent.id);
          console.log('✅ Payment intent confirmed for subscription');
        }
      }
    }
    
    console.log('✅ Subscription setup completed');
    return subscription;
  } catch (error) {
    console.error('❌ Error completing subscription setup:', error);
    throw error;
  }
}
// 5. MAIN FUNCTION - COMPLETE AUTO-CUT SETUP
async function setupAutoCutSubscription(userData, paymentMethodId, priceId) {
  try {
    console.log('🚀 Starting Auto-Cut Subscription Setup...');
    console.log('==========================================');
    
    // Step 1: Create customer
    const customer = await createCustomerWithPaymentMethod({
      email: userData.email,
      name: userData.name,
      userId: userData.id,
      planId: userData.planId
    });
    
    // Step 2: Create price if not provided
    if (!priceId) {
      console.log('📝 Creating price for daily-12 plan...');
      const product = await stripe.products.create({
        name: 'Daily Test Plan (12 days)',
        description: '12-day subscription with daily $1 charges'
      });
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 100, // $1.00 in cents
        currency: 'usd',
        recurring: {
          interval: 'day',
          interval_count: 1
        }
      });
      
      priceId = price.id;
      console.log('✅ Price created:', priceId);
    }
    
    // Step 3: Attach payment method (if provided)
    if (paymentMethodId) {
      await attachPaymentMethodToCustomer(customer.id, paymentMethodId);
    }
    
    // Step 4: Create subscription
    const subscription = await createSubscriptionWithAutoRenewal(customer.id, priceId, paymentMethodId);
    
    // Step 5: Complete subscription if needed
    if (subscription.status === 'incomplete') {
      console.log('🔄 Subscription is incomplete, attempting to complete...');
      
      try {
        // Get the latest invoice and confirm the payment intent
        const latestInvoice = subscription.latest_invoice;
        if (latestInvoice && latestInvoice.payment_intent) {
          const paymentIntent = latestInvoice.payment_intent;
          console.log('💳 Payment intent status:', paymentIntent.status);
          
          if (paymentIntent.status === 'requires_confirmation') {
            const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id);
            console.log('✅ Payment intent confirmed, status:', confirmedPaymentIntent.status);
          } else if (paymentIntent.status === 'requires_payment_method') {
            console.log('⚠️ Payment method required, but we already attached one');
            // Try to confirm with the attached payment method
            const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
              payment_method: paymentMethodId
            });
            console.log('✅ Payment intent confirmed with payment method, status:', confirmedPaymentIntent.status);
          }
        }
        
        // Wait a moment for Stripe to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retrieve the updated subscription
        const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id);
        console.log('📊 Updated subscription status:', updatedSubscription.status);
        
        if (updatedSubscription.status === 'active') {
          console.log('🎉 Subscription is now active!');
          subscription = updatedSubscription;
        } else {
          console.log('⚠️ Subscription still incomplete, but payment method is saved for future use');
        }
      } catch (error) {
        console.error('❌ Error completing subscription:', error);
        // Continue anyway, subscription might still work
      }
    }
    
    console.log('🎉 Auto-Cut Setup Complete!');
    console.log('============================');
    console.log('✅ Customer created and payment method attached');
    console.log('✅ Subscription created with auto-renewal');
    console.log('✅ Future payments will be automatic');
    
    // Check if subscription is actually active
    const isActive = subscription.status === 'active';
    const needsPayment = subscription.status === 'incomplete';
    
    return {
      success: isActive,
      customer: customer,
      subscription: subscription,
      message: isActive ? 'Auto-cut setup completed successfully' : 'Subscription created but payment incomplete - 3D Secure authentication required',
      needsPayment: needsPayment,
      subscriptionStatus: subscription.status
    };
    
  } catch (error) {
    console.error('❌ Auto-Cut Setup Failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Auto-cut setup failed'
    };
  }
}

// Log Stripe configuration
console.log('🔧 Stripe configuration:');
console.log('  - Secret key available:', !!stripeSecretKey);
console.log('  - Stripe initialized:', !!stripe);
console.log('  - Using live key:', stripeSecretKey ? stripeSecretKey.includes('sk_live_') : false);

const RAW_ALLOWED_ORIGINS = [
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3005',
    'http://localhost:3006',
  'null',
    'https://thebioping.com',
  'https://www.thebioping.com'
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (RAW_ALLOWED_ORIGINS.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname === 'localhost') return true;
    if (hostname.endsWith('.onrender.com')) return true;
    if (hostname.endsWith('.render.com')) return true;
    if (hostname.endsWith('thebioping.com')) return true;
  } catch (error) {
    console.warn('⚠️ Unable to parse origin for CORS check:', origin, error.message);
  }

  return false;
};

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn('🚫 Blocked CORS origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma']
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});
// Webhook for Stripe events - MUST BE BEFORE express.json() middleware
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // It's crucial to load the webhook secret from environment variables for security.
  // Do not hardcode secrets in production. If the environment variable is not set,
  // the webhook verification will correctly fail, indicating a configuration issue.
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('🔔 Webhook received - Debug Info:');
  console.log('📧 Signature:', sig ? 'Present' : 'Missing');
  console.log('🔑 Endpoint Secret:', endpointSecret ? 'Set' : 'Missing');
  console.log('📦 Body length:', req.body ? req.body.length : 'No body');

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verification successful');
  } catch (err) {
    console.log('❌ Webhook signature verification failed:', err.message);
    console.log('🔍 Debug - Expected secret:', endpointSecret);
    console.log('🔍 Debug - Received signature:', sig);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Webhook received:', event.type);

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Payment succeeded:', paymentIntent.id);
      console.log('Payment details:', {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customer: paymentIntent.customer,
        customerEmail: paymentIntent.metadata?.customerEmail,
        planId: paymentIntent.metadata?.planId,
        status: paymentIntent.status
      });
      
      // Get customer email from metadata or retrieve from Stripe
      let customerEmail = paymentIntent.metadata?.customerEmail;
      
      if (!customerEmail && paymentIntent.customer) {
        try {
          const customer = await stripe.customers.retrieve(paymentIntent.customer);
          customerEmail = customer.email;
          console.log('📧 Retrieved customer email from Stripe:', customerEmail);
        } catch (error) {
          console.log('⚠️ Could not retrieve customer email:', error.message);
        }
      }
      
      if (customerEmail) {
        console.log('📧 Processing payment for customer:', customerEmail);
        
        try {
          // Try to update in MongoDB first
          const User = require('./models/User');
          const planId = paymentIntent.metadata?.planId || 'monthly';
          
          // Calculate credits based on plan - EXACT credits for each plan
          let credits = 5; // default for free plan
          console.log('💳 Calculating credits for plan:', planId);
          
          if (planId === 'daily-12') {
            credits = 50;
          } else if (planId === 'monthly') {
            credits = 50; // Monthly plan
          } else if (planId === 'annual') {
            credits = 100; // Annual plan
          } else if (planId === 'basic') {
            credits = 50;
          } else if (planId === 'premium') {
            credits = 100;
          } else if (planId === 'simple-1') {
            credits = 50;
          } else if (planId === 'basic-yearly') {
            credits = 50;
          } else if (planId === 'premium-yearly') {
            credits = 100;
          } else if (planId === 'test') {
            credits = 1;
          }
          
          console.log('💳 Credits assigned for plan', planId, ':', credits);
          
          // Check if this is a subscription payment
          const isSubscriptionPayment = planId === 'daily-12' || planId === 'yearly' || planId === 'basic-yearly' || planId === 'premium-yearly';
          
          if (isSubscriptionPayment) {
            console.log('🔄 Processing subscription payment for:', customerEmail);
            
            // Update subscription status to active
            const updateData = {
              paymentCompleted: true,
              currentPlan: planId,
              paymentUpdatedAt: new Date(),
              currentCredits: credits,
              subscriptionStatus: 'active',
              lastPaymentDate: new Date(),
              autoRenewal: true
            };
            
            // For daily subscriptions, set up renewal schedule
            if (planId === 'daily-12') {
              updateData.nextCreditRenewal = new Date(Date.now() + 24 * 60 * 60 * 1000);
              updateData.subscriptionEndAt = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000);
            }
            
            const updatedUser = await User.findOneAndUpdate(
              { email: customerEmail },
              updateData,
              { new: true, maxTimeMS: 10000 }
            );
            
            if (updatedUser) {
              console.log('✅ MongoDB subscription payment processed for:', customerEmail);
            }
          } else {
            // One-time payment processing
            console.log('💳 Processing one-time payment for:', customerEmail);
          
          const updatedUser = await User.findOneAndUpdate(
            { email: customerEmail },
            {
              paymentCompleted: true,
              currentPlan: planId,
              paymentUpdatedAt: new Date(),
              currentCredits: credits,
              lastPaymentIntent: paymentIntent.id,
              lastPaymentAmount: paymentIntent.amount,
              lastPaymentDate: new Date()
            },
            { new: true }
          );
          
          if (updatedUser) {
            console.log('✅ User payment status updated in MongoDB:', customerEmail);
            console.log('📝 Updated user details:', {
              email: updatedUser.email,
              currentPlan: updatedUser.currentPlan,
              currentCredits: updatedUser.currentCredits,
              paymentCompleted: updatedUser.paymentCompleted
            });
          } else {
            console.log('⚠️ User not found in MongoDB, updating file storage...');
            // Fallback to file-based storage
            const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
            if (userIndex !== -1) {
              mockDB.users[userIndex].paymentCompleted = true;
              mockDB.users[userIndex].currentPlan = planId;
              mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
              mockDB.users[userIndex].currentCredits = credits;
              mockDB.users[userIndex].lastPaymentIntent = paymentIntent.id;
              mockDB.users[userIndex].lastPaymentAmount = paymentIntent.amount;
              mockDB.users[userIndex].lastPaymentDate = new Date().toISOString();
              saveDataToFilesImmediate('payment_succeeded');
              console.log('✅ User payment status updated in file storage');
            } else {
              console.log('⚠️ User not found in database:', customerEmail);
            }
            }
          }
        } catch (error) {
          console.error('❌ Error updating user payment status:', error);
          // Fallback to file-based storage
          const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
          if (userIndex !== -1) {
            mockDB.users[userIndex].paymentCompleted = true;
            mockDB.users[userIndex].currentPlan = paymentIntent.metadata.planId || 'monthly';
            mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
            // Set credits based on plan
            if (paymentIntent.metadata.planId === 'daily-12') {
              mockDB.users[userIndex].currentCredits = 50;
            }
            saveDataToFilesImmediate('payment_succeeded');
            console.log('✅ User payment status updated in file storage (fallback)');
          }
        }
      }
      
      // Generate automatic invoice for successful payment
      let invoiceResult = null;
      try {
        const customerEmail = paymentIntent.receipt_email || paymentIntent.customer_details?.email || paymentIntent.metadata?.customerEmail;
        const planId = paymentIntent.metadata?.planId || 'monthly';
        
        if (customerEmail) {
          console.log('🎯 Triggering automatic invoice generation...');
          invoiceResult = await generateAutomaticInvoice(paymentIntent, customerEmail, planId);
        } else {
          console.log('⚠️ No customer email found for invoice generation');
        }
      } catch (invoiceError) {
        console.error('❌ Error generating automatic invoice:', invoiceError);
      }
      
      // Send payment confirmation email
      try {
        const customerEmail = paymentIntent.receipt_email || paymentIntent.customer_details?.email || paymentIntent.metadata?.customerEmail;
        if (customerEmail) {
          // Check if invoice PDF is available
          const hasInvoicePDF = invoiceResult && invoiceResult.pdfBuffer;
          
          const mailOptions = {
            to: customerEmail,
            subject: hasInvoicePDF ? 'BioPing - Payment Confirmation & Invoice' : 'BioPing - Payment Confirmation',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Payment Confirmation</p>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #333; margin-bottom: 20px;">Payment Successful!</h2>
                  <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                    Thank you for your payment! Your transaction has been processed successfully.
                  </p>
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <div style="display: flex; justify-content: between; margin-bottom: 10px;">
                      <span style="font-weight: bold;">Amount:</span>
                      <span>$${(paymentIntent.amount / 100).toFixed(2)} USD</span>
                    </div>
                    <div style="display: flex; justify-content: between; margin-bottom: 10px;">
                      <span style="font-weight: bold;">Transaction ID:</span>
                      <span style="font-family: monospace;">${paymentIntent.id}</span>
                    </div>
                    <div style="display: flex; justify-content: between;">
                      <span style="font-weight: bold;">Date:</span>
                      <span>${new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    ${hasInvoicePDF 
                      ? '<strong>📎 Your invoice is attached to this email as a PDF.</strong><br>It is also available in your account dashboard.' 
                      : 'Your invoice is available in your account dashboard.'
                    } If you have any questions, please contact our support team.
                  </p>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px;">
                      Best regards,<br>
                      The BioPing Team
                    </p>
                  </div>
                </div>
              </div>
            `
          };
          
          // Attach invoice PDF if available
          if (hasInvoicePDF) {
            const attachments = [{
              filename: `BioPing-Invoice-${invoiceResult.invoiceData.id}.pdf`,
              content: invoiceResult.pdfBuffer
            }];
            await sendEmail(mailOptions.to, mailOptions.subject, mailOptions.html, null, attachments);
            console.log('✅ Payment confirmation email with invoice PDF sent to:', customerEmail);
          } else {
            await sendEmail(mailOptions.to, mailOptions.subject, mailOptions.html);
            console.log('✅ Payment confirmation email sent to:', customerEmail);
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending payment confirmation email:', emailError);
      }
      break;
      
    case 'invoice.payment_succeeded':
      const paidInvoice = event.data.object;
      console.log('✅ Invoice payment succeeded:', paidInvoice.id);
      try {
        const subId = paidInvoice.subscription;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const cust = await stripe.customers.retrieve(sub.customer);
          const email = cust.email;
          const idx = mockDB.users.findIndex(u => u.email === email);
          if (idx !== -1) {
            mockDB.users[idx].subscriptionOnHold = false;
            if (mockDB.users[idx].currentPlan === 'daily-12') {
              mockDB.users[idx].currentCredits = 50;
              mockDB.users[idx].nextCreditRenewal = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
              saveDataToFiles('daily_subscription_paid');
            }
          }
        }
      } catch (e) { console.log('paid update error:', e.message); }
      break;
      
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('❌ Invoice payment failed:', failedInvoice.id);
      console.log('Invoice details:', {
        customer: failedInvoice.customer,
        customerEmail: failedInvoice.customer_email,
        amount: failedInvoice.amount_due,
        billingReason: failedInvoice.billing_reason,
        attemptCount: failedInvoice.attempt_count
      });
      
      try {
        const email = failedInvoice.customer_email;
        const customerId = failedInvoice.customer;
        
        if (email) {
          // Find user by email
          const idx = mockDB.users.findIndex(u => u.email === email);
          
          if (idx !== -1) {
            // Handle subscription-based invoices
            const subId = failedInvoice.subscription;
            if (subId) {
              mockDB.users[idx].subscriptionOnHold = true;
              saveDataToFiles('subscription_on_hold');
              console.log('✅ Subscription put on hold for user:', email);
            } else {
              // Handle manual invoices (like daily plans)
              console.log('📋 Manual invoice payment failed for user:', email);
              
              // Check if this is a daily plan invoice
              const lineItems = failedInvoice.lines?.data || [];
              const isDailyPlan = lineItems.some(item => 
                item.description && item.description.includes('Daily')
              );
              
              if (isDailyPlan) {
                // For daily plans, we might want to suspend access or send notification
                mockDB.users[idx].paymentFailed = true;
                mockDB.users[idx].lastPaymentFailure = new Date().toISOString();
                saveDataToFiles('daily_plan_payment_failed');
                console.log('⚠️ Daily plan payment failed for user:', email);
              }
            }
          } else {
            console.log('⚠️ User not found for email:', email);
          }
          
          // Send notification email
          const mailOptions = {
            from: process.env.EMAIL_USER || 'gauravvij1980@gmail.com',
            to: email,
            subject: 'Payment Issue - Action Required',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">Payment Failed</h2>
                <p>We were unable to process your payment for the following invoice:</p>
                <ul>
                  <li><strong>Invoice ID:</strong> ${failedInvoice.id}</li>
                  <li><strong>Amount:</strong> $${(failedInvoice.amount_due / 100).toFixed(2)} USD</li>
                  <li><strong>Attempts:</strong> ${failedInvoice.attempt_count}</li>
                </ul>
                <p>Please update your payment method or contact support to resolve this issue.</p>
                <p>Best regards,<br>The BioPing Team</p>
              </div>
            `
          };
          
          try { 
            await sendEmail(mailOptions.to, mailOptions.subject, mailOptions.html); 
            console.log('✅ Payment failure notification sent to:', email);
          } catch (e) { 
            console.log('❌ Mail error:', e.message); 
          }
        } else {
          console.log('⚠️ No customer email found in invoice');
        }
      } catch (e) { 
        console.log('❌ Payment failure handling error:', e.message); 
      }
      break;
      
    case 'customer.subscription.created':
      console.log('✅ Customer subscription created');
      
      const subscription = event.data.object;
      console.log('Subscription details:', {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        plan: subscription.plan?.id,
        interval: subscription.plan?.interval,
        amount: subscription.plan?.amount,
        metadata: subscription.metadata
      });
      
      // Auto-capture payment for incomplete subscriptions
      if (subscription.status === 'incomplete' && subscription.latest_invoice) {
        console.log('🔄 Auto-capturing payment for incomplete subscription...');
        try {
          const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
          if (invoice.payment_intent && invoice.payment_intent.status === 'requires_payment_method') {
            console.log('💳 Payment method required, attempting to capture...');
            // The payment will be automatically captured when the customer provides a valid payment method
          }
        } catch (captureError) {
          console.error('❌ Error auto-capturing payment:', captureError);
        }
      }
      
      // Check if this is a daily subscription (either by metadata or plan details)
      const isDailySubscription = subscription.metadata?.planId === 'daily-12' || 
                                 (subscription.plan?.interval === 'day' && subscription.plan?.amount === 100);
      
      if (isDailySubscription) {
        console.log('🔄 Daily subscription created, setting up daily billing...');
        
        // Update user with subscription details
        try {
          const customer = await stripe.customers.retrieve(subscription.customer);
          if (customer.email) {
            console.log('📧 Found customer email:', customer.email);
            
            // Try MongoDB first
            try {
              const User = require('./models/User');
              const updatedUser = await User.findOneAndUpdate(
                { email: customer.email },
                {
                  subscriptionId: subscription.id,
                  stripeCustomerId: subscription.customer,
                  currentPlan: 'daily-12',
                  subscriptionStatus: subscription.status,
                  subscriptionCreatedAt: new Date(subscription.created * 1000),
                  subscriptionEndAt: new Date(subscription.current_period_end * 1000),
                  lastCreditRenewal: new Date(),
                  nextCreditRenewal: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  autoRenewal: true,
                  paymentMethodSaved: true
                },
                { new: true }
              );
              
              if (updatedUser) {
                console.log('✅ MongoDB daily subscription updated for:', customer.email);
                console.log('🎉 Auto-cut subscription setup complete!');
              } else {
                console.log('⚠️ User not found in MongoDB for:', customer.email);
              }
            } catch (dbError) {
              console.log('❌ MongoDB update failed, updating file storage...', dbError.message);
              // Fallback to file storage
              const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
              if (userIndex !== -1) {
                mockDB.users[userIndex].subscriptionId = subscription.id;
                mockDB.users[userIndex].stripeCustomerId = subscription.customer;
                mockDB.users[userIndex].currentPlan = 'daily-12';
                mockDB.users[userIndex].subscriptionStatus = subscription.status;
                mockDB.users[userIndex].subscriptionCreatedAt = new Date(subscription.created * 1000).toISOString();
                mockDB.users[userIndex].subscriptionEndAt = new Date(subscription.current_period_end * 1000).toISOString();
                mockDB.users[userIndex].lastCreditRenewal = new Date().toISOString();
                mockDB.users[userIndex].nextCreditRenewal = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                mockDB.users[userIndex].autoRenewal = true;
                mockDB.users[userIndex].paymentMethodSaved = true;
                saveDataToFiles('daily_subscription_created');
                console.log('✅ File storage daily subscription updated for:', customer.email);
                console.log('🎉 Auto-cut subscription setup complete!');
              } else {
                console.log('⚠️ User not found in file storage for:', customer.email);
              }
            }
          } else {
            console.log('⚠️ No customer email found for subscription:', subscription.id);
          }
        } catch (error) {
          console.error('❌ Error updating user for daily subscription:', error);
        }
      } else {
        console.log('📋 Non-daily subscription created, no special handling needed');
      }
      break;
      
    case 'invoice.payment_succeeded':
      console.log('💰 Invoice payment succeeded - Auto-renewal working!');
      
      const paymentSucceededInvoice = event.data.object;
      console.log('Invoice details:', {
        id: paymentSucceededInvoice.id,
        customer: paymentSucceededInvoice.customer,
        subscription: paymentSucceededInvoice.subscription,
        amount: paymentSucceededInvoice.amount_paid,
        status: paymentSucceededInvoice.status
      });
      
      // Handle successful auto-renewal
      if (paymentSucceededInvoice.subscription) {
        try {
          const customer = await stripe.customers.retrieve(paymentSucceededInvoice.customer);
          if (customer.email) {
            console.log('🔄 Processing auto-renewal for:', customer.email);
            
            // Try MongoDB first
            try {
              const User = require('./models/User');
              const updatedUser = await User.findOneAndUpdate(
                { email: customer.email },
                {
                  lastPaymentDate: new Date(),
                  subscriptionStatus: 'active',
                  autoRenewalWorking: true,
                  lastAutoRenewal: new Date()
                },
                { new: true }
              );
              
              if (updatedUser) {
                console.log('✅ Auto-renewal processed in MongoDB for:', customer.email);
              }
            } catch (dbError) {
              console.log('❌ MongoDB update failed, updating file storage...');
              // Fallback to file storage
              const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
              if (userIndex !== -1) {
                mockDB.users[userIndex].lastPaymentDate = new Date().toISOString();
                mockDB.users[userIndex].subscriptionStatus = 'active';
                mockDB.users[userIndex].autoRenewalWorking = true;
                mockDB.users[userIndex].lastAutoRenewal = new Date().toISOString();
                saveDataToFiles('auto_renewal_success');
                console.log('✅ Auto-renewal processed in file storage for:', customer.email);
              }
            }
            
            // Send renewal confirmation email
            try {
              const mailOptions = {
                from: process.env.EMAIL_USER || 'gauravvij1980@gmail.com',
                to: customer.email,
                subject: '🔄 Subscription Renewed - BioPing',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 20px; text-align: center; color: white;">
                      <h1 style="margin: 0; font-size: 28px;">🔄 Subscription Renewed!</h1>
                      <p style="margin: 10px 0 0 0; font-size: 16px;">Auto-renewal successful</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa;">
                      <h2 style="color: #333; margin-bottom: 20px;">Your subscription has been automatically renewed!</h2>
                      
                      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #4caf50; margin-top: 0;">Renewal Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                          <li style="margin: 10px 0;"><strong>Amount:</strong> $${(paymentSucceededInvoice.amount_paid / 100).toFixed(2)} USD</li>
                          <li style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                          <li style="margin: 10px 0;"><strong>Status:</strong> Active</li>
                          <li style="margin: 10px 0;"><strong>Invoice ID:</strong> ${paymentSucceededInvoice.id}</li>
                        </ul>
                      </div>
                      
                      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                        <p style="margin: 0; color: #2e7d32;"><strong>✅ Auto-Renewal Working Perfectly!</strong> Your subscription will continue to renew automatically.</p>
                      </div>
                      
                      <p style="color: #666; margin-top: 20px;">
                        Thank you for your continued subscription. Your access to premium features remains active.
                      </p>
                    </div>
                    
                    <div style="background: #333; color: white; padding: 20px; text-align: center;">
                      <p style="margin: 0;">© 2024 BioPing. All rights reserved.</p>
                    </div>
                  </div>
                `
              };
              
              await sendEmail(mailOptions.to, mailOptions.subject, mailOptions.html);
              console.log('✅ Auto-renewal confirmation email sent to:', customer.email);
            } catch (emailError) {
              console.error('❌ Email sending error:', emailError);
            }
          }
        } catch (error) {
          console.error('❌ Error processing auto-renewal:', error);
        }
      }
      break;
      
    case 'customer.subscription.updated':
      console.log('✅ Customer subscription updated');
      
      // Handle daily-12 subscription updates
      const updatedSubscription = event.data.object;
      if (updatedSubscription.metadata?.planId === 'daily-12') {
        console.log('🔄 Daily-12 subscription updated...');
        
        try {
          const customer = await stripe.customers.retrieve(updatedSubscription.customer);
          if (customer.email) {
            // Update subscription status
            try {
              const User = require('./models/User');
              await User.findOneAndUpdate(
                { email: customer.email },
                {
                  subscriptionStatus: updatedSubscription.status,
                  subscriptionEndAt: new Date(updatedSubscription.current_period_end * 1000)
                }
              );
              console.log('✅ MongoDB daily subscription status updated for:', customer.email);
            } catch (dbError) {
              console.log('❌ MongoDB update failed, updating file storage...');
              const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
              if (userIndex !== -1) {
                mockDB.users[userIndex].subscriptionStatus = updatedSubscription.status;
                mockDB.users[userIndex].subscriptionEndAt = new Date(updatedSubscription.current_period_end * 1000).toISOString();
                saveDataToFiles('daily_subscription_updated');
                console.log('✅ File storage daily subscription status updated for:', customer.email);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error updating daily subscription status:', error);
        }
      }
      break;
    case 'customer.subscription.deleted':
      console.log('❌ Customer subscription deleted');
      
      // Handle daily-12 subscription cancellation
      const deletedSubscription = event.data.object;
      if (deletedSubscription.metadata?.planId === 'daily-12') {
        console.log('🔄 Daily-12 subscription cancelled...');
        
        try {
          const customer = await stripe.customers.retrieve(deletedSubscription.customer);
          if (customer.email) {
            // Update subscription status
            try {
              const User = require('./models/User');
              await User.findOneAndUpdate(
                { email: customer.email },
                {
                  subscriptionStatus: 'cancelled',
                  subscriptionOnHold: true,
                  currentPlan: 'free'
                }
              );
              console.log('✅ MongoDB daily subscription cancelled for:', customer.email);
            } catch (dbError) {
              console.log('❌ MongoDB update failed, updating file storage...');
              const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
              if (userIndex !== -1) {
                mockDB.users[userIndex].subscriptionStatus = 'cancelled';
                mockDB.users[userIndex].subscriptionOnHold = true;
                mockDB.users[userIndex].currentPlan = 'free';
                saveDataToFiles('daily_subscription_cancelled');
                console.log('✅ File storage daily subscription cancelled for:', customer.email);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error cancelling daily subscription:', error);
        }
      }
      break;
      

      
    case 'invoice.created':
      const newInvoice = event.data.object;
      console.log('📄 New invoice created:', newInvoice.id);
      break;
      
    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Debug webhook endpoint - for testing
app.post('/api/webhook-debug', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('🔍 Webhook Debug Endpoint Hit');
  console.log('📧 Headers:', req.headers);
  console.log('📦 Body:', req.body.toString());
  console.log('🔑 Stripe Signature:', req.headers['stripe-signature']);
  console.log('🔑 Environment Secret:', process.env.STRIPE_WEBHOOK_SECRET);
  
  res.status(200).json({ 
    message: 'Debug webhook received',
    hasSignature: !!req.headers['stripe-signature'],
    hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    bodyLength: req.body ? req.body.length : 0
  });
});

// Add express.json() middleware AFTER webhook route
app.use(express.json());

// Serve static files (PDFs) with enhanced configuration
app.use('/pdf', express.static(path.join(__dirname, '../public/pdf'), {
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
  }
}));

// Serve PDFs from the pdfs folder
app.use('/pdfs', express.static(path.join(__dirname, '../public/pdfs'), {
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
  }
}));

// Serve /static files from build directory first, then public
const staticBuildPath = path.join(__dirname, '../build');
const staticPublicPath = path.join(__dirname, '../public');
const staticServePath = fs.existsSync(staticBuildPath) ? staticBuildPath : staticPublicPath;

app.use('/static', express.static(staticServePath, {
  setHeaders: (res, filePath) => {
    // Set proper MIME types for JavaScript files
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Set proper MIME types for CSS files
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    // Set proper MIME types for PDF files
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    // Set cache headers for static assets
    if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
}));

// Handle 404 for /static files that don't exist
app.use('/static', (req, res, next) => {
  // If we reach here, the file wasn't found by express.static
  // Check if it's a static file request
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|pdf)$/)) {
    // Try both build and public directories
    let filePath = path.join(__dirname, '../build', req.path);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '../public', req.path);
    }
    if (fs.existsSync(filePath)) {
      // Set proper MIME type
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      return res.sendFile(filePath);
    }
    // File doesn't exist - return 404
    return res.status(404).json({ error: 'Static file not found', path: req.path });
  }
  next();
});

// Serve test subscription page
app.use('/test', express.static(path.join(__dirname, 'public')));

// Add cache-busting middleware
app.use((req, res, next) => {
  // Force no-cache for all requests
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Add version parameter to force refresh
  if (req.query.v) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  }
  
  next();
});

// Health check endpoint - REMOVED DUPLICATE

// Test PDF endpoint
app.get('/api/test-pdf', (req, res) => {
  const pdfPath = path.join(__dirname, '../public/pdf/BioPing Training Manual.pdf');
  if (fs.existsSync(pdfPath)) {
    res.json({ 
      status: 'PDF files available',
      path: pdfPath,
      exists: true
    });
  } else {
    res.json({ 
      status: 'PDF files not found',
      path: pdfPath,
      exists: false
    });
  }
});

// PDF health check endpoint
app.get('/api/pdf-health', (req, res) => {
  const pdfDir = path.join(__dirname, '../public/pdf');
  const pdfFiles = fs.existsSync(pdfDir) ? fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf')) : [];
  
  res.json({ 
    status: 'PDF directory check',
    pdfDir: pdfDir,
    pdfDirExists: fs.existsSync(pdfDir),
    pdfFiles: pdfFiles,
    totalFiles: pdfFiles.length,
    sampleFile: pdfFiles[0] || 'No PDFs found'
  });
});

// Direct PDF serving endpoint with proper headers
app.get('/api/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join(__dirname, '../public/pdf', filename);
  
  if (fs.existsSync(pdfPath)) {
    // Set proper headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Stream the PDF file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({ error: 'PDF not found', filename });
  }
});
// Test endpoint
app.get('/api/test', (req, res) => {
  const pdfDir = path.join(__dirname, '../public/pdf');
  const pdfFiles = fs.existsSync(pdfDir) ? fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf')) : [];
  
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    pdfDir: pdfDir,
    pdfDirExists: fs.existsSync(pdfDir),
    pdfFiles: pdfFiles,
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/signup',
      '/api/create-payment-intent',
      '/api/auth/subscription-status',
      '/api/test-pdf',
      '/api/pdf-health'
    ]
  });
});

// MongoDB connection test endpoint
app.get('/api/test-mongodb', async (req, res) => {
  try {
    console.log('🔧 Testing MongoDB connection...');
    
    // Test MongoDB connection
    const User = require('./models/User');
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    // Test creating a user
    const testUserData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'mongodb-test@example.com',
      password: 'testpassword123', // Fixed: 8+ characters
      company: 'BioPing',
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    };
    
    // Check if test user exists
    let existingTestUser = await User.findOne({ email: testUserData.email });
    if (existingTestUser) {
      await User.findByIdAndDelete(existingTestUser._id);
      console.log('🧹 Cleaned up existing test user');
    }
    
    // Create test user
    const newTestUser = new User(testUserData);
    await newTestUser.save();
    console.log('✅ Test user created in MongoDB');
    
    // Verify user was saved
    const savedUser = await User.findOne({ email: testUserData.email });
    if (savedUser) {
      console.log('✅ Test user verified in MongoDB');
      // Clean up
      await User.findByIdAndDelete(savedUser._id);
      console.log('🧹 Test user cleaned up');
      
      res.json({
        success: true,
        message: 'MongoDB connection test successful!',
        details: {
          connection: 'Connected',
          database: 'bioping',
          testUser: 'Created and verified',
          cleanup: 'Completed'
        }
      });
    } else {
      throw new Error('Test user not found after creation');
    }
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'MongoDB connection test failed',
      error: error.message
    });
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'public', 'pdf');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + '.pdf');
  }
});

const pdfUpload = multer({ 
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'bioping-super-secure-jwt-secret-key-2025-very-long-and-random-string';

// RESEND EMAIL SYSTEM - HTTP API (NO SMTP)
// Using Resend HTTP API instead of SMTP for Render compatibility
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_your_resend_api_key_here';

console.log('📧 Email configured with Resend HTTP API (Render Compatible)');
console.log('📧 RESEND_API_KEY set:', process.env.RESEND_API_KEY ? 'Yes' : 'No');
console.log('📧 RESEND_API_KEY value:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 4) + '****' : 'Not set');

// Warn if RESEND_API_KEY is not properly configured
if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_your_resend_api_key_here') {
  console.error('⚠️ WARNING: RESEND_API_KEY is not configured! Email sending will fail!');
  console.error('⚠️ Please set RESEND_API_KEY in your environment variables.');
} else {
  console.log('✅ RESEND_API_KEY is configured and ready');
}

// RESEND EMAIL FUNCTION - HTTP API (NO SMTP)
const sendEmail = async (to, subject, html, replyTo = null, attachments = []) => {
  try {
    // Validate RESEND_API_KEY first
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_your_resend_api_key_here') {
      console.error('❌ RESEND EMAIL ERROR: RESEND_API_KEY is not configured!');
      return { 
        success: false, 
        error: 'Email service is not configured. Please set RESEND_API_KEY in environment variables.'
      };
    }

    console.log(`📧 RESEND EMAIL: Sending to ${to}`);
    console.log(`📧 RESEND EMAIL: From: BioPing <support@thebioping.com>`);
    if (replyTo) {
      console.log(`📧 RESEND EMAIL: Reply-To: ${replyTo}`);
    }
    if (attachments && attachments.length > 0) {
      console.log(`📧 RESEND EMAIL: Attachments: ${attachments.length} file(s)`);
    }
    
    // Use Resend HTTP API instead of SMTP
    const emailBody = {
      from: 'BioPing <support@thebioping.com>',
      to: [to],
      subject: subject,
      html: html
    };

    // Add reply-to header if provided
    if (replyTo) {
      emailBody.reply_to = replyTo;
    }

    // Add attachments if provided (Resend API format)
    if (attachments && attachments.length > 0) {
      emailBody.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content.toString('base64')
      }));
    }

    console.log(`📧 RESEND EMAIL: Making API request to Resend...`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody)
    });
    
    const result = await response.json();
    console.log(`📧 RESEND EMAIL: Response status: ${response.status}`);
    console.log(`📧 RESEND EMAIL: Response body:`, JSON.stringify(result));
    
    if (response.ok) {
      console.log('✅ RESEND EMAIL: Sent successfully:', result.id);
      return { 
        success: true, 
        messageId: result.id 
      };
    } else {
      console.error('❌ RESEND EMAIL ERROR - Status:', response.status);
      console.error('❌ RESEND EMAIL ERROR - Message:', result.message);
      console.error('❌ RESEND EMAIL ERROR - Full response:', JSON.stringify(result));
      return { 
        success: false, 
        error: result.message || `HTTP ${response.status}: ${JSON.stringify(result)}`
      };
    }
    
  } catch (error) {
    console.error('❌ RESEND EMAIL ERROR - Exception:', error.message);
    console.error('❌ RESEND EMAIL ERROR - Stack:', error.stack);
    return { 
      success: false, 
      error: error.message
    };
  }
};

console.log('📧 Real Gmail function ready - Actually sends emails');

// Email templates
const emailTemplates = {
  verification: (code) => ({
    subject: 'BioPing - Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Email Verification</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Your Verification Code</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thank you for signing up with BioPing! Please use the verification code below to complete your registration:
          </p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code will expire in 30 minutes. If you didn't request this code, please ignore this email.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              The BioPing Team
            </p>
          </div>
        </div>
      </div>
    `
  })
};

// Universal emails that can login without signup
const universalEmails = [
  'universalx0242@gmail.com',
  'admin@bioping.com',
  'demo@bioping.com',
  'test@bioping.com',
  'user@bioping.com',
  'guest@bioping.com'
];

// Pre-hashed password for all universal emails
const hashedPassword = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // 'password'

// Simple user data for universal emails
const universalUsers = universalEmails.map((email, index) => ({
  id: `universal_${index + 1}`,
  email: email,
  password: hashedPassword,
  name: email.split('@')[0],
  role: email === 'universalx0242@gmail.com' ? 'admin' : 'user'
}));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔍 Auth check:', { 
    hasAuthHeader: !!authHeader, 
    hasToken: !!token,
    tokenLength: token ? token.length : 0
  });

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    console.log('✅ Token verified for user:', user.email);
    req.user = user;
    next();
  });
};

// Middleware to check if user is suspended
const checkUserSuspension = (req, res, next) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (user && user.suspended && user.suspended.isSuspended) {
      const now = new Date();
      const suspendUntil = new Date(user.suspended.suspendedUntil);
      
      if (now < suspendUntil) {
        return res.status(403).json({ 
          message: 'Account suspended',
          suspended: {
            reason: user.suspended.reason,
            suspendedUntil: user.suspended.suspendedUntil,
            duration: user.suspended.duration
          }
        });
      } else {
        // Suspension period has expired, remove suspension
        delete user.suspended;
        saveDataToFiles('suspension_expired');
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking user suspension:', error);
    next(); // Continue if there's an error checking suspension
  }
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Admin auth - Auth header:', authHeader);
  console.log('Admin auth - Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('Admin auth - No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Admin auth - Invalid token:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    console.log('Admin auth - User email:', user.email);
    
    // Check if user is admin (universalx0242@gmail.com or admin@bioping.com can be admin)
    if (user.email !== 'universalx0242@gmail.com' && user.email !== 'admin@bioping.com') {
      console.log('Admin auth - Access denied for:', user.email);
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    console.log('Admin auth - Access granted for:', user.email);
    req.user = user;
    next();
  });
};

// Routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Test current user route
app.get('/api/test-user', authenticateToken, (req, res) => {
  res.json({ 
    message: 'User authenticated',
    user: req.user,
    isAdmin: req.user.email === 'universalx0242@gmail.com' || req.user.email === 'admin@bioping.com'
  });
});

// Test email configuration endpoint
app.get('/api/test-email-config', (req, res) => {
  try {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || true,
      user: process.env.EMAIL_USER || 'gauravvij1980@gmail.com',
      passSet: !!process.env.EMAIL_PASS,
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json({
      success: true,
      config: emailConfig,
      message: 'Email configuration loaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to load email configuration'
    });
  }
});

// Health check route - MAIN ENDPOINT
app.get('/api/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      server: 'BioPing Backend',
      port: PORT,
      mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      email: 'Simple Gmail function ready',
      emailUser: process.env.EMAIL_USER || 'gauravvij1980@gmail.com',
      emailPass: process.env.EMAIL_PASS ? 'Set' : 'Not set',
      stripe: stripe ? 'Configured' : 'Not configured',
      cors: 'Enabled for thebioping.com'
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      server: 'BioPing Backend',
      port: PORT,
      mongodb: 'Error',
      email: 'Simple Gmail function ready',
      emailUser: process.env.EMAIL_USER || 'gauravvij1980@gmail.com',
      emailPass: process.env.EMAIL_PASS ? 'Set' : 'Not set',
      stripe: 'Error',
      cors: 'Enabled for thebioping.com'
    });
  }
});

// Secure PDF serving endpoint with advanced security
app.get('/api/secure-pdf/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const pdfPath = path.join(__dirname, '../pdf', filename);
    
    // Check if file exists and is a PDF
    if (!fs.existsSync(pdfPath) || !filename.toLowerCase().endsWith('.pdf')) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Verify user permissions (in production, check user role and access rights)
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Set advanced security headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add custom security headers
    res.setHeader('X-PDF-Security', 'protected');
    res.setHeader('X-User-ID', req.user.email);
    res.setHeader('X-Access-Time', new Date().toISOString());
    
    // Stream the PDF with security logging
    const stream = fs.createReadStream(pdfPath);
    
    // Log access for security monitoring
    console.log(`PDF access: ${filename} by user ${req.user.email} at ${new Date().toISOString()}`);
    
    stream.on('error', (error) => {
      console.error('PDF stream error:', error);
      res.status(500).json({ error: 'Error streaming PDF' });
    });
    
    stream.pipe(res);
    
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Additional secure PDF endpoint for different access patterns
app.get('/api/secure-pdf-stream/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const pdfPath = path.join(__dirname, '../pdf', filename);
    
    // Check if file exists and is a PDF
    if (!fs.existsSync(pdfPath) || !filename.toLowerCase().endsWith('.pdf')) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Get file stats for range requests
    const stats = fs.statSync(pdfPath);
    const fileSize = stats.size;
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(pdfPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'ALLOWALL', // Allow embedding from any domain
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-PDF-Security': 'protected'
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'ALLOWALL', // Allow embedding from any domain
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-PDF-Security': 'protected'
      });
      
      fs.createReadStream(pdfPath).pipe(res);
    }
    
  } catch (error) {
    console.error('Error serving PDF stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test email endpoint - actually send email
app.post('/api/test-email-send', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email } = req.body;
    
    console.log(`📧 Testing email sending to: ${email}`);
    
    // Try to send actual email
    const emailResult = await sendEmail(
      email,
      'BioPing - Test Email',
      '<h1>Test Email</h1><p>This is a test email from BioPing live server.</p>'
    );
    
    console.log(`📧 Test email result:`, emailResult);
    
    res.json({
      success: emailResult.success,
      message: emailResult.success ? 'Test email sent successfully' : 'Test email failed',
      emailResult: emailResult
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Test email error',
      error: error.message 
    });
  }
});
// Test email configuration
app.get('/api/test-email', async (req, res) => {
  try {
    // Always try to send email with hardcoded configuration
    // Simple email function is always available
    console.log('📧 Using simple Gmail function for email sending...');
      // Use simple email function instead
      const testResult = await sendEmail(
        req.query.email || 'test@example.com',
        'Test Email - BioPing',
        emailTemplates.verification('123456').html
      );
      
      return res.json({
        success: true,
        message: 'Test email sent successfully with simple Gmail function',
        to: req.query.email || 'test@example.com'
      });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: `Test email failed: ${error.message}`,
      error: {
        code: error.code,
        command: error.command,
        response: error.response
      }
    });
  }
});

// Send verification code endpoint
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    console.log('📧 Send verification request received:', req.body);
    console.log('📧 Request headers:', req.headers);
    
    const { email } = req.body;
    console.log('📧 Email extracted:', email);
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      console.log('❌ Invalid email:', email);
      return res.status(400).json({ message: 'Valid email required' });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Try to save to MongoDB first
    try {
      console.log('💾 Attempting to save verification code to MongoDB...');
      
      // Delete old verification codes for this email
      await VerificationCode.deleteMany({ email });
      
      // Create new verification code
      const newVerificationCode = new VerificationCode({
        email,
        code: verificationCode,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      });
      
      await newVerificationCode.save();
      console.log(`✅ Verification code saved to MongoDB for: ${email}`);
    } catch (dbError) {
      console.log('❌ MongoDB save failed, using file-based storage...');
      console.log('MongoDB Save Error:', dbError.message);
      
      // Fallback to file-based storage
      mockDB.verificationCodes = mockDB.verificationCodes.filter(
        record => record.email !== email
      );
      
      mockDB.verificationCodes.push({
        email,
        code: verificationCode,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      });
    }

    // Send email FIRST, then save data
    console.log(`📧 OTP Generated for ${email}: ${verificationCode}`);
    console.log(`🔑 VERIFICATION CODE FOR ${email}: ${verificationCode}`);
    
    // Try to send email using simple function (async, don't wait)
    console.log(`📧 Attempting to send OTP email to: ${email}`);
    
    // Send email with verification code using Resend system
    try {
      console.log('📧 Resend Email configuration check:');
      console.log('  - RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
      console.log('  - Using Resend with verified domain: thebioping.com');
      
      const emailTemplate = emailTemplates.verification(verificationCode);
      console.log('📧 Sending verification email to:', email);

      const emailResult = await sendEmail(
        email,
        emailTemplate.subject,
        emailTemplate.html
      );

      if (emailResult.success) {
        console.log('✅ Email sent successfully:', emailResult.messageId);
        console.log(`✅ Verification email sent to ${email} with code: ${verificationCode}`);

        res.json({
          success: true,
          message: 'Verification code sent successfully to your email',
          verificationCode: verificationCode,
          note: 'If email not received, use this code: ' + verificationCode
        });
      } else {
        console.log('❌ Email sending failed:', emailResult.error);
        console.log(`📧 Email failed to send, but code is: ${verificationCode}`);
        
        // Return success with the code in response for development
        res.json({
          success: true,
          message: 'Verification code generated (email failed to send)',
          verificationCode: verificationCode,
          emailError: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      console.log(`📧 Email failed to send, but code is: ${verificationCode}`);
      console.log('📧 Error details:', {
        name: emailError.name,
        message: emailError.message,
        code: emailError.code
      });
      
      // Return success with the code in response for development
      res.json({
        success: true,
        message: 'Verification code generated (email failed to send)',
        verificationCode: verificationCode,
        emailError: emailError.message
      });
    }

    // Save data to files
    saveDataToFiles('verification_code_sent');

  } catch (error) {
    console.error('Send verification error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Check server logs for more info'
    });
  }
});
// Verify email code endpoint
app.post('/api/auth/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, code } = req.body;
    
    // Try MongoDB first
    let verificationRecord = null;
    try {
      console.log('🔍 Checking MongoDB for verification code...');
      verificationRecord = await VerificationCode.findOne({ 
        email, 
        code, 
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });
      
      if (verificationRecord) {
        console.log('✅ Found verification code in MongoDB');
        // Mark as used
        await VerificationCode.deleteOne({ _id: verificationRecord._id });
        console.log('✅ Verification code marked as used and deleted');
      }
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file-based storage...');
      console.log('MongoDB Error:', dbError.message);
      
      // Fallback to file-based storage
      verificationRecord = mockDB.verificationCodes.find(
        record => record.email === email && 
                  record.code === code && 
                  new Date(record.expiresAt) > new Date()
      );
      
      if (verificationRecord) {
        console.log('✅ Found verification code in file storage');
        // Remove the used verification code
        mockDB.verificationCodes = mockDB.verificationCodes.filter(
          record => !(record.email === email && record.code === code)
        );
        saveDataToFiles('email_verified');
      }
    }

    if (!verificationRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification code' 
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create account endpoint
app.post('/api/auth/create-account', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('company').notEmpty().trim(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { firstName, lastName, email, company, password } = req.body;

    console.log(`🔧 Create account attempt for: ${email}`);

    // Check if user already exists (try MongoDB first, then file-based)
    let existingUser = null;
    try {
      console.log('🔍 Checking MongoDB for existing user...');
      existingUser = await User.findOne({ email }).maxTimeMS(10000);
      console.log('✅ MongoDB query completed');
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file-based storage...');
      console.log('MongoDB Error:', dbError.message);
      existingUser = mockDB.users.find(u => u.email === email);
    }

    if (existingUser) {
      console.log('⚠️ User already exists');
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Master email: brittany.filips@thebioping.com - auto-approved, unlimited credits
    const masterEmails = ['brittany.filips@thebioping.com'];
    const isMasterEmail = masterEmails.includes(email.toLowerCase());
    
    // Create new user object
    // IMPORTANT: Free users get exactly 5 credits once, never regenerated
    // Master email gets auto-approved and unlimited credits
    const newUserData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      company,
      role: 'other',
      // Email already OTP-verified at this point
      isVerified: true,
      otpVerifiedAt: new Date(),
      // Admin approval flow - master email auto-approved
      isApproved: isMasterEmail,
      status: isMasterEmail ? 'active' : 'pending',
      paymentCompleted: isMasterEmail, // Master email treated as paid
      currentPlan: isMasterEmail ? 'premium' : 'free',
      currentCredits: isMasterEmail ? 999999 : 5  // Master email gets unlimited credits
    };

    let newUser = null;
    let userId = null;

    // Try to save to MongoDB first
    try {
      console.log('💾 Attempting to save user to MongoDB...');
      newUser = new User(newUserData);
      await newUser.save();
      userId = newUser._id;
      console.log(`✅ New user saved to MongoDB: ${email} (ID: ${userId})`);
    } catch (dbError) {
      console.log('❌ MongoDB save failed, using file-based storage...');
      console.log('MongoDB Save Error:', dbError.message);
      // Fallback to file-based storage
      newUser = {
        id: mockDB.users.length + 1,
        ...newUserData,
        name: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString()
      };
      mockDB.users.push(newUser);
      userId = newUser.id;
      saveDataToFiles('user_created');
      console.log(`✅ New user saved to file: ${email} (ID: ${userId})`);
    }

    if (isMasterEmail) {
      console.log(`🎉 Master account created successfully (auto-approved): ${email}`);
    } else {
      console.log(`🎉 Account created successfully (awaiting admin approval): ${email}`);
    }

    // Master email is auto-approved, others require admin approval
    res.status(201).json({
      success: true,
      message: isMasterEmail ? 'Master account created successfully. You can login now.' : 'Account created. Awaiting admin approval.',
      awaitingApproval: !isMasterEmail,
      user: {
        id: userId,
        email: newUser.email,
        name: newUser.name || `${firstName} ${lastName}`,
        role: newUser.role,
        status: isMasterEmail ? 'active' : 'pending',
        isApproved: isMasterEmail
      }
    });

  } catch (error) {
    console.error('❌ Create account error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(`🔧 Login attempt for: ${email}`);

    // Check if it's a universal email
    const user = universalUsers.find(u => u.email === email);
    
    if (!user) {
      console.log('🔍 Checking MongoDB for registered user...');
      // Check if it's a registered user (try MongoDB first, then file-based)
      let registeredUser = null;
      try {
        registeredUser = await User.findOne({ email }).maxTimeMS(10000);
        console.log('✅ MongoDB query completed');
        if (registeredUser) {
          console.log(`✅ Found user in MongoDB: ${email}`);
          // Convert Mongoose document to plain object
          registeredUser = registeredUser.toObject ? registeredUser.toObject() : registeredUser;
        } else {
          console.log('⚠️ User not found in MongoDB, checking file storage...');
          registeredUser = mockDB.users.find(u => u.email === email);
        }
      } catch (dbError) {
        console.log('❌ MongoDB not available, checking file-based storage...');
        console.log('MongoDB Error:', dbError.message);
        registeredUser = mockDB.users.find(u => u.email === email);
      }

      if (!registeredUser) {
        console.log('❌ User not found in any storage');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password for registered user
      const isValidPassword = await bcrypt.compare(password, registeredUser.password);
      if (!isValidPassword) {
        console.log('❌ Invalid password');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('✅ Password verified successfully');
      
      // Debug logging for approval status
      console.log('🔍 Checking approval status:', {
        email: registeredUser.email,
        isApproved: registeredUser.isApproved,
        isApprovedType: typeof registeredUser.isApproved,
        status: registeredUser.status,
        statusType: typeof registeredUser.status
      });
      
      // Enforce admin approval - if approved, allow login (even if status is pending, we'll auto-update it)
      const isApproved = registeredUser.isApproved === true || registeredUser.isApproved === 'true';
      
      if (!isApproved) {
        console.log('❌ User not approved yet');
        return res.status(403).json({
          message: 'We are reviewing your request and inform you by email once your account is confirmed for registration.',
          awaitingApproval: true
        });
      }
      
      // Auto-update status to active if approved but status is still pending
      if (isApproved && registeredUser.status === 'pending') {
        console.log('🔄 Auto-updating status from pending to active for approved user');
        try {
          await User.findOneAndUpdate(
            { email: registeredUser.email },
            { status: 'active', isActive: true },
            { new: true, maxTimeMS: 10000 }
          );
          // Also update file storage
          const fileStorageUserIndex = mockDB.users.findIndex(u => u.email === registeredUser.email);
          if (fileStorageUserIndex !== -1) {
            mockDB.users[fileStorageUserIndex].status = 'active';
            mockDB.users[fileStorageUserIndex].isActive = true;
            saveDataToFiles('auto_status_update');
          }
          registeredUser.status = 'active';
          registeredUser.isActive = true;
        } catch (updateError) {
          console.log('⚠️ Failed to auto-update status, continuing anyway:', updateError.message);
        }
      }
      
      console.log('✅ User approved');
      
      // Check if free trial has expired (only for free users who haven't paid)
      // This check should come AFTER approval check so free users see trial expired popup, not approval popup
      // Master email: brittany.filips@thebioping.com - never expires
      const masterEmails = ['brittany.filips@thebioping.com'];
      const isMasterEmail = masterEmails.includes(email.toLowerCase());
      
      if (!registeredUser.paymentCompleted && registeredUser.currentPlan === 'free' && !isMasterEmail) {
        const now = new Date();
        const registrationDate = new Date(registeredUser.createdAt || registeredUser.registrationDate || now);
        const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
        const trialDays = 5;
        const daysExpired = daysSinceRegistration >= trialDays;
        
        // Check if credits are exhausted (0 or less credits)
        const creditsExhausted = (registeredUser.currentCredits || 0) <= 0;
        
        // Trial expires if either 5 days passed OR 5 credits exhausted
        const trialExpired = daysExpired || creditsExhausted;
        
        if (trialExpired) {
          let expiryReason = '';
          if (daysExpired && creditsExhausted) {
            expiryReason = 'Your 5-day free trial period has ended and all your free credits have been used up.';
          } else if (daysExpired) {
            expiryReason = 'Your 5-day free trial period has ended.';
          } else if (creditsExhausted) {
            expiryReason = 'You have used all your free credits (5 credits).';
          }
          
          console.log(`⏰ Trial expired for user: ${email} (Days: ${daysSinceRegistration}, Credits: ${registeredUser.currentCredits || 0})`);
          return res.status(403).json({
            message: `${expiryReason} Please upgrade to a paid plan to continue accessing the platform.`,
            trialExpired: true,
            expiryReason: expiryReason
          });
        }
      }
      
      // Generate JWT token for registered user
      const token = jwt.sign(
        { 
          id: registeredUser._id || registeredUser.id,
          email: registeredUser.email, 
          name: registeredUser.name || `${registeredUser.firstName} ${registeredUser.lastName}`,
          role: registeredUser.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`🎉 Login successful for: ${email}`);

      res.json({
        message: 'Login successful',
        token,
        user: {
          email: registeredUser.email,
          name: registeredUser.name || `${registeredUser.firstName} ${registeredUser.lastName}`,
          role: registeredUser.role
        },
        credits: registeredUser.currentCredits || 5
      });
      
      // Save login data
      saveDataToFiles('user_login');
      return;
    }

    console.log('🔍 Universal user login...');
    // Check password for universal user
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for universal user');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Universal user password verified');

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email, 
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`🎉 Universal user login successful: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      },
      credits: 5 // Give 5 credits to all users
    });
    
    // Save universal user login data
    saveDataToFiles('universal_user_login');

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard data routes
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    totalCompanies: 500,
    totalContacts: 2500,
    totalInvestors: 200,
    recentSearches: 15
  });
});

app.get('/api/dashboard/saved-searches', authenticateToken, (req, res) => {
  res.json({
    searches: []
  });
});

app.get('/api/dashboard/search', authenticateToken, (req, res) => {
  res.json({
    message: 'Search endpoint ready'
  });
});

app.get('/api/dashboard/resources/definitions', authenticateToken, (req, res) => {
  res.json({
    definitions: {
      diseaseArea: "Select the therapeutic area your drug is targeting (e.g., oncology, neurology, infectious disease).",
      developmentStage: "Indicate the current stage of your drug: Preclinical, Clinical (Phase I-III), or Marketed.",
      modality: "Specify the type of drug (e.g., small molecule, biologic, gene therapy, cell therapy)",
      partnerCategory: "Choose the type of partner you're targeting:",
      region: "Select the geographic region where you're seeking potential partners (e.g., North America, Europe, Asia)."
    }
  });
});

app.get('/api/dashboard/resources/coaching-tips', authenticateToken, (req, res) => {
  res.json({
    tips: []
  });
});

app.get('/api/dashboard/resources/free-content', authenticateToken, (req, res) => {
  // Redirect to BD Insights endpoint
  res.redirect('/api/dashboard/resources/bd-insights');
});

app.get('/api/dashboard/resources/bd-insights', authenticateToken, (req, res) => {
  // Only allow universal user and master email to access BD Insights
  const allowedEmails = ['universalx0242@gmail.com', 'brittany.filips@thebioping.com'];
  if (!allowedEmails.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ 
      message: 'Access denied. Only universal users can access BD Insights.' 
    });
  }

  res.json({
    insights: [
      {
        id: 1,
        title: 'BD Conferences - Priority, Budgets and Smart ROI Tips',
        description: 'Strategic insights from 15+ years of experience in Large Pharma to Small Biotechs.',
        type: 'PDF',
        size: '2.5 MB',
        views: 1856,
        rating: 4.9,
        featured: true,
        filename: 'BD Conferences, Priority & Budgets.pdf'
      },
      {
        id: 2,
        title: 'Biopharma Industry News and Resources',
        description: 'Latest industry updates and strategic resources for business development.',
        type: 'PDF',
        size: '1.8 MB',
        views: 1240,
        rating: 4.7,
        featured: false,
        filename: 'Biopharma News & Resources.pdf'
      },
      {
        id: 3,
        title: 'Big Pharma\'s BD Blueprint including Strategic Interest Areas',
        description: 'Comprehensive blueprint for understanding large pharma business development strategies.',
        type: 'PDF',
        size: '3.2 MB',
        views: 980,
        rating: 4.8,
        featured: false,
        filename: 'Big Pharma BD Playbook.pdf'
      },
      {
        id: 4,
        title: 'Winning BD Pitch Decks and Management Tips',
        description: 'Proven strategies and templates for creating compelling BD presentations.',
        type: 'PDF',
        size: '2.1 MB',
        views: 1560,
        rating: 4.9,
        featured: false,
        filename: 'Winning BD Pitch Deck.pdf'
      },
      {
        id: 5,
        title: 'BD Process and Tips',
        description: 'Comprehensive BD process guide and strategic tips for success.',
        type: 'PDF',
        size: '1.5 MB',
        views: 890,
        rating: 4.6,
        featured: false,
        filename: 'BD Process and Tips.pdf'
      }
    ]
  });
});

// Universal user subscription renewal endpoint
app.post('/api/auth/renew-universal-subscription', authenticateToken, (req, res) => {
  try {
    // Only allow universalx0242@gmail.com to use this endpoint
    if (req.user.email !== 'universalx0242@gmail.com') {
      return res.status(403).json({ message: 'Access denied. Only universal users can renew subscriptions.' });
    }

    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = mockDB.users[userIndex];
    const now = new Date();

    // Renew subscription with extended access
    mockDB.users[userIndex] = {
      ...user,
      paymentCompleted: true,
      currentPlan: 'premium', // Upgrade to premium plan
      currentCredits: 1000, // Give 1000 credits for extended access
      lastCreditRenewal: now.toISOString(),
      nextCreditRenewal: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      paymentUpdatedAt: now.toISOString()
    };

    // Add to payment history
    if (!mockDB.users[userIndex].paymentHistory) {
      mockDB.users[userIndex].paymentHistory = [];
    }

    mockDB.users[userIndex].paymentHistory.push({
      date: now.toISOString(),
      amount: 0, // Free renewal for universal user
      plan: 'premium',
      status: 'completed',
      type: 'universal_renewal'
    });

    saveDataToFiles();

    console.log(`✅ Universal subscription renewed for ${req.user.email}`);

    res.json({
      success: true,
      message: 'Universal subscription renewed successfully',
      newPlan: 'premium',
      newCredits: 1000,
      nextRenewal: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Error renewing universal subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/dashboard/legal', authenticateToken, (req, res) => {
  res.json({
    disclaimer: [
      {
        title: "1. Information Only - No Guarantees",
        content: "The information in the database (contact details, affiliations) is for general informational and business development purposes only, and accuracy, completeness, timeliness, or usefulness is not guaranteed."
      },
      {
        title: "2. No Endorsement or Representation",
        content: "Inclusion of any individual or company does not constitute an endorsement or recommendation, and the platform does not represent or act on behalf of listed individuals or companies."
      },
      {
        title: "3. Use at Your Own Risk",
        content: "Users are solely responsible for how they use the information, including outreach, communication, and follow-up, and the platform is not responsible for the outcome of contact attempts or partnerships."
      },
      {
        title: "4. No Liability",
        content: "The platform shall not be held liable for any direct, indirect, incidental, or consequential damages arising from use of the database, including errors, omissions, inaccuracies, or actions taken based on the information."
      },
      {
        title: "5. Compliance",
        content: "By accessing and using the database, users agree to comply with applicable data privacy laws (such as GDPR, CAN-SPAM) and ethical outreach practices, with the user solely responsible for compliance."
      },
      {
        title: "6. Intellectual Property",
        content: "All content and materials on this platform are protected by intellectual property rights."
      }
    ]
  });
});

app.get('/api/dashboard/contact', authenticateToken, (req, res) => {
  res.json({
    email: "support@bioping.com",
    message: "Please contact us via email if you find any discrepancies."
  });
});
// ============================================================================
// AUTO-CUT SUBSCRIPTION ENDPOINT
// ============================================================================
// Create subscription with auto-cut functionality
app.post('/api/create-subscription', async (req, res) => {
  try {
    console.log('🚀 Creating subscription with auto-cut...');
    console.log('📝 Request body:', req.body);
    
    const { paymentMethodId, customerEmail, planId, customerName } = req.body;
    
    console.log('📋 Extracted fields:', { paymentMethodId, customerEmail, planId, customerName });
    
    // Validate required fields with detailed logging
    console.log('🔍 Validation check:', {
      paymentMethodId: paymentMethodId ? `${paymentMethodId.substring(0, 10)}...` : 'MISSING',
      customerEmail: customerEmail || 'MISSING',
      planId: planId || 'MISSING',
      customerName: customerName || 'MISSING'
    });

    if (!paymentMethodId || !customerEmail || !planId) {
      console.log('❌ Missing required fields:', { 
        paymentMethodId: !!paymentMethodId, 
        customerEmail: !!customerEmail, 
        planId: !!planId 
      });
      return res.status(400).json({
        success: false,
        message: 'Payment method ID, customer email, and plan ID are required',
        received: { 
          paymentMethodId: !!paymentMethodId, 
          customerEmail: !!customerEmail, 
          planId: !!planId,
          customerName: !!customerName
        },
        debug: {
          paymentMethodId: paymentMethodId ? `${paymentMethodId.substring(0, 10)}...` : null,
          customerEmail: customerEmail,
          planId: planId,
          customerName: customerName
        }
      });
    }
    
    // Determine price ID based on plan
    let priceId;
    switch (planId) {
      case 'daily-12':
        // Use test price ID for test mode, live price ID for live mode
        if (stripeSecretKey.includes('sk_test_')) {
          // Create test price for daily plan
          try {
            const testPrice = await stripe.prices.create({
              unit_amount: 100, // $1.00
              currency: 'usd',
              recurring: { interval: 'day' },
              product_data: {
                name: 'Daily Test Plan'
              }
            });
            priceId = testPrice.id;
            console.log('✅ Created test price:', priceId);
          } catch (error) {
            console.error('❌ Error creating test price:', error);
            return res.status(500).json({
              success: false,
              message: 'Failed to create test price'
            });
          }
        } else {
          priceId = 'price_1Ry3VCLf1iznKy11PtmX3JJE'; // Live mode price ID
        }
        break;
      case 'basic':
        // Create price dynamically for basic plan
        try {
          const basicPrice = await stripe.prices.create({
            unit_amount: 50000, // $500.00 in cents
            currency: 'usd',
            product_data: {
              name: 'Basic Plan - One-time Payment'
            }
          });
          priceId = basicPrice.id;
          console.log('✅ Created basic plan price:', priceId);
        } catch (error) {
          console.error('❌ Error creating basic plan price:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to create basic plan price'
          });
        }
        break;
      case 'premium':
        // Create price dynamically for premium plan
        try {
          const premiumPrice = await stripe.prices.create({
            unit_amount: 75000, // $750.00 in cents
            currency: 'usd',
            product_data: {
              name: 'Premium Plan - One-time Payment'
            }
          });
          priceId = premiumPrice.id;
          console.log('✅ Created premium plan price:', priceId);
        } catch (error) {
          console.error('❌ Error creating premium plan price:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to create premium plan price'
          });
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid plan ID'
        });
    }
    
    console.log('📊 Subscription details:', {
      customerEmail,
      planId,
      priceId,
      paymentMethodId: paymentMethodId.substring(0, 10) + '...'
    });
    
    // Setup auto-cut subscription
    const result = await setupAutoCutSubscription(
      {
        email: customerEmail,
        name: customerName || 'Customer',
        id: 'user_' + Date.now(), // You can get this from your user database
        planId: planId
      },
      paymentMethodId,
      priceId
    );
    
    if (result.success) {
      console.log('✅ Auto-cut subscription setup successful');
      console.log('📊 Result:', {
        subscriptionId: result.subscription.id,
        customerId: result.customer.id,
        status: result.subscription.status
      });
      
      // Enhanced 3D Secure Detection System
      console.log('🔍 3D Secure Detection System Starting...');
      console.log('📊 Subscription Status:', result.subscription.status);
      console.log('📊 Subscription ID:', result.subscription.id);
      
      if (result.subscription.status === 'incomplete' && result.subscription.latest_invoice) {
        const latestInvoice = result.subscription.latest_invoice;
        console.log('🔍 Latest invoice status:', latestInvoice.status);
        console.log('🔍 Latest invoice ID:', latestInvoice.id);
        console.log('🔍 Payment intent status:', latestInvoice.payment_intent?.status);
        console.log('🔍 Payment intent ID:', latestInvoice.payment_intent?.id);
        
        if (latestInvoice.payment_intent && latestInvoice.payment_intent.status === 'requires_action') {
          console.log('🔐 3D Secure Authentication Required!');
          console.log('🔑 Client secret available:', !!latestInvoice.payment_intent.client_secret);
          console.log('🔑 Client secret preview:', latestInvoice.payment_intent.client_secret ? 
            latestInvoice.payment_intent.client_secret.substring(0, 20) + '...' : 'Missing');
          
          // Enhanced 3D Secure response
          return res.json({
            success: true,
            requires_action: true,
            client_secret: latestInvoice.payment_intent.client_secret,
            subscriptionId: result.subscription.id,
            customerId: result.customer.id,
            status: result.subscription.status,
            paymentIntentId: latestInvoice.payment_intent.id,
            invoiceId: latestInvoice.id,
            message: 'Subscription created but requires 3D Secure authentication',
            authentication_required: true,
            next_action: 'complete_3d_secure_authentication'
          });
        } else if (latestInvoice.payment_intent && latestInvoice.payment_intent.status === 'processing') {
          console.log('⏳ Payment is processing...');
          return res.json({
            success: true,
            requires_action: false,
            subscriptionId: result.subscription.id,
            customerId: result.customer.id,
            status: 'processing',
            message: 'Subscription created and payment is processing'
          });
        } else if (latestInvoice.payment_intent && latestInvoice.payment_intent.status === 'succeeded') {
          console.log('✅ Payment already succeeded!');
          // Continue with normal flow
        } else {
          console.log('⚠️ Unknown payment intent status:', latestInvoice.payment_intent?.status);
        }
      } else if (result.subscription.status === 'active') {
        console.log('✅ Subscription is already active!');
      } else {
        console.log('⚠️ Subscription status not handled:', result.subscription.status);
      }
      
      // Update user in database
      try {
        // Calculate credits based on plan
        let credits = 5; // default
        if (planId === 'daily-12') {
          credits = 50;
        } else if (planId === 'basic') {
          credits = 50;
        } else if (planId === 'premium') {
          credits = 100;
        } else if (planId === 'simple-1') {
          credits = 50;
        } else if (planId === 'basic-yearly') {
          credits = 50;
        } else if (planId === 'premium-yearly') {
          credits = 100;
        }
        
        console.log(`💰 Assigning ${credits} credits for plan: ${planId}`);
        
        // Try MongoDB first
        const User = require('./models/User');
        const updatedUser = await User.findOneAndUpdate(
          { email: customerEmail },
          {
            stripeCustomerId: result.customer.id,
            subscriptionId: result.subscription.id,
            currentPlan: planId,
            subscriptionStatus: 'active',
            paymentCompleted: true,
            subscriptionCreatedAt: new Date(),
            lastPaymentDate: new Date(),
            currentCredits: credits
          },
          { new: true }
        );
        
        if (updatedUser) {
          console.log('✅ User updated in MongoDB:', customerEmail);
        } else {
          console.log('⚠️ User not found in MongoDB, updating file storage...');
          // Fallback to file storage
          const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
          if (userIndex !== -1) {
            mockDB.users[userIndex].stripeCustomerId = result.customer.id;
            mockDB.users[userIndex].subscriptionId = result.subscription.id;
            mockDB.users[userIndex].currentPlan = planId;
            mockDB.users[userIndex].subscriptionStatus = 'active';
            mockDB.users[userIndex].paymentCompleted = true;
            mockDB.users[userIndex].subscriptionCreatedAt = new Date().toISOString();
            mockDB.users[userIndex].lastPaymentDate = new Date().toISOString();
            mockDB.users[userIndex].currentCredits = credits;
            saveDataToFiles('subscription_created');
            console.log(`✅ User updated in file storage with ${credits} credits`);
          }
        }
      } catch (dbError) {
        console.error('❌ Database update error:', dbError);
        // Continue with response even if database update fails
      }
      
      // Send confirmation email
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER || 'support@thebioping.com',
          to: customerEmail,
          subject: '🎉 Subscription Activated - BioPing',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Subscription Activated!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to BioPing Premium</p>
              </div>
              
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">Your subscription is now active!</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #667eea; margin-top: 0;">Subscription Details:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li style="margin: 10px 0;"><strong>Plan:</strong> ${planId}</li>
                    <li style="margin: 10px 0;"><strong>Status:</strong> Active</li>
                    <li style="margin: 10px 0;"><strong>Auto-Renewal:</strong> Enabled</li>
                    <li style="margin: 10px 0;"><strong>Subscription ID:</strong> ${result.subscription.id}</li>
                  </ul>
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                  <p style="margin: 0; color: #2e7d32;"><strong>✅ Auto-Cut Enabled:</strong> Your subscription will automatically renew. No manual payments required!</p>
                </div>
                
                <p style="color: #666; margin-top: 20px;">
                  You can now access all premium features. If you have any questions, feel free to contact our support team.
                </p>
              </div>
              
              <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p style="margin: 0;">© 2024 BioPing. All rights reserved.</p>
              </div>
            </div>
          `
        };
        
        await sendEmail(mailOptions.to, mailOptions.subject, mailOptions.html);
        console.log('✅ Subscription confirmation email sent to:', customerEmail);
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
        // Continue even if email fails
      }
      
      // Generate automatic invoice for successful subscription
      try {
        console.log('🎯 Generating automatic invoice for subscription...');
        
        // Create a mock payment intent for invoice generation
        const mockPaymentIntent = {
          id: `pi_subscription_${result.subscription.id}`,
          amount: result.subscription.items.data[0].price.unit_amount,
          currency: result.subscription.currency || 'usd',
          status: 'succeeded',
          metadata: {
            planId: planId,
            customerEmail: customerEmail
          }
        };
        
        await generateAutomaticInvoice(mockPaymentIntent, customerEmail, planId);
        console.log('✅ Automatic invoice generated for subscription');
      } catch (invoiceError) {
        console.error('❌ Error generating subscription invoice:', invoiceError);
        // Don't fail the subscription if invoice generation fails
      }
      
      res.json({
        success: true,
        message: 'Subscription created successfully with auto-cut enabled',
        subscriptionId: result.subscription.id,
        customerId: result.customer.id,
        planId: planId,
        autoRenewal: true
      });
      
    } else {
      console.error('❌ Subscription creation failed:', result.message);
      res.status(400).json({
        success: false,
        message: result.message || 'Subscription creation failed'
      });
    }
    
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and message are required' 
      });
    }

    // Log the contact form submission
    console.log('Contact form submission:', {
      name,
      email,
      company,
      message,
      timestamp: new Date().toISOString()
    });

    // Send email notification to universal email
    const emailContent = `
New Contact Form Submission:
---------------------------
Name: ${name}
Email: ${email}
Company: ${company || 'Not specified'}
Message: ${message}
Timestamp: ${new Date().toLocaleString()}
    `;

    // Send real email to universalx0242@gmail.com using Resend
    console.log('🔧 Contact Form Email Configuration Check:');
    console.log('  - RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
    console.log('  - Using Resend with verified domain: thebioping.com');
    
    // Always try to send email using Resend system
    console.log('📧 Using Resend system for contact form email sending...');
    if (true) { // Always send email
      try {
        console.log('📧 Attempting to send email...');
        
        // Use the same transporter configuration as the main email setup
        const isCustomDomain = true;
        
        // Use simple Gmail function for reliable email sending
        const emailHtml = `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'Not specified'}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `;
        
        // Send to gauravvij1980@gmail.com (keep as is)
        const emailResult = await sendEmail(
          'gauravvij1980@gmail.com',
          'New Contact Form Submission - BioPing',
          emailHtml,
          email // Set Reply-To to user's email
        );
        
        if (emailResult.success) {
          console.log('✅ Contact form email sent successfully to gauravvij1980@gmail.com');
          console.log('📧 Email ID:', emailResult.messageId);
        } else {
          console.log('❌ Contact form email failed:', emailResult.error);
          console.log('📧 Full email result:', emailResult);
        }
        
        // Also send to vik.vij@thebioping.com
        try {
          const vikEmailResult = await sendEmail(
            'vik.vij@thebioping.com',
            'New Contact Form Submission - BioPing',
            emailHtml,
            email // Set Reply-To to user's email
          );
          
          if (vikEmailResult.success) {
            console.log('✅ Contact form email sent successfully to vik.vij@thebioping.com');
            console.log('📧 Email ID:', vikEmailResult.messageId);
          } else {
            console.log('❌ Contact form email to vik.vij@thebioping.com failed:', vikEmailResult.error);
          }
        } catch (vikEmailError) {
          console.error('❌ Error sending email to vik.vij@thebioping.com:', vikEmailError);
          // Don't fail the whole request if this fails
        }
        
        // Also send to customer
        const customerEmailResult = await sendEmail(
          email,
          'Thank you for contacting BioPing',
          `
          <h2>Thank you for contacting BioPing!</h2>
          <p>Hi ${name},</p>
          <p>We have received your message and will get back to you soon.</p>
          <p><strong>Your message:</strong> ${message}</p>
          <p>Best regards,<br>BioPing Team</p>
          `
        );
        
        if (customerEmailResult.success) {
          console.log('✅ Customer confirmation email sent');
        } else {
          console.log('❌ Customer confirmation email failed:', customerEmailResult.error);
        }
        
        res.json({ success: true, message: 'Message sent successfully' });
        return;
      } catch (emailError) {
        console.error('❌ Error sending contact form email:', emailError);
        res.status(500).json({ success: false, message: 'Error sending message' });
        return;
      }
    }
    
    // Fallback - this should not be reached
    res.json({ success: true, message: 'Message received (email sending disabled)' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Newsletter subscription endpoint
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid email is required' 
      });
    }

    console.log('📧 Newsletter subscription request received:', email);
    
    // Check if RESEND_API_KEY is configured
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_your_resend_api_key_here') {
      console.error('❌ Newsletter: RESEND_API_KEY is not configured!');
      console.error('❌ Newsletter: Cannot send email notifications.');
      // Still return success to user, but log the error
      return res.json({ 
        success: true, 
        message: 'Subscription received (email notifications are currently disabled)' 
      });
    }

    // Send email notification to admin emails
    const emailHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.8;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">🎉 New Newsletter Subscription</h1>
        </div>
        
        <div style="background:#ffffff;padding:30px;border:1px solid #e0e0e0;border-radius:0 0 10px 10px;">
          <p style="color:#333333;font-size:16px;margin-bottom:20px;">
            Great news! Someone has subscribed to stay updated with <strong>BioPing newsletter</strong>.
          </p>
          
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#667eea;">📧 Subscriber Email:</strong><br/>
              <span style="color:#666666;font-size:18px;">${email}</span>
            </p>
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#667eea;">🕐 Subscription Date & Time:</strong><br/>
              <span style="color:#666666;">${new Date().toLocaleString()}</span>
            </p>
          </div>
          
          <div style="background:#e8f5e9;padding:15px;border-radius:8px;border-left:4px solid #4caf50;margin:20px 0;">
            <p style="margin:0;color:#2e7d32;font-size:14px;">
              <strong>✅ Action Required:</strong> This subscriber has expressed interest in receiving BioPing newsletter updates. You can add them to your email marketing list.
            </p>
          </div>
          
          <p style="color:#666666;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e0e0e0;">
            This is an automated notification from BioPing newsletter subscription system.
          </p>
        </div>
        
        <div style="text-align:center;padding:20px;color:#999999;font-size:12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} BioPing. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send to all specified emails
    const adminEmails = [
      'gauravvij1980@gmail.com',
      'vik.vij@thebioping.com',
      'amankk0007@gmail.com'
    ];

    let emailSent = false;
    const emailErrors = [];
    
    console.log('📧 Newsletter: Starting to send emails to admin addresses...');
    console.log('📧 Newsletter: Admin emails:', adminEmails);
    
    for (let i = 0; i < adminEmails.length; i++) {
      const adminEmail = adminEmails[i];
      try {
        console.log(`📧 Newsletter: Attempting to send to ${adminEmail} (${i + 1}/${adminEmails.length})...`);
        
        // Send email WITHOUT replyTo to avoid issues (like OTP emails work)
        const emailResult = await sendEmail(
          adminEmail,
          'New Newsletter Subscription - BioPing',
          emailHtml
          // Removed replyTo parameter - it was causing email delivery issues
        );
        
        if (emailResult.success) {
          console.log(`✅ Newsletter subscription email sent successfully to ${adminEmail}`);
          console.log(`✅ Email ID: ${emailResult.messageId}`);
          emailSent = true;
        } else {
          const errorMsg = `Failed to send to ${adminEmail}: ${emailResult.error}`;
          console.error(`❌ ${errorMsg}`);
          emailErrors.push(errorMsg);
        }
        
        // Add small delay between emails to avoid rate limiting (except for last email)
        if (i < adminEmails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
      } catch (emailError) {
        const errorMsg = `Exception sending to ${adminEmail}: ${emailError.message}`;
        console.error(`❌ ${errorMsg}`);
        console.error(`❌ Stack trace:`, emailError.stack);
        emailErrors.push(errorMsg);
      }
    }
    
    // Log summary
    console.log('📧 Newsletter: Email sending summary:');
    console.log(`📧 Newsletter: Success: ${emailSent ? 'YES' : 'NO'}`);
    console.log(`📧 Newsletter: Total admin emails: ${adminEmails.length}`);
    console.log(`📧 Newsletter: Errors: ${emailErrors.length}`);
    if (emailErrors.length > 0) {
      console.log('📧 Newsletter: Error details:', emailErrors);
    }

    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'Successfully subscribed to newsletter!' 
      });
    } else {
      // Still return success even if email fails
      res.json({ 
        success: true, 
        message: 'Subscription received (email notification may have failed)' 
      });
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Opt-Out form submission endpoint
app.post('/api/opt-out/submit', async (req, res) => {
  try {
    const { fullName, company, workEmail, corrections } = req.body;
    
    // Validate required fields
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Full name is required' 
      });
    }
    
    if (!workEmail || !workEmail.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Work email is required' 
      });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workEmail.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid work email address' 
      });
    }

    console.log('📧 Opt-Out form submission received:', { fullName, company, workEmail, hasCorrections: !!corrections });

    // Check if RESEND_API_KEY is configured
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_your_resend_api_key_here') {
      console.error('❌ Opt-Out: RESEND_API_KEY is not configured!');
      return res.json({ 
        success: true, 
        message: 'Request received (email notifications are currently disabled)' 
      });
    }

    // Escape HTML to prevent XSS and template issues
    const escapeHtml = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const safeFullName = escapeHtml(fullName);
    const safeCompany = escapeHtml(company || '');
    const safeWorkEmail = escapeHtml(workEmail);
    const safeCorrections = escapeHtml(corrections || '');

    // Create email HTML
    const emailHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.8;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">🚫 New Opt-Out / Data Request</h1>
        </div>
        <div style="background:#ffffff;padding:30px;border:1px solid #e0e0e0;border-radius:0 0 10px 10px;">
          <p style="color:#333333;font-size:16px;margin-bottom:20px;">
            A user has submitted a request regarding their personal information on BioPing.
          </p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#ff6b6b;">👤 Full Name:</strong><br/>
              <span style="color:#666666;font-size:18px;">${safeFullName}</span>
            </p>
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#ff6b6b;">🏢 Company:</strong><br/>
              <span style="color:#666666;font-size:18px;">${safeCompany || 'Not provided'}</span>
            </p>
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#ff6b6b;">📧 Work Email to Remove:</strong><br/>
              <span style="color:#666666;font-size:18px;">${safeWorkEmail}</span>
            </p>
            ${safeCorrections ? `
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#ff6b6b;">📝 Corrections/Updates:</strong><br/>
              <span style="color:#666666;font-size:16px;white-space:pre-wrap;">${safeCorrections}</span>
            </p>` : ''}
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#ff6b6b;">🕐 Submission Date & Time:</strong><br/>
              <span style="color:#666666;">${new Date().toLocaleString()}</span>
            </p>
          </div>
          <div style="background:#fff3e0;padding:15px;border-radius:8px;border-left:4px solid #ff9800;margin:20px 0;">
            <p style="margin:0;color:#e65100;font-size:14px;">
              <strong>⚠️ Action Required:</strong> Please review this request and process it within 15 business days as per policy.
            </p>
          </div>
          <p style="color:#666666;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e0e0e0;">
            This is an automated notification from BioPing's data request system.
          </p>
        </div>
        <div style="text-align:center;padding:20px;color:#999999;font-size:12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} BioPing. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send to admin emails
    const adminEmails = [
      'amankk0007@gmail.com',
      'vik.vij@thebioping.com'
    ];

    let emailSent = false;
    const emailErrors = [];
    
    console.log('📧 Opt-Out: Starting to send emails to admin addresses...');
    console.log('📧 Opt-Out: Admin emails:', adminEmails);
    
    for (let i = 0; i < adminEmails.length; i++) {
      const adminEmail = adminEmails[i];
      try {
        console.log(`📧 Opt-Out: Attempting to send to ${adminEmail} (${i + 1}/${adminEmails.length})...`);
        
        const emailResult = await sendEmail(
          adminEmail,
          'Do Not Sell or Share My Info or Opt-Out - BioPing',
          emailHtml
        );
        
        if (emailResult.success) {
          console.log(`✅ Opt-Out email sent successfully to ${adminEmail}`);
          console.log(`✅ Email ID: ${emailResult.messageId}`);
          emailSent = true;
        } else {
          const errorMsg = `Failed to send to ${adminEmail}: ${emailResult.error}`;
          console.error(`❌ ${errorMsg}`);
          emailErrors.push(errorMsg);
        }
        
        // Add small delay between emails
        if (i < adminEmails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (emailError) {
        const errorMsg = `Exception sending to ${adminEmail}: ${emailError.message}`;
        console.error(`❌ ${errorMsg}`);
        emailErrors.push(errorMsg);
      }
    }
    
    // Log summary
    console.log('📧 Opt-Out: Email sending summary:');
    console.log(`📧 Opt-Out: Success: ${emailSent ? 'YES' : 'NO'}`);
    console.log(`📧 Opt-Out: Total admin emails: ${adminEmails.length}`);
    console.log(`📧 Opt-Out: Errors: ${emailErrors.length}`);
    if (emailErrors.length > 0) {
      console.log('📧 Opt-Out: Error details:', emailErrors);
    }

    if (emailSent) {
      console.log('✅ Opt-Out: Request processed successfully - emails sent');
      res.json({ 
        success: true, 
        message: 'Opt-out request submitted successfully! Admins have been notified. We will process your request within 15 business days.' 
      });
    } else {
      console.error('❌ Opt-Out: Request received but email sending failed');
      console.error('❌ Opt-Out: All email attempts failed:', emailErrors);
      res.status(500).json({ 
        success: false, 
        message: 'Request received, but email notification failed. Please contact support directly at privacy@thebioping.com' 
      });
    }
  } catch (error) {
    console.error('Opt-Out submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Request Demo form submission endpoint
app.post('/api/request-demo/submit', async (req, res) => {
  try {
    const { firstName, lastName, email, company, role, phone, message } = req.body;
    
    // Validate required fields
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name is required' 
      });
    }
    
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Last name is required' 
      });
    }
    
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }
    
    if (!company || !company.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company name is required' 
      });
    }
    
    if (!role || !role.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role is required' 
      });
    }

    console.log('📧 Request Demo form submission received:', { firstName, lastName, email, company, role, phone: phone ? 'provided' : 'not provided' });

    // Check if RESEND_API_KEY is configured
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_your_resend_api_key_here') {
      console.error('❌ Request Demo: RESEND_API_KEY is not configured!');
      return res.json({ 
        success: true, 
        message: 'Request received (email notifications are currently disabled)' 
      });
    }

    // Escape HTML to prevent XSS and template issues
    const escapeHtml = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const safeFirstName = escapeHtml(firstName);
    const safeLastName = escapeHtml(lastName);
    const safeEmail = escapeHtml(email);
    const safeCompany = escapeHtml(company || '');
    const safeRole = escapeHtml(role || '');
    const safePhone = escapeHtml(phone || '');
    const safeMessage = escapeHtml(message || '');

    // Create email HTML
    const emailHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.8;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">🎯 New Demo Request</h1>
        </div>
        <div style="background:#ffffff;padding:30px;border:1px solid #e0e0e0;border-radius:0 0 10px 10px;">
          <p style="color:#333333;font-size:16px;margin-bottom:20px;">
            A potential customer has requested a demo of the BioPing platform.
          </p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#667eea;">👤 Full Name:</strong><br/>
              <span style="color:#666666;font-size:18px;">${safeFirstName} ${safeLastName}</span>
            </p>
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#667eea;">📧 Email:</strong><br/>
              <span style="color:#666666;font-size:18px;">${safeEmail}</span>
            </p>
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#667eea;">🏢 Company:</strong><br/>
              <span style="color:#666666;font-size:18px;">${safeCompany}</span>
            </p>
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#667eea;">💼 Role:</strong><br/>
              <span style="color:#666666;font-size:18px;">${safeRole}</span>
            </p>
            ${safePhone ? `
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#667eea;">📞 Phone:</strong><br/>
              <span style="color:#666666;font-size:18px;">${safePhone}</span>
            </p>` : ''}
            ${safeMessage ? `
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#667eea;">💬 Additional Information:</strong><br/>
              <span style="color:#666666;font-size:16px;white-space:pre-wrap;">${safeMessage}</span>
            </p>` : ''}
            <p style="margin:10px 0;color:#333333;">
              <strong style="color:#667eea;">🕐 Request Date & Time:</strong><br/>
              <span style="color:#666666;">${new Date().toLocaleString()}</span>
            </p>
          </div>
          <div style="background:#e8f5e9;padding:15px;border-radius:8px;border-left:4px solid #4caf50;margin:20px 0;">
            <p style="margin:0;color:#2e7d32;font-size:14px;">
              <strong>✅ Action Required:</strong> Please contact this potential customer within 24 hours to schedule their personalized demo.
            </p>
          </div>
          <p style="color:#666666;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e0e0e0;">
            This is an automated notification from BioPing's demo request system.
          </p>
        </div>
        <div style="text-align:center;padding:20px;color:#999999;font-size:12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} BioPing. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send to admin emails
    const adminEmails = [
      'amankk0007@gmail.com',
      'vik.vij@thebioping.com'
    ];

    let emailSent = false;
    const emailErrors = [];
    
    console.log('📧 Request Demo: Starting to send emails to admin addresses...');
    console.log('📧 Request Demo: Admin emails:', adminEmails);
    
    for (let i = 0; i < adminEmails.length; i++) {
      const adminEmail = adminEmails[i];
      try {
        console.log(`📧 Request Demo: Attempting to send to ${adminEmail} (${i + 1}/${adminEmails.length})...`);
        
        const emailResult = await sendEmail(
          adminEmail,
          'Demo Request from BioPing Website',
          emailHtml
        );
        
        if (emailResult.success) {
          console.log(`✅ Request Demo email sent successfully to ${adminEmail}`);
          console.log(`✅ Email ID: ${emailResult.messageId}`);
          emailSent = true;
        } else {
          const errorMsg = `Failed to send to ${adminEmail}: ${emailResult.error}`;
          console.error(`❌ ${errorMsg}`);
          emailErrors.push(errorMsg);
        }
        
        // Add small delay between emails
        if (i < adminEmails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (emailError) {
        const errorMsg = `Exception sending to ${adminEmail}: ${emailError.message}`;
        console.error(`❌ ${errorMsg}`);
        console.error(`❌ Stack trace:`, emailError.stack);
        emailErrors.push(errorMsg);
      }
    }
    
    // Log summary
    console.log('📧 Request Demo: Email sending summary:');
    console.log(`📧 Request Demo: Success: ${emailSent ? 'YES' : 'NO'}`);
    console.log(`📧 Request Demo: Total admin emails: ${adminEmails.length}`);
    console.log(`📧 Request Demo: Errors: ${emailErrors.length}`);
    if (emailErrors.length > 0) {
      console.log('📧 Request Demo: Error details:', emailErrors);
    }

    if (emailSent) {
      console.log('✅ Request Demo: Request processed successfully - emails sent');
      res.json({ 
        success: true, 
        message: 'Demo request submitted successfully! We will contact you within 24 hours to schedule your personalized demo.' 
      });
    } else {
      console.error('❌ Request Demo: Request received but email sending failed');
      console.error('❌ Request Demo: All email attempts failed:', emailErrors);
      res.status(500).json({ 
        success: false, 
        message: 'Request received, but email notification failed. Please contact support directly at support@thebioping.com' 
      });
    }
  } catch (error) {
    console.error('Request Demo submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during demo request submission.' 
    });
  }
});

// Contact form data storage (for admin panel)
const contactSubmissions = [];

// Get contact submissions (admin only)
app.get('/api/admin/contact-submissions', authenticateAdmin, async (req, res) => {
  try {
    const submissions = global.contactSubmissions || [];
    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// BD Consulting endpoints
app.post('/api/consulting/book-session', authenticateToken, async (req, res) => {
  try {
    const { date, time, topic, notes } = req.body;
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has paid plan (Basic or Premium)
    if (user.currentPlan === 'free') {
      return res.status(403).json({ message: 'Consulting sessions are only available for paid plans' });
    }

    // Check if user has already used their consulting hour
    const existingSession = consultingSessions.find(session => 
      session.userEmail === user.email && session.status === 'completed'
    );

    if (existingSession) {
      return res.status(400).json({ message: 'You have already used your consulting session' });
    }

    const session = {
      id: Date.now().toString(),
      userEmail: user.email,
      userName: user.name,
      userCompany: user.company,
      date: date,
      time: time,
      topic: topic,
      notes: notes,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    consultingSessions.push(session);
    
    res.json({
      success: true,
      message: 'Consulting session booked successfully',
      session: session
    });
  } catch (error) {
    console.error('Error booking consulting session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/consulting/user-sessions', authenticateToken, async (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userSessions = consultingSessions.filter(session => 
      session.userEmail === user.email
    );

    res.json({
      success: true,
      sessions: userSessions
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// BD Consulting tracking system
let consultingSessions = [
  {
    id: '1',
    userEmail: 'test@example.com',
    userName: 'Test User',
    userCompany: 'Test Company',
    date: '2024-01-20',
    time: '10:00 AM',
    topic: 'BD Strategy Discussion',
    notes: 'Initial consultation for partnership strategy',
    status: 'scheduled',
    createdAt: new Date().toISOString()
  }
];

app.get('/api/admin/consulting-sessions', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      sessions: consultingSessions
    });
  } catch (error) {
    console.error('Error fetching consulting sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/complete-session/:sessionId', authenticateAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionIndex = consultingSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    consultingSessions[sessionIndex].status = 'completed';
    consultingSessions[sessionIndex].completedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Session marked as completed',
      session: consultingSessions[sessionIndex]
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Pricing Analytics Backend Routes
// In-memory data storage (in production, this would be a database)
let pricingData = {
  plans: [
    { 
      id: 1,
      name: 'Starter', 
      price: 99, 
      color: 'blue', 
      members: 456, 
      revenue: 45144,
      growth: 12.5,
      conversion: 8.2,
      avgLifetime: 14.2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    { 
      id: 2,
      name: 'Professional', 
      price: 199, 
      color: 'purple', 
      members: 623, 
      revenue: 123977,
      growth: 18.7,
      conversion: 12.4,
      avgLifetime: 22.8,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    { 
      id: 3,
      name: 'Enterprise', 
      price: 399, 
      color: 'green', 
      members: 168, 
      revenue: 67032,
      growth: 6.3,
      conversion: 3.1,
      avgLifetime: 45.6,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ],
  recentPurchases: [
    { 
      id: 1,
      name: 'John Smith', 
      company: 'TechCorp', 
      plan: 'Professional', 
      date: '2024-01-15', 
      amount: 199, 
      status: 'active',
      email: 'john.smith@techcorp.com',
      phone: '+1-555-0123',
      createdAt: new Date('2024-01-15')
    },
    { 
      id: 2,
      name: 'Sarah Johnson', 
      company: 'BioTech', 
      plan: 'Enterprise', 
      date: '2024-01-14', 
      amount: 399, 
      status: 'active',
      email: 'sarah.johnson@biotech.com',
      phone: '+1-555-0124',
      createdAt: new Date('2024-01-14')
    },
    { 
      id: 3,
      name: 'Mike Chen', 
      company: 'Pharma Inc', 
      plan: 'Starter', 
      date: '2024-01-13', 
      amount: 99, 
      status: 'active',
      email: 'mike.chen@pharma.com',
      phone: '+1-555-0125',
      createdAt: new Date('2024-01-13')
    },
    { 
      id: 4,
      name: 'Emily Davis', 
      company: 'Life Sciences', 
      plan: 'Professional', 
      date: '2024-01-12', 
      amount: 199, 
      status: 'active',
      email: 'emily.davis@lifesciences.com',
      phone: '+1-555-0126',
      createdAt: new Date('2024-01-12')
    },
    { 
      id: 5,
      name: 'David Wilson', 
      company: 'Research Labs', 
      plan: 'Enterprise', 
      date: '2024-01-11', 
      amount: 399, 
      status: 'active',
      email: 'david.wilson@researchlabs.com',
      phone: '+1-555-0127',
      createdAt: new Date('2024-01-11')
    }
  ],
  monthlyStats: [
    { 
      id: 1,
      month: 'Jan', 
      starter: 45, 
      professional: 62, 
      enterprise: 18, 
      total: 125,
      revenue: 12500,
      growth: 0,
      createdAt: new Date('2024-01-31')
    },
    { 
      id: 2,
      month: 'Feb', 
      starter: 52, 
      professional: 68, 
      enterprise: 22, 
      total: 142,
      revenue: 14200,
      growth: 13.6,
      createdAt: new Date('2024-02-29')
    },
    { 
      id: 3,
      month: 'Mar', 
      starter: 48, 
      professional: 71, 
      enterprise: 20, 
      total: 139,
      revenue: 13900,
      growth: -2.1,
      createdAt: new Date('2024-03-31')
    },
    { 
      id: 4,
      month: 'Apr', 
      starter: 55, 
      professional: 75, 
      enterprise: 25, 
      total: 155,
      revenue: 15500,
      growth: 11.5,
      createdAt: new Date('2024-04-30')
    },
    { 
      id: 5,
      month: 'May', 
      starter: 58, 
      professional: 78, 
      enterprise: 28, 
      total: 164,
      revenue: 16400,
      growth: 5.8,
      createdAt: new Date('2024-05-31')
    },
    { 
      id: 6,
      month: 'Jun', 
      starter: 62, 
      professional: 82, 
      enterprise: 30, 
      total: 174,
      revenue: 17400,
      growth: 6.1,
      createdAt: new Date('2024-06-30')
    }
  ],
  topCompanies: [
    { 
      id: 1,
      name: 'BioTech Solutions', 
      revenue: 2397, 
      members: 12, 
      plan: 'Professional',
      contactPerson: 'Dr. Sarah Johnson',
      email: 'sarah@biotechsolutions.com',
      phone: '+1-555-0101',
      website: 'https://biotechsolutions.com',
      createdAt: new Date('2024-01-01')
    },
    { 
      id: 2,
      name: 'Pharma Research', 
      revenue: 1995, 
      members: 5, 
      plan: 'Enterprise',
      contactPerson: 'Mike Chen',
      email: 'mike@pharmaresearch.com',
      phone: '+1-555-0102',
      website: 'https://pharmaresearch.com',
      createdAt: new Date('2024-01-02')
    },
    { 
      id: 3,
      name: 'Life Sciences Corp', 
      revenue: 1791, 
      members: 9, 
      plan: 'Professional',
      contactPerson: 'Emily Davis',
      email: 'emily@lifesciencescorp.com',
      phone: '+1-555-0103',
      website: 'https://lifesciencescorp.com',
      createdAt: new Date('2024-01-03')
    },
    { 
      id: 4,
      name: 'Medical Innovations', 
      revenue: 1596, 
      members: 8, 
      plan: 'Professional',
      contactPerson: 'David Wilson',
      email: 'david@medicalinnovations.com',
      phone: '+1-555-0104',
      website: 'https://medicalinnovations.com',
      createdAt: new Date('2024-01-04')
    },
    { 
      id: 5,
      name: 'Clinical Research Ltd', 
      revenue: 1398, 
      members: 7, 
      plan: 'Professional',
      contactPerson: 'Lisa Brown',
      email: 'lisa@clinicalresearch.com',
      phone: '+1-555-0105',
      website: 'https://clinicalresearch.com',
      createdAt: new Date('2024-01-05')
    }
  ]
};

// Get all pricing analytics data
app.get('/api/pricing-analytics', authenticateToken, (req, res) => {
  try {
    // Calculate summary statistics
    const totalMembers = pricingData.plans.reduce((sum, plan) => sum + plan.members, 0);
    const totalRevenue = pricingData.plans.reduce((sum, plan) => sum + plan.revenue, 0);
    const avgRevenuePerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0;
    
    const summary = {
      totalMembers,
      totalRevenue,
      avgRevenuePerMember: Math.round(avgRevenuePerMember),
      conversionRate: 8.2, // Average conversion rate
      mostPopularPlan: pricingData.plans.reduce((max, plan) => 
        plan.members > max.members ? plan : max
      ).name
    };

    res.json({
      success: true,
      data: {
        plans: pricingData.plans,
        recentPurchases: pricingData.recentPurchases,
        monthlyStats: pricingData.monthlyStats,
        topCompanies: pricingData.topCompanies,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching pricing analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pricing analytics data' 
    });
  }
});

// Get specific plan details
app.get('/api/pricing-analytics/plans/:planId', authenticateToken, (req, res) => {
  try {
    const planId = parseInt(req.params.planId);
    const plan = pricingData.plans.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan not found' 
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching plan details' 
    });
  }
});

// Add new purchase
app.post('/api/pricing-analytics/purchases', authenticateToken, [
  body('name').notEmpty().trim(),
  body('company').notEmpty().trim(),
  body('plan').notEmpty().trim(),
  body('amount').isNumeric(),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().trim()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { name, company, plan, amount, email, phone } = req.body;
    
    const newPurchase = {
      id: pricingData.recentPurchases.length + 1,
      name,
      company,
      plan,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      email,
      phone: phone || '',
      createdAt: new Date()
    };

    pricingData.recentPurchases.unshift(newPurchase);

    // Update plan statistics
    const planToUpdate = pricingData.plans.find(p => p.name === plan);
    if (planToUpdate) {
      planToUpdate.members += 1;
      planToUpdate.revenue += parseFloat(amount);
      planToUpdate.updatedAt = new Date();
    }

    res.status(201).json({
      success: true,
      message: 'Purchase added successfully',
      data: newPurchase
    });
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding purchase' 
    });
  }
});

// Update plan statistics
app.put('/api/pricing-analytics/plans/:planId', authenticateToken, [
  body('members').optional().isNumeric(),
  body('revenue').optional().isNumeric(),
  body('growth').optional().isNumeric(),
  body('conversion').optional().isNumeric(),
  body('avgLifetime').optional().isNumeric()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const planId = parseInt(req.params.planId);
    const plan = pricingData.plans.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan not found' 
      });
    }

    // Update only provided fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        plan[key] = parseFloat(req.body[key]);
      }
    });
    
    plan.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating plan' 
    });
  }
});

// Get revenue trends
app.get('/api/pricing-analytics/revenue-trends', authenticateToken, (req, res) => {
  try {
    const trends = pricingData.monthlyStats.map(month => ({
      month: month.month,
      revenue: month.revenue,
      growth: month.growth
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching revenue trends' 
    });
  }
});

// Get analytics summary
app.get('/api/pricing-analytics/summary', authenticateToken, (req, res) => {
  try {
    const totalMembers = pricingData.plans.reduce((sum, plan) => sum + plan.members, 0);
    const totalRevenue = pricingData.plans.reduce((sum, plan) => sum + plan.revenue, 0);
    const avgRevenuePerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0;
    
    const summary = {
      totalMembers,
      totalRevenue,
      avgRevenuePerMember: Math.round(avgRevenuePerMember),
      conversionRate: 8.2,
      mostPopularPlan: pricingData.plans.reduce((max, plan) => 
        plan.members > max.members ? plan : max
      ).name,
      totalPurchases: pricingData.recentPurchases.length,
      activePurchases: pricingData.recentPurchases.filter(p => p.status === 'active').length
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics summary' 
    });
  }
});

// Export analytics data
app.get('/api/pricing-analytics/export', authenticateToken, (req, res) => {
  try {
    const exportData = {
      plans: pricingData.plans,
      recentPurchases: pricingData.recentPurchases,
      monthlyStats: pricingData.monthlyStats,
      topCompanies: pricingData.topCompanies,
      exportDate: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=pricing-analytics.json');
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting analytics data' 
    });
  }
});

// Admin Panel Backend Routes

// In-memory storage for biotech data (in production, this would be a database)
let biotechData = [];

// Get all biotech data (admin only)
app.get('/api/admin/biotech-data', authenticateAdmin, (req, res) => {
  try {
    console.log('Admin biotech data - Request received');
    console.log('Admin biotech data - Data count:', biotechData.length);

    res.json({
      success: true,
      data: biotechData,
      uploadedFiles: mockDB.uploadedFiles
    });
  } catch (error) {
    console.error('Error fetching biotech data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching biotech data' 
    });
  }
});

// Upload Excel file
app.post('/api/admin/upload-excel', authenticateAdmin, upload.single('file'), (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Excel file must have at least a header row and one data row'
      });
    }

    // Get headers (first row)
    const headers = jsonData[0].map(header => header ? header.toString().trim() : '');
    
    // Log all headers for debugging
    console.log('Excel headers found:', headers);
    console.log('Looking for specific columns:');
    console.log('Company:', headers.indexOf('Company'));
    console.log('Contact Name:', headers.indexOf('Contact Name'));
    console.log('TA1 - Oncology:', headers.indexOf('TA1 - Oncology'));
    console.log('Tier:', headers.indexOf('Tier'));
    console.log('All TA columns:');
    for (let i = 1; i <= 17; i++) {
      const taHeader = i <= 10 ? `TA${i}` : `T${i}`;
      console.log(`${taHeader}:`, headers.indexOf(`${taHeader} -`));
    }
    
    // Accept any Excel file structure - no validation restrictions
    console.log('Processing Excel file with columns:', headers);

    // Process data rows (skip header)
    const newData = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row.length === 0 || row.every(cell => !cell)) continue; // Skip empty rows
      
      // Create record based on your actual Excel structure from images
      const record = {
        id: biotechData.length + newData.length + 1,
        companyName: row[headers.indexOf('Company')] || 'Pfizer',
        contactPerson: row[headers.indexOf('Contact Name')] || 'Contact ' + (newData.length + 1),
        contactTitle: row[headers.indexOf('Contact Title')] || 'Sr. Director',
        contactFunction: row[headers.indexOf('Contact Function')] || 'Business Development',
        email: row[headers.indexOf('Contact Email')] || 'contact@company.com',
        region: row[headers.indexOf('Country (HQ)')] || 'USA',
        tier: row[headers.indexOf('Tier')] || 'Large Pharma',
        modality: row[headers.indexOf('Modality')] || 'SM, LM, CT, GT',
        partnerType: row[headers.indexOf('Partner Type')] || 'Buyer',
        // Add TA columns based on your Excel structure (TA1-TA17)
        ta1_oncology: row[headers.indexOf('TA1 - Oncology')] || '0',
        ta2_cardiovascular: row[headers.indexOf('TA2 - Cardiovascular')] || '0',
        ta3_neuroscience: row[headers.indexOf('TA3 - Neuroscience')] || '0',
        ta4_immunology_autoimmune: row[headers.indexOf('T4 - Immunology & Autoimmune')] || '0',
        ta5_infectious_diseases: row[headers.indexOf('T5 - Infectious Diseases')] || '0',
        ta6_respiratory: row[headers.indexOf('T6 - Respiratory')] || '0',
        ta7_endocrinology_metabolic: row[headers.indexOf('T7 - Endocrinology & Metabolic')] || '0',
        ta8_rare_orphan: row[headers.indexOf('T8 - Rare / Orphan')] || '0',
        ta9_hematology: row[headers.indexOf('T9 - Hematology')] || '0',
        ta10_gastroenterology: row[headers.indexOf('T10 - Gastroenterology')] || '0',
        ta11_dermatology: row[headers.indexOf('T11 - Dermatology')] || '0',
        ta12_ophthalmology: row[headers.indexOf('T12 - Ophthalmology')] || '0',
        ta13_kidney_renal: row[headers.indexOf('T13 - Kidney / Renal')] || '0',
        ta14_msk_disease: row[headers.indexOf('T14 - MSK Disease')] || '0',
        ta15_womens_health: row[headers.indexOf('T15 - Women\'s Health')] || '0',
        ta16_pain: row[headers.indexOf('T16 - Pain')] || '0',
        ta17_urology: row[headers.indexOf('T17 - Urology')] || '0',
        // Add BD Person TA Focus
        bdPersonTAFocus: row[headers.indexOf('BD Person TA Focus (Only for Business Development)')] || '',
        createdAt: new Date().toISOString().split('T')[0]
      };

      // Accept any record - no validation restrictions
      newData.push(record);
    }

    if (newData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records found in the Excel file'
      });
    }

    // Add to existing data
    biotechData = [...biotechData, ...newData];

    // Store file info in mockDB
    const fileInfo = {
      id: Date.now(),
      filename: req.file.originalname,
      uploadDate: new Date(),
      recordsAdded: newData.length,
      totalRecords: biotechData.length
    };
    mockDB.uploadedFiles.push(fileInfo);

    // Save data to files
    saveDataToFiles('user_created');

    res.status(201).json({
      success: true,
      message: `${newData.length} records uploaded successfully`,
      data: {
        totalRecords: biotechData.length,
        newRecords: newData.length,
        processedRows: jsonData.length - 1,
        validRecords: newData.length,
        fileInfo
      }
    });
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing Excel file: ' + error.message 
    });
  }
});

// Debug endpoint to check search criteria
app.post('/api/debug-search', authenticateToken, (req, res) => {
  try {
    const { diseaseArea, partnerType, region, contactFunction } = req.body;
    
    console.log('🔍 Debug Search Criteria:', { diseaseArea, partnerType, region, contactFunction });
    console.log('📊 Total biotech data available:', biotechData.length);
    
    // Check TA11 dermatology data
    if (diseaseArea === 'TA11 - Dermatology') {
      const ta11Data = biotechData.filter(item => item.ta11_dermatology === '1' || item.ta11_dermatology === 1);
      console.log('🧬 TA11 Dermatology records:', ta11Data.length);
      
      // Check by tier
      if (partnerType === 'Tier 2 - Mid-Size') {
        const ta11MidSize = ta11Data.filter(item => {
          const tier = item.tier || '';
          return tier.toLowerCase().includes('mid') || 
                 tier.toLowerCase().includes('mid cap') ||
                 tier.toLowerCase().includes('tier 2') ||
                 tier.toLowerCase().includes('mid-size');
        });
        console.log('🏢 TA11 + Mid-Size records:', ta11MidSize.length);
        
        // Check by region
        if (region === 'Europe') {
          const ta11MidSizeEurope = ta11MidSize.filter(item => {
            const itemRegion = item.region || '';
            const itemContinent = item.continent || '';
            return itemContinent === 'Europe' ||
                   itemRegion.toLowerCase().includes('germany') || 
                   itemRegion.toLowerCase().includes('france') ||
                   itemRegion.toLowerCase().includes('switzerland') ||
                   itemRegion.toLowerCase().includes('denmark') ||
                   itemRegion.toLowerCase().includes('uk') ||
                   itemRegion.toLowerCase().includes('spain') ||
                   itemRegion.toLowerCase().includes('italy') ||
                   itemRegion.toLowerCase().includes('netherlands') ||
                   itemRegion.toLowerCase().includes('belgium') ||
                   itemRegion.toLowerCase().includes('austria') ||
                   itemRegion.toLowerCase().includes('finland') ||
                   itemRegion.toLowerCase().includes('poland') ||
                   itemRegion.toLowerCase().includes('norway') ||
                   itemRegion.toLowerCase().includes('hungary') ||
                   itemRegion.toLowerCase().includes('sweden') ||
                   itemRegion.toLowerCase().includes('iceland') ||
                   itemRegion.toLowerCase().includes('greece') ||
                   itemRegion.toLowerCase().includes('ireland') ||
                   itemRegion.toLowerCase().includes('czech republic') ||
                   itemRegion.toLowerCase().includes('czech') ||
                   itemRegion.toLowerCase().includes('portugal') ||
                   itemRegion.toLowerCase().includes('estonia') ||
                   itemRegion.toLowerCase().includes('luxembourg') ||
                   itemRegion.toLowerCase().includes('malta') ||
                   itemRegion.toLowerCase().includes('slovenia') ||
                   itemRegion.toLowerCase().includes('romania') ||
                   itemRegion.toLowerCase().includes('slovakia') ||
                   itemRegion.toLowerCase().includes('lithuania');
          });
          console.log('🌍 TA11 + Mid-Size + Europe records:', ta11MidSizeEurope.length);
          
          // Check by function
          if (contactFunction === 'Business Development') {
            const finalResults = ta11MidSizeEurope.filter(item => {
              const itemFunction = item.contactFunction || '';
              return itemFunction.toLowerCase().includes('business development') || 
                     itemFunction.toLowerCase().includes('bd') ||
                     itemFunction.toLowerCase().includes('business dev') ||
                     itemFunction.toLowerCase().includes('regulatory bd') ||
                     itemFunction.toLowerCase().includes('r&d business development') ||
                     itemFunction.toLowerCase().includes('international business development');
            });
            console.log('👔 TA11 + Mid-Size + Europe + BD records:', finalResults.length);
            
            // Count unique companies and contacts
            const uniqueCompanies = new Set(finalResults.map(item => item.companyName));
            const uniqueContacts = new Set(finalResults.map(item => item.email));
            
            console.log('🏢 Unique companies:', uniqueCompanies.size);
            console.log('👥 Unique contacts:', uniqueContacts.size);
            
            // Show UCB specifically
            const ucbRecords = finalResults.filter(item => 
              item.companyName && item.companyName.toLowerCase().includes('ucb')
            );
            console.log('🏢 UCB records found:', ucbRecords.length);
            console.log('🏢 UCB unique contacts:', new Set(ucbRecords.map(item => item.email)).size);
            
            return res.json({
              success: true,
              debug: {
                totalData: biotechData.length,
                ta11Records: ta11Data.length,
                ta11MidSizeRecords: ta11MidSize.length,
                ta11MidSizeEuropeRecords: ta11MidSizeEurope.length,
                finalResults: finalResults.length,
                uniqueCompanies: uniqueCompanies.size,
                uniqueContacts: uniqueContacts.size,
                ucbRecords: ucbRecords.length,
                ucbUniqueContacts: new Set(ucbRecords.map(item => item.email)).size,
                sampleUcbRecords: ucbRecords.slice(0, 5)
              }
            });
          }
        }
      }
    }
    
    res.json({ success: true, message: 'Debug search completed' });
    
  } catch (error) {
    console.error('Error in debug search:', error);
    res.status(500).json({ success: false, message: 'Debug search failed' });
  }
});
// Search biotech data (public endpoint with limits)
app.post('/api/search-biotech', authenticateToken, checkUserSuspension, [
  body('drugName').optional(),
  body('diseaseArea').optional(),
  body('developmentStage').optional(),
  body('modality').optional(),
  body('partnerType').optional(),
  body('region').optional(),
  body('function').optional(),
  body('searchType').optional(),
  body('searchQuery').optional()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { drugName, diseaseArea, developmentStage, modality, partnerType, region, function: contactFunction, searchType, searchQuery } = req.body;
    
    console.log('Search criteria:', { drugName, diseaseArea, developmentStage, modality, partnerType, region, contactFunction });
    console.log('Total data available:', biotechData.length);
    console.log('Sample data item:', biotechData[0]);
    
    // Debug: Show all available column names in the first data item
    if (biotechData.length > 0) {
      console.log('Available columns in data:', Object.keys(biotechData[0]));
      console.log('Sample data with all columns:', biotechData[0]);
      
      // Check if the specific columns we're looking for exist
      console.log('Checking for TA columns:');
      console.log('t4_immunology_autoimmune exists:', 't4_immunology_autoimmune' in biotechData[0]);
      console.log('tier exists:', 'tier' in biotechData[0]);
      console.log('t4_immunology_autoimmune value:', biotechData[0].t4_immunology_autoimmune);
      console.log('tier value:', biotechData[0].tier);
    }
    
    // Filter data based on search criteria
    let filteredData = biotechData;
    
    // Check if user provided any search criteria
    let hasSearchCriteria = false;
    let searchCriteria = [];
    
    // Handle simple search by company name or contact name
    if (searchType && searchQuery) {
      hasSearchCriteria = true;
      searchCriteria.push('Simple Search');
      console.log('Simple search:', { searchType, searchQuery });
      
      const query = searchQuery.toLowerCase().trim();
      let tempFilteredData = biotechData.filter(item => {
        if (searchType === 'Company Name') {
          // Partial match for company name (case insensitive) - so "pfizer" will find "Pfizer Inc"
          return item.companyName && item.companyName.toLowerCase().includes(query);
        } else if (searchType === 'Contact Name') {
          // Partial match for contact name (case insensitive)
          return item.contactPerson && item.contactPerson.toLowerCase().includes(query);
        }
        return false;
      });
      
      // Always return individual contacts, don't group by company
      filteredData = tempFilteredData;
      console.log('Individual contacts found:', filteredData.length);
      console.log('After simple search filter, records found:', filteredData.length);
    }
    
    // Disease Area - mandatory
    if (diseaseArea) {
      hasSearchCriteria = true;
      searchCriteria.push('Disease Area');
      console.log('Filtering by disease area:', diseaseArea);
      
      // Map disease area to actual columns in your data (TA1-TA3, T4-T17)
      let taColumn = '';
      switch(diseaseArea) {
        case 'Oncology':
        case 'TA1 - Oncology': taColumn = 'ta1_oncology'; break;
        case 'Cardiovascular':
        case 'TA2 - Cardiovascular': taColumn = 'ta2_cardiovascular'; break;
        case 'Neurology':
        case 'TA3 - Neuroscience': taColumn = 'ta3_neuroscience'; break;
        case 'Immunology':
        case 'TA4 - Immunology & Autoimmune': taColumn = 'ta4_immunology_autoimmune'; break;
        case 'Infectious Diseases':
        case 'TA5 - Infectious Diseases': taColumn = 'ta5_infectious_diseases'; break;
        case 'Rare Diseases':
        case 'TA6 - Respiratory': taColumn = 'ta6_respiratory'; break;
        case 'Metabolic Disorders':
        case 'TA7 - Endocrinology & Metabolic': taColumn = 'ta7_endocrinology_metabolic'; break;
        case 'TA8 - Rare / Orphan': taColumn = 'ta8_rare_orphan'; break;
        case 'TA9 - Hematology': taColumn = 'ta9_hematology'; break;
        case 'TA10 - Gastroenterology': taColumn = 'ta10_gastroenterology'; break;
        case 'TA11 - Dermatology': taColumn = 'ta11_dermatology'; break;
        case 'TA12 - Ophthalmology': taColumn = 'ta12_ophthalmology'; break;
        case 'TA13 - Kidney / Renal': taColumn = 'ta13_kidney_renal'; break;
        case 'TA14 - MSK Disease': taColumn = 'ta14_msk_disease'; break;
        case 'TA15 - Women\'s Health': taColumn = 'ta15_womens_health'; break;
        case 'TA16 - Pain': taColumn = 'ta16_pain'; break;
        case 'TA17 - Urology': taColumn = 'ta17_urology'; break;
        default: taColumn = ''; break;
      }
      
      if (taColumn) {
        console.log('Filtering by TA column:', taColumn);
        console.log('Checking if column exists in data:', taColumn in (biotechData[0] || {}));
        filteredData = biotechData.filter(item => {
          const taValue = item[taColumn];
          console.log('Checking:', item.companyName, 'TA Value:', taValue, 'Type:', typeof taValue, 'Column exists:', taColumn in item);
          return taValue === '1' || taValue === 1 || taValue === true;
        });
        console.log('After disease area filter, records found:', filteredData.length);
      } else {
        console.log('Disease area not found in available options, skipping filter');
      }
    }
    
    // Partner Type (Looking For) - mandatory
    if (partnerType) {
      hasSearchCriteria = true;
      searchCriteria.push('Looking For');
      console.log('Filtering by partner type:', partnerType);
      
      const uniqueTiers = [...new Set(biotechData.map(item => item.tier))];
      console.log('Available tier values in data:', uniqueTiers);
      
      if (uniqueTiers.length > 0 && !uniqueTiers.every(tier => !tier)) {
        filteredData = filteredData.filter(item => {
          const itemTier = item.tier || '';
          let isMatch = false;
          
          console.log('Checking tier for:', item.companyName, 'Item tier:', itemTier, 'Search tier:', partnerType);
          
          // Handle both frontend options and direct tier values
          if (partnerType === 'Tier 1 - Large Pharma' || partnerType === 'Large Pharma') {
            isMatch = itemTier.toLowerCase().includes('large pharma') || 
                     itemTier.toLowerCase().includes('large') ||
                     itemTier.toLowerCase().includes('tier 1');
          } else if (partnerType === 'Tier 2 - Mid-Size' || partnerType === 'Mid-Size') {
            isMatch = itemTier.toLowerCase().includes('mid') || 
                     itemTier.toLowerCase().includes('mid cap') ||
                     itemTier.toLowerCase().includes('tier 2') ||
                     itemTier.toLowerCase().includes('mid-size');
          } else if (partnerType === 'Tier 3 - Small Biotech\'s' || partnerType === 'Small Biotech') {
            isMatch = itemTier.toLowerCase().includes('small') || 
                     itemTier.toLowerCase().includes('small cap') ||
                     itemTier.toLowerCase().includes('tier 3') ||
                     itemTier.toLowerCase().includes('biotech');
          } else {
            // Fallback to direct matching
            isMatch = itemTier.toLowerCase().includes(partnerType.toLowerCase());
          }
          
          console.log('Tier match result:', isMatch, 'for company:', item.companyName);
          return isMatch;
        });
        console.log('After partner type filter, records found:', filteredData.length);
      }
    }
    
    // Development Stage - optional, skip if no stage data available
    if (developmentStage && developmentStage.trim() !== '') {
      console.log('Development stage provided:', developmentStage);
      console.log('Note: Stage of Development column not found in Excel data - skipping stage filter');
      // Don't add to searchCriteria since we're not actually filtering
      // Don't filter data since stage column doesn't exist
      console.log('Stage filter skipped - no stage data available in Excel');
    }
    
    // Modality - optional but if provided, must match
    if (modality) {
      hasSearchCriteria = true;
      searchCriteria.push('Modality');
      console.log('Filtering by modality:', modality);
      filteredData = filteredData.filter(item => {
        const itemModality = item.modality || '';
        let isMatch = false;
        
        console.log('Checking modality for:', item.companyName, 'Item modality:', itemModality, 'Search modality:', modality);
        console.log('Modality type:', typeof itemModality, 'Length:', itemModality.length);
        
        // Handle modality abbreviations (only what's actually in Excel)
        if (modality === 'Small Molecule') {
          isMatch = itemModality.toLowerCase().includes('sm') || itemModality.toLowerCase().includes('small molecule');
        } else if (modality === 'Large Molecule') {
          // Look for "LM" specifically (case insensitive)
          isMatch = itemModality.toLowerCase().includes('lm') || itemModality.toLowerCase().includes('large molecule');
          console.log('Large Molecule check:', itemModality, 'contains LM:', isMatch);
        } else if (modality === 'Cell Therapy') {
          isMatch = itemModality.toLowerCase().includes('ct') || itemModality.toLowerCase().includes('cell therapy');
        } else if (modality === 'Gene Therapy') {
          isMatch = itemModality.toLowerCase().includes('gt') || itemModality.toLowerCase().includes('gene therapy');
        } else if (modality === 'RNA Therapy') {
          isMatch = itemModality.toLowerCase().includes('rna') || itemModality.toLowerCase().includes('rna therapy');
        } else if (modality === 'Biologics') {
          isMatch = itemModality.toLowerCase().includes('bx') || itemModality.toLowerCase().includes('biologics');
        } else if (modality === 'Other') {
          // For "Other", check if it doesn't match any of the main modalities in Excel
          const mainModalities = ['sm', 'lm', 'ct', 'gt', 'rna', 'bx', 'rl', 'vc', 'mb', 'pdt', 'aso', 'st', 'gx'];
          isMatch = !mainModalities.some(mod => itemModality.toLowerCase().includes(mod));
        } else {
          // Fallback to general search
          isMatch = itemModality.toLowerCase().includes(modality.toLowerCase());
        }
        
        console.log('Modality match result:', isMatch, 'for company:', item.companyName);
        return isMatch;
      });
      console.log('After modality filter, records found:', filteredData.length);
    }
    
    // Drug Name - user enters their own drug, don't filter by it, just include it in results
    if (drugName && drugName.trim()) {
      console.log('User drug name:', drugName, '- will be displayed in results, not used for filtering');
      // Don't filter by drug name - user enters their own drug to sell
    }
    
    // Region - only filter if user selected it
    if (region) {
      hasSearchCriteria = true;
      searchCriteria.push('Region');
      console.log('🌍 Filtering by region:', region);
      console.log('🌍 Filtered data count before region filter:', filteredData.length);
      
      // Get ALL unique region values from the data before filtering
      if (filteredData.length > 0) {
        const allRegions = [...new Set(filteredData.map(item => item.region || 'N/A'))];
        console.log('🌍 ALL unique region values in data before filter:', allRegions);
        
        // Check specifically for Oceania-related regions
        const oceaniaRelated = filteredData.filter(item => {
          const region = (item.region || '').toLowerCase();
          return region.includes('australia') || 
                 region.includes('new zealand') || 
                 region.includes('oceania') ||
                 region.includes('nz') ||
                 region === 'nz';
        });
        console.log('🌍 Records with Oceania-related regions found:', oceaniaRelated.length);
        if (oceaniaRelated.length > 0) {
          const oceaniaRegions = [...new Set(oceaniaRelated.slice(0, 10).map(item => item.region || 'N/A'))];
          console.log('🌍 Sample Oceania region values:', oceaniaRegions);
        }
      }
      
      const regionAliasMap = {
        'apac': 'Asia-Pacific',
        'asia pac': 'Asia-Pacific',
        'asia-pacific': 'Asia-Pacific',
        'asia pacific': 'Asia-Pacific',
        'oceania': 'Oceania',
        'australia / nz': 'Oceania',
        'australia/nz': 'Oceania',
        'australia - nz': 'Oceania',
        'australia nz': 'Oceania',
        'australia and nz': 'Oceania',
        'australia & nz': 'Oceania',
        'australia new zealand': 'Oceania',
        'australia/new zealand': 'Oceania',
        'australia / new zealand': 'Oceania',
        'australia & new zealand': 'Oceania',
        'australia - new zealand': 'Oceania',
        'australia-nz': 'Oceania',
        'australia nz (oceania)': 'Oceania',
        'australia / nz (oceania)': 'Oceania',
        'australia / new zealand (oceania)': 'Oceania',
        'middle east and africa': 'Middle East & Africa',
        'middle east & africa': 'Middle East & Africa'
      };

      const normalizedRegionInput = region.trim().toLowerCase();
      const regionFilterValue = regionAliasMap[normalizedRegionInput] || region;
      console.log(`🌍 Normalized region: "${region}" -> "${regionFilterValue}"`);
      if (regionFilterValue !== region) {
        console.log(`Normalized region value for filtering: ${region} -> ${regionFilterValue}`);
      }
      
      let oceaniaMatches = 0;
      let oceaniaRejects = 0;
      
      filteredData = filteredData.filter(item => {
        const itemRegion = item.region || '';
        const itemContinent = item.continent || '';
        let isMatch = false;
        
        // Use continent field for better matching
        const itemRegionLower = itemRegion.toLowerCase();
        const itemContinentLower = itemContinent.toLowerCase();
        
        // Only log for Oceania to reduce noise
        if (regionFilterValue === 'Oceania' && oceaniaMatches + oceaniaRejects < 10) {
          console.log('🌍 Oceania check:', {
            company: item.companyName,
            region: itemRegion,
            regionLower: itemRegionLower,
            continent: itemContinent,
            continentLower: itemContinentLower,
            searchRegion: region
          });
        }
        
        // Handle region variations and abbreviations
        if (regionFilterValue === 'North America') {
          // Exclude Australia and other non-North American countries explicitly
          const isAustralia = itemRegion.toLowerCase().includes('australia');
          const isNewZealand = itemRegion.toLowerCase().includes('new zealand');
          const isEuropean = itemRegion.toLowerCase().includes('germany') || 
                           itemRegion.toLowerCase().includes('france') ||
                           itemRegion.toLowerCase().includes('uk') ||
                           itemRegion.toLowerCase().includes('spain') ||
                           itemRegion.toLowerCase().includes('italy') ||
                           itemRegion.toLowerCase().includes('netherlands') ||
                           itemRegion.toLowerCase().includes('belgium') ||
                           itemRegion.toLowerCase().includes('austria') ||
                           itemRegion.toLowerCase().includes('finland') ||
                           itemRegion.toLowerCase().includes('poland') ||
                           itemRegion.toLowerCase().includes('norway') ||
                           itemRegion.toLowerCase().includes('hungary') ||
                           itemRegion.toLowerCase().includes('sweden') ||
                           itemRegion.toLowerCase().includes('iceland') ||
                           itemRegion.toLowerCase().includes('greece') ||
                           itemRegion.toLowerCase().includes('switzerland') ||
                           itemRegion.toLowerCase().includes('denmark') ||
                           itemRegion.toLowerCase().includes('ireland') ||
                           itemRegion.toLowerCase().includes('czech republic') ||
                           itemRegion.toLowerCase().includes('czech') ||
                           itemRegion.toLowerCase().includes('portugal') ||
                           itemRegion.toLowerCase().includes('estonia') ||
                           itemRegion.toLowerCase().includes('luxembourg') ||
                           itemRegion.toLowerCase().includes('malta') ||
                           itemRegion.toLowerCase().includes('slovenia') ||
                           itemRegion.toLowerCase().includes('romania') ||
                           itemRegion.toLowerCase().includes('slovakia') ||
                           itemRegion.toLowerCase().includes('lithuania');
          const isAsian = itemRegion.toLowerCase().includes('japan') || 
                         itemRegion.toLowerCase().includes('china') ||
                         itemRegion.toLowerCase().includes('india') ||
                         itemRegion.toLowerCase().includes('south korea') ||
                         itemRegion.toLowerCase().includes('israel') ||
                         itemRegion.toLowerCase().includes('taiwan') ||
                         itemRegion.toLowerCase().includes('uae') ||
                         itemRegion.toLowerCase().includes('singapore') ||
                         itemRegion.toLowerCase().includes('hong kong') ||
                         itemRegion.toLowerCase().includes('saudi arabia') ||
                         itemRegion.toLowerCase().includes('turkey');
          
          isMatch = !isAustralia && !isNewZealand && !isEuropean && !isAsian && (
                   itemContinent === 'North America' || 
                   itemRegion.toLowerCase().includes('usa') || 
                   itemRegion.toLowerCase().includes('united states') ||
                   itemRegion.toLowerCase().includes('us') ||
                   itemRegion.toLowerCase().includes('canada') ||
                   itemRegion.toLowerCase().includes('mexico')
          );
        } else if (regionFilterValue === 'Europe') {
          // Exclude non-European countries explicitly
          const isNorthAmerican = itemRegion.toLowerCase().includes('usa') || 
                                itemRegion.toLowerCase().includes('united states') ||
                                itemRegion.toLowerCase().includes('us') ||
                                itemRegion.toLowerCase().includes('canada') ||
                                itemRegion.toLowerCase().includes('mexico');
          const isAustralian = itemRegion.toLowerCase().includes('australia') ||
                              itemRegion.toLowerCase().includes('new zealand');
          const isAsian = itemRegion.toLowerCase().includes('japan') || 
                         itemRegion.toLowerCase().includes('china') ||
                         itemRegion.toLowerCase().includes('india') ||
                         itemRegion.toLowerCase().includes('south korea') ||
                         itemRegion.toLowerCase().includes('israel') ||
                         itemRegion.toLowerCase().includes('taiwan') ||
                         itemRegion.toLowerCase().includes('uae') ||
                         itemRegion.toLowerCase().includes('singapore') ||
                         itemRegion.toLowerCase().includes('hong kong') ||
                         itemRegion.toLowerCase().includes('saudi arabia') ||
                         itemRegion.toLowerCase().includes('turkey');
          const isAfrican = itemRegion.toLowerCase().includes('egypt') ||
                           itemRegion.toLowerCase().includes('south africa');
          const isSouthAmerican = itemRegion.toLowerCase().includes('brazil') ||
                                 itemRegion.toLowerCase().includes('chile') ||
                                 itemRegion.toLowerCase().includes('colombia') ||
                                 itemRegion.toLowerCase().includes('uruguay');
          
          isMatch = !isNorthAmerican && !isAustralian && !isAsian && !isAfrican && !isSouthAmerican && (
                   itemContinent === 'Europe' ||
                   itemRegion.toLowerCase().includes('germany') || 
                   itemRegion.toLowerCase().includes('france') ||
                   itemRegion.toLowerCase().includes('switzerland') ||
                   itemRegion.toLowerCase().includes('denmark') ||
                   itemRegion.toLowerCase().includes('uk') ||
                   itemRegion.toLowerCase().includes('spain') ||
                   itemRegion.toLowerCase().includes('italy') ||
                   itemRegion.toLowerCase().includes('netherlands') ||
                   itemRegion.toLowerCase().includes('belgium') ||
                   itemRegion.toLowerCase().includes('austria') ||
                   itemRegion.toLowerCase().includes('finland') ||
                   itemRegion.toLowerCase().includes('poland') ||
                   itemRegion.toLowerCase().includes('norway') ||
                   itemRegion.toLowerCase().includes('hungary') ||
                   itemRegion.toLowerCase().includes('sweden') ||
                   itemRegion.toLowerCase().includes('iceland') ||
                   itemRegion.toLowerCase().includes('greece') ||
                   itemRegion.toLowerCase().includes('ireland') ||
                   itemRegion.toLowerCase().includes('czech republic') ||
                   itemRegion.toLowerCase().includes('czech') ||
                   itemRegion.toLowerCase().includes('portugal') ||
                   itemRegion.toLowerCase().includes('estonia') ||
                   itemRegion.toLowerCase().includes('luxembourg') ||
                   itemRegion.toLowerCase().includes('malta') ||
                   itemRegion.toLowerCase().includes('slovenia') ||
                   itemRegion.toLowerCase().includes('romania') ||
                   itemRegion.toLowerCase().includes('slovakia') ||
                   itemRegion.toLowerCase().includes('lithuania')
          );
        } else if (regionFilterValue === 'Asia-Pacific') {
          // Exclude non-Asian countries explicitly
          const isNorthAmerican = itemRegion.toLowerCase().includes('usa') || 
                                itemRegion.toLowerCase().includes('united states') ||
                                itemRegion.toLowerCase().includes('us') ||
                                itemRegion.toLowerCase().includes('canada') ||
                                itemRegion.toLowerCase().includes('mexico');
          const isEuropean = itemRegion.toLowerCase().includes('germany') || 
                           itemRegion.toLowerCase().includes('france') ||
                           itemRegion.toLowerCase().includes('uk') ||
                           itemRegion.toLowerCase().includes('spain') ||
                           itemRegion.toLowerCase().includes('italy') ||
                           itemRegion.toLowerCase().includes('netherlands') ||
                           itemRegion.toLowerCase().includes('belgium') ||
                           itemRegion.toLowerCase().includes('austria') ||
                           itemRegion.toLowerCase().includes('finland') ||
                           itemRegion.toLowerCase().includes('poland') ||
                           itemRegion.toLowerCase().includes('norway') ||
                           itemRegion.toLowerCase().includes('hungary') ||
                           itemRegion.toLowerCase().includes('sweden') ||
                           itemRegion.toLowerCase().includes('iceland') ||
                           itemRegion.toLowerCase().includes('greece') ||
                           itemRegion.toLowerCase().includes('switzerland') ||
                           itemRegion.toLowerCase().includes('denmark') ||
                           itemRegion.toLowerCase().includes('ireland') ||
                           itemRegion.toLowerCase().includes('czech republic') ||
                           itemRegion.toLowerCase().includes('czech') ||
                           itemRegion.toLowerCase().includes('portugal') ||
                           itemRegion.toLowerCase().includes('estonia') ||
                           itemRegion.toLowerCase().includes('luxembourg') ||
                           itemRegion.toLowerCase().includes('malta') ||
                           itemRegion.toLowerCase().includes('slovenia') ||
                           itemRegion.toLowerCase().includes('romania') ||
                           itemRegion.toLowerCase().includes('slovakia') ||
                           itemRegion.toLowerCase().includes('lithuania');
          const isAustralian = itemRegion.toLowerCase().includes('australia') ||
                              itemRegion.toLowerCase().includes('new zealand');
          const isAfrican = itemRegion.toLowerCase().includes('egypt') ||
                           itemRegion.toLowerCase().includes('south africa');
          const isSouthAmerican = itemRegion.toLowerCase().includes('brazil') ||
                                 itemRegion.toLowerCase().includes('chile') ||
                                 itemRegion.toLowerCase().includes('colombia') ||
                                 itemRegion.toLowerCase().includes('uruguay');
          
          isMatch = !isNorthAmerican && !isEuropean && !isAustralian && !isAfrican && !isSouthAmerican && (
                   itemContinent === 'Asia' ||
                   itemRegion.toLowerCase().includes('japan') || 
                   itemRegion.toLowerCase().includes('china') ||
                   itemRegion.toLowerCase().includes('india') ||
                   itemRegion.toLowerCase().includes('south korea') ||
                   itemRegion.toLowerCase().includes('israel') ||
                   itemRegion.toLowerCase().includes('taiwan') ||
                   itemRegion.toLowerCase().includes('uae') ||
                   itemRegion.toLowerCase().includes('singapore') ||
                   itemRegion.toLowerCase().includes('hong kong') ||
                   itemRegion.toLowerCase().includes('saudi arabia') ||
                   itemRegion.toLowerCase().includes('turkey')
          );
        } else if (regionFilterValue === 'Asia') {
          // Exclude non-Asian countries explicitly
          const isNorthAmerican = itemRegion.toLowerCase().includes('usa') || 
                                itemRegion.toLowerCase().includes('united states') ||
                                itemRegion.toLowerCase().includes('us') ||
                                itemRegion.toLowerCase().includes('canada') ||
                                itemRegion.toLowerCase().includes('mexico');
          const isEuropean = itemRegion.toLowerCase().includes('germany') || 
                           itemRegion.toLowerCase().includes('france') ||
                           itemRegion.toLowerCase().includes('uk') ||
                           itemRegion.toLowerCase().includes('spain') ||
                           itemRegion.toLowerCase().includes('italy') ||
                           itemRegion.toLowerCase().includes('netherlands') ||
                           itemRegion.toLowerCase().includes('belgium') ||
                           itemRegion.toLowerCase().includes('austria') ||
                           itemRegion.toLowerCase().includes('finland') ||
                           itemRegion.toLowerCase().includes('poland') ||
                           itemRegion.toLowerCase().includes('norway') ||
                           itemRegion.toLowerCase().includes('hungary') ||
                           itemRegion.toLowerCase().includes('sweden') ||
                           itemRegion.toLowerCase().includes('iceland') ||
                           itemRegion.toLowerCase().includes('greece') ||
                           itemRegion.toLowerCase().includes('switzerland') ||
                           itemRegion.toLowerCase().includes('denmark') ||
                           itemRegion.toLowerCase().includes('ireland') ||
                           itemRegion.toLowerCase().includes('czech republic') ||
                           itemRegion.toLowerCase().includes('czech') ||
                           itemRegion.toLowerCase().includes('portugal') ||
                           itemRegion.toLowerCase().includes('estonia') ||
                           itemRegion.toLowerCase().includes('luxembourg') ||
                           itemRegion.toLowerCase().includes('malta') ||
                           itemRegion.toLowerCase().includes('slovenia') ||
                           itemRegion.toLowerCase().includes('romania') ||
                           itemRegion.toLowerCase().includes('slovakia') ||
                           itemRegion.toLowerCase().includes('lithuania');
          const isAustralian = itemRegion.toLowerCase().includes('australia') ||
                              itemRegion.toLowerCase().includes('new zealand');
          const isAfrican = itemRegion.toLowerCase().includes('egypt') ||
                           itemRegion.toLowerCase().includes('south africa');
          const isSouthAmerican = itemRegion.toLowerCase().includes('brazil') ||
                                 itemRegion.toLowerCase().includes('chile') ||
                                 itemRegion.toLowerCase().includes('colombia') ||
                                 itemRegion.toLowerCase().includes('uruguay');
          
          isMatch = !isNorthAmerican && !isEuropean && !isAustralian && !isAfrican && !isSouthAmerican && (
                   itemContinent === 'Asia' ||
                   itemRegion.toLowerCase().includes('japan') || 
                   itemRegion.toLowerCase().includes('china') ||
                   itemRegion.toLowerCase().includes('india') ||
                   itemRegion.toLowerCase().includes('south korea') ||
                   itemRegion.toLowerCase().includes('israel') ||
                   itemRegion.toLowerCase().includes('taiwan') ||
                   itemRegion.toLowerCase().includes('uae') ||
                   itemRegion.toLowerCase().includes('singapore') ||
                   itemRegion.toLowerCase().includes('hong kong') ||
                   itemRegion.toLowerCase().includes('saudi arabia') ||
                   itemRegion.toLowerCase().includes('turkey')
          );
        } else if (regionFilterValue === 'Oceania') {
          // FIRST: Check if it's Oceania (positive match) - be very flexible
          // Check for Oceania countries - Australia and New Zealand variants
          const isAustralia = itemRegionLower.includes('australia') || 
                             itemRegionLower.includes('aus ') ||
                             itemRegionLower.startsWith('aus ') ||
                             itemRegionLower === 'aus' ||
                             itemRegionLower.trim() === 'aus';
                             
          const containsNZVariant = itemRegionLower.includes('new zealand') ||
                                   itemRegionLower.includes('new-zealand') ||
                                   itemRegionLower.includes('newzealand') ||
                                   itemRegionLower.includes('new_zealand') ||
                                   itemRegionLower.includes('australia / nz') ||
                                   itemRegionLower.includes('australia & nz') ||
                                   itemRegionLower.includes('australia-nz') ||
                                   itemRegionLower.includes('australia nz') ||
                                   itemRegionLower.includes('australia/nz') ||
                                   itemRegionLower.includes('australia&nz') ||
                                   itemRegionLower.includes('australia_nz') ||
                                   itemRegionLower.includes(' nz ') ||
                                   itemRegionLower.endsWith(' nz') ||
                                   itemRegionLower === 'nz' ||
                                   itemRegionLower.trim() === 'nz' ||
                                   itemRegionLower.startsWith('nz ') ||
                                   itemRegionLower.endsWith('/nz') ||
                                   itemRegionLower.endsWith('&nz') ||
                                   itemRegionLower.endsWith('_nz') ||
                                   itemRegionLower.includes('new z') ||
                                   // If it has "nz" and is not from excluded regions (Brazil, Switzerland)
                                   (itemRegionLower.includes('nz') && 
                                    !itemRegionLower.includes('brazil') && 
                                    !itemRegionLower.includes('switzerland') &&
                                    !itemRegionLower.includes('brazi') &&
                                    !itemRegionLower.includes('swiss'));
          
          // Check continent field if it exists
          const isOceaniaContinent = itemContinentLower === 'oceania' ||
                                    itemContinentLower.includes('oceania') ||
                                    itemContinentLower.includes('australia') ||
                                    itemContinentLower.includes('new zealand');
          
          // Check if region contains "oceania" (case insensitive)
          const hasOceaniaInRegion = itemRegionLower.includes('oceania') ||
                                    itemRegionLower === 'oceania' ||
                                    itemRegionLower.trim() === 'oceania';
          
          // Positive match: Is it Oceania?
          const isOceaniaPositiveMatch = isOceaniaContinent ||
                                        isAustralia ||
                                        containsNZVariant ||
                                        hasOceaniaInRegion;
          
          // If it's NOT a positive Oceania match, exclude it
          if (!isOceaniaPositiveMatch) {
            isMatch = false;
          } else {
            // SECOND: If it's Oceania, check exclusions (only exclude if clearly from other regions)
            // Default to true if it's a positive Oceania match, then exclude only if clearly from another region
            isMatch = true; // Start with true for positive Oceania matches
            
            // Only exclude if it's CLEARLY from another region AND not Oceania
            // Be very careful - don't exclude if there's any Oceania indicator
            const hasNorthAmericanOnly = (itemRegionLower.includes('usa') || 
                                itemRegionLower.includes('united states') ||
                                itemRegionLower.includes('us') ||
                                itemRegionLower.includes('canada') ||
                                itemRegionLower.includes('mexico')) &&
                                !isAustralia && 
                                !containsNZVariant &&
                                !isOceaniaContinent &&
                                !hasOceaniaInRegion;
                                    
            const hasEuropeanOnly = (itemRegionLower.includes('germany') || 
                           itemRegionLower.includes('france') ||
                           itemRegionLower.includes('uk') ||
                           itemRegionLower.includes('spain') ||
                           itemRegionLower.includes('italy') ||
                           itemRegionLower.includes('netherlands') ||
                           itemRegionLower.includes('belgium') ||
                           itemRegionLower.includes('austria') ||
                           itemRegionLower.includes('finland') ||
                           itemRegionLower.includes('poland') ||
                           itemRegionLower.includes('norway') ||
                           itemRegionLower.includes('hungary') ||
                           itemRegionLower.includes('sweden') ||
                           itemRegionLower.includes('iceland') ||
                           itemRegionLower.includes('greece') ||
                           itemRegionLower.includes('switzerland') ||
                           itemRegionLower.includes('denmark') ||
                           itemRegionLower.includes('ireland') ||
                           itemRegionLower.includes('czech republic') ||
                           itemRegionLower.includes('czech') ||
                           itemRegionLower.includes('portugal') ||
                           itemRegionLower.includes('estonia') ||
                           itemRegionLower.includes('luxembourg') ||
                           itemRegionLower.includes('malta') ||
                           itemRegionLower.includes('slovenia') ||
                           itemRegionLower.includes('romania') ||
                           itemRegionLower.includes('slovakia') ||
                           itemRegionLower.includes('lithuania')) &&
                           !isAustralia && 
                           !containsNZVariant &&
                           !isOceaniaContinent &&
                           !hasOceaniaInRegion;
                               
            const hasAsianOnly = (itemRegionLower.includes('japan') || 
                         itemRegionLower.includes('china') ||
                         itemRegionLower.includes('india') ||
                         itemRegionLower.includes('south korea') ||
                         itemRegionLower.includes('israel') ||
                         itemRegionLower.includes('taiwan') ||
                         itemRegionLower.includes('uae') ||
                         itemRegionLower.includes('singapore') ||
                         itemRegionLower.includes('hong kong') ||
                         itemRegionLower.includes('saudi arabia') ||
                         itemRegionLower.includes('turkey')) &&
                         !isAustralia && 
                         !containsNZVariant &&
                         !isOceaniaContinent &&
                         !hasOceaniaInRegion;
                           
            const hasAfricanOnly = (itemRegionLower.includes('egypt') ||
                             itemRegionLower.includes('south africa')) &&
                             !isAustralia &&
                             !containsNZVariant &&
                             !isOceaniaContinent &&
                             !hasOceaniaInRegion;
                             
            const hasSouthAmericanOnly = (itemRegionLower.includes('brazil') ||
                                 itemRegionLower.includes('chile') ||
                                 itemRegionLower.includes('colombia') ||
                                 itemRegionLower.includes('uruguay')) &&
                                 !isAustralia &&
                                 !containsNZVariant &&
                                 !isOceaniaContinent &&
                                 !hasOceaniaInRegion;
            
            // Exclude only if it's clearly from another region (no Oceania indicators)
            if (hasNorthAmericanOnly || hasEuropeanOnly || hasAsianOnly || hasAfricanOnly || hasSouthAmericanOnly) {
              isMatch = false;
            }
          }
          
          // Only log first few Oceania checks for debugging
          if (oceaniaMatches + oceaniaRejects < 5) {
            console.log('🌍 Oceania filter check:', {
              companyName: item.companyName,
              itemRegion: itemRegion,
              itemRegionLower: itemRegionLower,
              itemContinent: itemContinent,
              itemContinentLower: itemContinentLower,
              isAustralia: isAustralia,
              containsNZVariant: containsNZVariant,
              isOceaniaPositiveMatch: isOceaniaContinent || isAustralia || containsNZVariant || hasOceaniaInRegion,
              isMatch: isMatch
            });
          }
          
          if (isMatch) oceaniaMatches++;
          else oceaniaRejects++;
        } else if (regionFilterValue === 'Middle East & Africa') {
          // Exclude non-Middle East & African countries explicitly
          const isNorthAmerican = itemRegion.toLowerCase().includes('usa') || 
                                itemRegion.toLowerCase().includes('united states') ||
                                itemRegion.toLowerCase().includes('us') ||
                                itemRegion.toLowerCase().includes('canada') ||
                                itemRegion.toLowerCase().includes('mexico');
          const isEuropean = itemRegion.toLowerCase().includes('germany') || 
                           itemRegion.toLowerCase().includes('france') ||
                           itemRegion.toLowerCase().includes('uk') ||
                           itemRegion.toLowerCase().includes('spain') ||
                           itemRegion.toLowerCase().includes('italy') ||
                           itemRegion.toLowerCase().includes('netherlands') ||
                           itemRegion.toLowerCase().includes('belgium') ||
                           itemRegion.toLowerCase().includes('austria') ||
                           itemRegion.toLowerCase().includes('finland') ||
                           itemRegion.toLowerCase().includes('poland') ||
                           itemRegion.toLowerCase().includes('norway') ||
                           itemRegion.toLowerCase().includes('hungary') ||
                           itemRegion.toLowerCase().includes('sweden') ||
                           itemRegion.toLowerCase().includes('iceland') ||
                           itemRegion.toLowerCase().includes('greece') ||
                           itemRegion.toLowerCase().includes('switzerland') ||
                           itemRegion.toLowerCase().includes('denmark') ||
                           itemRegion.toLowerCase().includes('ireland') ||
                           itemRegion.toLowerCase().includes('czech republic') ||
                           itemRegion.toLowerCase().includes('czech') ||
                           itemRegion.toLowerCase().includes('portugal') ||
                           itemRegion.toLowerCase().includes('estonia') ||
                           itemRegion.toLowerCase().includes('luxembourg') ||
                           itemRegion.toLowerCase().includes('malta') ||
                           itemRegion.toLowerCase().includes('slovenia') ||
                           itemRegion.toLowerCase().includes('romania') ||
                           itemRegion.toLowerCase().includes('slovakia') ||
                           itemRegion.toLowerCase().includes('lithuania');
          const isAsian = itemRegion.toLowerCase().includes('japan') || 
                         itemRegion.toLowerCase().includes('china') ||
                         itemRegion.toLowerCase().includes('india') ||
                         itemRegion.toLowerCase().includes('south korea');
          const isAustralian = itemRegion.toLowerCase().includes('australia') ||
                              itemRegion.toLowerCase().includes('new zealand');
          const isSouthAmerican = itemRegion.toLowerCase().includes('brazil') ||
                                 itemRegion.toLowerCase().includes('chile') ||
                                 itemRegion.toLowerCase().includes('colombia') ||
                                 itemRegion.toLowerCase().includes('uruguay');
          
          isMatch = !isNorthAmerican && !isEuropean && !isAsian && !isAustralian && !isSouthAmerican && (
                   itemContinent === 'Africa' ||
                   itemRegion.toLowerCase().includes('egypt') ||
                   itemRegion.toLowerCase().includes('uae') ||
                   itemRegion.toLowerCase().includes('saudi arabia') ||
                   itemRegion.toLowerCase().includes('israel') ||
                   itemRegion.toLowerCase().includes('turkey')
          );
        } else if (regionFilterValue === 'Africa') {
          // Exclude non-African countries explicitly
          const isNorthAmerican = itemRegion.toLowerCase().includes('usa') || 
                                itemRegion.toLowerCase().includes('united states') ||
                                itemRegion.toLowerCase().includes('us') ||
                                itemRegion.toLowerCase().includes('canada') ||
                                itemRegion.toLowerCase().includes('mexico');
          const isEuropean = itemRegion.toLowerCase().includes('germany') || 
                           itemRegion.toLowerCase().includes('france') ||
                           itemRegion.toLowerCase().includes('uk') ||
                           itemRegion.toLowerCase().includes('spain') ||
                           itemRegion.toLowerCase().includes('italy') ||
                           itemRegion.toLowerCase().includes('netherlands') ||
                           itemRegion.toLowerCase().includes('belgium') ||
                           itemRegion.toLowerCase().includes('austria') ||
                           itemRegion.toLowerCase().includes('finland') ||
                           itemRegion.toLowerCase().includes('poland') ||
                           itemRegion.toLowerCase().includes('norway') ||
                           itemRegion.toLowerCase().includes('hungary') ||
                           itemRegion.toLowerCase().includes('sweden') ||
                           itemRegion.toLowerCase().includes('iceland') ||
                           itemRegion.toLowerCase().includes('greece') ||
                           itemRegion.toLowerCase().includes('switzerland') ||
                           itemRegion.toLowerCase().includes('denmark') ||
                           itemRegion.toLowerCase().includes('ireland') ||
                           itemRegion.toLowerCase().includes('czech republic') ||
                           itemRegion.toLowerCase().includes('czech') ||
                           itemRegion.toLowerCase().includes('portugal') ||
                           itemRegion.toLowerCase().includes('estonia') ||
                           itemRegion.toLowerCase().includes('luxembourg') ||
                           itemRegion.toLowerCase().includes('malta') ||
                           itemRegion.toLowerCase().includes('slovenia') ||
                           itemRegion.toLowerCase().includes('romania') ||
                           itemRegion.toLowerCase().includes('slovakia') ||
                           itemRegion.toLowerCase().includes('lithuania');
          const isAsian = itemRegion.toLowerCase().includes('japan') || 
                         itemRegion.toLowerCase().includes('china') ||
                         itemRegion.toLowerCase().includes('india') ||
                         itemRegion.toLowerCase().includes('south korea') ||
                         itemRegion.toLowerCase().includes('israel') ||
                         itemRegion.toLowerCase().includes('taiwan') ||
                         itemRegion.toLowerCase().includes('uae') ||
                         itemRegion.toLowerCase().includes('singapore') ||
                         itemRegion.toLowerCase().includes('hong kong') ||
                         itemRegion.toLowerCase().includes('saudi arabia') ||
                         itemRegion.toLowerCase().includes('turkey');
          const isAustralian = itemRegion.toLowerCase().includes('australia') ||
                              itemRegion.toLowerCase().includes('new zealand');
          const isSouthAmerican = itemRegion.toLowerCase().includes('brazil') ||
                                 itemRegion.toLowerCase().includes('chile') ||
                                 itemRegion.toLowerCase().includes('colombia') ||
                                 itemRegion.toLowerCase().includes('uruguay');
          
          isMatch = !isNorthAmerican && !isEuropean && !isAsian && !isAustralian && !isSouthAmerican && (
                   itemContinent === 'Africa' ||
                   itemRegion.toLowerCase().includes('egypt')
          );
        } else if (regionFilterValue === 'Latin America') {
          // Exclude non-South American countries explicitly
          const isNorthAmerican = itemRegion.toLowerCase().includes('usa') || 
                                itemRegion.toLowerCase().includes('united states') ||
                                itemRegion.toLowerCase().includes('us') ||
                                itemRegion.toLowerCase().includes('canada') ||
                                itemRegion.toLowerCase().includes('mexico');
          const isEuropean = itemRegion.toLowerCase().includes('germany') || 
                           itemRegion.toLowerCase().includes('france') ||
                           itemRegion.toLowerCase().includes('uk') ||
                           itemRegion.toLowerCase().includes('spain') ||
                           itemRegion.toLowerCase().includes('italy') ||
                           itemRegion.toLowerCase().includes('netherlands') ||
                           itemRegion.toLowerCase().includes('belgium') ||
                           itemRegion.toLowerCase().includes('austria') ||
                           itemRegion.toLowerCase().includes('finland') ||
                           itemRegion.toLowerCase().includes('poland') ||
                           itemRegion.toLowerCase().includes('norway') ||
                           itemRegion.toLowerCase().includes('hungary') ||
                           itemRegion.toLowerCase().includes('sweden') ||
                           itemRegion.toLowerCase().includes('iceland') ||
                           itemRegion.toLowerCase().includes('greece') ||
                           itemRegion.toLowerCase().includes('switzerland') ||
                           itemRegion.toLowerCase().includes('denmark') ||
                           itemRegion.toLowerCase().includes('ireland') ||
                           itemRegion.toLowerCase().includes('czech republic') ||
                           itemRegion.toLowerCase().includes('czech') ||
                           itemRegion.toLowerCase().includes('portugal') ||
                           itemRegion.toLowerCase().includes('estonia') ||
                           itemRegion.toLowerCase().includes('luxembourg') ||
                           itemRegion.toLowerCase().includes('malta') ||
                           itemRegion.toLowerCase().includes('slovenia') ||
                           itemRegion.toLowerCase().includes('romania') ||
                           itemRegion.toLowerCase().includes('slovakia') ||
                           itemRegion.toLowerCase().includes('lithuania');
          const isAsian = itemRegion.toLowerCase().includes('japan') || 
                         itemRegion.toLowerCase().includes('china') ||
                         itemRegion.toLowerCase().includes('india') ||
                         itemRegion.toLowerCase().includes('south korea') ||
                         itemRegion.toLowerCase().includes('israel') ||
                         itemRegion.toLowerCase().includes('taiwan') ||
                         itemRegion.toLowerCase().includes('uae') ||
                         itemRegion.toLowerCase().includes('singapore') ||
                         itemRegion.toLowerCase().includes('hong kong') ||
                         itemRegion.toLowerCase().includes('saudi arabia') ||
                         itemRegion.toLowerCase().includes('turkey');
          const isAustralian = itemRegion.toLowerCase().includes('australia') ||
                              itemRegion.toLowerCase().includes('new zealand');
          const isAfrican = itemRegion.toLowerCase().includes('egypt') ||
                           itemRegion.toLowerCase().includes('south africa');
          
          isMatch = !isNorthAmerican && !isEuropean && !isAsian && !isAustralian && !isAfrican && (
                   itemContinent === 'South America' ||
                   itemRegion.toLowerCase().includes('brazil') ||
                   itemRegion.toLowerCase().includes('chile') ||
                   itemRegion.toLowerCase().includes('colombia') ||
                   itemRegion.toLowerCase().includes('uruguay')
          );
        } else if (regionFilterValue === 'South America') {
          // Exclude non-South American countries explicitly
          const isNorthAmerican = itemRegion.toLowerCase().includes('usa') || 
                                itemRegion.toLowerCase().includes('united states') ||
                                itemRegion.toLowerCase().includes('us') ||
                                itemRegion.toLowerCase().includes('canada') ||
                                itemRegion.toLowerCase().includes('mexico');
          const isEuropean = itemRegion.toLowerCase().includes('germany') || 
                           itemRegion.toLowerCase().includes('france') ||
                           itemRegion.toLowerCase().includes('uk') ||
                           itemRegion.toLowerCase().includes('spain') ||
                           itemRegion.toLowerCase().includes('italy') ||
                           itemRegion.toLowerCase().includes('netherlands') ||
                           itemRegion.toLowerCase().includes('belgium') ||
                           itemRegion.toLowerCase().includes('austria') ||
                           itemRegion.toLowerCase().includes('finland') ||
                           itemRegion.toLowerCase().includes('poland') ||
                           itemRegion.toLowerCase().includes('norway') ||
                           itemRegion.toLowerCase().includes('hungary') ||
                           itemRegion.toLowerCase().includes('sweden') ||
                           itemRegion.toLowerCase().includes('iceland') ||
                           itemRegion.toLowerCase().includes('greece') ||
                           itemRegion.toLowerCase().includes('switzerland') ||
                           itemRegion.toLowerCase().includes('denmark') ||
                           itemRegion.toLowerCase().includes('ireland') ||
                           itemRegion.toLowerCase().includes('czech republic') ||
                           itemRegion.toLowerCase().includes('czech') ||
                           itemRegion.toLowerCase().includes('portugal') ||
                           itemRegion.toLowerCase().includes('estonia') ||
                           itemRegion.toLowerCase().includes('luxembourg') ||
                           itemRegion.toLowerCase().includes('malta') ||
                           itemRegion.toLowerCase().includes('slovenia') ||
                           itemRegion.toLowerCase().includes('romania') ||
                           itemRegion.toLowerCase().includes('slovakia') ||
                           itemRegion.toLowerCase().includes('lithuania');
          const isAsian = itemRegion.toLowerCase().includes('japan') || 
                         itemRegion.toLowerCase().includes('china') ||
                         itemRegion.toLowerCase().includes('india') ||
                         itemRegion.toLowerCase().includes('south korea') ||
                         itemRegion.toLowerCase().includes('israel') ||
                         itemRegion.toLowerCase().includes('taiwan') ||
                         itemRegion.toLowerCase().includes('uae') ||
                         itemRegion.toLowerCase().includes('singapore') ||
                         itemRegion.toLowerCase().includes('hong kong') ||
                         itemRegion.toLowerCase().includes('saudi arabia') ||
                         itemRegion.toLowerCase().includes('turkey');
          const isAustralian = itemRegion.toLowerCase().includes('australia') ||
                              itemRegion.toLowerCase().includes('new zealand');
          const isAfrican = itemRegion.toLowerCase().includes('egypt') ||
                           itemRegion.toLowerCase().includes('south africa');
          
          isMatch = !isNorthAmerican && !isEuropean && !isAsian && !isAustralian && !isAfrican && (
                   itemContinent === 'South America' ||
                   itemRegion.toLowerCase().includes('brazil') ||
                   itemRegion.toLowerCase().includes('chile') ||
                   itemRegion.toLowerCase().includes('colombia') ||
                   itemRegion.toLowerCase().includes('uruguay')
          );
        } else {
          // Fallback to general search for specific countries
          const fallbackRegionValue = regionFilterValue.toLowerCase();
          isMatch = itemRegionLower.includes(fallbackRegionValue) ||
                   itemContinentLower.includes(fallbackRegionValue);
        }
        
        // Only log if it's Oceania or first few matches
        if (regionFilterValue === 'Oceania' && (oceaniaMatches + oceaniaRejects < 10 || isMatch)) {
          console.log('🌍 Region match result:', isMatch, 'for company:', item.companyName, 'Region:', itemRegion);
        } else if (regionFilterValue !== 'Oceania' && oceaniaMatches === 0 && oceaniaRejects < 5) {
        console.log('Region match result:', isMatch, 'for company:', item.companyName);
        }
        return isMatch;
      });
      
      if (regionFilterValue === 'Oceania') {
        console.log(`🌍 Oceania filter results: ${oceaniaMatches} matches, ${oceaniaRejects} rejects`);
      }
      console.log('🌍 After region filter, records found:', filteredData.length);
    }
    // Function - only filter if user selected it
    if (contactFunction) {
      hasSearchCriteria = true;
      searchCriteria.push('Function');
      console.log('Filtering by function:', contactFunction);
      filteredData = filteredData.filter(item => {
        const itemFunction = item.contactFunction || '';
        let isMatch = false;
        
        console.log('Checking function for:', item.companyName, 'Item function:', itemFunction, 'Search function:', contactFunction);
        
        // Handle frontend function options
        if (contactFunction === 'Business Development') {
          // Find all BD-related functions
          isMatch = itemFunction.toLowerCase().includes('business development') || 
                   itemFunction.toLowerCase().includes('bd') ||
                   itemFunction.toLowerCase().includes('business dev') ||
                   itemFunction.toLowerCase().includes('regulatory bd') ||
                   itemFunction.toLowerCase().includes('r&d business development') ||
                   itemFunction.toLowerCase().includes('international business development');
        } else if (contactFunction === 'Non-BD') {
          // Find all non-BD functions (exclude BD-related, but include NA/Not Defined)
          const isBD = itemFunction.toLowerCase().includes('business development') || 
                      itemFunction.toLowerCase().includes('bd') ||
                      itemFunction.toLowerCase().includes('business dev') ||
                      itemFunction.toLowerCase().includes('regulatory bd') ||
                      itemFunction.toLowerCase().includes('r&d business development') ||
                      itemFunction.toLowerCase().includes('international business development');
          isMatch = !isBD; // Include all non-BD functions including NA/Not Defined
        } else if (contactFunction === 'All') {
          // Show both BD and non-BD functions (include all functions including NA/Not Defined)
          isMatch = true; // Include all functions
        } else {
          // Fallback to general search for specific functions
          isMatch = itemFunction.toLowerCase().includes(contactFunction.toLowerCase());
        }
        
        console.log('Function match result:', isMatch, 'for company:', item.companyName);
        return isMatch;
      });
      console.log('After function filter, records found:', filteredData.length);
    }
    
    console.log('Search criteria provided:', searchCriteria);
    console.log('Filtered data count:', filteredData.length);
    
    // Debug: Count unique companies and contacts in filtered data
    const uniqueCompanies = new Set(filteredData.map(item => item.companyName));
    const uniqueContacts = new Set(filteredData.map(item => item.email));
    console.log('🔍 Debug - Unique companies in filtered data:', uniqueCompanies.size);
    console.log('🔍 Debug - Unique contacts in filtered data:', uniqueContacts.size);
    
    // Debug: Check UCB specifically
    const ucbRecords = filteredData.filter(item => 
      item.companyName && item.companyName.toLowerCase().includes('ucb')
    );
    console.log('🔍 Debug - UCB records found:', ucbRecords.length);
    console.log('🔍 Debug - UCB unique contacts:', new Set(ucbRecords.map(item => item.email)).size);

    // If no search criteria provided, return empty results
    if (!hasSearchCriteria) {
      console.log('No search criteria provided. Returning empty results.');
      return res.json({
        success: true,
        data: {
          results: [],
          totalFound: 0,
          totalShown: 0,
          hasMore: false,
          message: 'Please select at least Disease Area and Looking For to search, or use the search bar to find companies or contacts.'
        }
      });
    }
    
    // If search criteria provided but no matches found, return empty results
    if (hasSearchCriteria && filteredData.length === 0) {
      console.log('Search criteria provided but no matches found. Returning empty results.');
      return res.json({
        success: true,
        data: {
          results: [],
          totalFound: 0,
          totalShown: 0,
          hasMore: false,
          message: `No Match Found. Please Refine Your Search Criterion`
        }
      });
    }
    
    // Show all results without any limits
    let limitedData = filteredData.map(item => ({
      id: item.id,
      companyName: item.companyName,
      contactPerson: item.contactPerson,
      contactTitle: item.contactTitle,
      contactFunction: item.contactFunction,
      region: item.region,
      tier: item.tier,
      modality: item.modality,
      partnerType: item.partnerType,
      // Show email for testing
      email: item.email,
      // Add all TA columns for complete data
      ta1_oncology: item.ta1_oncology,
      ta2_cardiovascular: item.ta2_cardiovascular,
      ta3_neuroscience: item.ta3_neuroscience,
      ta4_immunology_autoimmune: item.ta4_immunology_autoimmune,
      ta5_infectious_diseases: item.ta5_infectious_diseases,
      ta6_respiratory: item.ta6_respiratory,
      ta7_endocrinology_metabolic: item.ta7_endocrinology_metabolic,
      ta8_rare_orphan: item.ta8_rare_orphan,
      ta9_hematology: item.ta9_hematology,
      ta10_gastroenterology: item.ta10_gastroenterology,
      ta11_dermatology: item.ta11_dermatology,
      ta12_ophthalmology: item.ta12_ophthalmology,
      ta13_kidney_renal: item.ta13_kidney_renal,
      ta14_msk_disease: item.ta14_msk_disease,
      ta15_womens_health: item.ta15_womens_health,
      ta16_pain: item.ta16_pain,
      ta17_urology: item.ta17_urology,
      bdPersonTAFocus: item.bdPersonTAFocus
    }));

    // Deduplicate results ONLY for Contact Name searches
    if (searchType === 'Contact Name') {
      console.log('Deduplicating contact results...');
      const seenContacts = new Set();
      limitedData = limitedData.filter(item => {
        // Create a unique key based on contact person, company, and email
        const contactKey = `${item.contactPerson?.toLowerCase() || ''}_${item.companyName?.toLowerCase() || ''}_${item.email?.toLowerCase() || ''}`;
        if (seenContacts.has(contactKey)) {
          console.log('Removing duplicate contact:', item.contactPerson, 'at', item.companyName);
          return false;
        }
        seenContacts.add(contactKey);
        return true;
      });
      console.log('After deduplication, contacts found:', limitedData.length);
    } else {
      // For all other search types, don't deduplicate - show all results
      console.log('No deduplication for search type:', searchType);
    }

    res.json({
      success: true,
      data: {
        results: limitedData,
        totalFound: filteredData.length,
        totalShown: limitedData.length,
        hasMore: false, // Show all results
        message: filteredData.length === 0 ? 'No Match Found. Please Refine Your Search Criterion' : null
      }
    });
    
    // Save search data
    saveDataToFiles('search_performed');
    
  } catch (error) {
    console.error('Error searching biotech data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching data' 
    });
  }
});

// Test endpoint for AI Deal Scanner
app.get('/api/ai-deal-scraper-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'AI Deal Scanner endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// AI Deal Scanner endpoint
app.post('/api/ai-deal-scraper', authenticateToken, [
  body('searchQuery').notEmpty().trim(),
  body('sources').optional().isArray(),
  body('dateRange').isInt({ min: 1, max: 365 }),
  body('userEmail').isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { searchQuery, dateRange, userEmail } = req.body;
    
    console.log(`🤖 AI Deal Scanner started for user: ${userEmail}`);
    console.log(`🔍 Search query: ${searchQuery}`);
    console.log('🛰️ Sources: OpenAI web search');
    console.log(`📅 Date range: ${dateRange} days`);

    // Check user credits (assuming 1 credit per scraping session) - optimized query
    const user = await User.findOne({ email: userEmail }).select('credits').lean();
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.credits < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient credits. Please purchase more credits to use AI Deal Scanner.' 
      });
    }

    // Deduct credit asynchronously (don't wait for it)
    User.findOneAndUpdate(
      { email: userEmail },
      { $inc: { credits: -1 } },
      { new: true }
    ).catch(err => console.error('Error deducting credit:', err));

    // FIXED: Always use 12 months (365 days) for drug deals
    const rangeInDays = 365;
    
    let openAiResult;
    try {
      openAiResult = await searchDealsWithOpenAI(searchQuery, rangeInDays, userEmail);
    } catch (openAiError) {
      console.error('❌ OpenAI API call failed:', openAiError);
      // Return fallback instead of crashing
      openAiResult = { deals: [], sources: [], narrative: '' };
    }
    
    const aggregatedDeals = Array.isArray(openAiResult?.deals) ? [...openAiResult.deals] : [];
    const sourceDetails = [];

    if (openAiResult?.sources?.length) {
      sourceDetails.push(
        ...openAiResult.sources.map((source) => ({
          ...source,
          kind: 'openai_web_search'
        }))
      );
    }

    // Filter out invalid sources (Wikipedia, Trump news, etc.)
    const blockedDomains = ['wikipedia.org', 'wikipedia.com', 'wikimedia.org'];
    const blockedKeywords = ['trump', 'biden', 'election', 'politics', 'president'];
    
    // Filter deals: must have buyer AND seller, no blocked sources, must match indication, no devices
    const searchQueryLower = (searchQuery || '').toLowerCase().trim();
    
    // Blocked device-related keywords
    const deviceKeywords = ['device', 'diagnostic device', 'surgical instrument', 'medical equipment', 
                           'implant', 'catheter', 'stent', 'pacemaker', 'prosthetic', 'orthopedic device',
                           'imaging device', 'monitoring device', 'sensor', 'scanner', 'analyzer'];
    
    const filteredDeals = aggregatedDeals.filter(deal => {
      // Normalize buyer and seller values
      const buyer = (deal.buyer || '').trim();
      const seller = (deal.seller || '').trim();
      
      // Must have both buyer and seller (not empty, not disclosed, not placeholder)
      const hasBuyer = buyer && 
                       buyer.length > 0 &&
                       buyer !== '—' &&
                       buyer !== '-' &&
                       buyer !== 'N/A' &&
                       buyer !== 'n/a' &&
                       buyer !== 'NA' &&
                       !buyer.toLowerCase().includes('not disclosed') &&
                       !buyer.toLowerCase().includes('undisclosed') &&
                       !buyer.toLowerCase().includes('unknown') &&
                       !buyer.toLowerCase().includes('tbd') &&
                       !buyer.toLowerCase().includes('to be determined') &&
                       !buyer.toLowerCase().includes('pending');
      
      const hasSeller = seller &&
                        seller.length > 0 &&
                        seller !== '—' &&
                        seller !== '-' &&
                        seller !== 'N/A' &&
                        seller !== 'n/a' &&
                        seller !== 'NA' &&
                        !seller.toLowerCase().includes('not disclosed') &&
                        !seller.toLowerCase().includes('undisclosed') &&
                        !seller.toLowerCase().includes('unknown') &&
                        !seller.toLowerCase().includes('tbd') &&
                        !seller.toLowerCase().includes('to be determined') &&
                        !seller.toLowerCase().includes('pending');
      
      if (!hasBuyer || !hasSeller) {
        console.log(`🚫 Filtered out deal: buyer="${buyer}", seller="${seller}"`);
        return false; // Skip deals without buyer or seller
      }
      
      // CRITICAL: Validate deal date - must be within last 12 months (365 days) and not in future
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      const minDate = new Date(today);
      minDate.setDate(today.getDate() - 365); // 12 months ago
      minDate.setHours(0, 0, 0, 0); // Start of that day
      
      let dealDate = null;
      const dealDateStr = (deal.dealDate || '').trim();
      
      if (dealDateStr) {
        try {
          // Parse date - handle ISO format (YYYY-MM-DD) and other formats
          let parsedDate = null;
          
          // Try ISO format first (most common)
          if (dealDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            parsedDate = new Date(dealDateStr + 'T00:00:00'); // Add time to avoid timezone issues
          } else if (dealDateStr.match(/^\d{4}-\d{2}-\d{2}T/)) {
            // Already has time
            parsedDate = new Date(dealDateStr);
          } else {
            // Try parsing other formats
            parsedDate = new Date(dealDateStr);
          }
          
          // Check if date is valid
          if (isNaN(parsedDate.getTime())) {
            console.log(`🚫 Filtered out deal - invalid date format: "${dealDateStr}"`);
            return false; // Skip deals with invalid date format
          }
          
          // Normalize to date only (remove time component for comparison)
          dealDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
          const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
          
          // CRITICAL: Date must not be in the future (except today)
          if (dealDate > todayDateOnly) {
            console.log(`🚫 Filtered out deal - date in future: "${dealDateStr}" (parsed as ${dealDate.toISOString().split('T')[0]}, today is ${todayDateOnly.toISOString().split('T')[0]})`);
            return false; // Skip deals with future dates
          }
          
          // Check if date is within range (last 12 months to today)
          if (dealDate < minDateOnly) {
            console.log(`🚫 Filtered out deal - date too old: "${dealDateStr}" (parsed as ${dealDate.toISOString().split('T')[0]}, minimum is ${minDateOnly.toISOString().split('T')[0]})`);
            return false; // Skip deals with dates older than 12 months
          }
          
          // Additional sanity check: if date is very recent (within last 7 days) but deal seems old based on title/summary, flag it
          const daysDiff = Math.floor((todayDateOnly - dealDate) / (1000 * 60 * 60 * 24));
          if (daysDiff < 7) {
            // Very recent date - check if it makes sense
            const titleLower = (deal.title || '').toLowerCase();
            const summaryLower = (deal.summary || '').toLowerCase();
            const hasOldKeywords = ['announced', 'signed', 'completed', 'closed'].some(keyword => 
              titleLower.includes(keyword) || summaryLower.includes(keyword)
            );
            // If deal mentions "announced" or "signed" but date is very recent, it might be wrong
            // But we'll allow it for now, just log a warning
            if (hasOldKeywords && daysDiff < 2) {
              console.log(`⚠️ Warning: Deal has very recent date but mentions announcement: "${dealDateStr}" - "${deal.title || 'Unknown'}"`);
            }
          }
          
        } catch (dateError) {
          console.log(`🚫 Filtered out deal - date parsing error: "${dealDateStr}"`, dateError);
          return false; // Skip deals with unparseable dates
        }
      } else {
        // If no date provided, we'll allow it but log a warning
        console.log(`⚠️ Deal has no date: "${deal.title || 'Unknown'}" - allowing but may need review`);
      }
      
      // Check for blocked domains (Wikipedia, etc.)
      const sourceUrl = (deal.sourceUrl || '').toLowerCase();
      const isBlockedDomain = blockedDomains.some(domain => sourceUrl.includes(domain));
      if (isBlockedDomain) {
        return false;
      }
      
      // Check for blocked keywords in title/summary (Trump, Biden, politics, etc.)
      const titleLower = (deal.title || '').toLowerCase();
      const summaryLower = (deal.summary || '').toLowerCase();
      const hasBlockedKeyword = blockedKeywords.some(keyword => 
        titleLower.includes(keyword) || summaryLower.includes(keyword)
      );
      if (hasBlockedKeyword) {
        return false;
      }
      
      // CRITICAL: Exclude device deals - only allow drug deals
      // Check in all relevant fields for device keywords
      const drugNameLower = (deal.drugName || '').toLowerCase();
      const therapeuticAreaLower = (deal.therapeuticArea || '').toLowerCase();
      const allText = `${titleLower} ${summaryLower} ${drugNameLower} ${therapeuticAreaLower}`;
      
      // More aggressive device filtering
      const isDeviceDeal = deviceKeywords.some(keyword => 
        allText.includes(keyword) ||
        titleLower.includes(keyword) ||
        summaryLower.includes(keyword) ||
        drugNameLower.includes(keyword)
      );
      
      // Also check if it's explicitly a drug deal (must mention drug, pharmaceutical, therapeutic, etc.)
      const drugKeywords = ['drug', 'pharmaceutical', 'therapeutic', 'biologic', 'compound', 'candidate', 
                           'therapy', 'treatment', 'medication', 'medicine', 'biotech'];
      const hasDrugKeyword = drugKeywords.some(keyword => 
        allText.includes(keyword) ||
        titleLower.includes(keyword) ||
        summaryLower.includes(keyword)
      );
      
      if (isDeviceDeal || !hasDrugKeyword) {
        console.log(`🚫 Filtered out non-drug deal: isDevice=${isDeviceDeal}, hasDrugKeyword=${hasDrugKeyword}`);
        return false; // Skip device deals or deals without drug keywords - only drugs allowed
      }
      
      // CRITICAL: If search query provided, MUST match indication/therapeutic area field ONLY (strict matching)
      if (searchQueryLower) {
        const therapeuticArea = therapeuticAreaLower;
        
        // STRICT MATCHING: Search query MUST match indication/therapeutic area field
        // Indication column is the PRIMARY and ONLY matching field for search keyword
        // Do NOT match on title/summary - only indication/therapeutic area matters
        const matchesIndication = therapeuticArea && therapeuticArea.includes(searchQueryLower);
        
        if (!matchesIndication) {
          console.log(`🚫 Filtered out deal - indication mismatch: searchQuery="${searchQueryLower}", therapeuticArea="${therapeuticArea}"`);
          return false; // Skip deals where indication/therapeutic area doesn't match search keyword
        }
        
        // Only deals with matching indication will pass this filter
      }
      
      return true;
    });

    // Enhanced deduplication: check URL, title similarity, buyer+seller combo, and date
    const seenKeys = new Set();
    const seenTitles = new Set();
    const seenBuyerSellerDates = new Set();
    const uniqueDeals = [];
    
    for (const deal of filteredDeals) {
      // Normalize title for similarity check (remove special chars, normalize spaces)
      const normalizedTitle = (deal.title || '').toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 120); // First 120 chars for comparison
      
      // Create unique key from URL (primary deduplication)
      const urlKey = (deal.sourceUrl || '').toLowerCase().trim();
      
      // Create buyer+seller+date key (secondary deduplication for same deal from different sources)
      const buyer = (deal.buyer || '').toLowerCase().trim();
      const seller = (deal.seller || '').toLowerCase().trim();
      const dealDate = (deal.dealDate || '').toLowerCase().trim();
      const buyerSellerDateKey = `${buyer}|||${seller}|||${dealDate}`;
      
      // Check if we've seen this exact URL, very similar title, or same buyer+seller+date
      const isDuplicate = (urlKey && seenKeys.has(urlKey)) || 
                         (normalizedTitle && normalizedTitle.length > 20 && seenTitles.has(normalizedTitle)) ||
                         (buyerSellerDateKey && buyerSellerDateKey.length > 10 && seenBuyerSellerDates.has(buyerSellerDateKey));
      
      if (!isDuplicate && urlKey) {
        // Mark as seen
        seenKeys.add(urlKey);
        if (normalizedTitle && normalizedTitle.length > 20) {
          seenTitles.add(normalizedTitle);
        }
        if (buyerSellerDateKey && buyerSellerDateKey.length > 10) {
          seenBuyerSellerDates.add(buyerSellerDateKey);
        }
        
        const domainKey = (deal.sourceId || '').replace(/^www\./i, '');
        const friendlySource = deal.source || PREFERRED_DOMAIN_LABELS[domainKey] || domainKey || 'OpenAI Web Search';

        // Ensure only one sourceUrl (take the first valid one, no duplicates)
        const sourceUrl = (deal.sourceUrl || '').trim();
        if (!sourceUrl) continue; // Skip if no URL

        // Final safety check: ensure buyer and seller are valid (should already be filtered, but double-check)
        const finalBuyer = (deal.buyer || '').trim();
        const finalSeller = (deal.seller || '').trim();
        
        if (!finalBuyer || !finalSeller || 
            finalBuyer === '—' || finalBuyer === '-' || finalBuyer === 'N/A' ||
            finalSeller === '—' || finalSeller === '-' || finalSeller === 'N/A') {
          console.log(`🚫 Final filter: Skipping deal with invalid buyer/seller: buyer="${finalBuyer}", seller="${finalSeller}"`);
          continue; // Skip this deal
        }

        uniqueDeals.push({
          buyer: finalBuyer,
          seller: finalSeller,
          drugName: deal.drugName || '',
          therapeuticArea: deal.therapeuticArea || '',
          stage: deal.stage || '',
          financials: deal.financials || '',
          totalValue: deal.totalValue || deal.financials || '',
          dealDate: deal.dealDate || new Date().toISOString().split('T')[0],
          source: friendlySource,
          sourceId: domainKey || 'openai_web_search',
          sourceUrl: sourceUrl, // Only one URL per deal
          title: deal.title || searchQuery,
          summary: deal.summary || '',
          rawText: deal.rawText || '',
          tags: deal.tags || [],
          searchQuery,
          userEmail
        });
      }
    }

    // Sort deals by dealDate in descending order (latest date first)
    const sortedDeals = uniqueDeals.sort((a, b) => {
      const aDate = new Date(a.dealDate || 0);
      const bDate = new Date(b.dealDate || 0);
      
      // Handle invalid dates - put them at the end
      if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
      if (isNaN(aDate.getTime())) return 1;
      if (isNaN(bDate.getTime())) return -1;
      
      // Descending order: latest date first
      return bDate - aDate;
    });

    const responseDeals = sortedDeals.slice(0, 50); // Show up to 50 deals (increased from 30)
    const responseDomains = Array.from(new Set(responseDeals.map(deal => deal.sourceId || 'openai_web_search')));

    const sourcesUsed = ['openai_web_search'];

    const uniqueSourceDetails = [];
    const seenSourceDetailKeys = new Set();
    for (const detail of sourceDetails) {
      const key = `${detail.kind || 'unknown'}:${detail.name || ''}:${detail.url || ''}`;
      if (!seenSourceDetailKeys.has(key)) {
        uniqueSourceDetails.push(detail);
        seenSourceDetailKeys.add(key);
      }
    }

    // Store deals in MongoDB asynchronously (non-blocking) for better performance
    if (responseDeals.length > 0) {
      setImmediate(async () => {
        try {
          const dealSchema = new mongoose.Schema({
            searchQuery: String,
            buyer: String,
            seller: String,
            drugName: String,
            therapeuticArea: String,
            stage: String,
            financials: String,
            totalValue: String,
            dealDate: String,
            source: String,
            sourceId: String,
            sourceUrl: String,
            title: String,
            summary: String,
            rawText: String,
            tags: [String],
            scrapedAt: { type: Date, default: Date.now },
            userEmail: String
          }, { timestamps: true });

          const Deal = mongoose.models.Deal || mongoose.model('Deal', dealSchema);
          await Deal.insertMany(responseDeals.map(deal => ({
            ...deal,
            scrapedAt: new Date()
          })));
          console.log(`💾 Saved ${responseDeals.length} deals to database`);
        } catch (dbError) {
          console.error('Error saving deals to database:', dbError);
        }
      });
    }

    if (responseDeals.length === 0) {
      const fallbackDeals = buildFallbackDeals(searchQuery);
      const fallbackNarrative = (openAiResult?.narrative || '').trim() || buildFallbackNarrative(searchQuery, rangeInDays);
      return res.json({
        success: true,
        data: {
          deals: fallbackDeals,
          totalFound: uniqueDeals.length,
          sources: sourcesUsed,
          sourceDetails: uniqueSourceDetails,
          insights: openAiResult?.insights || '',
          narrative: fallbackNarrative,
          domains: responseDomains,
          searchQuery,
          dateRange: rangeInDays,
          isFallback: true
        },
        creditsUsed: 1,
        message: 'Live research temporarily unavailable. Provided fallback playbook instead.'
      });
    }

    const narrativeForResponse = (openAiResult?.narrative || '').trim() || buildFallbackNarrative(searchQuery, rangeInDays);

    res.json({
      success: true,
      data: {
        deals: responseDeals,
        totalFound: uniqueDeals.length,
        sources: sourcesUsed,
        sourceDetails: uniqueSourceDetails,
        insights: openAiResult?.insights || '',
        narrative: narrativeForResponse,
        domains: responseDomains,
        searchQuery,
        dateRange: rangeInDays,
        isFallback: false
      },
      creditsUsed: 1,
      message: `Collected ${responseDeals.length} deals from ${uniqueDeals.length} unique hits`
    });

  } catch (error) {
    console.error('❌ Error in AI Deal Scanner:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.status,
      response: error.response?.data
    });
    res.status(500).json({ 
      success: false, 
      message: 'Error scraping deals. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin endpoint to add credits to multiple users (bulk operation)
app.post('/api/admin/add-credits-bulk', authenticateAdmin, [
  body('users').isArray().withMessage('Users must be an array'),
  body('users.*.email').isEmail().withMessage('Each user must have a valid email'),
  body('users.*.credits').isInt({ min: 1, max: 10000 }).withMessage('Credits must be between 1 and 10000'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { users, reason } = req.body;
    const adminEmail = req.user.email;

    console.log(`🔧 Admin ${adminEmail} attempting bulk credit addition to ${users.length} users`);

    const results = [];
    const errors_list = [];

    for (const userData of users) {
      try {
        const { email, credits } = userData;
        
        let user = null;
        
        // Try MongoDB first
        try {
          user = await User.findOne({ email }).maxTimeMS(10000);
          
          if (user) {
            const oldCredits = user.currentCredits || 0;
            const newCredits = oldCredits + credits;

            // Update credits in MongoDB
            await User.findOneAndUpdate(
              { _id: user._id },
              { 
                $inc: { currentCredits: credits },
                $set: { 
                  lastCreditRenewal: new Date(),
                  lastModifiedBy: adminEmail,
                  lastModifiedAt: new Date()
                }
              },
              { new: true, maxTimeMS: 10000 }
            );

            // Log credit addition
            if (!user.creditUsageHistory) {
              user.creditUsageHistory = [];
            }
            user.creditUsageHistory.push({
              creditsAdded: credits,
              creditsBefore: oldCredits,
              creditsAfter: newCredits,
              reason: reason || `Bulk admin credit addition by ${adminEmail}`,
              addedBy: adminEmail,
              addedAt: new Date()
            });
            await User.findOneAndUpdate(
              { _id: user._id },
              { creditUsageHistory: user.creditUsageHistory },
              { new: true, maxTimeMS: 10000 }
            );

            // Also update file storage
            const userIndex = mockDB.users.findIndex(u => u.email === user.email);
            if (userIndex !== -1) {
              mockDB.users[userIndex].currentCredits = newCredits;
              mockDB.users[userIndex].lastCreditRenewal = new Date();
            }

            results.push({
              email,
              success: true,
              oldCredits,
              newCredits,
              creditsAdded: credits
            });
            continue;
          }
        } catch (dbError) {
          console.error(`❌ MongoDB error for ${email}:`, dbError);
        }

        // Fallback to file storage
        const userIndex = mockDB.users.findIndex(u => u.email === email);
        
        if (userIndex === -1) {
          errors_list.push({
            email,
            error: 'User not found'
          });
          continue;
        }

        const fileUser = mockDB.users[userIndex];
        const oldCredits = fileUser.currentCredits || 0;
        const newCredits = oldCredits + credits;

        // Update credits in file storage
        mockDB.users[userIndex].currentCredits = newCredits;
        mockDB.users[userIndex].lastCreditRenewal = new Date();

        // Add to credit history
        if (!mockDB.users[userIndex].creditUsageHistory) {
          mockDB.users[userIndex].creditUsageHistory = [];
        }
        mockDB.users[userIndex].creditUsageHistory.push({
          creditsAdded: credits,
          creditsBefore: oldCredits,
          creditsAfter: newCredits,
          reason: reason || `Bulk admin credit addition by ${adminEmail}`,
          addedBy: adminEmail,
          addedAt: new Date()
        });

        results.push({
          email,
          success: true,
          oldCredits,
          newCredits,
          creditsAdded: credits
        });

      } catch (error) {
        console.error(`❌ Error processing ${userData.email}:`, error);
        errors_list.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    // Save file storage if any updates were made
    if (results.length > 0) {
      saveDataToFiles('bulk_admin_credit_addition');
    }

    res.json({
      success: true,
      message: `Processed ${users.length} users: ${results.length} successful, ${errors_list.length} failed`,
      data: {
        successful: results,
        failed: errors_list,
        totalProcessed: users.length,
        successCount: results.length,
        failureCount: errors_list.length
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk credit addition:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding credits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get contact emails (paid feature)
app.post('/api/get-contacts', authenticateToken, [
  body('companyIds').isArray()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const { companyIds } = req.body;
    
    // Get contact details for requested companies
    const contacts = biotechData
      .filter(item => companyIds.includes(item.id))
      .map(item => ({
        id: item.id,
        companyName: item.companyName,
        contactPerson: item.contactPerson,
        email: item.email,
        phone: item.phone,
        website: item.website
      }));

    res.json({
      success: true,
      data: {
        contacts,
        totalContacts: contacts.length,
        price: contacts.length * 99 // $99 per contact
      }
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting contacts' 
    });
  }
});

// Delete multiple records (admin only)
app.delete('/api/admin/delete-records', authenticateAdmin, (req, res) => {
  try {

    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request: ids array required' 
      });
    }

    const initialLength = biotechData.length;
    biotechData = biotechData.filter(item => !ids.includes(item.id));

    const deletedCount = initialLength - biotechData.length;

    // Save data to files
    saveDataToFiles('payment_success');

    res.json({
      success: true,
      message: `${deletedCount} records deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting records:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting records' 
    });
  }
});

// Delete single record (admin only)
app.delete('/api/admin/biotech-data/:id', authenticateAdmin, (req, res) => {
  try {

    const id = parseInt(req.params.id);
    const initialLength = biotechData.length;
    biotechData = biotechData.filter(item => item.id !== id);

    if (biotechData.length === initialLength) {
      return res.status(404).json({ 
        success: false, 
        message: 'Record not found' 
      });
    }

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting record' 
    });
  }
});

// Get admin statistics
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  try {

    const uniqueCompanies = new Set(biotechData.map(item => item.companyName)).size;
    const uniqueContacts = new Set(biotechData.map(item => item.email)).size;
    
    const stats = {
      totalRecords: biotechData.length,
      totalCompanies: uniqueCompanies,
      totalContacts: uniqueContacts,
      totalRevenue: biotechData.length * 99 // Assuming $99 per record
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching admin stats' 
    });
  }
});

// Debug endpoint to see uploaded data
app.get('/api/debug/data', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalRecords: biotechData.length,
        sampleRecords: biotechData.slice(0, 3),
        allRecords: biotechData,
        summary: {
          companies: [...new Set(biotechData.map(item => item.companyName))],
          tiers: [...new Set(biotechData.map(item => item.tier))],
          taColumns: Object.keys(biotechData[0] || {}).filter(key => key.startsWith('ta'))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching debug data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching debug data' 
    });
  }
});

// Connect to MongoDB
console.log('🔧 Initializing server...');
console.log('📡 Attempting MongoDB connection...');

// Data storage with file persistence
const DATA_FILE = path.join(__dirname, 'data', 'biotechData.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const VERIFICATION_FILE = path.join(__dirname, 'data', 'verificationCodes.json');
const UPLOADED_FILES_FILE = path.join(__dirname, 'data', 'uploadedFiles.json');
const BD_TRACKER_FILE = path.join(__dirname, 'data', 'bdTracker.json');
const BLOCKED_EMAILS_FILE = path.join(__dirname, 'data', 'blockedEmails.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load data from files with recovery
const loadDataFromFiles = () => {
  try {
    // Load biotech data
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      biotechData = JSON.parse(data);
      console.log(`✅ Loaded ${biotechData.length} biotech records from file`);
    } else {
      console.log('⚠️ No biotech data file found, starting fresh');
    }

    // Load users
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      mockDB.users = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.users.length} users from file`);
    } else {
      console.log('⚠️ No users file found, starting fresh');
      mockDB.users = [];
    }

    // Load verification codes
    if (fs.existsSync(VERIFICATION_FILE)) {
      const data = fs.readFileSync(VERIFICATION_FILE, 'utf8');
      mockDB.verificationCodes = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.verificationCodes.length} verification codes from file`);
    } else {
      console.log('⚠️ No verification codes file found, starting fresh');
      mockDB.verificationCodes = [];
    }

    // Load uploaded files info
    if (fs.existsSync(UPLOADED_FILES_FILE)) {
      const data = fs.readFileSync(UPLOADED_FILES_FILE, 'utf8');
      mockDB.uploadedFiles = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.uploadedFiles.length} uploaded files info from file`);
    } else {
      console.log('⚠️ No uploaded files info found, starting fresh');
      mockDB.uploadedFiles = [];
    }

    // Load BD Tracker data
    if (fs.existsSync(BD_TRACKER_FILE)) {
      const data = fs.readFileSync(BD_TRACKER_FILE, 'utf8');
      mockDB.bdTracker = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.bdTracker.length} BD Tracker entries from file`);
    } else {
      console.log('⚠️ No BD Tracker file found, starting fresh');
      mockDB.bdTracker = [];
    }

    // Load PDFs data
    if (fs.existsSync(path.join(__dirname, 'data', 'pdfs.json'))) {
      const data = fs.readFileSync(path.join(__dirname, 'data', 'pdfs.json'), 'utf8');
      mockDB.pdfs = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.pdfs.length} PDFs from file`);
    } else {
      console.log('⚠️ No PDFs file found, starting fresh');
      mockDB.pdfs = [];
    }

    // Load pricing data
    if (fs.existsSync(path.join(__dirname, 'data', 'pricing.json'))) {
      const data = fs.readFileSync(path.join(__dirname, 'data', 'pricing.json'), 'utf8');
      mockDB.pricing = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.pricing.length} pricing plans from file`);
    } else {
      console.log('⚠️ No pricing file found, starting fresh');
      mockDB.pricing = [];
    }

    // Load blocked emails data
    if (fs.existsSync(BLOCKED_EMAILS_FILE)) {
      const data = fs.readFileSync(BLOCKED_EMAILS_FILE, 'utf8');
      mockDB.blockedEmails = JSON.parse(data);
      console.log(`✅ Loaded ${mockDB.blockedEmails.length} blocked emails from file`);
    } else {
      console.log('⚠️ No blocked emails file found, starting fresh');
      mockDB.blockedEmails = [];
    }

    // Ensure universal users exist
    const universalEmails = [
      'universalx0242@gmail.com',
      'admin@bioping.com',
      'demo@bioping.com',
      'test@bioping.com'
    ];

    universalEmails.forEach(email => {
      const existingUser = mockDB.users.find(u => u.email === email);
      if (!existingUser) {
        console.log(`🔄 Creating universal user: ${email}`);
        const newUser = {
          id: mockDB.users.length + 1,
          firstName: email.split('@')[0],
          lastName: '',
          email: email,
          password: '$2a$10$20TtHYxGnnAA1EcZoXq06u2faT68sDulbmnMEJMyg.kRZBh6cicmS', // Default password: 'password'
          name: email.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString(),
          paymentCompleted: email === 'universalx0242@gmail.com' ? true : false,
          currentPlan: email === 'universalx0242@gmail.com' ? 'test' : 'free',
          currentCredits: email === 'universalx0242@gmail.com' ? 1 : 5,
          // Add invoice data for universalx0242@gmail.com
          invoices: email === 'universalx0242@gmail.com' ? [
            {
              id: 'INV-001',
              amount: 1.00,
              currency: 'USD',
              status: 'paid',
              date: new Date().toISOString(),
              description: 'Test Plan - $1.00',
              plan: 'Test Plan'
            }
          ] : [],
          paymentHistory: email === 'universalx0242@gmail.com' ? [
            {
              id: 'PAY-001',
              amount: 1.00,
              currency: 'USD',
              status: 'completed',
              date: new Date().toISOString(),
              description: 'Test Plan Payment',
              plan: 'Test Plan'
            }
          ] : []
        };
        mockDB.users.push(newUser);
      }
    });

    // Update existing universalx0242@gmail.com user with invoice data
    const universalUser = mockDB.users.find(u => u.email === 'universalx0242@gmail.com');
    if (universalUser && (!universalUser.invoices || universalUser.invoices.length === 0)) {
      console.log('🔄 Adding invoice data to universal user...');
      universalUser.invoices = [
        {
          id: 'INV-001',
          amount: 1.00,
          currency: 'USD',
          status: 'paid',
          date: new Date().toISOString(),
          description: 'Test Plan - $1.00',
          plan: 'Test Plan'
        }
      ];
      universalUser.paymentHistory = [
        {
          id: 'PAY-001',
          amount: 1.00,
          currency: 'USD',
          status: 'completed',
          date: new Date().toISOString(),
          description: 'Test Plan Payment',
          plan: 'Test Plan'
        }
      ];
    }

    // Save immediately after ensuring universal users exist
    saveDataToFiles('subscription_created');
    
  } catch (error) {
    console.error('❌ Error loading data from files:', error);
    console.log('🔄 Attempting to recover from backup...');
    
    // Try to recover from backup
    try {
      const backupDir = path.join(__dirname, 'backups');
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
        if (backupFiles.length > 0) {
          const latestBackup = backupFiles.sort().pop();
          const backupPath = path.join(backupDir, latestBackup);
          const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
          
          mockDB.users = backupData.users || [];
          mockDB.verificationCodes = backupData.verificationCodes || [];
          mockDB.uploadedFiles = backupData.uploadedFiles || [];
          mockDB.bdTracker = backupData.bdTracker || [];
          biotechData = backupData.biotechData || [];
          
          console.log('✅ Recovered data from backup:', latestBackup);
          saveDataToFiles('credit_used');
        }
      }
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError);
      console.log('🔄 Starting with fresh data...');
      mockDB.users = [];
      mockDB.verificationCodes = [];
      mockDB.uploadedFiles = [];
      mockDB.bdTracker = [];
      biotechData = [];
    }
  }
};

// Debounced saving to improve performance
let saveTimeout = null;
const saveDataToFiles = (action = 'auto') => {
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Set new timeout to save after 2 seconds of inactivity
  saveTimeout = setTimeout(() => {
    performSave(action);
  }, 2000);
};

// Immediate save function for critical operations
const saveDataToFilesImmediate = (action = 'auto') => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  performSave(action);
};
// Actual save function
const performSave = (action = 'auto') => {
  try {
    // Create backup before saving
    const backupDir = path.join(__dirname, 'backups', new Date().toISOString().split('T')[0]);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save biotech data
    fs.writeFileSync(DATA_FILE, JSON.stringify(biotechData, null, 2));
    console.log(`✅ Saved ${biotechData.length} biotech records (${action})`);
    
    // Save users
    fs.writeFileSync(USERS_FILE, JSON.stringify(mockDB.users, null, 2));
    console.log(`✅ Saved ${mockDB.users.length} users (${action})`);
    
    // Save verification codes
    fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(mockDB.verificationCodes, null, 2));
    console.log(`✅ Saved ${mockDB.verificationCodes.length} verification codes (${action})`);
    
    // Save uploaded files info
    fs.writeFileSync(UPLOADED_FILES_FILE, JSON.stringify(mockDB.uploadedFiles, null, 2));
    console.log(`✅ Saved ${mockDB.uploadedFiles.length} uploaded files info (${action})`);
    
    // Save BD Tracker data
    fs.writeFileSync(BD_TRACKER_FILE, JSON.stringify(mockDB.bdTracker, null, 2));
    console.log(`✅ Saved ${mockDB.bdTracker.length} BD Tracker entries (${action})`);
    
    // Save PDFs data
    fs.writeFileSync(path.join(__dirname, 'data', 'pdfs.json'), JSON.stringify(mockDB.pdfs, null, 2));
    console.log(`✅ Saved ${mockDB.pdfs.length} PDFs (${action})`);
    
    // Save pricing data
    fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
    console.log(`✅ Saved ${mockDB.pricing.length} pricing plans (${action})`);
    
    // Save blocked emails data
    fs.writeFileSync(BLOCKED_EMAILS_FILE, JSON.stringify(mockDB.blockedEmails, null, 2));
    console.log(`✅ Saved ${mockDB.blockedEmails.length} blocked emails (${action})`);
    
    console.log(`✅ All data saved successfully (${action})`);
  } catch (error) {
    console.error(`❌ Error saving data (${action}):`, error);
    // Try to save to backup location
    try {
      const backupFile = path.join(__dirname, 'backups', `backup-${Date.now()}.json`);
      const backupData = {
        users: mockDB.users,
        biotechData: biotechData,
        verificationCodes: mockDB.verificationCodes,
        uploadedFiles: mockDB.uploadedFiles,
        bdTracker: mockDB.bdTracker,
        pdfs: mockDB.pdfs,
        pricing: mockDB.pricing,
        timestamp: new Date().toISOString(),
        action: action
      };
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      console.log('✅ Emergency backup saved to:', backupFile);
    } catch (backupError) {
      console.error('❌ Emergency backup also failed:', backupError);
    }
  }
};
// Mock database connection for now
const mockDB = {
  users: [],
  verificationCodes: [],
  uploadedFiles: [], // Store uploaded file info
  bdTracker: [], // Store BD Tracker entries
  pdfs: [], // Store PDF management data
  pricing: [], // Store pricing plans data
  blockedEmails: [] // Store blocked email addresses
};

// Load data on startup
loadDataFromFiles();

// Save data periodically (every 5 minutes)
setInterval(() => {
  saveDataToFiles('bd_entry_added');
}, 5 * 60 * 1000);

// Save data on server shutdown
process.on('SIGINT', () => {
  console.log('Saving data before shutdown...');
  saveDataToFiles('search_performed');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Saving data before shutdown...');
  saveDataToFiles('file_uploaded');
  process.exit(0);
});

// Email functionality removed - using universal login emails




// Get all users (admin only)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    let users = [];
    let totalUsers = 0;

    // Try to fetch users from MongoDB first
    try {
      const mongoUsers = await User.find({}).select('-password').sort({ createdAt: -1 });
      if (mongoUsers && mongoUsers.length > 0) {
        users = mongoUsers.map(user => {
          // Calculate actual credits based on payment status and trial expiration
          let actualCredits = user.currentCredits || 5;
          
          if (user.paymentCompleted && user.currentPlan !== 'free') {
            // Paid users - keep their actual credits (like universalx0242 with 34 credits)
            actualCredits = user.currentCredits || 0;
          } else {
            // Free users - check if 5-day trial has expired
            const registrationDate = new Date(user.createdAt);
            const currentDate = new Date();
            const daysSinceRegistration = Math.floor((currentDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceRegistration >= 5) {
              actualCredits = 0; // Trial expired
            } else {
              actualCredits = 5; // Still in trial period
            }
          }
          
          return {
            id: user._id,
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            company: user.company,
            role: user.role,
            isApproved: user.isApproved,
            isVerified: user.isVerified,
            isActive: user.isActive,
            paymentCompleted: user.paymentCompleted,
            currentPlan: user.currentPlan,
            currentCredits: actualCredits,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            name: `${user.firstName} ${user.lastName}`.trim()
          };
        });
        totalUsers = users.length;
        console.log(`✅ Fetched ${totalUsers} users from MongoDB`);
      }
    } catch (dbError) {
      console.log('❌ MongoDB not available, using file-based storage...');
    }

    // If no users from MongoDB, fallback to file-based storage
    if (users.length === 0) {
      users = mockDB.users.map(user => {
        // Calculate actual credits based on payment status and trial expiration
        let actualCredits = user.currentCredits || 5;
        
        if (user.paymentCompleted && user.currentPlan !== 'free') {
          // Paid users - keep their actual credits (like universalx0242 with 34 credits)
          actualCredits = user.currentCredits || 0;
        } else {
          // Free users - check if 5-day trial has expired
          const registrationDate = new Date(user.createdAt);
          const currentDate = new Date();
          const daysSinceRegistration = Math.floor((currentDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceRegistration >= 5) {
            actualCredits = 0; // Trial expired
          } else {
            actualCredits = 5; // Still in trial period
          }
        }
        
        return {
          ...user,
          currentCredits: actualCredits
        };
      });
      totalUsers = users.length;
      console.log(`📁 Using ${totalUsers} users from file storage`);
    }

    res.json({
      success: true,
      data: {
        users: users,
        totalUsers: totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
});

// Admin: Approve user endpoint
app.post('/api/admin/approve-user/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminEmail = req.user.email;
    
    console.log(`🔍 Admin approving user: ${userId} by ${adminEmail}`);
    
    // Try MongoDB first
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      user.isApproved = true;
      user.status = 'active';
      user.isActive = true;
      user.isVerified = user.isVerified || true;
      user.approvedAt = new Date();
      user.approvedBy = adminEmail;
      await user.save();
      
      // Also update file storage if user exists there (for sync)
      const fileStorageUserIndex = mockDB.users.findIndex(u => u.email === user.email);
      if (fileStorageUserIndex !== -1) {
        mockDB.users[fileStorageUserIndex].isApproved = true;
        mockDB.users[fileStorageUserIndex].status = 'active';
        mockDB.users[fileStorageUserIndex].isActive = true;
        mockDB.users[fileStorageUserIndex].approvedAt = new Date().toISOString();
        mockDB.users[fileStorageUserIndex].approvedBy = adminEmail;
        saveDataToFiles('user_approval_sync');
        console.log(`✅ Also updated file storage for user: ${user.email}`);
      }
      
      // Try to notify the user via email (best-effort)
      try {
        const subject = 'Your BioPing account has been approved';
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
            <h2>Account Approved ✅</h2>
            <p>Hi ${user.firstName || ''} ${user.lastName || ''},</p>
            <p>Your account has been approved by the admin. You can now log in and use the dashboard.</p>
            <p><a href="${process.env.FRONTEND_BASE_URL || 'https://thebioping.com'}/login" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Login Now</a></p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `;
        if (typeof sendEmail === 'function') {
          await sendEmail(user.email, subject, html);
        }
      } catch (notifyErr) {
        console.log('⚠️ Failed to send approval email:', notifyErr.message);
      }
      
      console.log(`✅ User ${user.email} approved by ${adminEmail}`);
      
      res.json({
        success: true,
        message: 'User approved successfully',
        user: {
          id: user._id,
          email: user.email,
          isApproved: user.isApproved,
          approvedAt: user.approvedAt,
          approvedBy: user.approvedBy
        }
      });
    } catch (dbError) {
      console.log('❌ MongoDB not available, using file storage...');
      
      // Fallback to file storage
      const userIndex = mockDB.users.findIndex(u => u.id === userId || u._id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      mockDB.users[userIndex].isApproved = true;
      mockDB.users[userIndex].status = 'active';
      mockDB.users[userIndex].isActive = true;
      mockDB.users[userIndex].approvedAt = new Date().toISOString();
      mockDB.users[userIndex].approvedBy = adminEmail;
      // Best-effort notify (file storage case)
      try {
        const subject = 'Your BioPing account has been approved';
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
            <h2>Account Approved ✅</h2>
            <p>Hi ${mockDB.users[userIndex].firstName || ''} ${mockDB.users[userIndex].lastName || ''},</p>
            <p>Your account has been approved by the admin. You can now log in and use the dashboard.</p>
            <p><a href="${process.env.FRONTEND_BASE_URL || 'https://thebioping.com'}/login" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Login Now</a></p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `;
        if (typeof sendEmail === 'function') {
          await sendEmail(mockDB.users[userIndex].email, subject, html);
        }
      } catch (notifyErr) {
        console.log('⚠️ Failed to send approval email (file):', notifyErr.message);
      }
      
      saveDataToFiles('user_approval');
      
      console.log(`✅ User ${mockDB.users[userIndex].email} approved by ${adminEmail}`);
      
      res.json({
        success: true,
        message: 'User approved successfully',
        user: {
          id: mockDB.users[userIndex].id,
          email: mockDB.users[userIndex].email,
          isApproved: true,
          approvedAt: mockDB.users[userIndex].approvedAt,
          approvedBy: mockDB.users[userIndex].approvedBy
        }
      });
    }
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error approving user' 
    });
  }
});

// Admin: Reject user endpoint
app.post('/api/admin/reject-user/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminEmail = req.user.email;
    
    console.log(`🔍 Admin rejecting user: ${userId} by ${adminEmail}`);
    
    // Try MongoDB first
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      await User.findByIdAndDelete(userId);
      
      console.log(`✅ User ${user.email} rejected and deleted by ${adminEmail}`);
      
      res.json({
        success: true,
        message: 'User rejected and account deleted'
      });
    } catch (dbError) {
      console.log('❌ MongoDB not available, using file storage...');
      
      // Fallback to file storage
      const userIndex = mockDB.users.findIndex(u => u.id === userId || u._id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      const userEmail = mockDB.users[userIndex].email;
      mockDB.users.splice(userIndex, 1);
      
      saveDataToFiles('user_rejection');
      
      console.log(`✅ User ${userEmail} rejected and deleted by ${adminEmail}`);
      
      res.json({
        success: true,
        message: 'User rejected and account deleted'
      });
    }
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error rejecting user' 
    });
  }
});

// Admin: Get pending approvals
app.get('/api/admin/pending-approvals', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching pending approvals...');
    
    let pendingUsers = [];
    
    // Try MongoDB first
    try {
      const users = await User.find({ isApproved: false }).select('-password').sort({ createdAt: -1 });
      pendingUsers = users.map(user => ({
        id: user._id,
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
        name: `${user.firstName} ${user.lastName}`.trim()
      }));
      
      console.log(`✅ Found ${pendingUsers.length} pending users in MongoDB`);
    } catch (dbError) {
      console.log('❌ MongoDB not available, using file storage...');
      
      // Fallback to file storage
      pendingUsers = mockDB.users
        .filter(user => !user.isApproved)
        .map(user => ({
          ...user,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        }));
      
      console.log(`📁 Found ${pendingUsers.length} pending users in file storage`);
    }
    
    res.json({
      success: true,
      data: {
        pendingUsers: pendingUsers,
        totalPending: pendingUsers.length
      }
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pending approvals' 
    });
  }
});

// Admin: Approve all existing users (one-time migration)
app.post('/api/admin/approve-existing-users', authenticateAdmin, async (req, res) => {
  try {
    const adminEmail = req.user.email;
    console.log(`🔍 Admin approving all existing users by ${adminEmail}`);
    
    let approvedCount = 0;
    
    // Try MongoDB first
    try {
      const result = await User.updateMany(
        { isApproved: { $ne: true } },
        { 
          $set: { 
            isApproved: true, 
            approvedAt: new Date(), 
            approvedBy: adminEmail 
          } 
        }
      );
      
      approvedCount = result.modifiedCount;
      console.log(`✅ Approved ${approvedCount} existing users in MongoDB`);
    } catch (dbError) {
      console.log('❌ MongoDB not available, using file storage...');
      
      // Fallback to file storage
      const unapprovedUsers = mockDB.users.filter(user => !user.isApproved);
      unapprovedUsers.forEach(user => {
        user.isApproved = true;
        user.approvedAt = new Date().toISOString();
        user.approvedBy = adminEmail;
      });
      
      approvedCount = unapprovedUsers.length;
      saveDataToFiles('approve_existing_users');
      
      console.log(`✅ Approved ${approvedCount} existing users in file storage`);
    }
    
    res.json({
      success: true,
      message: `Successfully approved ${approvedCount} existing users`,
      approvedCount: approvedCount
    });
  } catch (error) {
    console.error('Error approving existing users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error approving existing users' 
    });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`🗑️ Delete user request - ID: ${userId} (type: ${typeof userId})`);
    let user = null;
    let userEmail = null;

    // Try to find and delete user in MongoDB first
    try {
      user = await User.findById(userId);
      if (user) {
        userEmail = user.email;
        await User.findByIdAndDelete(userId);
        console.log(`✅ User deleted from MongoDB: ${userEmail}`);
      }
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file-based storage...');
    }

    // If not found in MongoDB, check file-based storage
    if (!user) {
      const fileUserIndex = mockDB.users.findIndex(u => 
        u.id === parseInt(userId) || 
        u.id === userId || 
        u._id === userId || 
        u._id === parseInt(userId)
      );
      if (fileUserIndex !== -1) {
        user = mockDB.users[fileUserIndex];
        userEmail = user.email;
        mockDB.users.splice(fileUserIndex, 1);
        console.log(`✅ User deleted from file storage: ${userEmail}`);
      }
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Add email to blocked list to prevent re-registration
    if (userEmail) {
      const blockedEmailEntry = {
        email: userEmail,
        blockedAt: new Date().toISOString(),
        blockedBy: req.user.email || 'admin',
        reason: 'User account deleted by admin'
      };

      // Add to file-based blocked emails
      mockDB.blockedEmails.push(blockedEmailEntry);
      
      // Save the blocked emails data
      saveDataToFiles('user_deleted_and_blocked');
      
      console.log(`🚫 Email blocked to prevent re-registration: ${userEmail}`);
    }

    res.json({
      success: true,
      message: 'User deleted successfully and email blocked from re-registration'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user' 
    });
  }
});

// Get blocked emails (admin only)
app.get('/api/admin/blocked-emails', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockDB.blockedEmails
    });
  } catch (error) {
    console.error('Error fetching blocked emails:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching blocked emails' 
    });
  }
});

// ADMIN CREDIT MODIFICATION REMOVED - Credits can only be consumed, never restored
// This ensures the integrity of the credit system

// ADMIN CREDIT MODIFICATION REMOVED - Credits can only be consumed, never restored
// This ensures the integrity of the credit system

// Unblock email (admin only)
app.post('/api/admin/unblock-email', authenticateAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const emailIndex = mockDB.blockedEmails.findIndex(blocked => blocked.email === email);
    if (emailIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email not found in blocked list' 
      });
    }

    // Remove from blocked list
    mockDB.blockedEmails.splice(emailIndex, 1);
    saveDataToFiles('email_unblocked');
    
    console.log(`✅ Email unblocked: ${email}`);
    
    res.json({
      success: true,
      message: 'Email unblocked successfully'
    });
  } catch (error) {
    console.error('Error unblocking email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error unblocking email' 
    });
  }
});

// BD Tracker API Endpoints

// Get all BD Tracker entries for specific user
app.get('/api/bd-tracker', authenticateToken, checkUserSuspension, async (req, res) => {
  try {
    console.log('BD Tracker GET - User ID:', req.user.id);
    console.log('BD Tracker GET - User Email:', req.user.email);
    
    let userEntries = [];
    
    // Try MongoDB first
    try {
      userEntries = await BDTracker.find({ userId: req.user.id }).sort({ createdAt: -1 });
      console.log('BD Tracker GET - MongoDB entries:', userEntries.length);
    } catch (dbError) {
      console.log('MongoDB not available, using file-based storage...');
      // Fallback to file-based storage
      userEntries = mockDB.bdTracker.filter(entry => entry.userId === req.user.id);
      console.log('BD Tracker GET - File entries:', userEntries.length);
    }
    
    res.json({
      success: true,
      data: userEntries
    });
  } catch (error) {
    console.error('Error fetching BD Tracker entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching BD Tracker entries' 
    });
  }
});

// Add new BD Tracker entry
app.post('/api/bd-tracker', authenticateToken, async (req, res) => {
  try {
    console.log('BD Tracker POST - User ID:', req.user.id);
    console.log('BD Tracker POST - User Email:', req.user.email);
    console.log('BD Tracker POST - Request Body:', req.body);
    
    const { type, company, programPitched, outreachDates, contactFunction, contactPerson, cda, feedback, nextSteps, timelines, reminders } = req.body;

    // Validate required fields
    if (!company || !contactPerson) {
      console.log('BD Tracker POST - Validation failed:', { company, contactPerson });
      return res.status(400).json({
        success: false,
        message: 'Company and Contact Person are required'
      });
    }

    let newEntry = null;

    // Try MongoDB first
    try {
      newEntry = new BDTracker({
        userId: req.user.id,
        type: type || '',
        company,
        programPitched: programPitched || '',
        outreachDates: outreachDates || '',
        contactFunction: contactFunction || '',
        contactPerson,
        cda: cda || '',
        feedback: feedback || '',
        nextSteps: nextSteps || '',
        timelines: timelines || '',
        reminders: reminders || '',
        status: 'active',
        priority: 'medium'
      });

      await newEntry.save();
      console.log('BD Tracker POST - MongoDB entry created:', newEntry._id);
    } catch (dbError) {
      console.log('MongoDB save failed, using file-based storage...');
      // Fallback to file-based storage
      newEntry = {
        id: Date.now().toString(),
        type: type || '',
        company,
        programPitched: programPitched || '',
        outreachDates: outreachDates || '',
        contactFunction: contactFunction || '',
        contactPerson,
        cda: cda || '',
        feedback: feedback || '',
        nextSteps: nextSteps || '',
        timelines: timelines || '',
        reminders: reminders || '',
        createdAt: new Date().toISOString(),
        userId: req.user.id
      };

      mockDB.bdTracker.unshift(newEntry);
      saveDataToFiles('bd_entry_added');
      console.log('BD Tracker POST - File entry created:', newEntry.id);
    }

    res.json({
      success: true,
      data: newEntry,
      message: 'BD Tracker entry added successfully'
    });
  } catch (error) {
    console.error('Error adding BD Tracker entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding BD Tracker entry' 
    });
  }
});
// Update BD Tracker entry
app.put('/api/bd-tracker/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, company, programPitched, outreachDates, contactFunction, contactPerson, cda, feedback, nextSteps, timelines, reminders } = req.body;

    // Validate required fields
    if (!company || !contactPerson) {
      return res.status(400).json({
        success: false,
        message: 'Company and Contact Person are required'
      });
    }

    let updatedEntry = null;

    // Try MongoDB first
    try {
      updatedEntry = await BDTracker.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        {
          projectName,
          company,
          programPitched: programPitched || '',
          outreachDates: outreachDates || '',
          contactFunction: contactFunction || '',
          contactPerson,
          cda: cda || '',
          feedback: feedback || '',
          nextSteps: nextSteps || '',
          timelines: timelines || '',
          reminders: reminders || ''
        },
        { new: true }
      );

      if (!updatedEntry) {
        return res.status(404).json({
          success: false,
          message: 'BD Tracker entry not found or not authorized'
        });
      }

      console.log('BD Tracker PUT - MongoDB entry updated:', updatedEntry._id);
    } catch (dbError) {
      console.log('MongoDB update failed, using file-based storage...');
      // Fallback to file-based storage - try both id and _id formats
      let entryIndex = mockDB.bdTracker.findIndex(entry => entry.id === id && entry.userId === req.user.id);
      
      if (entryIndex === -1) {
        // Try MongoDB _id format
        entryIndex = mockDB.bdTracker.findIndex(entry => entry._id === id && entry.userId === req.user.id);
      }
      
      if (entryIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'BD Tracker entry not found or not authorized'
        });
      }

      mockDB.bdTracker[entryIndex] = {
        ...mockDB.bdTracker[entryIndex],
        projectName,
        company,
        programPitched: programPitched || '',
        outreachDates: outreachDates || '',
        contactFunction: contactFunction || '',
        contactPerson,
        cda: cda || '',
        feedback: feedback || '',
        nextSteps: nextSteps || '',
        timelines: timelines || '',
        reminders: reminders || '',
        updatedAt: new Date().toISOString()
      };

      updatedEntry = mockDB.bdTracker[entryIndex];
      saveDataToFiles('bd_entry_updated');
      console.log('BD Tracker PUT - File entry updated:', updatedEntry.id);
    }

    res.json({
      success: true,
      data: updatedEntry,
      message: 'BD Tracker entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating BD Tracker entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating BD Tracker entry' 
    });
  }
});
// Delete BD Tracker entry
app.delete('/api/bd-tracker/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let deleted = false;

    // Try MongoDB first
    try {
      const result = await BDTracker.findOneAndDelete({ _id: id, userId: req.user.id });
      
      if (result) {
        console.log('BD Tracker DELETE - MongoDB entry deleted:', result._id);
        deleted = true;
      }
    } catch (dbError) {
      console.log('MongoDB delete failed, using file-based storage...');
      // Fallback to file-based storage - try both id and _id formats
      let entryIndex = mockDB.bdTracker.findIndex(entry => entry.id === id && entry.userId === req.user.id);
      
      if (entryIndex === -1) {
        // Try MongoDB _id format
        entryIndex = mockDB.bdTracker.findIndex(entry => entry._id === id && entry.userId === req.user.id);
      }
      
      if (entryIndex !== -1) {
        mockDB.bdTracker.splice(entryIndex, 1);
        saveDataToFiles('bd_entry_deleted');
        console.log('BD Tracker DELETE - File entry deleted:', id);
        deleted = true;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'BD Tracker entry not found or not authorized'
      });
    }

    res.json({
      success: true,
      message: 'BD Tracker entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting BD Tracker entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting BD Tracker entry' 
    });
  }
});

// Get custom column headings for BD Tracker
app.get('/api/bd-tracker/column-headings', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    console.log('🔍 GET column-headings - User:', userEmail, 'ID:', userId);
    
    // Try MongoDB first
    try {
      const user = await User.findById(userId);
      console.log('📊 User found in MongoDB:', !!user);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const headings = user.bdTrackerColumnHeadings || {};
      console.log('📋 Current headings:', headings);
      
      res.json({
        success: true,
        columnHeadings: headings
      });
    } catch (dbError) {
      console.log('❌ MongoDB error:', dbError.message);
      console.log('🔄 Using file-based storage...');
      // Fallback to file-based storage
      const user = mockDB.users.find(u => u.email === userEmail);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      res.json({
        success: true,
        columnHeadings: user.bdTrackerColumnHeadings || {}
      });
    }
  } catch (error) {
    console.error('❌ Error fetching column headings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch column headings' });
  }
});

// Save custom column headings for BD Tracker
app.post('/api/bd-tracker/column-headings', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user.id;
    const { columnHeadings } = req.body;
    
    console.log('💾 POST column-headings - User:', userEmail, 'ID:', userId);
    console.log('📝 Headings to save:', columnHeadings);
    
    // Try MongoDB first
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { bdTrackerColumnHeadings: columnHeadings },
        { new: true }
      );
      
      console.log('✅ User updated in MongoDB:', !!user);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      console.log('📋 Saved headings:', user.bdTrackerColumnHeadings);
      
      res.json({
        success: true,
        message: 'Column headings saved successfully',
        columnHeadings: columnHeadings
      });
    } catch (dbError) {
      console.log('❌ MongoDB error:', dbError.message);
      console.log('🔄 Using file-based storage...');
      // Fallback to file-based storage
      const userIndex = mockDB.users.findIndex(u => u.email === userEmail);
      
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Update user's column headings
      mockDB.users[userIndex].bdTrackerColumnHeadings = columnHeadings;
      
      // Save to file
      saveDataToFiles('bd_tracker_column_headings_updated');
      
      res.json({
        success: true,
        message: 'Column headings saved successfully',
        columnHeadings: columnHeadings
      });
    }
  } catch (error) {
    console.error('Error saving column headings:', error);
    res.status(500).json({ success: false, message: 'Failed to save column headings' });
  }
});

// Server will be started at the end of the file

// Forgot password endpoint
app.post('/api/auth/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email } = req.body;
    
    // Check if user exists (try MongoDB first, then fallback to file-based)
    let user = null;
    try {
      console.log('🔍 Checking MongoDB for user password reset...');
      user = await User.findOne({ email }).maxTimeMS(10000);
      console.log('✅ MongoDB query completed for password reset');
    } catch (dbError) {
      console.log('❌ MongoDB not available for password reset, checking file-based storage...');
      console.log('MongoDB Error:', dbError.message);
      user = mockDB.users.find(u => u.email === email);
    }
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'No account found with this email address' 
      });
    }
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code for password reset
    mockDB.verificationCodes.push({
      email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      type: 'password-reset' // Distinguish from email verification
    });

    // Send password reset email FIRST, then save data
    console.log(`📧 Password Reset OTP Generated for ${email}: ${verificationCode}`);
    console.log(`🔑 PASSWORD RESET CODE FOR ${email}: ${verificationCode}`);
    
    const passwordResetHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">BioPing</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Password Reset</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Your Password Reset Code</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            You requested a password reset for your BioPing account. Please use the verification code below to reset your password:
          </p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${verificationCode}</span>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code will expire in 10 minutes. If you didn't request this password reset, please ignore this email.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              The BioPing Team
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Try to send email using Gmail SMTP
    console.log(`📧 Attempting to send password reset OTP email to: ${email}`);
    const emailResult = await sendEmail(
      email,
      'BioPing - Password Reset Code',
      passwordResetHtml
    );
    
    console.log(`📧 Password reset email result:`, emailResult);
    
    if (emailResult.success) {
      console.log(`✅ Password reset OTP email sent successfully to ${email}`);
      res.json({
        success: true,
        message: 'Password reset code sent successfully to your email'
      });
    } else {
      console.log(`❌ Failed to send password reset OTP email to ${email}:`, emailResult.error);
      // Return OTP in response as fallback
      res.json({
        success: true,
        message: 'Password reset code generated successfully',
        verificationCode: verificationCode,
        note: 'Use this code: ' + verificationCode,
        emailError: emailResult.error
      });
    }

    // Save data to files AFTER email attempt
    saveDataToFiles('password_reset_code_sent');

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, code, newPassword } = req.body;
    
    // Find the verification code for password reset
    const verificationRecord = mockDB.verificationCodes.find(
      record => record.email === email && 
                record.code === code && 
                record.type === 'password-reset' &&
                new Date() < record.expiresAt
    );

    if (!verificationRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification code' 
      });
    }

    // Find the user (try MongoDB first, then fallback to file-based)
    let user = null;
    let isMongoUser = false;
    try {
      console.log('🔍 Checking MongoDB for password reset user...');
      user = await User.findOne({ email }).maxTimeMS(10000);
      if (user) {
        console.log('✅ User found in MongoDB for password reset');
        isMongoUser = true;
      }
    } catch (dbError) {
      console.log('❌ MongoDB not available for password reset, checking file-based storage...');
      console.log('MongoDB Error:', dbError.message);
    }
    
    // Fallback to file storage if MongoDB fails or user not found
    if (!user) {
      user = mockDB.users.find(u => u.email === email);
      if (user) {
        console.log('✅ User found in file storage for password reset');
      }
    }
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if the new password is different from the current password
    const isCurrentPassword = await bcrypt.compare(newPassword, user.password);
    if (isCurrentPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be different from your current password' 
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password based on storage type
    if (isMongoUser) {
      // Update in MongoDB
      try {
        await User.findOneAndUpdate(
          { email },
          { password: hashedPassword },
          { new: true }
        );
        console.log('✅ Password updated in MongoDB');
      } catch (dbError) {
        console.log('❌ Failed to update password in MongoDB:', dbError.message);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to update password' 
        });
      }
    } else {
      // Update in file storage
      user.password = hashedPassword;
      console.log('✅ Password updated in file storage');
    }

    // Remove the used verification code
    mockDB.verificationCodes = mockDB.verificationCodes.filter(
      record => !(record.email === email && record.code === code && record.type === 'password-reset')
    );

    // Save data to files (only for file storage users)
    if (!isMongoUser) {
      saveDataToFiles();
    }

    console.log(`✅ Password reset successful for ${email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route to get user profile
app.get('/api/auth/profile', authenticateToken, checkUserSuspension, async (req, res) => {
  try {
    console.log('🔍 Fetching profile for:', req.user.email);
    
    let user = null;
    
    // Try MongoDB first - FORCE FRESH DATA
    try {
      user = await User.findOne({ email: req.user.email }).maxTimeMS(10000);
      if (user) {
        console.log('✅ User found in MongoDB with credits:', user.currentCredits);
        // Convert to plain object for JSON response
        user = user.toObject();
        console.log('✅ Using FRESH MongoDB data - credits:', user.currentCredits);
      } else {
        console.log('⚠️ User NOT found in MongoDB, will check file storage');
      }
    } catch (dbError) {
      console.log('⚠️ MongoDB error, falling back to file storage:', dbError.message);
    }
    
    // Fallback to file storage if MongoDB fails
    if (!user) {
      user = mockDB.users.find(u => u.email === req.user.email);
      if (user) {
        console.log('✅ User found in file storage with credits:', user.currentCredits);
        console.log('⚠️ WARNING: Using file storage data - MongoDB should be primary source!');
        console.log('⚠️ This user needs to be synced to MongoDB!');
        
        // Create user in MongoDB if doesn't exist
        try {
          const User = require('./models/User');
          const newMongoUser = await User.create({
            email: user.email,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
            role: user.role,
            currentCredits: user.currentCredits,
            paymentCompleted: user.paymentCompleted,
            currentPlan: user.currentPlan,
            createdAt: user.createdAt,
            isVerified: user.isVerified,
            isActive: user.isActive
          });
          console.log('✅ User created in MongoDB with credits:', newMongoUser.currentCredits);
        } catch (createError) {
          console.log('❌ Failed to create user in MongoDB:', createError.message);
        }
      }
    }
    
    if (!user) {
      console.log('❌ User not found in any database');
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch invoices from Stripe if user has Stripe customer ID
    let stripeInvoices = [];
    if (user.stripeCustomerId) {
      try {
        console.log('🔍 Fetching Stripe invoices for customer:', user.stripeCustomerId);
        const invoices = await stripe.invoices.list({
          customer: user.stripeCustomerId,
          limit: 10
        });
        
        stripeInvoices = invoices.data.map(invoice => ({
          id: invoice.id,
          number: invoice.number || invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000).toISOString(),
          paid: invoice.paid,
          hosted_invoice_url: invoice.hosted_invoice_url,
          description: invoice.description || 'Subscription Payment'
        }));
        
        console.log(`✅ Found ${stripeInvoices.length} Stripe invoices`);
      } catch (stripeError) {
        console.log('⚠️ Stripe invoice fetch error:', stripeError.message);
      }
    }

    // Determine actual credits to send
    let creditsToSend = user.currentCredits;
    const isFreeUser = !user.paymentCompleted || user.currentPlan === 'free';
    
    // For paid users, ensure they have the correct credits for their plan
    if (!isFreeUser) {
      const expectedCredits = user.currentPlan === 'monthly' || user.currentPlan === 'basic' ? 50 :
                             user.currentPlan === 'annual' || user.currentPlan === 'premium' ? 100 :
                             user.currentPlan === 'test' ? 1 : 
                             user.currentPlan === 'daily-12' ? 50 : 5; // Added daily-12 support
      
      // CRITICAL FIX: Don't auto-correct credits for ANY paid plan (they can vary due to usage)
      if (user.currentPlan === 'daily-12' || user.currentPlan === 'monthly' || user.currentPlan === 'annual' || user.currentPlan === 'basic' || user.currentPlan === 'premium') {
        console.log(`💳 ${user.currentPlan} plan: Using actual credits (${creditsToSend}) - no auto-correction`);
        // Keep actual credits for all paid plans
      } else if (creditsToSend !== expectedCredits) {
        console.log(`🔧 Fixing credits for paid user: ${creditsToSend} → ${expectedCredits} (${user.currentPlan} plan)`);
        creditsToSend = expectedCredits;
        
        // Update in MongoDB
        try {
          await User.findOneAndUpdate(
            { email: user.email },
            { currentCredits: expectedCredits },
            { new: true, maxTimeMS: 10000 }
          );
          console.log(`✅ Updated user credits in MongoDB to ${expectedCredits}`);
        } catch (dbError) {
          console.log('⚠️ Could not update MongoDB, updating file storage...');
          // Fallback to file storage
          const userIndex = mockDB.users.findIndex(u => u.email === user.email);
          if (userIndex !== -1) {
            mockDB.users[userIndex].currentCredits = expectedCredits;
            saveDataToFiles('credits_fixed');
          }
        }
      }
    }
    
    // If currentCredits is undefined or null, set based on plan and trial status
    if (creditsToSend === undefined || creditsToSend === null) {
      if (isFreeUser) {
        // Check trial status for free users
        const registrationDate = new Date(user.createdAt || user.registrationDate || new Date());
        const now = new Date();
        const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
        const trialExpired = daysSinceRegistration >= 5;
        
        creditsToSend = trialExpired ? 0 : 5;
      } else {
        // Paid users get default credits based on plan
        if (user.currentPlan === 'monthly' || user.currentPlan === 'basic') {
          creditsToSend = 50;
        } else if (user.currentPlan === 'annual' || user.currentPlan === 'premium') {
          creditsToSend = 100;
        } else if (user.currentPlan === 'test') {
          creditsToSend = 1;
        } else {
          creditsToSend = 5;
        }
      }
    }
    
    // Return complete user data including invoices and payment history
    console.log('📤 Sending profile data with credits:', {
      email: user.email,
      currentPlan: user.currentPlan || 'free',
      currentCredits: creditsToSend,
      storedCredits: user.currentCredits,
      paymentCompleted: user.paymentCompleted || false
    });

    res.json({
      user: {
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        createdAt: user.createdAt,
        currentPlan: user.currentPlan || 'free',
        paymentCompleted: user.paymentCompleted || false,
        currentCredits: creditsToSend,
        invoices: [...(user.invoices || []), ...stripeInvoices],
        paymentHistory: user.paymentHistory || [],
        lastCreditRenewal: user.lastCreditRenewal,
        nextCreditRenewal: user.nextCreditRenewal,
        hasPaymentInfo: true,
        stripeCustomerId: user.stripeCustomerId,
        subscriptionId: user.subscriptionId
      }
    });
    
    // Save profile access data
    saveDataToFiles('profile_accessed');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Free Plan Activation Route
app.post('/api/auth/activate-free-plan', authenticateToken, async (req, res) => {
  try {
    console.log('🎉 Free plan activation request received for user:', req.user.email);
    
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    // Try MongoDB first
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Update user to free plan
      user.currentPlan = 'free';
      user.paymentCompleted = true; // Mark as completed for free plan
      user.currentCredits = 5; // Give 5 credits for free plan
      user.subscriptionStatus = 'active';
      user.planActivatedAt = new Date();
      
      await user.save();
      console.log('✅ Free plan activated in MongoDB for user:', userEmail);
      
      res.json({
        success: true,
        message: 'Free plan activated successfully!',
        user: {
          id: user._id,
          email: user.email,
          currentPlan: user.currentPlan,
          currentCredits: user.currentCredits,
          paymentCompleted: user.paymentCompleted
        }
      });
    } catch (dbError) {
      console.log('MongoDB error, using file-based storage...');
      
      // Fallback to file-based storage
      const userIndex = mockDB.users.findIndex(u => u.email === userEmail);
      if (userIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Update user to free plan
      mockDB.users[userIndex].currentPlan = 'free';
      mockDB.users[userIndex].paymentCompleted = true;
      mockDB.users[userIndex].currentCredits = 5;
      mockDB.users[userIndex].subscriptionStatus = 'active';
      mockDB.users[userIndex].planActivatedAt = new Date().toISOString();
      
      // Save to file
      saveDataToFiles('free_plan_activated');
      console.log('✅ Free plan activated in file storage for user:', userEmail);
      
      res.json({
        success: true,
        message: 'Free plan activated successfully!',
        user: {
          id: mockDB.users[userIndex].id,
          email: mockDB.users[userIndex].email,
          currentPlan: mockDB.users[userIndex].currentPlan,
          currentCredits: mockDB.users[userIndex].currentCredits,
          paymentCompleted: mockDB.users[userIndex].paymentCompleted
        }
      });
    }
  } catch (error) {
    console.error('❌ Error activating free plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to activate free plan' 
    });
  }
});
// Stripe Payment Routes
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    console.log('Payment intent request received:', req.body);
    const { amount, currency = 'usd', planId, isAnnual } = req.body;

    console.log('Stripe secret key available:', !!stripeSecretKey);
    console.log('Processing payment for:', { amount, planId, isAnnual });
    
    // Check if this is a free plan (amount is 0 or planId is 'free')
    if (amount === 0 || planId === 'free') {
      console.log('❌ Free plan detected - should not create payment intent');
      return res.status(400).json({ 
        error: 'Invalid payment amount', 
        message: 'Free plans should not require payment processing. Use the free plan activation endpoint instead.' 
      });
    }
    
    // Validate Stripe is properly configured
    if (!stripe || !stripeSecretKey) {
      console.error('❌ Stripe not properly configured');
      console.error('🔧 Stripe object:', !!stripe);
      console.error('🔧 Stripe secret key:', !!stripeSecretKey);
      return res.status(500).json({ 
        error: 'Payment service not available', 
        details: 'Stripe configuration error' 
      });
    }

    // Create payment intent directly with amount (no price IDs needed)
    console.log('Creating payment intent for amount:', amount * 100, 'cents');

    // Create or get customer for better tracking
    let customer = null;
    const customerEmail = req.body.customerEmail;
    
    console.log('Customer email:', customerEmail);
    
    if (customerEmail) {
      // Try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('Found existing customer:', customer.id);
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            planId: planId,
            isAnnual: isAnnual ? 'true' : 'false'
          }
        });
        console.log('Created new customer:', customer.id);
      }
    }

    console.log('Creating payment intent with amount:', amount * 100);
    console.log('Customer:', customer ? customer.id : 'guest');
    console.log('Plan details:', { planId, isAnnual, amount: amount * 100 });

    // Create simple payment intent for all plans
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents and round
      currency: currency,
      customer: customer ? customer.id : undefined,
      metadata: {
        planId: planId,
        isAnnual: isAnnual ? 'true' : 'false',
        customerEmail: customerEmail || (customer ? customer.email : ''),
        integration_check: 'accept_a_payment'
      },
      payment_method_types: ['card'],
      automatic_payment_methods: {
        enabled: true
      },
      confirmation_method: 'manual',
      statement_descriptor: 'THE BIOPING',
      capture_method: 'automatic'
    });

    console.log('✅ Payment intent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      clientSecret: !!paymentIntent.client_secret,
      paymentMethodTypes: paymentIntent.payment_method_types
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Payment failed', details: error.message });
  }
});
// Fixed: Create 12-day $1/day subscription with proper auto-cut payment flow
app.post('/api/subscription/create-daily-12', async (req, res) => {
  try {
    const { customerEmail, paymentMethodId, customerName } = req.body;

    // Validate required fields for auto-cut functionality
    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Customer email is required'
      });
    }

    console.log('🚀 Creating 12-day subscription with auto-cut functionality...');

    // Use the existing auto-cut subscription setup
    const result = await setupAutoCutSubscription(
      {
        email: customerEmail,
        name: customerName || 'Customer',
        id: 'user_' + Date.now(),
        planId: 'daily-12'
      },
      paymentMethodId, // This will be null if not provided, but setupAutoCutSubscription handles it
      null // Will create price dynamically
    );

    if (result.success) {
      console.log('✅ 12-day subscription with auto-cut created successfully!');
      
      // Check if 3D Secure authentication is required
      const latestInvoice = result.subscription.latest_invoice;
      if (latestInvoice && latestInvoice.payment_intent) {
        const paymentIntent = latestInvoice.payment_intent;
        
        console.log('🔍 Payment Intent Status:', paymentIntent.status);
        
        if (paymentIntent.status === 'requires_action') {
          console.log('🔐 3D Secure authentication required');
          console.log('🔑 Client secret available:', !!paymentIntent.client_secret);
          console.log('🔑 Client secret preview:', paymentIntent.client_secret ? 
            paymentIntent.client_secret.substring(0, 20) + '...' : 'Missing');
          
          return res.json({
            success: true,
            requires_action: true,
            client_secret: paymentIntent.client_secret,
            subscriptionId: result.subscription.id,
            customerId: result.customer.id,
            status: result.subscription.status,
            paymentIntentId: paymentIntent.id,
            message: 'Subscription created but payment incomplete - 3D Secure authentication required',
            authentication_required: true,
            next_action: 'complete_3d_secure_authentication'
          });
        }
        
        if (paymentIntent.status === 'succeeded') {
          console.log('✅ Payment succeeded, proceeding with subscription setup');
        } else {
          console.log('❌ Payment not succeeded, status:', paymentIntent.status);
          return res.status(400).json({
            success: false,
            message: `Payment failed with status: ${paymentIntent.status}`,
            paymentStatus: paymentIntent.status
          });
        }
      }
      
      // Generate initial invoice for subscription creation
      const initialInvoice = {
        id: `INIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        amount: 1.00, // $1.00 for daily plan
        currency: 'usd',
        status: 'paid',
        description: 'Daily-12 Plan - Initial Subscription',
        plan: 'Daily-12',
        subscriptionId: result.subscription.id,
        customerEmail: customerEmail,
        type: 'subscription_creation',
        creditsAdded: 50
      };

      // Add invoice to user record
      try {
        const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
        if (userIndex !== -1) {
          if (!mockDB.users[userIndex].invoices) {
            mockDB.users[userIndex].invoices = [];
          }
          mockDB.users[userIndex].invoices.push(initialInvoice);
          mockDB.users[userIndex].currentCredits = (mockDB.users[userIndex].currentCredits || 0) + 50;
          mockDB.users[userIndex].currentPlan = 'daily-12';
          mockDB.users[userIndex].subscriptionEndAt = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString();
          saveDataToFiles('subscription_created_with_invoice');
        }
      } catch (error) {
        console.error('❌ Error adding initial invoice:', error);
      }
      
      res.json({
        success: true,
        subscriptionId: result.subscription.id,
        customerId: result.customer.id,
        status: result.subscription.status,
        message: '12-day subscription created with automatic daily billing setup',
        endAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        invoice: initialInvoice
      });
    } else {
      console.log('❌ Auto-cut subscription setup failed');
      res.status(500).json({
        success: false,
        message: 'Failed to create auto-cut subscription',
        details: result.error
      });
    }

  } catch (error) {
    console.error('Create daily subscription error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create daily subscription', 
      details: error.message
    });
  }
});

// Admin endpoints for Gaurav Vij - REAL MONGODB DATA
app.get('/api/admin/user-activity', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching real user activity from MongoDB...');
    
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      console.log('❌ MongoDB not connected, using file-based data...');
      return res.json({
        success: true,
        data: [],
        totalUsers: 0,
        recentActivity: 0,
        message: 'Using file-based storage - MongoDB not available'
      });
    }
    
    // Get real user activity data from MongoDB with timeout
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const users = await User.find({}).lean().sort({ createdAt: -1 }).maxTimeMS(15000);
    
    const userActivity = users.map(user => {
      const activities = [];
      if (new Date(user.createdAt) > thirtyDaysAgo) {
        activities.push('New Registration');
      }
      if (user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo) {
        activities.push('Recent Login');
      }
      if (user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo) {
        activities.push('Profile Updated');
      }
      
      return {
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        action: activities.length > 0 ? activities.join(', ') : 'No Recent Activity',
        timestamp: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin,
        lastUpdate: user.updatedAt,
        company: user.company,
        role: user.role,
        ipAddress: 'N/A'
      };
    });

    res.json({
      success: true,
      data: userActivity,
      totalUsers: users.length,
      recentActivity: users.filter(u => 
        new Date(u.createdAt) > thirtyDaysAgo || 
        (u.lastLogin && new Date(u.lastLogin) > thirtyDaysAgo) ||
        (u.updatedAt && new Date(u.updatedAt) > thirtyDaysAgo)
      ).length
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user activity' });
  }
});

app.get('/api/admin/trial-data', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching real trial data from MongoDB...');
    
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      console.log('❌ MongoDB not connected, using file-based data...');
      return res.json({
        success: true,
        data: [],
        totalUsers: 0,
        trialUsers: 0,
        paidUsers: 0,
        message: 'Using file-based storage - MongoDB not available'
      });
    }
    
    // Get real trial data from MongoDB with timeout
    const users = await User.find({}).lean().sort({ createdAt: -1 }).maxTimeMS(15000);
    
    const trialData = users.map(user => {
      let trialInfo;
      
      if (user.currentPlan === 'test') {
        trialInfo = {
          status: 'Test Account',
          daysRemaining: 'N/A',
          trialStart: user.createdAt,
          trialEnd: null
        };
      } else if (user.currentPlan === 'free' && !user.paymentCompleted) {
        // Free trial: 5 days from registration
        const trialStart = new Date(user.createdAt);
        const trialEnd = new Date(trialStart.getTime() + (5 * 24 * 60 * 60 * 1000));
        const now = new Date();
        const daysRemaining = Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000));
        
        trialInfo = {
          status: daysRemaining > 0 ? 'Active' : 'Expired',
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          trialStart: trialStart,
          trialEnd: trialEnd
        };
      } else if (user.paymentCompleted) {
        trialInfo = {
          status: 'Paid Customer',
          daysRemaining: 'N/A',
          trialStart: user.createdAt,
          trialEnd: null
        };
      } else {
        trialInfo = {
          status: 'Inactive',
          daysRemaining: 0,
          trialStart: user.createdAt,
          trialEnd: null
        };
      }
      
      return {
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        trialStart: trialInfo.trialStart,
        trialEnd: trialInfo.trialEnd,
        status: trialInfo.status,
        daysRemaining: trialInfo.daysRemaining,
        currentPlan: user.currentPlan,
        paymentStatus: user.paymentCompleted ? 'Completed' : 'Pending',
        company: user.company
      };
    });

    res.json({
      success: true,
      data: trialData,
      totalUsers: users.length,
      trialUsers: users.filter(u => u.currentPlan === 'free' || u.currentPlan === 'test').length,
      paidUsers: users.filter(u => u.paymentCompleted).length
    });
  } catch (error) {
    console.error('Error fetching trial data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trial data' });
  }
});

app.get('/api/admin/potential-customers', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching real potential customers from MongoDB...');
    
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      console.log('❌ MongoDB not connected, using file-based data...');
      return res.json({
        success: true,
        data: [],
        totalUsers: 0,
        potentialCustomers: 0,
        message: 'Using file-based storage - MongoDB not available'
      });
    }
    
    // Get real potential customer data from MongoDB with timeout
    const users = await User.find({}).lean().sort({ createdAt: -1 }).maxTimeMS(15000);
    
    const potentialCustomers = users
      .filter(user => !user.paymentCompleted && user.currentPlan !== 'test')
      .map(user => {
        const lastActivity = user.lastLogin || user.updatedAt || user.createdAt;
        const daysSinceLastActivity = Math.ceil((new Date() - new Date(lastActivity)) / (24 * 60 * 60 * 1000));
        
        let priority = 'Low';
        if (daysSinceLastActivity <= 7) priority = 'High';
        else if (daysSinceLastActivity <= 30) priority = 'Medium';
        
        return {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company || 'N/A',
          phone: user.phone || 'N/A',
          registrationDate: user.createdAt,
          lastActivity: lastActivity,
          daysSinceLastActivity: daysSinceLastActivity,
          priority: priority,
          isHotLead: daysSinceLastActivity <= 7,
          role: user.role,
          currentPlan: user.currentPlan
        };
      });

    res.json({
      success: true,
      data: potentialCustomers,
      totalPotentialCustomers: potentialCustomers.length,
      hotLeads: potentialCustomers.filter(c => c.isHotLead).length,
      highPriority: potentialCustomers.filter(c => c.priority === 'High').length,
      mediumPriority: potentialCustomers.filter(c => c.priority === 'Medium').length,
      lowPriority: potentialCustomers.filter(c => c.priority === 'Low').length
    });
  } catch (error) {
    console.error('Error fetching potential customers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch potential customers' });
  }
});

app.get('/api/admin/subscription-details', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching real subscription details from MongoDB...');
    
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      console.log('❌ MongoDB not connected, using file-based data...');
      return res.json({
        success: true,
        subscriptions: [],
        message: 'Using file-based storage - MongoDB not available'
      });
    }
    
    // Get real subscription details from MongoDB
    const users = await User.find({}).lean().sort({ createdAt: -1 }).maxTimeMS(15000);
    
    const subscriptionDetails = users.map(user => ({
      id: user.id || user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      company: user.company,
      currentPlan: user.currentPlan || 'free',
      paymentCompleted: user.paymentCompleted || false,
      currentCredits: user.currentCredits || 0,
      lastCreditRenewal: user.lastCreditRenewal,
      nextCreditRenewal: user.nextCreditRenewal,
      subscriptionId: user.subscriptionId,
      subscriptionEndAt: user.subscriptionEndAt,
      subscriptionOnHold: user.subscriptionOnHold || false,
      paymentUpdatedAt: user.paymentUpdatedAt,
      createdAt: user.createdAt,
      invoices: user.invoices || [],
      paymentHistory: user.paymentHistory || [],
      status: user.paymentCompleted ? 'Active' : 'Inactive',
      isVerified: user.isVerified,
      isActive: user.isActive
    }));

    res.json({
      success: true,
      subscriptions: subscriptionDetails,
      totalSubscriptions: subscriptionDetails.length,
      activeSubscriptions: subscriptionDetails.filter(s => s.status === 'Active').length,
      inactiveSubscriptions: subscriptionDetails.filter(s => s.status === 'Inactive').length,
      verifiedUsers: subscriptionDetails.filter(s => s.isVerified).length,
      activeUsers: subscriptionDetails.filter(s => s.isActive).length
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription details' });
  }
});

// Comprehensive admin data endpoint - fetches all data from MongoDB Atlas
app.get('/api/admin/comprehensive-data', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching comprehensive admin data from MongoDB Atlas...');
    
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      console.log('❌ MongoDB not connected, using file-based data...');
      return res.json({
        success: true,
        message: 'Using file-based storage - MongoDB not available',
        data: {
          users: [],
          trialData: [],
          potentialCustomers: [],
          userActivity: [],
          subscriptionDetails: [],
          contactSubmissions: []
        }
      });
    }
    
    // Fetch all data from MongoDB with timeout
    const users = await User.find({}).lean().sort({ createdAt: -1 }).maxTimeMS(15000);
    const bdTrackers = await BDTracker.find({}).lean().maxTimeMS(15000);
    
    // Calculate trial data
    const trialUsers = users.filter(user => 
      user.currentPlan === 'free' || user.currentPlan === 'test'
    );
    
    // Calculate potential customers
    const potentialCustomers = users.filter(user => 
      !user.paymentCompleted && user.currentPlan !== 'test'
    );
    
    // Calculate user activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = users.filter(user => 
      new Date(user.createdAt) > thirtyDaysAgo || 
      (user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo) ||
      (user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo)
    );
    
    // Format data for admin panel
    const formattedData = {
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        verifiedUsers: users.filter(u => u.isVerified).length,
        pendingApprovals: users.filter(u => !u.isApproved).length,
        paidUsers: users.filter(u => u.paymentCompleted).length,
        testUsers: users.filter(u => u.currentPlan === 'test').length,
        trialUsers: trialUsers.length,
        potentialCustomers: potentialCustomers.length,
        suspendedUsers: users.filter(u => u.suspended && u.suspended.suspendedUntil && new Date() < new Date(u.suspended.suspendedUntil)).length,
        totalBDProjects: bdTrackers.length,
        uniqueCompanies: new Set(users.map(u => u.company)).size,
        generatedAt: new Date().toISOString()
      },
      users: users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        role: user.role,
        isApproved: user.isApproved,
        isVerified: user.isVerified,
        isActive: user.isActive,
        paymentCompleted: user.paymentCompleted,
        currentPlan: user.currentPlan,
        currentCredits: user.currentCredits || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        updatedAt: user.updatedAt,
        subscriptionId: user.subscriptionId,
        subscriptionEndAt: user.subscriptionEndAt,
        nextCreditRenewal: user.nextCreditRenewal,
        status: user.suspended && user.suspended.suspendedUntil && new Date() < new Date(user.suspended.suspendedUntil) ? 'Suspended' : 'Active'
      })),
      userActivity: recentUsers.map(user => {
        const activities = [];
        if (new Date(user.createdAt) > thirtyDaysAgo) activities.push('New Registration');
        if (user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo) activities.push('Recent Login');
        if (user.updatedAt && new Date(user.updatedAt) > thirtyDaysAgo) activities.push('Profile Updated');
        
        return {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          activities: activities.length > 0 ? activities.join(', ') : 'No Recent Activity',
          registrationDate: user.createdAt,
          lastLogin: user.lastLogin,
          lastUpdate: user.updatedAt,
          company: user.company,
          role: user.role
        };
      }),
      trialData: trialUsers.map(user => {
        let trialInfo;
        if (user.currentPlan === 'test') {
          trialInfo = { status: 'Test Account', daysRemaining: 'N/A', trialEnd: null };
        } else if (user.currentPlan === 'free' && !user.paymentCompleted) {
          const trialStart = new Date(user.createdAt);
          const trialEnd = new Date(trialStart.getTime() + (5 * 24 * 60 * 60 * 1000));
          const now = new Date();
          const daysRemaining = Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000));
          trialInfo = {
            status: daysRemaining > 0 ? 'Active' : 'Expired',
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
            trialEnd: trialEnd
          };
        } else {
          trialInfo = { status: 'Paid Customer', daysRemaining: 'N/A', trialEnd: null };
        }
        
        return {
          userName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          trialStart: user.createdAt,
          trialEnd: trialInfo.trialEnd,
          status: trialInfo.status,
          daysRemaining: trialInfo.daysRemaining,
          currentPlan: user.currentPlan,
          paymentStatus: user.paymentCompleted ? 'Completed' : 'Pending',
          company: user.company
        };
      }),
      potentialCustomers: potentialCustomers.map(user => {
        const lastActivity = user.lastLogin || user.updatedAt || user.createdAt;
        const daysSinceLastActivity = Math.ceil((new Date() - new Date(lastActivity)) / (24 * 60 * 60 * 1000));
        
        let priority = 'Low';
        if (daysSinceLastActivity <= 7) priority = 'High';
        else if (daysSinceLastActivity <= 30) priority = 'Medium';
        
        return {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company || 'N/A',
          phone: user.phone || 'N/A',
          registrationDate: user.createdAt,
          lastActivity: lastActivity,
          daysSinceLastActivity: daysSinceLastActivity,
          priority: priority,
          isHotLead: daysSinceLastActivity <= 7,
          role: user.role,
          currentPlan: user.currentPlan
        };
      }),
      subscriptions: users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        currentPlan: user.currentPlan || 'free',
        paymentCompleted: user.paymentCompleted || false,
        currentCredits: user.currentCredits || 0,
        lastCreditRenewal: user.lastCreditRenewal,
        nextCreditRenewal: user.nextCreditRenewal,
        subscriptionId: user.subscriptionId,
        subscriptionEndAt: user.subscriptionEndAt,
        subscriptionOnHold: user.subscriptionOnHold || false,
        paymentUpdatedAt: user.paymentUpdatedAt,
        createdAt: user.createdAt,
        invoices: user.invoices || [],
        paymentHistory: user.paymentHistory || [],
        status: user.paymentCompleted ? 'Active' : 'Inactive',
        isVerified: user.isVerified,
        isActive: user.isActive
      })),
      bdTrackers: bdTrackers.map(track => ({
        id: track._id,
        projectName: track.projectName,
        company: track.company,
        userId: track.userId,
        status: track.status,
        priority: track.priority,
        contactPerson: track.contactPerson,
        contactFunction: track.contactFunction,
        createdAt: track.createdAt,
        updatedAt: track.updatedAt
      }))
    };

    res.json({
      success: true,
      message: 'Comprehensive admin data fetched successfully from MongoDB Atlas',
      data: formattedData
    });
    
  } catch (error) {
    console.error('Error fetching comprehensive admin data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch comprehensive admin data',
      error: error.message 
    });
  }
});

// ============================================================================
// AUTOMATIC INVOICE GENERATION FUNCTION
// ============================================================================

// Function to automatically generate invoice after successful payment
async function generateAutomaticInvoice(paymentIntent, customerEmail, planId) {
  try {
    console.log('📄 Generating automatic invoice for payment:', paymentIntent.id);
    
    // Find user data
    let user = null;
    try {
      user = await User.findOne({ email: customerEmail });
      if (!user) {
        const fileUser = mockDB.users.find(u => u.email === customerEmail);
        if (fileUser) {
          user = fileUser;
        }
      }
    } catch (error) {
      console.log('Using file-based user data');
      user = mockDB.users.find(u => u.email === customerEmail);
    }
    
    if (!user) {
      console.log('❌ User not found for automatic invoice generation');
      return;
    }
    
    // Create invoice data
    const invoiceData = {
      id: `INV-${Date.now()}`,
      paymentIntentId: paymentIntent.id,
      customerEmail: customerEmail,
      amount: paymentIntent.amount / 100, // Convert cents to dollars
      currency: paymentIntent.currency.toUpperCase(),
      planId: planId,
      status: 'paid',
      created: new Date().toISOString(),
      date: new Date().toISOString(),
      description: getPlanDescription(planId),
      user: {
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || customerEmail,
        email: customerEmail,
        company: user.company || 'N/A'
      }
    };
    
    // Generate PDF invoice
    const pdfBuffer = await generatePDFInvoice(invoiceData, invoiceData.user);
    
    // Save invoice data to database/file
    try {
      // Try to save to MongoDB first
      if (isMongoConnected()) {
        await User.findOneAndUpdate(
          { email: customerEmail },
          { 
            $push: { 
              invoices: invoiceData 
            }
          }
        );
        console.log('✅ Invoice saved to MongoDB');
      } else {
        // Fallback to file storage
        const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
        if (userIndex !== -1) {
          if (!mockDB.users[userIndex].invoices) {
            mockDB.users[userIndex].invoices = [];
          }
          mockDB.users[userIndex].invoices.push(invoiceData);
          saveDataToFiles();
          console.log('✅ Invoice saved to file storage');
        }
      }
    } catch (saveError) {
      console.error('❌ Error saving invoice:', saveError);
    }
    
    console.log('✅ Automatic invoice generated successfully:', invoiceData.id);
    return {
      invoiceData,
      pdfBuffer
    };
    
  } catch (error) {
    console.error('❌ Error generating automatic invoice:', error);
    return null;
  }
}
// Helper function to get plan description
function getPlanDescription(planId) {
  const planDescriptions = {
    'monthly': 'BioPing Monthly Subscription',
    'yearly': 'BioPing Yearly Subscription',
    'basic': 'BioPing Basic Plan',
    'premium': 'BioPing Premium Plan',
    'basic-yearly': 'BioPing Basic Plan (Yearly)',
    'premium-yearly': 'BioPing Premium Plan (Yearly)',
    'daily-12': 'BioPing 12-Day Trial Plan',
    'simple-1': 'BioPing Simple Plan'
  };
  
  return planDescriptions[planId] || 'BioPing Subscription';
}
// Function to generate PDF invoice
const generatePDFInvoice = (invoice, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add company logo
      try {
        // Try multiple logo files in order of preference
        const logoPaths = [
          path.join(__dirname, '..', 'public', 'logo192.png'),
          path.join(__dirname, '..', 'public', 'Gaurav.png'),
          path.join(__dirname, '..', 'public', 'our-approach.png'),
          path.join(__dirname, '..', 'public', 'who-we-serve.png'),
          path.join(__dirname, '..', 'public', 'image.png')
        ];
        
        let logoAdded = false;
        for (const logoPath of logoPaths) {
          if (fs.existsSync(logoPath)) {
            console.log('🔍 Trying logo at:', logoPath);
            try {
              // Add logo at the top right
              doc.image(logoPath, {
                fit: [120, 60],
                align: 'right'
              });
              console.log('✅ Logo added successfully from:', logoPath);
              logoAdded = true;
              doc.moveDown(1);
              break;
            } catch (imageError) {
              console.log('❌ Failed to load logo from:', logoPath, '- Error:', imageError.message);
              continue;
            }
          }
        }
        
        if (!logoAdded) {
          console.log('❌ No suitable logo found, using text fallback');
        }
      } catch (logoError) {
        console.log('❌ Error loading logo:', logoError.message);
      }

      // Only add company name if no logo was added
      if (!logoAdded) {
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor('#2563eb')
           .text('BioPing', { align: 'center' });
      }
      
      doc.moveDown(0.5);
      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Business Development Intelligence Platform', { align: 'center' });
      
      doc.moveDown(2);

      // Invoice title
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('INVOICE', { align: 'center' });
      
      doc.moveDown(1);

      // Invoice details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(`Invoice #: ${invoice.id}`);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(`Date: ${new Date(invoice.created || invoice.date || Date.now()).toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })}`);
      
      doc.moveDown(1);

      // Customer information
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('Bill To:');
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#374151')
         .text(user.name || 'N/A');
      
      if (user.company) {
        doc.text(user.company);
      }
      
      doc.text(user.email);
      
      doc.moveDown(2);

      // Invoice items table
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('Description', 50, doc.y);
      
      doc.text('Amount', 400, doc.y);
      
      doc.moveDown(0.5);
      
      // Draw line
      doc.strokeColor('#d1d5db')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.moveDown(0.5);

      // Invoice item
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#374151')
         .text(invoice.description || 'Subscription Plan', 50, doc.y);
      
      doc.text(`$${(invoice.amount || 0).toFixed(2)}`, 400, doc.y);
      
      doc.moveDown(1);
      
      // Draw line
      doc.strokeColor('#d1d5db')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.moveDown(1);

      // Total
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text('Total:', 350, doc.y);
      
      doc.text(`$${(invoice.amount || 0).toFixed(2)}`, 400, doc.y);
      
      doc.moveDown(2);

      // Status
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#059669')
         .text(`Status: ${(invoice.status || invoice.paid ? 'PAID' : 'PENDING').toUpperCase()}`, { align: 'center' });
      
      doc.moveDown(2);

      // Footer
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('Thank you for choosing BioPing!', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.text('For any questions, please contact our support team at support@bioping.com', { align: 'center' });
      
      doc.moveDown(1);
      doc.text('BioPing - Business Development Intelligence Platform', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Test PDF generation endpoint
app.get('/api/test-pdf', async (req, res) => {
  try {
    console.log('🧪 Testing PDF generation...');
    
    const testInvoice = {
      id: 'TEST-001',
      amount: 1.00,
      description: 'Test Invoice',
      created: new Date().toISOString(),
      status: 'PAID'
    };
    
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company'
    };
    
    const pdfBuffer = await generatePDFInvoice(testInvoice, testUser);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(500).json({ error: 'PDF generation failed - empty buffer' });
    }
    
    console.log('✅ Test PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=test-invoice.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Test PDF generation failed:', error);
    res.status(500).json({ 
      error: 'Test PDF generation failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Download queue to prevent simultaneous downloads
const downloadQueue = new Set();

// Download invoice endpoint - Support both Stripe and local invoices
app.get('/api/auth/download-invoice/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Check if download is already in progress
    if (downloadQueue.has(invoiceId)) {
      return res.status(429).json({ 
        message: 'Download already in progress. Please wait...' 
      });
    }
    
    // Add to download queue
    downloadQueue.add(invoiceId);
    
    try {
    // Find the user
    const user = mockDB.users.find(u => u.email === req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔍 Downloading invoice:', invoiceId, 'for user:', user.email);

    // First, try to find the invoice in Stripe
    let invoice = null;
    let isStripeInvoice = false;

    try {
      // Check if this is a Stripe invoice ID
      const stripeInvoice = await stripe.invoices.retrieve(invoiceId);
      
      // Verify this invoice belongs to the user
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length > 0 && stripeInvoice.customer === customers.data[0].id) {
        invoice = {
          id: stripeInvoice.id,
          number: stripeInvoice.number || stripeInvoice.id,
          amount: stripeInvoice.amount_paid / 100,
          currency: stripeInvoice.currency.toUpperCase(),
          status: stripeInvoice.status,
          created: new Date(stripeInvoice.created * 1000).toISOString(),
          paid: stripeInvoice.paid,
          hosted_invoice_url: stripeInvoice.hosted_invoice_url,
          invoice_pdf: stripeInvoice.invoice_pdf,
          description: stripeInvoice.description || 'BioPing Subscription',
          period_start: stripeInvoice.period_start ? new Date(stripeInvoice.period_start * 1000).toISOString() : null,
          period_end: stripeInvoice.period_end ? new Date(stripeInvoice.period_end * 1000).toISOString() : null
        };
        isStripeInvoice = true;
        console.log('✅ Found Stripe invoice:', invoiceId);
      }
    } catch (stripeError) {
      console.log('❌ Not a Stripe invoice or error:', stripeError.message);
    }

    // If not found in Stripe, check local invoices
    if (!invoice) {
      invoice = user.invoices?.find(inv => inv.id === invoiceId);
      if (invoice) {
        console.log('✅ Found local invoice:', invoiceId);
      }
    }

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Validate invoice object structure
    if (!invoice.id) {
      console.error('❌ Invalid invoice object - missing ID:', invoice);
      return res.status(400).json({ message: 'Invalid invoice format - missing ID' });
    }
    
    console.log('📋 Invoice object structure:', {
      id: invoice.id,
      amount: invoice.amount,
      created: invoice.created,
      date: invoice.date,
      status: invoice.status,
      paid: invoice.paid,
      description: invoice.description
    });

    // If it's a Stripe invoice and has a PDF URL, redirect to it
    if (isStripeInvoice && invoice.invoice_pdf) {
      console.log('📄 Redirecting to Stripe PDF:', invoice.invoice_pdf);
      return res.redirect(invoice.invoice_pdf);
    }

    // Otherwise, generate PDF invoice
    console.log('📄 Generating PDF for invoice:', invoice);
    const pdfBuffer = await generatePDFInvoice(invoice, user);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ Generated PDF buffer is empty');
      return res.status(500).json({ message: 'Error: Generated PDF is empty' });
    }
    
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    } finally {
      // Remove from download queue
      downloadQueue.delete(invoiceId);
    }
    
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    res.status(500).json({ 
      message: 'Error generating invoice',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Remove from download queue
    downloadQueue.delete(req.params.invoiceId);
  }
});

// Update user profile endpoint
app.put('/api/auth/update-profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile update request received');
    console.log('User email:', req.user.email);
    console.log('Request body:', req.body);
    
    const { name, company } = req.body;
    
    // Find the user in the database
    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    console.log('User index:', userIndex);
    console.log('Total users:', mockDB.users.length);
    
    if (userIndex === -1) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found, updating profile...');
    console.log('Current user data:', mockDB.users[userIndex]);

    // Update user profile
    if (name) {
      mockDB.users[userIndex].name = name;
      mockDB.users[userIndex].firstName = name.split(' ')[0] || name;
      mockDB.users[userIndex].lastName = name.split(' ').slice(1).join(' ') || '';
      console.log('Updated name to:', name);
    }
    
    if (company) {
      mockDB.users[userIndex].company = company;
      console.log('Updated company to:', company);
    }

    // Save to file
    saveDataToFiles('profile_update');
    console.log('Data saved to file');

    const responseData = {
      success: true,
      message: 'Profile updated successfully',
      user: {
        email: mockDB.users[userIndex].email,
        name: mockDB.users[userIndex].name,
        company: mockDB.users[userIndex].company,
        role: mockDB.users[userIndex].role
      }
    };

    console.log('Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user invoices endpoint - Fetch from Stripe
app.get('/api/auth/invoices', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching invoices for:', req.user.email);
    
    let user = null;
    
    // Try MongoDB first
    try {
      user = await User.findOne({ email: req.user.email }).maxTimeMS(10000);
      if (user) {
        console.log('✅ User found in MongoDB for invoices');
        user = user.toObject();
      } else {
        console.log('⚠️ User NOT found in MongoDB, will check file storage');
      }
    } catch (dbError) {
      console.log('⚠️ MongoDB error, falling back to file storage:', dbError.message);
    }
    
    // Fallback to file storage if MongoDB fails
    if (!user) {
      user = mockDB.users.find(u => u.email === req.user.email);
      if (user) {
        console.log('✅ User found in file storage for invoices');
        console.log('⚠️ WARNING: Using file storage data - MongoDB should be primary source!');
      }
    }
    
    if (!user) {
      console.log('❌ User not found in any database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔍 Fetching invoices for user:', user.email);

    // Try to fetch invoices from Stripe
    let stripeInvoices = [];
    try {
      // First, find the customer in Stripe by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        console.log('📧 Found Stripe customer:', customer.id);

        // Fetch invoices for this customer
        const invoices = await stripe.invoices.list({
          customer: customer.id,
          limit: 100
        });

        stripeInvoices = invoices.data.map(invoice => ({
          id: invoice.id,
          number: invoice.number || invoice.id,
          amount: invoice.amount_paid / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000).toISOString(),
          paid: invoice.paid,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          description: invoice.description || 'BioPing Subscription',
          period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null
        }));

        console.log('📄 Found', stripeInvoices.length, 'Stripe invoices');
      } else {
        console.log('❌ No Stripe customer found for email:', user.email);
      }
    } catch (stripeError) {
      console.error('❌ Error fetching from Stripe:', stripeError.message);
      // Fall back to local invoices if Stripe fails
    }

    // Combine Stripe invoices with local invoices (if any)
    const localInvoices = user.invoices || [];
    const allInvoices = [...stripeInvoices, ...localInvoices];

    // Sort by creation date (newest first)
    allInvoices.sort((a, b) => new Date(b.created) - new Date(a.created));

    console.log('📊 Total invoices to return:', allInvoices.length);

    res.json({
      success: true,
      data: allInvoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Download all invoices as single PDF - Support both Stripe and local invoices
app.get('/api/auth/download-all-invoices', authenticateToken, async (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔍 Downloading all invoices for user:', user.email);

    // Fetch invoices from Stripe first
    let stripeInvoices = [];
    try {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        const invoices = await stripe.invoices.list({
          customer: customer.id,
          limit: 100
        });

        stripeInvoices = invoices.data.map(invoice => ({
          id: invoice.id,
          number: invoice.number || invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000).toISOString(),
          paid: invoice.paid,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          description: invoice.description || 'BioPing Subscription',
          period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null
        }));

        console.log('📄 Found', stripeInvoices.length, 'Stripe invoices');
      }
    } catch (stripeError) {
      console.error('❌ Error fetching from Stripe:', stripeError.message);
    }

    // Combine with local invoices
    const localInvoices = user.invoices || [];
    const allInvoices = [...stripeInvoices, ...localInvoices];

    if (allInvoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found' });
    }

    console.log('📊 Total invoices to include in PDF:', allInvoices.length);

    // Create a combined PDF with all invoices
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=all-invoices-${user.email}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });

    // Add company logo
    try {
      // Try multiple logo files in order of preference
      const logoPaths = [
        path.join(__dirname, '..', 'public', 'logo192.png'),
        path.join(__dirname, '..', 'public', 'Gaurav.png'),
        path.join(__dirname, '..', 'public', 'our-approach.png'),
        path.join(__dirname, '..', 'public', 'who-we-serve.png'),
        path.join(__dirname, '..', 'public', 'image.png')
      ];
      
      let logoAdded = false;
      for (const logoPath of logoPaths) {
        if (fs.existsSync(logoPath)) {
          console.log('🔍 Trying logo at:', logoPath);
          try {
            // Add logo at the top right
            doc.image(logoPath, {
              fit: [120, 60],
              align: 'right'
            });
            console.log('✅ Logo added successfully from:', logoPath);
            logoAdded = true;
            doc.moveDown(1);
            break;
          } catch (imageError) {
            console.log('❌ Failed to load logo from:', logoPath, '- Error:', imageError.message);
            continue;
          }
        }
      }
      
      if (!logoAdded) {
        console.log('❌ No suitable logo found, using text fallback');
      }
    } catch (logoError) {
      console.log('❌ Error loading logo:', logoError.message);
    }

    // Only add company name if no logo was added
    if (!logoAdded) {
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#2563eb')
         .text('BioPing', { align: 'center' });
    }
    
    doc.moveDown(0.5);
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Business Development Intelligence Platform', { align: 'center' });
    
    doc.moveDown(2);

    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#111827')
       .text('ALL INVOICES', { align: 'center' });
    
    doc.moveDown(1);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#374151')
       .text('Customer:', { align: 'center' });
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(user.name || 'N/A', { align: 'center' });
    
    if (user.company) {
      doc.text(user.company, { align: 'center' });
    }
    
    doc.text(user.email, { align: 'center' });
    
    doc.moveDown(1);

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, { align: 'center' });
    
    doc.moveDown(2);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#111827')
       .text(`Total Invoices: ${allInvoices.length}`, { align: 'center' });
    
    doc.moveDown(1);

    const totalAmount = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#059669')
       .text(`Total Amount: $${totalAmount.toFixed(2)}`, { align: 'center' });

    // Add each invoice
    allInvoices.forEach((invoice, index) => {
      // Add page break between invoices (except for first one)
      if (index > 0) {
        doc.addPage();
      }

      // Add logo to each invoice page
      try {
        const logoPath = path.join(__dirname, '..', 'public', 'image.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, {
            fit: [80, 40],
            align: 'center'
          });
          doc.moveDown(0.5);
        } else {
          // Try alternative path
          const altLogoPath = path.join(__dirname, '..', '..', 'public', 'image.png');
          if (fs.existsSync(altLogoPath)) {
            doc.image(altLogoPath, {
              fit: [80, 40],
              align: 'center'
            });
            doc.moveDown(0.5);
          }
        }
      } catch (logoError) {
        console.log('Logo not found for invoice page');
      }

      // Invoice header
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(`Invoice #${invoice.id}`, { align: 'center' });
      
      doc.moveDown(1);

      // Invoice details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(`Date: ${new Date(invoice.date).toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })}`);
      
      doc.moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(`Plan: ${invoice.plan || 'Subscription'}`);
      
      doc.moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text(`Description: ${invoice.description || 'Business Development Platform Access'}`);
      
      doc.moveDown(1);

      // Amount and status
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#111827')
         .text(`Amount: $${invoice.amount.toFixed(2)}`);
      
      doc.moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#059669')
         .text(`Status: ${invoice.status.toUpperCase()}`);
      
      doc.moveDown(2);

      // Separator line
      doc.strokeColor('#d1d5db')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
    });

    doc.end();
  } catch (error) {
    console.error('Error generating all invoices PDF:', error);
    res.status(500).json({ message: 'Error generating invoices PDF' });
  }
});
// Admin: Suspend user endpoint
app.post('/api/admin/suspend-user', authenticateAdmin, async (req, res) => {
  try {
    const { userId, reason, suspendUntil, duration } = req.body;
    
    if (!userId || !reason || !suspendUntil) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = mockDB.users.find(u => 
      u.id === parseInt(userId) || 
      u.id === userId || 
      u._id === userId || 
      u._id === parseInt(userId)
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add suspension data to user
    user.suspended = {
      isSuspended: true,
      reason: reason,
      suspendedAt: new Date().toISOString(),
      suspendedUntil: suspendUntil,
      duration: duration,
      suspendedBy: req.user.email
    };

    // Save to file
    saveDataToFiles('user_suspended');

    res.json({
      success: true,
      message: 'User suspended successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        suspended: user.suspended
      }
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Unsuspend user endpoint
app.post('/api/admin/unsuspend-user', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = mockDB.users.find(u => 
      u.id === parseInt(userId) || 
      u.id === userId || 
      u._id === userId || 
      u._id === parseInt(userId)
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove suspension data
    if (user.suspended) {
      delete user.suspended;
    }

    // Save to file
    saveDataToFiles('user_unsuspended');

    res.json({
      success: true,
      message: 'User unsuspended successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get user suspension status
app.get('/api/admin/user-suspension/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = mockDB.users.find(u => 
      u.id === parseInt(userId) || 
      u.id === userId || 
      u._id === userId || 
      u._id === parseInt(userId)
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      suspended: user.suspended || null,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error fetching user suspension status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin endpoint to sync old payments from Stripe
app.post('/api/admin/sync-old-payments', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Starting manual sync of old Stripe payments...');
    
    // Get all customers from Stripe
    let allCustomers = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const params = { limit: 100 };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const customers = await stripe.customers.list(params);
      allCustomers = allCustomers.concat(customers.data);
      
      hasMore = customers.has_more;
      if (hasMore && customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    }

    console.log(`📧 Found ${allCustomers.length} customers in Stripe`);

    let totalInvoicesAdded = 0;
    let usersUpdated = 0;

    // Process each customer
    for (const customer of allCustomers) {
      if (!customer.email) continue;

      // Find user in local database
      const userIndex = mockDB.users.findIndex(u => u.email === customer.email);
      if (userIndex === -1) continue;

      // Initialize invoices array if it doesn't exist
      if (!mockDB.users[userIndex].invoices) {
        mockDB.users[userIndex].invoices = [];
      }

      // Get all invoices for this customer
      let allInvoices = [];
      hasMore = true;
      startingAfter = null;

      while (hasMore) {
        const params = { 
          customer: customer.id, 
          limit: 100 
        };
        if (startingAfter) {
          params.starting_after = startingAfter;
        }

        const invoices = await stripe.invoices.list(params);
        allInvoices = allInvoices.concat(invoices.data);
        
        hasMore = invoices.has_more;
        if (hasMore && invoices.data.length > 0) {
          startingAfter = invoices.data[invoices.data.length - 1].id;
        }
      }

      // Process each invoice
      for (const invoice of allInvoices) {
        // Check if invoice already exists
        const existingInvoice = mockDB.users[userIndex].invoices.find(
          inv => inv.id === invoice.id || inv.stripeInvoiceId === invoice.id
        );

        if (existingInvoice) continue;

        // Create invoice object
        const invoiceData = {
          id: invoice.id,
          stripeInvoiceId: invoice.id,
          number: invoice.number || invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000).toISOString(),
          paid: invoice.paid,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          description: invoice.description || 'BioPing Subscription',
          period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          customerEmail: customer.email,
          syncedAt: new Date().toISOString()
        };

        mockDB.users[userIndex].invoices.push(invoiceData);
        totalInvoicesAdded++;

        // Update user's payment status if invoice is paid
        if (invoice.paid && invoice.status === 'paid') {
          mockDB.users[userIndex].paymentCompleted = true;
          mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
        }
      }

      if (allInvoices.length > 0) {
        usersUpdated++;
      }
    }

    // Save data
    saveDataToFiles('sync_old_payments');

    res.json({
      success: true,
      message: 'Old payments synced successfully',
      data: {
        customersProcessed: allCustomers.length,
        usersUpdated: usersUpdated,
        invoicesAdded: totalInvoicesAdded
      }
    });

  } catch (error) {
    console.error('❌ Error syncing old payments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error syncing old payments',
      error: error.message 
    });
  }
});

// Serve React app static files (JS, CSS, images, etc.) with proper MIME types
// First try build directory (production build), then fall back to public
const buildPath = path.join(__dirname, '../build');
const publicPath = path.join(__dirname, '../public');

// Serve from build directory if it exists, otherwise from public
const staticPath = fs.existsSync(buildPath) ? buildPath : publicPath;

app.use(express.static(staticPath, {
  setHeaders: (res, filePath) => {
    // Set proper MIME types for JavaScript files
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Set proper MIME types for CSS files
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    // Set cache headers for static assets
    if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
}));

// Catch-all handler: serve React app for all non-API routes (React Router)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Skip /static routes - they're handled by express.static middleware above
  if (req.path.startsWith('/static/')) {
    return next(); // Let express.static handle it, or return 404 if not found
  }
  
  // For other static file requests (JS, CSS, etc.), if file doesn't exist, return 404
  // Don't serve index.html for missing static files
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|json|pdf)$/)) {
    // Try build directory first, then public
    let filePath = path.join(__dirname, '../build', req.path);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '../public', req.path);
    }
    if (fs.existsSync(filePath)) {
      // Set proper MIME type
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      return res.sendFile(filePath);
    } else {
      return res.status(404).json({ error: 'File not found', path: req.path });
    }
  }
  
  // Serve index.html for all other routes (React Router)
  // Try build directory first, then public
  let indexPath = path.join(__dirname, '../build/index.html');
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(__dirname, '../public/index.html');
  }
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('React app not found. Please build the frontend.');
  }
});

// Start server after MongoDB connection
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Server URL: https://bioping-backend.onrender.com`);
    console.log(`📧 Email server status: Gmail SMTP configured`);
    console.log(`💳 Stripe integration: ${stripe ? 'Ready' : 'Not ready'}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 MongoDB: Connected`);
    console.log(`✅ Health check available at: https://bioping-backend.onrender.com/api/health`);
    console.log(`🔄 Sync old payments: https://bioping-backend.onrender.com/api/admin/sync-old-payments`);
  }).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  });
}).catch((error) => {
  console.log('⚠️ MongoDB connection failed, starting server with file storage...');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (file storage mode)`);
    console.log(`🌐 Server URL: https://bioping-backend.onrender.com`);
    console.log(`📧 Email server status: Gmail SMTP configured`);
    console.log(`💳 Stripe integration: ${stripe ? 'Ready' : 'Not ready'}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 MongoDB: File-based storage`);
    console.log(`✅ Health check available at: https://bioping-backend.onrender.com/api/health`);
    console.log(`🔄 Sync old payments: https://bioping-backend.onrender.com/api/admin/sync-old-payments`);
  }).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  });
}); 

// Update user payment status
app.post('/api/auth/update-payment-status', authenticateToken, (req, res) => {
  try {
    const { paymentCompleted, currentPlan, currentCredits, lastCreditRenewal, nextCreditRenewal } = req.body;
    
    // Find the user in the database
    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user payment information
    mockDB.users[userIndex].paymentCompleted = paymentCompleted;
    mockDB.users[userIndex].currentPlan = currentPlan;
    mockDB.users[userIndex].paymentUpdatedAt = new Date().toISOString();
    
    // Update subscription data if provided
    if (currentCredits !== undefined) {
      mockDB.users[userIndex].currentCredits = currentCredits;
    }
    if (lastCreditRenewal) {
      mockDB.users[userIndex].lastCreditRenewal = lastCreditRenewal;
    }
    if (nextCreditRenewal) {
      mockDB.users[userIndex].nextCreditRenewal = nextCreditRenewal;
    }

    // Save to file
    saveDataToFiles();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      user: {
        email: mockDB.users[userIndex].email,
        name: mockDB.users[userIndex].name,
        paymentCompleted: mockDB.users[userIndex].paymentCompleted,
        currentPlan: mockDB.users[userIndex].currentPlan,
        currentCredits: mockDB.users[userIndex].currentCredits
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user payment status
app.get('/api/auth/payment-status', authenticateToken, (req, res) => {
  try {
    const user = mockDB.users.find(u => u.email === req.user.email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only universalx0242 should have payment status
    // All other users should be free
    let hasPaid = false;
    let currentPlan = 'free';
    
    if (user.email === 'universalx0242@gmail.com') {
      hasPaid = user.paymentCompleted || true; // Force true for universalx0242
      currentPlan = user.currentPlan || 'monthly';
    } else {
      // Reset other users to free
      hasPaid = false;
      currentPlan = 'free';
      
      // Update user in database to ensure they're marked as free
      const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
      if (userIndex !== -1) {
        mockDB.users[userIndex].paymentCompleted = false;
        mockDB.users[userIndex].currentPlan = 'free';
        saveDataToFiles();
      }
    }

    res.json({
      paymentCompleted: hasPaid,
      currentPlan: currentPlan,
      paymentUpdatedAt: user.paymentUpdatedAt
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Subscription management endpoints
app.get('/api/auth/subscription', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching subscription for:', req.user.email);
    
    let user = null;
    
    // Try MongoDB first
    try {
      user = await User.findOne({ email: req.user.email }).maxTimeMS(10000);
      if (user) {
        console.log('✅ User found in MongoDB for subscription');
        user = user.toObject();
      } else {
        console.log('⚠️ User NOT found in MongoDB, will check file storage');
      }
    } catch (dbError) {
      console.log('⚠️ MongoDB error, falling back to file storage:', dbError.message);
    }
    
    // Fallback to file storage if MongoDB fails
    if (!user) {
      user = mockDB.users.find(u => u.email === req.user.email);
      if (user) {
        console.log('✅ User found in file storage for subscription');
        console.log('⚠️ WARNING: Using file storage data - MongoDB should be primary source!');
      }
    }
    
    if (!user) {
      console.log('❌ User not found in any database');
      return res.status(404).json({ message: 'User not found' });
    }

    // Master email: brittany.filips@thebioping.com - unlimited credits, never expires
    const masterEmails = ['brittany.filips@thebioping.com'];
    const isMasterEmail = masterEmails.includes(user.email.toLowerCase());
    
    // CRITICAL FIX: DO NOT auto-renew credits here - only read from database
    // Credits should ONLY be added/renewed through payment webhooks
    const now = new Date();
    const registrationDate = new Date(user.createdAt || user.registrationDate || now);
    const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    const trialDays = 5;
    const trialExpired = isMasterEmail ? false : daysSinceRegistration >= trialDays; // Master email never expires
    const trialDaysRemaining = isMasterEmail ? 999999 : Math.max(0, trialDays - daysSinceRegistration);
    
    console.log('💳 Reading credits from database (NO AUTO-RENEWAL):', {
      email: user.email,
      currentCredits: user.currentCredits,
      plan: user.currentPlan,
      trialExpired: trialExpired,
      isMasterEmail: isMasterEmail
    });

    // For expired free trial users, enforce 0 credits (skip for master email)
    if (!user.paymentCompleted && user.currentPlan === 'free' && trialExpired && !isMasterEmail) {
      if (user.currentCredits > 0) {
        console.log('⚠️ Free trial expired, setting credits to 0');
        // Update in MongoDB
        try {
          await User.findOneAndUpdate(
            { email: user.email },
            { currentCredits: 0 },
            { new: true, maxTimeMS: 10000 }
          );
        } catch (err) {
          console.error('MongoDB update failed:', err.message);
        }
        // Update in mockDB
        const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
        if (userIndex !== -1) {
            mockDB.users[userIndex].currentCredits = 0;
            saveDataToFiles('free_trial_expired');
          }
        user.currentCredits = 0;
      }
    }

    // Return current credits from database (NO MODIFICATION)
    // Master email gets unlimited credits
    let currentCredits = isMasterEmail ? 999999 : (user.currentCredits || 0);
    
    console.log('✅ Returning credits from database:', currentCredits, isMasterEmail ? '(master account - unlimited)' : '');

    // Calculate next billing date for subscription plans
    let nextBillingDate = null;
    let isSubscriptionPlan = false;
    
    if (user.paymentCompleted && user.currentPlan && user.currentPlan !== 'free') {
      // Check if it's a subscription plan (monthly/annual) vs one-time payment (test/daily)
      if (user.currentPlan === 'monthly' || user.currentPlan === 'annual' || 
          user.currentPlan === 'basic' || user.currentPlan === 'premium') {
        isSubscriptionPlan = true;
        
        if (user.nextCreditRenewal) {
          nextBillingDate = user.nextCreditRenewal;
        } else if (user.lastCreditRenewal) {
          // Calculate next month's same date
          const lastPaymentDate = new Date(user.lastCreditRenewal);
          const nextMonth = new Date(lastPaymentDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextBillingDate = nextMonth.toISOString();
        } else {
          // First time subscription, calculate from registration date
          const registrationDate = new Date(user.createdAt || user.registrationDate || now);
          const nextMonth = new Date(registrationDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextBillingDate = nextMonth.toISOString();
        }
      }
    }

    console.log('📤 Sending subscription data with credits:', {
      email: user.email,
      currentPlan: user.currentPlan || 'free',
      currentCredits: currentCredits,
      paymentCompleted: user.paymentCompleted || false
    });

    res.json({
      paymentCompleted: user.paymentCompleted || false,
      currentPlan: user.currentPlan || 'free',
      currentCredits: currentCredits,
      lastCreditRenewal: user.lastCreditRenewal,
      nextCreditRenewal: user.nextCreditRenewal,
      nextBillingDate: nextBillingDate,
      isSubscriptionPlan: isSubscriptionPlan,
      trialExpired,
      daysRemaining: user.paymentCompleted && user.currentPlan !== 'free' ? null : trialDaysRemaining
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/api/auth/subscription-status', authenticateToken, async (req, res) => {
  try {
    // Use MongoDB instead of mockDB
    let user;
    if (isMongoConnected()) {
      user = await User.findOne({ email: req.user.email }).lean();
    } else {
      user = mockDB.users.find(u => u.email === req.user.email);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Master email: brittany.filips@thebioping.com - unlimited credits, never expires
    const masterEmails = ['brittany.filips@thebioping.com'];
    const isMasterEmail = masterEmails.includes(user.email.toLowerCase());
    
    // CRITICAL FIX: DO NOT auto-renew credits here - only read from database
    // Credits should ONLY be added/renewed through payment webhooks
    const now = new Date();
    const registrationDate = new Date(user.createdAt || user.registrationDate || now);
    const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    const trialDays = 5;
    const trialExpired = isMasterEmail ? false : daysSinceRegistration >= trialDays; // Master email never expires
    const trialDaysRemaining = isMasterEmail ? 999999 : Math.max(0, trialDays - daysSinceRegistration);
    
    console.log('💳 Reading subscription status (NO AUTO-RENEWAL):', {
      email: user.email,
      currentCredits: user.currentCredits,
      plan: user.currentPlan,
      trialExpired: trialExpired,
      isMasterEmail: isMasterEmail
    });

    // For expired free trial users, enforce 0 credits (skip for master email)
    if (!user.paymentCompleted && user.currentPlan === 'free' && trialExpired && !isMasterEmail) {
      if (user.currentCredits > 0) {
        console.log('⚠️ Free trial expired, setting credits to 0');
        // Update in MongoDB
        if (isMongoConnected()) {
          try {
            await User.findOneAndUpdate(
              { email: user.email },
              { currentCredits: 0 },
              { new: true, maxTimeMS: 10000 }
            );
          } catch (err) {
            console.error('MongoDB update failed:', err.message);
          }
        }
        // Update in mockDB
      const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
      if (userIndex !== -1) {
            mockDB.users[userIndex].currentCredits = 0;
            saveDataToFiles('free_trial_expired');
          }
        user.currentCredits = 0;
      }
    }

    // Return current credits from database (NO MODIFICATION)
    // Master email gets unlimited credits
    let currentCredits = isMasterEmail ? 999999 : (user.currentCredits || 0);
    
    console.log('✅ Returning subscription status with credits:', currentCredits, isMasterEmail ? '(master account - unlimited)' : '');

    res.json({
      paymentCompleted: user.paymentCompleted || false,
      currentPlan: user.currentPlan || 'free',
      currentCredits: currentCredits,
      lastCreditRenewal: user.lastCreditRenewal,
      nextCreditRenewal: user.nextCreditRenewal,
      trialExpired,
      daysRemaining: user.paymentCompleted && user.currentPlan !== 'free' ? null : trialDaysRemaining
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel subscription endpoint
app.post('/api/auth/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    console.log('🚫 User requesting subscription cancellation...');
    
    const user = mockDB.users.find(u => u.email === req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has an active subscription
    if (!user.paymentCompleted || user.currentPlan === 'free') {
      return res.status(400).json({ 
        message: 'No active subscription to cancel',
        hasActiveSubscription: false 
      });
    }

    console.log(`📧 Cancelling subscription for: ${user.email}`);
    console.log(`📋 Current plan: ${user.currentPlan}`);

    // Update user subscription status
    const userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    if (userIndex !== -1) {
      mockDB.users[userIndex].subscriptionStatus = 'cancelled';
      mockDB.users[userIndex].subscriptionOnHold = true;
      mockDB.users[userIndex].currentPlan = 'free';
      mockDB.users[userIndex].cancelledAt = new Date().toISOString();
      
      // Save to file
      saveDataToFiles('subscription_cancelled');
      console.log('✅ Subscription cancelled in file storage');
    }

    // If user has Stripe subscription, cancel it
    if (user.stripeCustomerId) {
      try {
        console.log(`🔍 Looking for Stripe subscriptions for customer: ${user.stripeCustomerId}`);
        
        // Get all subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active'
        });

        console.log(`📊 Found ${subscriptions.data.length} active subscriptions`);

        // Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          console.log(`🚫 Cancelling Stripe subscription: ${subscription.id}`);
          await stripe.subscriptions.cancel(subscription.id);
          console.log(`✅ Stripe subscription ${subscription.id} cancelled`);
        }

        // Update MongoDB if connected
        if (isMongoConnected()) {
          try {
            await User.findOneAndUpdate(
              { email: user.email },
              {
                subscriptionStatus: 'cancelled',
                subscriptionOnHold: true,
                currentPlan: 'free',
                cancelledAt: new Date()
              }
            );
            console.log('✅ MongoDB subscription cancelled');
          } catch (dbError) {
            console.log('❌ MongoDB update failed, file storage used');
          }
        }

      } catch (stripeError) {
        console.error('❌ Error cancelling Stripe subscription:', stripeError);
        // Continue with local cancellation even if Stripe fails
      }
    }

    res.json({
      message: 'Subscription cancelled successfully',
      hasActiveSubscription: false,
      currentPlan: 'free',
      subscriptionStatus: 'cancelled',
      cancelledAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    res.status(500).json({ 
      message: 'Failed to cancel subscription',
      error: error.message 
    });
  }
});
// Update user credits (when they use credits)
app.post('/api/auth/use-credit', authenticateToken, async (req, res) => {
  try {
    console.log('💳 CREDIT USAGE ENDPOINT CALLED for:', req.user.email);
    
    // CRITICAL FIX: Always fetch fresh user data from MongoDB first
    let user = null;
    let userIndex = -1;
    
    try {
      const User = require('./models/User');
      const mongoUser = await User.findOne({ email: req.user.email }).maxTimeMS(10000);
      
      if (mongoUser) {
        console.log('✅ Using fresh data from MongoDB');
        user = mongoUser.toObject();
        
        // Update mockDB with fresh MongoDB data to keep in sync
        userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
        if (userIndex !== -1) {
          // Sync the critical fields from MongoDB to mockDB
          mockDB.users[userIndex].currentCredits = user.currentCredits;
          mockDB.users[userIndex].creditUsageHistory = user.creditUsageHistory || [];
          mockDB.users[userIndex].lastCreditUsage = user.lastCreditUsage;
        }
      } else {
        // Fallback to mockDB if MongoDB doesn't have the user
        console.log('⚠️ User not in MongoDB, using mockDB');
        userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
        if (userIndex !== -1) {
          user = mockDB.users[userIndex];
        }
      }
    } catch (mongoError) {
      console.error('❌ MongoDB fetch failed, falling back to mockDB:', mongoError.message);
      userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
      if (userIndex !== -1) {
        user = mockDB.users[userIndex];
      }
    }
    
    if (!user) {
      console.log('❌ User not found in any storage');
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userIndex === -1) {
      userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    }
    
    console.log('💳 User current credits before:', user.currentCredits);
    
    // Master email: brittany.filips@thebioping.com - unlimited credits, never expires
    const masterEmails = ['brittany.filips@thebioping.com'];
    const isMasterEmail = masterEmails.includes(user.email.toLowerCase());
    
    // For master email, always allow credit usage without deduction
    if (isMasterEmail) {
      console.log('👑 Master email detected - unlimited credits, no deduction');
      return res.json({
        success: true,
        remainingCredits: 999999, // Unlimited credits
        message: 'Credit usage allowed (master account)'
      });
    }
    
    // Enforce free trial expiry before allowing credit usage
    if (!user.paymentCompleted || user.currentPlan === 'free') {
      const now = new Date();
      const registrationDate = new Date(user.createdAt || user.registrationDate || now);
      const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceRegistration >= 5) {
        if (user.currentCredits !== 0) {
          mockDB.users[userIndex].currentCredits = 0;
          
          // Save trial expiry to MongoDB
          try {
            const User = require('./models/User');
            await User.findOneAndUpdate(
              { email: user.email },
              { currentCredits: 0 },
              { new: true, maxTimeMS: 10000 }
            );
            console.log(`💾 Trial expiry saved to MongoDB for ${user.email}`);
          } catch (mongoError) {
            console.error('❌ MongoDB trial expiry save failed:', mongoError);
          }
          
          saveDataToFiles('free_trial_expired_block');
        }
        return res.status(400).json({ success: false, message: 'Free trial expired' });
      }
    }
    
    if (user.currentCredits > 0) {
      // Track credit usage with timestamp
      if (!user.creditUsageHistory) {
        user.creditUsageHistory = [];
      }
      
      user.creditUsageHistory.push({
        action: 'search',
        timestamp: new Date().toISOString(),
        creditsUsed: 1,
        remainingCredits: user.currentCredits - 1
      });
      
      // Keep only last 100 usage records
      if (user.creditUsageHistory.length > 100) {
        user.creditUsageHistory = user.creditUsageHistory.slice(-100);
      }
      
      user.currentCredits -= 1;
      user.lastCreditUsage = new Date().toISOString();
      console.log('💳 User current credits after decrement:', user.currentCredits);
      
      // Update mockDB immediately to keep in sync
      if (userIndex !== -1) {
        mockDB.users[userIndex].currentCredits = user.currentCredits;
        mockDB.users[userIndex].lastCreditUsage = user.lastCreditUsage;
        mockDB.users[userIndex].creditUsageHistory = user.creditUsageHistory;
      }
      
      // Save to MongoDB immediately (CRITICAL for persistence)
      try {
        const User = require('./models/User');
        const mongoResult = await User.findOneAndUpdate(
          { email: user.email },
          {
            currentCredits: user.currentCredits,
            lastCreditUsage: user.lastCreditUsage,
            $push: {
              creditUsageHistory: {
                action: 'search',
                timestamp: new Date(),
                creditsUsed: 1,
                remainingCredits: user.currentCredits
              }
            }
          },
          { new: true, maxTimeMS: 10000 }
        );
        console.log(`💾 Credit usage saved to MongoDB for ${user.email}:`, mongoResult?.currentCredits);
        
        if (!mongoResult) {
          console.error('⚠️ WARNING: MongoDB update returned null - data may not be persisted!');
          console.error('⚠️ User email:', user.email);
          console.error('⚠️ Attempted to set credits to:', user.currentCredits);
        } else {
          console.log('✅ MongoDB update successful - credits persisted:', mongoResult.currentCredits);
        }
      } catch (mongoError) {
        console.error('❌ CRITICAL: MongoDB save failed:', mongoError);
        console.error('⚠️ Credits may revert on refresh!');
        // Continue with file save as fallback
      }
      
      // Save to files as well (backup persistence)
      saveDataToFiles('credit_used');
      
      console.log(`💳 Credit consumed for ${user.email}: ${user.currentCredits + 1} → ${user.currentCredits}`);
      
      res.json({
        success: true,
        remainingCredits: user.currentCredits,
        message: 'Credit used successfully',
        usageHistory: user.creditUsageHistory.length
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No credits remaining'
      });
    }
  } catch (error) {
    console.error('Error using credit:', error);
    res.status(500).json({ message: 'Server error' });
  }
}); 

// Credit monitoring endpoint for admins
app.get('/api/admin/credit-monitoring', authenticateAdmin, (req, res) => {
  try {
    const users = mockDB.users.map(user => ({
      email: user.email,
      name: user.firstName + ' ' + user.lastName,
      company: user.company,
      currentPlan: user.currentPlan || 'free',
      currentCredits: user.currentCredits || 0,
      lastCreditUsage: user.lastCreditUsage,
      lastCreditRenewal: user.lastCreditRenewal,
      nextCreditRenewal: user.nextCreditRenewal,
      paymentCompleted: user.paymentCompleted || false,
      createdAt: user.createdAt,
      creditUsageHistory: user.creditUsageHistory || [],
      totalCreditsUsed: user.creditUsageHistory ? user.creditUsageHistory.reduce((sum, usage) => sum + usage.creditsUsed, 0) : 0
    }));

    // Sort by total credits used (descending)
    users.sort((a, b) => b.totalCreditsUsed - a.totalCreditsUsed);

    res.json({
      success: true,
      data: {
        users,
        summary: {
          totalUsers: users.length,
          paidUsers: users.filter(u => u.paymentCompleted).length,
          freeUsers: users.filter(u => !u.paymentCompleted).length,
          totalCreditsUsed: users.reduce((sum, u) => sum + u.totalCreditsUsed, 0),
          averageCreditsPerUser: Math.round(users.reduce((sum, u) => sum + u.totalCreditsUsed, 0) / users.length)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching credit monitoring data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin endpoint to add/increase credits for users
app.post('/api/admin/add-credits', authenticateAdmin, [
  body('email').optional().isEmail().withMessage('Valid email required if using email'),
  body('userId').optional().isString().withMessage('Valid userId required if using userId'),
  body('credits').isInt({ min: 1, max: 10000 }).withMessage('Credits must be between 1 and 10000'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, userId, credits, reason } = req.body;
    const adminEmail = req.user.email;

    // Must provide either email or userId
    if (!email && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Either email or userId must be provided'
      });
    }

    console.log(`🔧 Admin ${adminEmail} attempting to add ${credits} credits to ${email || userId}`);

    let user = null;
    let userIdentifier = email || userId;

    // Try MongoDB first
    try {
      if (email) {
        user = await User.findOne({ email }).maxTimeMS(10000);
      } else if (userId) {
        user = await User.findById(userId).maxTimeMS(10000);
      }

      if (user) {
        console.log(`✅ User found in MongoDB: ${user.email}`);
        const oldCredits = user.currentCredits || 0;
        const newCredits = oldCredits + credits;

        // Update credits in MongoDB
        await User.findOneAndUpdate(
          { _id: user._id },
          { 
            $inc: { currentCredits: credits },
            $set: { 
              lastCreditRenewal: new Date(),
              lastModifiedBy: adminEmail,
              lastModifiedAt: new Date()
            }
          },
          { new: true, maxTimeMS: 10000 }
        );

        // Log credit addition in creditUsageHistory
        if (!user.creditUsageHistory) {
          user.creditUsageHistory = [];
        }
        user.creditUsageHistory.push({
          creditsAdded: credits,
          creditsBefore: oldCredits,
          creditsAfter: newCredits,
          reason: reason || `Admin credit addition by ${adminEmail}`,
          addedBy: adminEmail,
          addedAt: new Date()
        });
        await User.findOneAndUpdate(
          { _id: user._id },
          { creditUsageHistory: user.creditUsageHistory },
          { new: true, maxTimeMS: 10000 }
        );

        console.log(`✅ Credits updated in MongoDB: ${oldCredits} → ${newCredits} (+${credits})`);

        // Also update file storage as backup
        const userIndex = mockDB.users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
          mockDB.users[userIndex].currentCredits = newCredits;
          mockDB.users[userIndex].lastCreditRenewal = new Date();
          saveDataToFiles('admin_credit_addition');
        }

        return res.json({
          success: true,
          message: `Successfully added ${credits} credits to ${user.email}`,
          data: {
            email: user.email,
            name: user.firstName + ' ' + user.lastName,
            oldCredits,
            newCredits,
            creditsAdded: credits,
            reason: reason || `Admin credit addition by ${adminEmail}`
          }
        });
      }
    } catch (dbError) {
      console.error('❌ MongoDB error:', dbError);
    }

    // Fallback to file storage
    const userIndex = mockDB.users.findIndex(u => 
      (email && u.email === email) || (userId && u.id === userId)
    );

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `User not found: ${userIdentifier}`
      });
    }

    const fileUser = mockDB.users[userIndex];
    const oldCredits = fileUser.currentCredits || 0;
    const newCredits = oldCredits + credits;

    // Update credits in file storage
    mockDB.users[userIndex].currentCredits = newCredits;
    mockDB.users[userIndex].lastCreditRenewal = new Date();
    mockDB.users[userIndex].lastModifiedBy = adminEmail;
    mockDB.users[userIndex].lastModifiedAt = new Date();

    // Add to credit history
    if (!mockDB.users[userIndex].creditUsageHistory) {
      mockDB.users[userIndex].creditUsageHistory = [];
    }
    mockDB.users[userIndex].creditUsageHistory.push({
      creditsAdded: credits,
      creditsBefore: oldCredits,
      creditsAfter: newCredits,
      reason: reason || `Admin credit addition by ${adminEmail}`,
      addedBy: adminEmail,
      addedAt: new Date()
    });

    saveDataToFiles('admin_credit_addition');

    console.log(`✅ Credits updated in file storage: ${oldCredits} → ${newCredits} (+${credits})`);

    res.json({
      success: true,
      message: `Successfully added ${credits} credits to ${fileUser.email}`,
      data: {
        email: fileUser.email,
        name: fileUser.firstName + ' ' + fileUser.lastName,
        oldCredits,
        newCredits,
        creditsAdded: credits,
        reason: reason || `Admin credit addition by ${adminEmail}`
      }
    });

  } catch (error) {
    console.error('❌ Error adding credits:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding credits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Data export endpoint (for backup)
app.get('/api/admin/export-data', authenticateAdmin, (req, res) => {
  try {
    const exportData = {
      users: mockDB.users,
      biotechData: biotechData,
      verificationCodes: mockDB.verificationCodes,
      uploadedFiles: mockDB.uploadedFiles,
      bdTracker: mockDB.bdTracker,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="bioping-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
});

// Data import endpoint (for restore)
app.post('/api/admin/import-data', authenticateAdmin, upload.single('backup'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No backup file provided' });
    }
    
    const backupData = JSON.parse(req.file.buffer.toString());
    
    // Validate backup data
    if (!backupData.users || !backupData.biotechData) {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }
    
    // Import data
    mockDB.users = backupData.users || [];
    mockDB.verificationCodes = backupData.verificationCodes || [];
    mockDB.uploadedFiles = backupData.uploadedFiles || [];
    mockDB.bdTracker = backupData.bdTracker || [];
    biotechData = backupData.biotechData || [];
    
    // Save imported data
    saveDataToFiles('data_imported');
    
    res.json({ 
      message: 'Data imported successfully',
      importedUsers: mockDB.users.length,
      importedBiotechRecords: biotechData.length,
      importedBdTrackerEntries: mockDB.bdTracker.length
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Import failed' });
  }
}); 

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol' 
      });
    }

    console.log(`🔧 Signup attempt for: ${email}`);

    // Check if email is blocked
    const isEmailBlocked = mockDB.blockedEmails.some(blocked => blocked.email === email);
    if (isEmailBlocked) {
      console.log('🚫 Email is blocked from registration');
      return res.status(403).json({ 
        success: false,
        message: 'This email address is not allowed on our platform. Please use a different email address to create your account.',
        errorType: 'EMAIL_BLOCKED',
        blockedEmail: email
      });
    }

    // Check if user already exists (try MongoDB first, then fallback to file-based)
    let existingUser = null;
    try {
      console.log('🔍 Checking MongoDB for existing user...');
      existingUser = await User.findOne({ email }).maxTimeMS(10000);
      console.log('✅ MongoDB query completed');
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file-based storage...');
      console.log('MongoDB Error:', dbError.message);
      existingUser = mockDB.users.find(u => u.email === email);
    }

    if (existingUser) {
      console.log('⚠️ User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object
    const newUserData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      company: 'BioPing',
      role: 'other',
      paymentCompleted: false,
      currentPlan: 'free',
      currentCredits: 5
    };

    let newUser = null;
    let userId = null;

    // Try to save to MongoDB first
    try {
      console.log('💾 Attempting to save user to MongoDB...');
      newUser = new User(newUserData);
      await newUser.save();
      userId = newUser._id;
      console.log(`✅ New user saved to MongoDB: ${email} (ID: ${userId})`);
    } catch (dbError) {
      console.log('❌ MongoDB save failed, using file-based storage...');
      console.log('MongoDB Save Error:', dbError.message);
      // Fallback to file-based storage
      newUser = {
        id: mockDB.users.length + 1,
        ...newUserData,
        name: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString()
      };
      mockDB.users.push(newUser);
      userId = newUser.id;
      saveDataToFiles('user_signup');
      console.log(`✅ New user saved to file: ${email} (ID: ${userId})`);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        email: newUser.email,
        name: newUser.name || `${firstName} ${lastName}`,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`🎉 New user registered successfully: ${email}`);

    res.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email: newUser.email,
        name: newUser.name || `${firstName} ${lastName}`,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enhanced PDF serving middleware for Render/GoDaddy
app.use('/pdf', (req, res, next) => {
  // Set proper headers for PDF files - allow cross-origin embedding
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Handle PDF requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Multiple PDF serving routes for different hosting scenarios
app.get('/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join(__dirname, '../public/pdf', filename);
  
  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.log(`PDF not found: ${pdfPath}`);
    return res.status(404).json({ error: 'PDF not found', path: pdfPath });
  }
  
  // Set headers for PDF - allow cross-origin embedding
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Stream the PDF file
  const stream = fs.createReadStream(pdfPath);
  stream.on('error', (error) => {
    console.error('PDF stream error:', error);
    res.status(500).json({ error: 'PDF stream error' });
  });
  stream.pipe(res);
});

// Alternative PDF route for static serving
app.get('/static/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join(__dirname, '../public/pdf', filename);
  
  if (!fs.existsSync(pdfPath)) {
    console.log(`Static PDF not found: ${pdfPath}`);
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const stream = fs.createReadStream(pdfPath);
  stream.pipe(res);
});

// API route for PDF serving
app.get('/api/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join(__dirname, '../public/pdf', filename);
  
  if (!fs.existsSync(pdfPath)) {
    console.log(`API PDF not found: ${pdfPath}`);
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const stream = fs.createReadStream(pdfPath);
  stream.pipe(res);
});

// PDF health check endpoint
app.get('/api/pdf-health', (req, res) => {
  const pdfDir = path.join(__dirname, '../public/pdf');
  const pdfPath = path.join(pdfDir, 'BioPing Training Manual.pdf');
  
  // Check if directory exists
  const dirExists = fs.existsSync(pdfDir);
  
  // Check if file exists
  const exists = fs.existsSync(pdfPath);
  
  // Get file stats for debugging
  let fileStats = null;
  let availablePdfs = [];
  
  if (dirExists) {
    try {
      availablePdfs = fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf'));
    } catch (error) {
      console.error('Error reading PDF directory:', error);
    }
  }
  
  if (exists) {
    try {
      fileStats = fs.statSync(pdfPath);
    } catch (error) {
      console.error('Error getting file stats:', error);
    }
  }
  
  res.json({
    pdfExists: exists,
    pdfPath: pdfPath,
    pdfDir: pdfDir,
    dirExists: dirExists,
    fileSize: fileStats ? fileStats.size : null,
    availablePdfs: availablePdfs,
    serverTime: new Date().toISOString(),
    requestHeaders: req.headers,
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
});

// Test PDF access endpoint
app.get('/api/test-pdf', (req, res) => {
  const pdfPath = path.join(__dirname, '../public/pdf', 'BioPing Training Manual.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'PDF not found', path: pdfPath });
  }
  
  // Set headers for PDF - allow cross-origin embedding
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding from any domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Stream the PDF file
  const stream = fs.createReadStream(pdfPath);
  stream.on('error', (error) => {
    console.error('PDF stream error:', error);
    res.status(500).json({ error: 'PDF stream error' });
  });
  stream.pipe(res);
});

// Simple test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    pdfDir: path.join(__dirname, '../public/pdf'),
    pdfDirExists: fs.existsSync(path.join(__dirname, '../public/pdf'))
  });
});
// Note: Frontend routes like /dashboard, /dashboard/bd-tracker are handled by React Router
// on the frontend (GoDaddy hosting). This server only handles API routes.
// For frontend routing issues, check GoDaddy hosting configuration.
// Public pricing plans endpoint (no authentication required)
app.get('/api/pricing-plans', async (req, res) => {
  try {
    console.log('🔍 Fetching public pricing plans...');
    
    // First try to get from admin-managed pricing data
    if (mockDB.pricing && mockDB.pricing.length > 0) {
      console.log('📊 Using admin-managed pricing data');
      console.log('📊 Raw pricing data:', JSON.stringify(mockDB.pricing, null, 2));
      const activePlans = mockDB.pricing
        .filter(plan => plan.isActive !== false && plan.id !== 'budget-plan')
        .map(plan => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features : (plan.features ? [plan.features] : [])
        }));
      
      console.log('✅ Returning admin-managed pricing plans:', activePlans.length, 'plans');
      console.log('✅ Active plans data:', JSON.stringify(activePlans, null, 2));
      return res.json({ plans: activePlans });
    }
    
    // Fallback: Initialize pricing array if it doesn't exist
    if (!mockDB.pricing) mockDB.pricing = [];
    
    // If no pricing plans exist, create default ones
    if (mockDB.pricing.length === 0) {
      console.log('📝 Creating default pricing plans...');
      const defaultPlans = [
        {
          _id: `plan_${Date.now()}_1`,
          id: 'free',
          name: 'Free',
          description: 'Perfect for getting started',
          credits: '5 credits for 5 days only',
          monthlyPrice: 0,
          annualPrice: 0,
          features: [
            '1 Seat included',
            'Get 5 free contacts',
            'Credits expire after 5 days (including weekends)',
            'AI Deal Scanner',
            'No Credit Card Needed',
            'No BD Insights Access'
          ],
          popular: false,
          buttonText: 'Get started',
          buttonStyle: 'outline',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: `plan_${Date.now()}_2`,
          id: 'basic',
          name: 'Basic Plan',
          description: 'Ideal for growing businesses',
          credits: '50 contacts/month',
          monthlyPrice: 390,
          annualPrice: 3750,
          planType: 'monthly',
          yearlyPlanType: 'yearly',
          features: [
            '1 Seat included',
            '50 contacts per month',
            'AI Deal Scanner',
            'Pay by credit/debit card',
            'Access to BD Tracker',
            '1 hr. of BD Consulting with Mr. Vik'
          ],
          popular: false,
          buttonText: 'Choose plan',
          buttonStyle: 'primary',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: `plan_${Date.now()}_3`,
          id: 'premium',
          name: 'Premium Plan',
          description: 'For advanced users and teams',
          credits: '100 contacts/month',
          monthlyPrice: 790,
          annualPrice: 7585,
          planType: 'monthly',
          yearlyPlanType: 'yearly',
          features: [
            '1 Seat included',
            '100 contacts per month',
            'AI Deal Scanner',
            'Pay by credit/debit card',
            'Access to BD Tracker',
            '2 hrs. of BD Consulting with Mr. Vik'
          ],
          popular: true,
          buttonText: 'Choose plan',
          buttonStyle: 'primary',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      mockDB.pricing = defaultPlans;
      
      // Save to file
      fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
      console.log('💾 Default pricing plans saved to file');
      
      // Save all data
      saveDataToFiles('default_pricing_plans_created');
    }
    
    // Filter only active plans for public display, exclude budget-plan, and ensure features are arrays
    const activePlans = mockDB.pricing
      .filter(plan => plan.isActive !== false && plan.id !== 'budget-plan')
      .map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : (plan.features ? [plan.features] : [])
      }));
    
    console.log('✅ Returning public pricing plans:', activePlans.length, 'plans');
    res.json({ plans: activePlans });
  } catch (error) {
    console.error('❌ Error fetching public pricing plans:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
});

// Test endpoint to check pricing data
app.get('/api/test-pricing', async (req, res) => {
  try {
    console.log('🧪 Testing pricing data...');
    console.log('📊 mockDB.pricing exists:', !!mockDB.pricing);
    console.log('📊 mockDB.pricing length:', mockDB.pricing ? mockDB.pricing.length : 0);
    console.log('📊 mockDB.pricing data:', JSON.stringify(mockDB.pricing, null, 2));
    
    res.json({ 
      success: true, 
      pricingExists: !!mockDB.pricing,
      pricingLength: mockDB.pricing ? mockDB.pricing.length : 0,
      pricingData: mockDB.pricing
    });
  } catch (error) {
    console.error('❌ Error testing pricing data:', error);
    res.status(500).json({ error: 'Failed to test pricing data' });
  }
});

// Admin Health Check
app.get('/api/admin/health', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Admin Health Check - User:', req.user?.email);
    res.json({ 
      success: true, 
      message: 'Admin access working',
      user: req.user?.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Admin health check error:', error);
    res.status(500).json({ error: 'Admin health check failed' });
  }
});
// Pricing Management Routes
app.get('/api/admin/pricing', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Admin Pricing: Fetching pricing plans...');
    console.log('🔍 Admin Pricing: User email:', req.user?.email);
    console.log('🔍 Admin Pricing: Request headers:', req.headers);
    
    // Initialize pricing array if it doesn't exist
    if (!mockDB.pricing) mockDB.pricing = [];
    
    // If no pricing plans exist, create default ones
    if (mockDB.pricing.length === 0) {
      console.log('📝 Creating default pricing plans...');
      const defaultPlans = [
        {
          _id: `plan_${Date.now()}_1`,
          id: 'free',
          name: 'Free',
          monthlyPrice: 0,
          yearlyPrice: 0,
          annualPrice: 0,
          credits: '5 credits for 5 days only',
          features: [
            '1 Seat included',
            'Get 5 free contacts',
            'Credits expire after 5 days (including weekends)',
            'No Credit Card Needed',
            'No BD Insights Access'
          ],
          description: 'Perfect for getting started',
          isPopular: false,
          popular: false,
          isActive: true,
          buttonText: 'Get started',
          buttonStyle: 'outline',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: `plan_${Date.now()}_2`,
          id: 'basic',
          name: 'Basic Plan',
          monthlyPrice: 390,
          yearlyPrice: 3750,
          annualPrice: 3750,
          credits: '50 contacts/month',
          features: [
            '1 Seat included',
            '50 contacts per month',
            'Pay by credit/debit card',
            'Access to BD Tracker',
            '1 hr. of BD Consulting with Mr. Vik'
          ],
          description: 'Ideal for growing businesses',
          isPopular: false,
          popular: false,
          isActive: true,
          buttonText: 'Choose plan',
          buttonStyle: 'primary',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: `plan_${Date.now()}_3`,
          id: 'premium',
          name: 'Premium Plan',
          monthlyPrice: 790,
          yearlyPrice: 7585,
          annualPrice: 7585,
          credits: '100 contacts/month',
          features: [
            '1 Seat included',
            '100 contacts per month',
            'Pay by credit/debit card',
            'Access to BD Tracker',
            '2 hrs. of BD Consulting with Mr. Vik'
          ],
          description: 'For advanced users and teams',
          isPopular: true,
          popular: true,
          isActive: true,
          buttonText: 'Choose plan',
          buttonStyle: 'primary',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      mockDB.pricing = defaultPlans;
      
      // Save to file
      fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
      console.log('✅ Created default pricing plans');
      
      // Save all data
      saveDataToFiles('default_pricing_plans_created');
    }
    
    // Ensure features are arrays for all plans
    const plansWithArrayFeatures = mockDB.pricing.map(plan => ({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features : (plan.features ? [plan.features] : [])
    }));
    
    console.log('✅ Admin Pricing: Returning pricing plans:', plansWithArrayFeatures.length, 'plans');
    console.log('✅ Admin Pricing: First plan sample:', plansWithArrayFeatures[0]);
    res.json({ 
      success: true,
      plans: plansWithArrayFeatures,
      total: plansWithArrayFeatures.length
    });
  } catch (error) {
    console.error('❌ Error fetching pricing plans:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
});

app.post('/api/admin/pricing', authenticateAdmin, async (req, res) => {
  try {
    const { name, monthlyPrice, yearlyPrice, credits, features, description, isPopular, isActive } = req.body;
    
    if (!name || !monthlyPrice || !credits) {
      return res.status(400).json({ error: 'Name, monthly price, and credits are required' });
    }
    
    const newPlan = {
      _id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      monthlyPrice: parseFloat(monthlyPrice),
      yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : 0,
      annualPrice: yearlyPrice ? parseFloat(yearlyPrice) : 0,
      credits: typeof credits === 'string' ? credits : `${credits} credits/month`,
      features: Array.isArray(features) ? features : (features ? features.split('\n').filter(f => f.trim()) : []),
      description: description || '',
      isPopular: isPopular || false,
      popular: isPopular || false,
      isActive: isActive !== false,
      buttonText: parseFloat(monthlyPrice) === 0 ? 'Get started' : 'Choose plan',
      buttonStyle: parseFloat(monthlyPrice) === 0 ? 'outline' : 'primary',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!mockDB.pricing) mockDB.pricing = [];
    mockDB.pricing.push(newPlan);
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
    
    // Save all data
    saveDataToFiles('pricing_plan_created');
    
    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    console.error('Error creating pricing plan:', error);
    res.status(500).json({ error: 'Failed to create pricing plan' });
  }
});

app.put('/api/admin/pricing/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, monthlyPrice, yearlyPrice, credits, features, description, isPopular, isActive } = req.body;
    
    if (!mockDB.pricing) mockDB.pricing = [];
    
    const planIndex = mockDB.pricing.findIndex(plan => plan._id === id);
    if (planIndex === -1) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }
    
    const updatedPlan = {
      ...mockDB.pricing[planIndex],
      name: name || mockDB.pricing[planIndex].name,
      id: name ? name.toLowerCase().replace(/\s+/g, '-') : mockDB.pricing[planIndex].id,
      monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : mockDB.pricing[planIndex].monthlyPrice,
      yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : mockDB.pricing[planIndex].yearlyPrice,
      annualPrice: yearlyPrice ? parseFloat(yearlyPrice) : mockDB.pricing[planIndex].annualPrice,
      credits: credits ? (typeof credits === 'string' ? credits : `${credits} credits/month`) : mockDB.pricing[planIndex].credits,
      features: features !== undefined ? (Array.isArray(features) ? features : features.split('\n').filter(f => f.trim())) : mockDB.pricing[planIndex].features,
      description: description !== undefined ? description : mockDB.pricing[planIndex].description,
      isPopular: isPopular !== undefined ? isPopular : mockDB.pricing[planIndex].isPopular,
      popular: isPopular !== undefined ? isPopular : mockDB.pricing[planIndex].popular,
      isActive: isActive !== undefined ? isActive : mockDB.pricing[planIndex].isActive,
      buttonText: mockDB.pricing[planIndex].buttonText || (parseFloat(monthlyPrice || mockDB.pricing[planIndex].monthlyPrice) === 0 ? 'Get started' : 'Choose plan'),
      buttonStyle: mockDB.pricing[planIndex].buttonStyle || (parseFloat(monthlyPrice || mockDB.pricing[planIndex].monthlyPrice) === 0 ? 'outline' : 'primary'),
      updatedAt: new Date()
    };
    
    mockDB.pricing[planIndex] = updatedPlan;
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
    
    // Save all data
    saveDataToFiles('pricing_plan_updated');
    
    res.json({ success: true, plan: updatedPlan });
  } catch (error) {
    console.error('Error updating pricing plan:', error);
    res.status(500).json({ error: 'Failed to update pricing plan' });
  }
});

app.delete('/api/admin/pricing/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mockDB.pricing) mockDB.pricing = [];
    
    const planIndex = mockDB.pricing.findIndex(plan => plan._id === id);
    if (planIndex === -1) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }
    
    // Don't allow deletion of Free plan
    if (mockDB.pricing[planIndex].name === 'Free') {
      return res.status(400).json({ error: 'Cannot delete the Free plan' });
    }
    
    mockDB.pricing.splice(planIndex, 1);
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pricing.json'), JSON.stringify(mockDB.pricing, null, 2));
    
    // Save all data
    saveDataToFiles('pricing_plan_deleted');
    
    res.json({ success: true, message: 'Pricing plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    res.status(500).json({ error: 'Failed to delete pricing plan' });
  }
});

// Pricing Management Routes
app.get('/api/admin/pricing-plans', authenticateToken, async (req, res) => {
  try {
    // Initialize pricing plans if they don't exist
    if (!mockDB.pricingPlans) {
      mockDB.pricingPlans = [
        {
          _id: '1',
          name: 'Free',
          description: 'Perfect for getting started',
          credits: 5,
          monthlyPrice: 0,
          annualPrice: 0,
          features: ['5 credits per month', 'Basic search', 'Email support'],
          isActive: true,
          createdAt: new Date()
        },
        {
          _id: '2',
          name: 'Basic',
          description: 'For small businesses',
          credits: 25,
          monthlyPrice: 29,
          annualPrice: 290,
          features: ['25 credits per month', 'Advanced search', 'Priority support', 'BD Tracker'],
          isActive: true,
          createdAt: new Date()
        },
        {
          _id: '3',
          name: 'Pro',
          description: 'For growing companies',
          credits: 100,
          monthlyPrice: 99,
          annualPrice: 990,
          features: ['100 credits per month', 'All features', 'Priority support', 'Custom reports'],
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      // Save to file
      fs.writeFileSync(path.join(__dirname, 'data', 'pricingPlans.json'), JSON.stringify(mockDB.pricingPlans, null, 2));
    }
    
    res.json({ pricingPlans: mockDB.pricingPlans });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
});

// PDF Management Routes
app.post('/api/admin/pdfs/upload', authenticateToken, pdfUpload.single('pdf'), async (req, res) => {
  try {
    console.log('📤 PDF Upload Request:', {
      file: req.file,
      body: req.body,
      headers: req.headers
    });
    
    if (!req.file) {
      console.log('❌ No file received');
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { name, description } = req.body;
    const pdfUrl = `/pdf/${req.file.filename}`;
    
    console.log('✅ File received:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      name: name,
      description: description
    });

    // Save to database
    const pdfData = {
      _id: Date.now().toString(),
      name,
      description,
      url: pdfUrl,
      filename: req.file.filename,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    };

    // Add to mockDB
    if (!mockDB.pdfs) mockDB.pdfs = [];
    mockDB.pdfs.push(pdfData);

    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pdfs.json'), JSON.stringify(mockDB.pdfs, null, 2));

    res.json({ message: 'PDF uploaded successfully', pdf: pdfData });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

app.get('/api/admin/pdfs', authenticateToken, async (req, res) => {
  try {
    // Initialize pdfs array if it doesn't exist
    if (!mockDB.pdfs) mockDB.pdfs = [];
    
    // Only auto-detect if the database is empty
    if (mockDB.pdfs.length === 0) {
      console.log('🔄 PDFs database is empty, auto-detecting from public/pdf folder...');
      
      // Auto-detect existing PDFs from public/pdf folder
      const existingPdfPath = path.join(__dirname, '..', 'public', 'pdf');
      if (fs.existsSync(existingPdfPath)) {
        const existingPdfFiles = fs.readdirSync(existingPdfPath).filter(file => file.endsWith('.pdf'));
        
        // Add existing PDFs to the database
        existingPdfFiles.forEach(filename => {
          const pdfData = {
            _id: `existing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: filename.replace('.pdf', '').replace(/_/g, ' ').replace(/,/g, ' - '),
            description: `Existing PDF: ${filename}`,
            url: `/pdf/${filename}`,
            filename: filename,
            uploadedAt: new Date(),
            uploadedBy: 'system',
            isExisting: true
          };
          mockDB.pdfs.push(pdfData);
        });
        
        // Save updated data
        fs.writeFileSync(path.join(__dirname, 'data', 'pdfs.json'), JSON.stringify(mockDB.pdfs, null, 2));
        console.log(`✅ Auto-detected and added ${existingPdfFiles.length} PDFs`);
      }
    } else {
      console.log(`✅ Using existing PDFs database with ${mockDB.pdfs.length} PDFs`);
    }
    
    res.json({ pdfs: mockDB.pdfs });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

app.delete('/api/admin/pdfs/:id', authenticateToken, async (req, res) => {
  try {
    const pdfId = req.params.id;
    const pdfIndex = mockDB.pdfs.findIndex(pdf => pdf._id === pdfId);
    
    if (pdfIndex === -1) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const pdf = mockDB.pdfs[pdfIndex];
    
    // Delete file from server
    const filePath = path.join(__dirname, '..', 'public', 'pdf', pdf.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from database
    mockDB.pdfs.splice(pdfIndex, 1);
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'data', 'pdfs.json'), JSON.stringify(mockDB.pdfs, null, 2));

    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

// PDF Management Routes added successfully

// Add node-cron for daily billing
const cron = require('node-cron');

// Plan Details Function
function getPlanDetails(planId) {
  const plans = {
    'simple-1': { 
      type: 'simple', 
      amount: 1, 
      credits: 50, 
      description: 'Simple $1 plan - one-time payment' 
    },
    'daily-12': { 
      type: 'daily', 
      amount: 1, 
      credits: 50, 
      description: 'Daily $1 plan - 12 days subscription' 
    },
    'basic': { 
      type: 'simple', 
      amount: 500, 
      credits: 50, 
      description: 'Basic $500 plan - one-time payment' 
    },
    'premium': { 
      type: 'simple', 
      amount: 750, 
      credits: 100, 
      description: 'Premium $750 plan - one-time payment' 
    },
    'basic-yearly': { 
      type: 'yearly', 
      amount: 400, // $4800/12 = $400 per month
      credits: 50, 
      description: 'Basic yearly plan - $400/month for 12 months' 
    },
    'premium-yearly': { 
      type: 'yearly', 
      amount: 600, // $7200/12 = $600 per month
      credits: 100, 
      description: 'Premium yearly plan - $600/month for 12 months' 
    }
  };
  return plans[planId];
}

// Daily and Yearly Subscription Processing System
async function processDailySubscriptions() {
  console.log('🔄 Starting subscription processing...');
  
  try {
    // Find all daily-12 subscribers
    let dailySubscribers = [];
    // Find all yearly subscribers
    let yearlySubscribers = [];
    
    // Try MongoDB first
    try {
      const mongoUsers = await User.find({ 
        currentPlan: 'daily-12',
        subscriptionEndAt: { $gt: new Date() } // Still active
      }).lean();
      
      dailySubscribers = mongoUsers.map(user => ({
        ...user,
        source: 'mongodb'
      }));
      console.log(`✅ Found ${dailySubscribers.length} daily subscribers in MongoDB`);
      
      // Find yearly subscribers
      const yearlyMongoUsers = await User.find({ 
        currentPlan: { $in: ['basic-yearly', 'premium-yearly'] },
        subscriptionEndAt: { $gt: new Date() } // Still active
      }).lean();
      
      yearlySubscribers = yearlyMongoUsers.map(user => ({
        ...user,
        source: 'mongodb'
      }));
      console.log(`✅ Found ${yearlySubscribers.length} yearly subscribers in MongoDB`);
    } catch (dbError) {
      console.log('❌ MongoDB not available, checking file storage...');
    }
    
    // Fallback to file storage
    if (dailySubscribers.length === 0) {
      dailySubscribers = mockDB.users.filter(user => 
        user.currentPlan === 'daily-12' && 
        user.subscriptionEndAt && 
        new Date(user.subscriptionEndAt) > new Date()
      ).map(user => ({
        ...user,
        source: 'file'
      }));
      console.log(`✅ Found ${dailySubscribers.length} daily subscribers in file storage`);
    }
    
    if (yearlySubscribers.length === 0) {
      yearlySubscribers = mockDB.users.filter(user => 
        (user.currentPlan === 'basic-yearly' || user.currentPlan === 'premium-yearly') && 
        user.subscriptionEndAt && 
        new Date(user.subscriptionEndAt) > new Date()
      ).map(user => ({
        ...user,
        source: 'file'
      }));
      console.log(`✅ Found ${yearlySubscribers.length} yearly subscribers in file storage`);
    }
    
    if (dailySubscribers.length === 0 && yearlySubscribers.length === 0) {
      console.log('ℹ️ No active subscribers found');
      return;
    }
    
    // Process each daily subscriber
    for (const subscriber of dailySubscribers) {
      try {
        await processDailySubscriber(subscriber);
      } catch (error) {
        console.error(`❌ Error processing daily subscriber ${subscriber.email}:`, error.message);
      }
    }
    
    // Process each yearly subscriber
    for (const subscriber of yearlySubscribers) {
      try {
        await processYearlySubscriber(subscriber);
      } catch (error) {
        console.error(`❌ Error processing yearly subscriber ${subscriber.email}:`, error.message);
      }
    }
    
    console.log('✅ Subscription processing completed');
  } catch (error) {
    console.error('❌ Daily subscription processing failed:', error);
  }
}

// Process individual yearly subscriber
async function processYearlySubscriber(subscriber) {
  console.log(`🔄 Processing yearly subscriber: ${subscriber.email}`);
  
  try {
    // Check if it's time for monthly renewal (yearly plans charge monthly)
    const lastRenewal = new Date(subscriber.lastCreditRenewal || subscriber.createdAt);
    const now = new Date();
    const daysSinceRenewal = (now - lastRenewal) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRenewal < 30) {
      console.log(`⏰ ${subscriber.email} - Not yet time for monthly renewal (${Math.floor(daysSinceRenewal)} days ago)`);
      return;
    }
    
    // Check if subscription is still active
    if (subscriber.subscriptionEndAt && new Date(subscriber.subscriptionEndAt) <= now) {
      console.log(`⏰ ${subscriber.email} - Subscription expired, skipping monthly renewal`);
      return;
    }
    
    // Process monthly payment and credit renewal
    await processYearlyPaymentAndCredits(subscriber);
    
  } catch (error) {
    console.error(`❌ Error processing yearly subscriber ${subscriber.email}:`, error);
  }
}

// Process yearly payment and credit renewal (monthly billing)
async function processYearlyPaymentAndCredits(subscriber) {
  console.log(`💳 Processing monthly payment for yearly plan: ${subscriber.email}`);
  
  try {
    // Get plan details
    const planDetails = getPlanDetails(subscriber.currentPlan);
    if (!planDetails) {
      console.log(`❌ Unknown plan: ${subscriber.currentPlan}`);
      return;
    }
    
    // Create payment intent for monthly billing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: planDetails.amount * 100, // Convert to cents
      currency: 'usd',
      customer: subscriber.stripeCustomerId,
      payment_method: subscriber.defaultPaymentMethodId,
      automatic_payment_methods: { enabled: true },
      confirm: true, // Auto-confirm for monthly billing
      off_session: true // Allow charging without user interaction
    });
    
    if (paymentIntent.status === 'succeeded') {
      console.log(`✅ Monthly payment succeeded for ${subscriber.email}: $${paymentIntent.amount / 100}`);
      
      // Renew credits and update user
      await renewYearlyCredits(subscriber, paymentIntent);
      
      // Generate monthly invoice
      await generateYearlyInvoice(subscriber, paymentIntent);
      
    } else {
      console.log(`❌ Monthly payment failed for ${subscriber.email}: ${paymentIntent.status}`);
      
      // Handle failed payment
      await handleFailedYearlyPayment(subscriber, paymentIntent);
    }
    
  } catch (error) {
    console.error(`❌ Error processing yearly payment for ${subscriber.email}:`, error);
  }
}
// Renew yearly credits (monthly)
async function renewYearlyCredits(subscriber, paymentIntent) {
  console.log(`🔄 Renewing monthly credits for yearly plan: ${subscriber.email}`);
  
  const planDetails = getPlanDetails(subscriber.currentPlan);
  const newCredits = planDetails.credits;
  
  // Update user credits
  const updateData = {
    currentCredits: newCredits,
    lastCreditRenewal: new Date().toISOString(),
    totalCreditsUsed: subscriber.totalCreditsUsed || 0
  };
  
  // Update in database
  if (subscriber.source === 'mongodb') {
    await User.findByIdAndUpdate(subscriber._id, updateData);
  } else {
    // Update in file storage
    const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
    if (userIndex !== -1) {
      mockDB.users[userIndex] = { ...mockDB.users[userIndex], ...updateData };
      fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(mockDB.users, null, 2));
    }
  }
  
  console.log(`✅ Monthly credits renewed for yearly plan ${subscriber.email}: ${newCredits} credits`);
}

// Generate yearly invoice (monthly)
async function generateYearlyInvoice(subscriber, paymentIntent) {
  console.log(`📄 Generating monthly invoice for yearly plan: ${subscriber.email}`);
  
  const invoice = {
    id: `inv_${Date.now()}_${subscriber.email}`,
    amount: paymentIntent.amount / 100,
    currency: 'usd',
    status: 'paid',
    created: new Date().toISOString(),
    plan: subscriber.currentPlan,
    type: 'yearly_monthly_renewal',
    paymentIntentId: paymentIntent.id
  };
  
  // Add invoice to user
  if (subscriber.source === 'mongodb') {
    await User.findByIdAndUpdate(subscriber._id, {
      $push: { invoices: invoice }
    });
  } else {
    const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
    if (userIndex !== -1) {
      if (!mockDB.users[userIndex].invoices) {
        mockDB.users[userIndex].invoices = [];
      }
      mockDB.users[userIndex].invoices.push(invoice);
      fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(mockDB.users, null, 2));
    }
  }
  
  console.log(`✅ Monthly invoice generated for yearly plan ${subscriber.email}`);
}

// Handle failed yearly payment
async function handleFailedYearlyPayment(subscriber, paymentIntent) {
  console.log(`❌ Handling failed monthly payment for yearly plan: ${subscriber.email}`);
  
  // Log failed payment
  const failedPayment = {
    id: `failed_${Date.now()}_${subscriber.email}`,
    amount: paymentIntent.amount / 100,
    currency: 'usd',
    status: 'failed',
    created: new Date().toISOString(),
    plan: subscriber.currentPlan,
    type: 'yearly_monthly_renewal_failed',
    paymentIntentId: paymentIntent.id,
    error: paymentIntent.last_payment_error?.message || 'Payment failed'
  };
  
  // Add failed payment to user
  if (subscriber.source === 'mongodb') {
    await User.findByIdAndUpdate(subscriber._id, {
      $push: { failedPayments: failedPayment }
    });
  } else {
    const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
    if (userIndex !== -1) {
      if (!mockDB.users[userIndex].failedPayments) {
        mockDB.users[userIndex].failedPayments = [];
      }
      mockDB.users[userIndex].failedPayments.push(failedPayment);
      fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(mockDB.users, null, 2));
    }
  }
  
  console.log(`✅ Failed payment logged for yearly plan ${subscriber.email}`);
}

// Process individual daily subscriber
async function processDailySubscriber(subscriber) {
  console.log(`🔄 Processing daily subscriber: ${subscriber.email}`);
  
  try {
    // Check if it's time for daily renewal
    const lastRenewal = new Date(subscriber.lastCreditRenewal || subscriber.createdAt);
    const now = new Date();
    const hoursSinceRenewal = (now - lastRenewal) / (1000 * 60 * 60);
    
    if (hoursSinceRenewal < 24) {
      console.log(`⏰ ${subscriber.email} - Not yet time for daily renewal (${Math.floor(hoursSinceRenewal)}h ago)`);
      return;
    }
    
    // Check if subscription is still active
    if (subscriber.subscriptionEndAt && new Date(subscriber.subscriptionEndAt) <= now) {
      console.log(`⏰ ${subscriber.email} - Subscription expired, skipping daily renewal`);
      return;
    }
    
    // Process daily payment and credit renewal
    await processDailyPaymentAndCredits(subscriber);
    
  } catch (error) {
    console.error(`❌ Error processing daily subscriber ${subscriber.email}:`, error);
  }
}
// Process daily payment and credit renewal
async function processDailyPaymentAndCredits(subscriber) {
  console.log(`💳 Processing daily payment for: ${subscriber.email}`);
  
  try {
    // Get customer from Stripe
    let customer = null;
    if (subscriber.stripeCustomerId) {
      customer = await stripe.customers.retrieve(subscriber.stripeCustomerId);
    } else {
      // Find customer by email
      const customers = await stripe.customers.list({ 
        email: subscriber.email, 
        limit: 1 
      });
      customer = customers.data[0];
    }
    
    if (!customer) {
      console.log(`⚠️ No Stripe customer found for ${subscriber.email}`);
      return;
    }
    
    // Create daily payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 in cents
      currency: 'usd',
      customer: customer.id,
      metadata: {
        planId: 'daily-12',
        customerEmail: subscriber.email,
        dailyRenewal: 'true',
        renewalDate: new Date().toISOString()
      },
      automatic_payment_methods: { enabled: true },
      confirm: true, // Auto-confirm for daily billing
      off_session: true // Allow charging without user interaction
    });
    
    if (paymentIntent.status === 'succeeded') {
      console.log(`✅ Daily payment succeeded for ${subscriber.email}: $${paymentIntent.amount / 100}`);
      
      // Renew credits and update user
      await renewDailyCredits(subscriber, paymentIntent);
      
      // Generate daily invoice
      await generateDailyInvoice(subscriber, paymentIntent);
      
    } else {
      console.log(`❌ Daily payment failed for ${subscriber.email}: ${paymentIntent.status}`);
      
      // Handle failed payment
      await handleFailedDailyPayment(subscriber, paymentIntent);
    }
    
  } catch (error) {
    console.error(`❌ Daily payment processing failed for ${subscriber.email}:`, error.message);
    
    // Handle payment error
    await handleDailyPaymentError(subscriber, error);
  }
}

// Renew daily credits for user
async function renewDailyCredits(subscriber, paymentIntent) {
  console.log(`🔄 Renewing daily credits for: ${subscriber.email}`);
  
  try {
    const newCredits = (subscriber.currentCredits || 0) + 50;
    const now = new Date();
    const nextRenewal = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Update in MongoDB if available
    if (subscriber.source === 'mongodb') {
      try {
        await User.findByIdAndUpdate(subscriber._id, {
          currentCredits: newCredits,
          lastCreditRenewal: now.toISOString(),
          nextCreditRenewal: nextRenewal.toISOString(),
          lastDailyPayment: now.toISOString(),
          dailyPaymentsCount: (subscriber.dailyPaymentsCount || 0) + 1
        });
        console.log(`✅ MongoDB credits renewed for ${subscriber.email}: ${newCredits} credits`);
      } catch (dbError) {
        console.log('❌ MongoDB update failed, using file storage...');
      }
    }
    
    // Update in file storage
    const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
    if (userIndex !== -1) {
      mockDB.users[userIndex].currentCredits = newCredits;
      mockDB.users[userIndex].lastCreditRenewal = now.toISOString();
      mockDB.users[userIndex].nextCreditRenewal = nextRenewal.toISOString();
      mockDB.users[userIndex].lastDailyPayment = now.toISOString();
      mockDB.users[userIndex].dailyPaymentsCount = (mockDB.users[userIndex].dailyPaymentsCount || 0) + 1;
      
      saveDataToFiles('daily_credits_renewed');
      console.log(`✅ File storage credits renewed for ${subscriber.email}: ${newCredits} credits`);
    }
    
  } catch (error) {
    console.error(`❌ Error renewing credits for ${subscriber.email}:`, error);
  }
}

// Generate daily invoice
async function generateDailyInvoice(subscriber, paymentIntent) {
  console.log(`📄 Generating daily invoice for: ${subscriber.email}`);
  
  try {
    const invoiceId = `DAILY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const dailyInvoice = {
      id: invoiceId,
      date: now.toISOString(),
      amount: paymentIntent.amount / 100, // $1.00
      currency: paymentIntent.currency || 'usd',
      status: 'paid',
      description: 'Daily-12 Plan - Daily Renewal',
      plan: 'Daily-12',
      paymentIntentId: paymentIntent.id,
      customerEmail: subscriber.email,
      type: 'daily_renewal',
      renewalNumber: (subscriber.dailyPaymentsCount || 0) + 1,
      creditsAdded: 50
    };
    
    // Add to MongoDB if available
    if (subscriber.source === 'mongodb') {
      try {
        await User.findByIdAndUpdate(subscriber._id, {
          $push: { invoices: dailyInvoice }
        });
        console.log(`✅ MongoDB daily invoice generated for ${subscriber.email}: ${invoiceId}`);
      } catch (dbError) {
        console.log('❌ MongoDB invoice update failed, using file storage...');
      }
    }
    
    // Add to file storage
    const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
    if (userIndex !== -1) {
      if (!mockDB.users[userIndex].invoices) {
        mockDB.users[userIndex].invoices = [];
      }
      mockDB.users[userIndex].invoices.push(dailyInvoice);
      
      saveDataToFiles('daily_invoice_generated');
      console.log(`✅ File storage daily invoice generated for ${subscriber.email}: ${invoiceId}`);
    }
    
  } catch (error) {
    console.error(`❌ Error generating daily invoice for ${subscriber.email}:`, error);
  }
}

// Handle failed daily payment
async function handleFailedDailyPayment(subscriber, paymentIntent) {
  console.log(`❌ Handling failed daily payment for: ${subscriber.email}`);
  
  try {
    // Update payment failure status
    const now = new Date();
    
    if (subscriber.source === 'mongodb') {
      try {
        await User.findByIdAndUpdate(subscriber._id, {
          lastPaymentFailure: now.toISOString(),
          paymentFailureCount: (subscriber.paymentFailureCount || 0) + 1,
          subscriptionOnHold: true
        });
      } catch (dbError) {
        console.log('❌ MongoDB failure update failed, using file storage...');
      }
    }
    
    // Update file storage
    const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
    if (userIndex !== -1) {
      mockDB.users[userIndex].lastPaymentFailure = now.toISOString();
      mockDB.users[userIndex].paymentFailureCount = (mockDB.users[userIndex].paymentFailureCount || 0) + 1;
      mockDB.users[userIndex].subscriptionOnHold = true;
      
      saveDataToFiles('daily_payment_failed');
    }
    
    // Send notification email (if email system is available)
    console.log(`⚠️ Daily payment failed for ${subscriber.email} - subscription on hold`);
    
  } catch (error) {
    console.error(`❌ Error handling failed payment for ${subscriber.email}:`, error);
  }
}

// Handle daily payment error
async function handleDailyPaymentError(subscriber, error) {
  console.log(`❌ Handling daily payment error for: ${subscriber.email}`);
  
  try {
    const now = new Date();
    
    // Update error status
    if (subscriber.source === 'mongodb') {
      try {
                 await User.findByIdAndUpdate(subscriber._id, {
           lastPaymentError: now.toISOString(),
           paymentErrorCount: (subscriber.paymentErrorCount || 0) + 1,
           lastPaymentErrorMessage: error.message
         });
       } catch (dbError) {
         console.log('❌ MongoDB error update failed, using file storage...');
       }
     }
     
     // Update file storage
     const userIndex = mockDB.users.findIndex(u => u.email === subscriber.email);
     if (userIndex !== -1) {
       mockDB.users[userIndex].lastPaymentError = now.toISOString();
       mockDB.users[userIndex].paymentErrorCount = (mockDB.users[userIndex].paymentErrorCount || 0) + 1;
       mockDB.users[userIndex].lastPaymentErrorMessage = error.message;
       
       saveDataToFiles('daily_payment_error');
     }
     
     console.log(`⚠️ Daily payment error for ${subscriber.email}: ${error.message}`);
     
   } catch (updateError) {
     console.error(`❌ Error updating error status for ${subscriber.email}:`, updateError);
   }
 }

// Schedule daily subscription processing
// Run every hour to check for daily renewals
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Hourly cron job triggered - checking daily subscriptions...');
  await processDailySubscriptions();
});

// Also run at midnight for daily summary
cron.schedule('0 0 * * *', async () => {
  console.log('🌅 Midnight cron job triggered - daily subscription summary...');
  await processDailySubscriptions();
  
  // Log daily summary
  console.log('📊 Daily Subscription Summary Completed');
});

console.log('✅ Daily subscription system initialized')