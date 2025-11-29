# AI Deal Scraper Setup Guide

## Overview
The AI Deal Scraper is a new feature that automatically scrapes biotech news websites to extract information about drug licensing and acquisition deals. It uses AI-powered pattern recognition to structure the data into a standardized format.

## Features Implemented

### 1. Frontend Component (`src/components/AIDealScraper.js`)
- **Search Interface**: Users can enter search queries and select news sources
- **Date Range Selection**: Filter deals by time period (1-30 days)
- **Source Selection**: Choose from 12+ biotech news sources
- **Advanced Filtering**: Filter by therapeutic area, deal stage, and financial value
- **Results Display**: Table format showing deal information as specified in the requirements
- **Export Functionality**: Download results as CSV
- **Credit System**: Integrates with existing user credit system

### 2. Backend API (`/api/ai-deal-scraper`)
- **Web Scraping**: Uses Puppeteer for dynamic content scraping
- **AI Data Extraction**: Pattern-based extraction of deal information
- **MongoDB Storage**: Saves scraped deals for future reference
- **Credit Management**: Deducts credits for scraping sessions
- **Error Handling**: Robust error handling for failed scrapes

### 3. Dashboard Integration
- **Navigation**: Added to "DATA" section in sidebar
- **Access Control**: Paid-only feature (requires subscription)
- **Suspension Handling**: Respects user suspension status

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd server
npm install axios cheerio puppeteer
```

### 2. Restart Backend Server
```bash
npm start
```

### 3. Frontend Dependencies
The frontend component uses existing dependencies and doesn't require additional installations.

## Usage

### 1. Access the Feature
- Navigate to Dashboard
- Click "AI Deal Scraper" in the DATA section (paid users only)

### 2. Configure Search
- Enter search query (e.g., "oncology deals", "cardiovascular partnerships")
- Select date range (1-30 days)
- Choose news sources to scrape
- Click "Scrape Deals"

### 3. Review Results
- View scraped deals in table format
- Use filters to narrow down results
- Export data as CSV

## Data Structure

The scraper extracts the following information for each deal:
- **Deal Date**: When the deal was announced
- **Buyer/Licensor**: Company acquiring the drug
- **Seller/Licensee**: Company selling/licensing the drug
- **Drug Name**: Name of the drug/compound
- **Disease/Therapeutic Area**: Medical indication
- **Stage**: Development stage (Pre-clinical, Phase I, II, III, Marketed)
- **Financials**: Deal value, upfront payments, milestones, royalties
- **Source**: Original news source and URL

## Supported News Sources

1. BioSpace
2. Fierce Biotech
3. Biotech Networks
4. Biocom California
5. LifeSci VC
6. San Diego Biotech
7. Cell & Gene
8. EU Medical Journal
9. Biocentury
10. Bio Xconomy
11. Pullan Consulting
12. PR Newswire

## Technical Details

### Web Scraping
- Uses Puppeteer for dynamic content scraping
- Handles JavaScript-rendered content
- Respects robots.txt and rate limiting
- Implements proper user agents and headers

### AI Data Extraction
- Pattern-based extraction using regex
- Identifies key deal components (buyer, seller, drug, financials)
- Extracts therapeutic areas and development stages
- Handles various financial formats

### Database Storage
- MongoDB collection: `deals`
- Stores search queries, extracted data, and metadata
- Includes user email for data ownership
- Timestamps for data freshness tracking

## Credit System Integration

- **Cost**: 1 credit per scraping session
- **Validation**: Checks user credits before scraping
- **Deduction**: Automatically deducts credits on successful scrape
- **Error Handling**: Returns appropriate error messages for insufficient credits

## Error Handling

- **Network Issues**: Graceful handling of failed requests
- **Parsing Errors**: Continues processing other sources if one fails
- **Rate Limiting**: Implements delays between requests
- **User Feedback**: Clear error messages and loading states

## Future Enhancements

1. **OpenAI Integration**: Replace regex patterns with GPT-based extraction
2. **Real-time Updates**: WebSocket connections for live deal updates
3. **Advanced Analytics**: Deal trend analysis and insights
4. **Email Alerts**: Notifications for new deals matching user criteria
5. **API Access**: REST API for external integrations

## Troubleshooting

### Common Issues

1. **Puppeteer Installation**: May require additional system dependencies
   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y gconf-service libasound2-dev libatk1.0-dev libc6-dev libdrm2 libgtk-3-dev libnspr4-dev libnss3-dev libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libxss1 libxtst6 xauth xvfb
   
   # macOS
   brew install --cask chromium
   ```

2. **Memory Issues**: Large scraping sessions may require increased memory
   ```bash
   node --max-old-space-size=4096 index.js
   ```

3. **Rate Limiting**: Some sources may block requests
   - Implement delays between requests
   - Use rotating user agents
   - Consider proxy services for production

## Security Considerations

- **Input Validation**: All user inputs are validated
- **Rate Limiting**: Prevents abuse of scraping functionality
- **Credit System**: Ensures fair usage
- **Data Privacy**: User data is properly isolated
- **Source Attribution**: Maintains links to original sources

## Performance Optimization

- **Parallel Processing**: Scrapes multiple sources simultaneously
- **Caching**: Consider implementing result caching
- **Database Indexing**: Index frequently queried fields
- **Memory Management**: Proper cleanup of browser instances

## Monitoring and Logging

- **Scraping Logs**: Track successful and failed scrapes
- **Performance Metrics**: Monitor scraping times and success rates
- **Error Tracking**: Log and alert on critical errors
- **Usage Analytics**: Track feature usage and user engagement
