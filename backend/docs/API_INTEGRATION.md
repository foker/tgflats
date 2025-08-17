# API Integration Guide for TBI-Prop

## Overview
This guide explains how to configure real API integrations for the TBI-Prop application.

## Quick Start

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your actual API keys (see sections below for obtaining keys)

3. Restart the application:
```bash
npm run start:dev
```

## API Services

### 1. Apify (Telegram Parsing)

**Purpose:** Scrapes Telegram channels for property listings

**How to get credentials:**
1. Go to [Apify Console](https://console.apify.com/)
2. Sign up or log in
3. Navigate to Settings → Integrations
4. Copy your User ID and API Token

**Environment variables:**
```env
APIFY_USER_ID=your_user_id_here
APIFY_SECRET=your_api_token_here
APIFY_ACTOR_ID=CIHG1VRwmC01rsPar  # Pre-configured Telegram scraper
```

**Testing:**
```bash
# Check if Apify is configured
curl http://localhost:3001/api/admin/api-config | jq '.apify'

# Trigger manual parse
curl -X POST http://localhost:3001/api/admin/parse-recent \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

### 2. OpenAI (AI Analysis)

**Purpose:** Analyzes property descriptions and extracts structured data

**How to get API key:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Create a new secret key

**Environment variables:**
```env
OPENAI_API_KEY=sk-your_openai_key_here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3
```

### 3. OpenRouter (DeepSeek Fallback)

**Purpose:** Alternative AI provider for cost optimization

**How to get API key:**
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Create a new API key

**Environment variables:**
```env
OPENROUTER_API_KEY=sk-or-v1-your_key_here
OPENROUTER_MODEL=deepseek/deepseek-chat
OPENROUTER_SITE_URL=https://tbi-prop.com
OPENROUTER_APP_NAME=TBI-Prop
```

### 4. Google Maps (Geocoding)

**Purpose:** Converts addresses to coordinates for map display

**How to get API key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Geocoding API"
4. Go to Credentials → Create Credentials → API Key
5. Restrict the key to Geocoding API only

**Environment variables:**
```env
GOOGLE_MAPS_API_KEY=AIza_your_google_maps_key_here
GOOGLE_MAPS_REGION=ge
GOOGLE_MAPS_LANGUAGE=en
```

### 5. OpenCage (Geocoding Fallback)

**Purpose:** Alternative geocoding provider

**How to get API key:**
1. Go to [OpenCage](https://opencagedata.com/)
2. Sign up for free account
3. Navigate to [Dashboard](https://opencagedata.com/dashboard)
4. Copy your API key

**Environment variables:**
```env
OPENCAGE_API_KEY=your_opencage_key_here
OPENCAGE_RATE_LIMIT=5
```

## Feature Flags

Control which features are enabled:

```env
# Use mock data when API keys are missing
ENABLE_MOCK_DATA=true

# Enable/disable features
ENABLE_AI_ANALYSIS=true
ENABLE_GEOCODING=true
ENABLE_AUTO_PARSING=false  # Set to true for production
ENABLE_WEBSOCKET=true
ENABLE_ADMIN_DASHBOARD=true
```

## Monitoring & Limits

### Cost Control
```env
# AI spending limits
AI_MONTHLY_SPENDING_LIMIT=100
AI_COST_WARNING_THRESHOLD=80
AI_ENABLE_FALLBACK=true  # Use cheaper models when limit approached
```

### Rate Limiting
```env
# Apify rate limiting
APIFY_RATE_LIMIT=10  # requests per minute
APIFY_MAX_RETRIES=3

# OpenCage rate limiting  
OPENCAGE_RATE_LIMIT=5  # requests per second
```

### Parsing Schedule
```env
# Cron expressions for scheduled parsing
PARSING_SCHEDULE_REGULAR="0 */12 * * *"  # Every 12 hours
PARSING_SCHEDULE_INITIAL="0 0 * * 0"     # Weekly full sync
PARSING_BATCH_SIZE=20
PARSING_INITIAL_LIMIT=100
```

## Verification

### 1. Check API Configuration Status
```bash
curl http://localhost:3001/api/admin/api-config | jq
```

Expected response shows which APIs are configured:
```json
{
  "apify": {
    "isConfigured": true,
    "actorId": "CIHG1VRwmC01rsPar",
    "channels": ["kvartiry_v_tbilisi", "propertyintbilisi", "GeorgiaRealEstateGroup"]
  },
  "ai": {
    "openai": true,
    "openrouter": true,
    "fallbackEnabled": true
  },
  "geocoding": {
    "googleMaps": true,
    "opencage": true
  }
}
```

### 2. Check System Health
```bash
curl http://localhost:3001/api/admin/system-health | jq
```

### 3. View Parsing Statistics
```bash
curl http://localhost:3001/api/admin/parsing-stats | jq
```

## Troubleshooting

### Application starts but uses mock data
- Check that API keys are set in `.env` (not `.env.example`)
- Verify keys are valid and not the placeholder values
- Check application logs for configuration warnings

### Apify parsing fails
- Verify Actor ID is correct: `CIHG1VRwmC01rsPar`
- Check Apify account has sufficient credits
- Review rate limiting settings
- Check logs: `docker-compose logs backend | grep Apify`

### AI analysis not working
- Verify OpenAI API key has access to GPT-4
- Check monthly spending limit hasn't been reached
- Review fallback configuration for OpenRouter

### Geocoding issues
- Ensure Google Maps API has Geocoding API enabled
- Check API key restrictions allow your server IP
- Verify OpenCage fallback is configured

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to version control
- Use environment-specific files: `.env.development`, `.env.production`
- Rotate API keys regularly
- Set up IP restrictions where possible
- Monitor API usage to detect anomalies

## Support

For issues or questions:
1. Check application logs: `npm run logs`
2. Review API provider documentation
3. Check rate limits and quotas on provider dashboards
4. Test with mock data enabled to isolate API issues