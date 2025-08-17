# Task 003: Real Parsing Integration Pipeline

#$ARGUMENTS: Implement complete Telegram parsing pipeline with Apify, AI processing via DeepSeek 3, geocoding, and automated scheduling

## Overview
Replace mock data with real Telegram channel parsing using Apify actor CIHG1VRwmC01rsPar, process posts through DeepSeek 3 for property data extraction, implement geocoding and image storage.

## Channels to Parse
- @kvartiry_v_tbilisi
- @propertyintbilisi
- @GeorgiaRealEstateGroup

## Task Breakdown

### 1. Infrastructure & Configuration
- [x] Create Apify integration service module
- [x] Configure OpenRouter client for DeepSeek 3
- [x] Setup OpenCage geocoding service
- [x] Update .env.example with new variables
- [x] Add TypeScript types for all external APIs

### 2. Apify Integration
- [x] Create ApifyService class with actor run methods
- [x] Implement Telegram channel parser using actor CIHG1VRwmC01rsPar
- [x] Add retry logic and error handling
- [x] Create types for Apify actor input/output
- [x] Test connection with real Apify account

### 3. AI Processing Pipeline
- [x] Create PropertyExtractor service using DeepSeek 3
- [x] Design prompt for property data extraction
- [x] Implement structured output parsing (price, area, rooms, amenities)
- [x] Add fallback for failed extractions
- [x] Create validation for extracted data

### 4. Data Processing & Storage
- [x] Implement image download and storage service
- [x] Create geocoding service with OpenCage API
- [x] Design database schema for parsed properties
- [x] Create upsert logic to avoid duplicates
- [x] Add data normalization and cleaning

### 5. Scheduled Tasks
- [x] Setup Bull queue for background jobs
- [x] Create cron job for parsing (every 12 hours, last 20 posts)
- [x] Implement initial data seeder (100 posts per channel)
- [x] Add job monitoring and failure notifications
- [x] Create admin endpoint for manual trigger

### 6. API Endpoints
- [x] POST /api/admin/parsing/trigger - Manual parsing trigger
- [x] GET /api/admin/parsing/status - Current parsing status
- [x] GET /api/admin/parsing/history - Parsing job history
- [x] POST /api/admin/parsing/seed - Initial data seeding

### 7. Testing
- [x] Unit tests for ApifyService
- [x] Unit tests for PropertyExtractor
- [x] Integration tests for full pipeline
- [x] Mock external API calls in tests
- [x] E2E test for scheduled job execution

### 8. Documentation
- [x] Update API documentation
- [x] Document parsing pipeline architecture
- [x] Add troubleshooting guide
- [x] Update deployment instructions

### 9. Error Handling & Monitoring
- [x] Implement comprehensive error logging
- [x] Add metrics for parsing success rate
- [x] Create alerts for failed parsing jobs
- [x] Implement graceful degradation

### 10. Performance Optimization
- [x] Add caching for geocoding results
- [x] Implement batch processing for AI requests
- [x] Optimize image storage (compression, CDN)
- [x] Add rate limiting for external APIs

## Technical Details

### Environment Variables
```env
# Apify
APIFY_USER_ID=your_user_id
APIFY_SECRET=your_api_token

# OpenRouter (for DeepSeek 3)
OPENROUTER_API_KEY=your_api_key

# OpenCage Geocoding
OPENCAGE_API_KEY=your_api_key
```

### Apify Actor Configuration
```json
{
  "actorId": "CIHG1VRwmC01rsPar",
  "input": {
    "channels": ["@kvartiry_v_tbilisi", "@propertyintbilisi", "@GeorgiaRealEstateGroup"],
    "limit": 20,
    "includeMedia": true
  }
}
```

### DeepSeek 3 Prompt Template
```
Extract property information from this Telegram post:
[POST_CONTENT]

Return JSON with:
- type: apartment/house/land
- price: number (in USD)
- rooms: number
- area: number (sqm)
- location: string
- amenities: string[]
- description: string
```

## Dependencies
- @apify/client
- openai (for OpenRouter)
- node-opencage-geocoder
- bull (job queue)
- sharp (image processing)

## Success Criteria
- [ ] Successfully parse and store 100+ real properties
- [ ] Automated parsing runs every 12 hours
- [ ] All images properly stored and accessible
- [ ] Geocoding accuracy > 90%
- [ ] AI extraction accuracy > 85%
- [ ] Zero data loss during processing

## Notes
- Priority: HIGH
- Estimated effort: 3-4 days
- Risk: API rate limits, AI extraction accuracy
- Mitigation: Implement proper rate limiting and manual review queue

## Related Files
- `/src/services/parsing/ApifyService.ts`
- `/src/services/ai/PropertyExtractor.ts`
- `/src/services/geocoding/OpenCageService.ts`
- `/src/jobs/ParsingJob.ts`
- `/src/api/admin/parsing.routes.ts`