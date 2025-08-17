# AI Cost Tracking System

## Overview
The AI Cost Tracking system monitors and tracks spending on AI API calls (OpenAI, Anthropic, etc.) to help manage costs and prevent overspending.

## Features

### 1. Token Counting
- Accurate token counting using `gpt-tokenizer` library
- Support for both input and output token tracking
- Fallback approximation when accurate counting fails

### 2. Cost Calculation
- Pre-configured pricing for multiple AI models:
  - OpenAI: GPT-3.5-Turbo, GPT-4, GPT-4-Turbo, GPT-4o
  - Anthropic: Claude-3 (Opus, Sonnet, Haiku), Claude-2.1
- Automatic cost calculation based on token usage
- Support for custom pricing configurations

### 3. Usage Tracking
- All API calls are logged to database
- Tracks: provider, model, tokens, cost, request ID, metadata
- Historical data for analysis and reporting

### 4. Spending Limits
- Monthly spending limits (configurable via `AI_MONTHLY_SPENDING_LIMIT` env var)
- Automatic fallback to mock data when limit exceeded
- Warning alerts when approaching limits (80% threshold)

### 5. Analytics & Reporting
- Usage statistics by period
- Breakdown by provider and model
- Daily spending trends
- Cost estimation for text analysis

## API Endpoints

### Get Usage Statistics
```
GET /api/ai-usage/stats?startDate=2025-01-01&endDate=2025-01-31
```
Returns aggregated statistics for the specified period.

### Get Cost Details
```
GET /api/ai-usage/costs?provider=openai&model=gpt-3.5-turbo&limit=10&offset=0
```
Returns detailed cost records with pagination.

### Get Monthly Spending
```
GET /api/ai-usage/monthly
```
Returns current month spending status and limits.

### Estimate Cost
```
GET /api/ai-usage/estimate?provider=openai&model=gpt-3.5-turbo&text=...&estimatedOutputTokens=500
```
Estimates cost for analyzing given text.

### Get Model Pricing
```
GET /api/ai-usage/models
```
Returns all supported models and their pricing.

## Configuration

### Environment Variables
```env
# Monthly spending limit in USD (default: 100)
AI_MONTHLY_SPENDING_LIMIT=100

# OpenAI API Key
OPENAI_API_KEY=your_key_here
```

### Database Schema
```prisma
model AiApiUsage {
  id           String   @id @default(uuid())
  provider     String   
  model        String   
  inputTokens  Int      
  outputTokens Int      
  totalTokens  Int      
  cost         Float    
  requestId    String?  
  metadata     Json?    
  createdAt    DateTime @default(now())
}
```

## Integration

The cost tracking is automatically integrated into the `AiAnalysisService`:

1. Before each API call, spending limits are checked
2. Input tokens are counted before the request
3. After receiving response, output tokens are tracked
4. Usage data is saved to database
5. If limits are exceeded, service falls back to mock analysis

## Usage Example

```typescript
// The service automatically tracks usage
const result = await aiAnalysisService.analyzeText(text);

// Check current spending
const spending = await costTrackingService.getCurrentMonthSpending();
console.log(`Current month spending: $${spending.total} / $${spending.limit}`);

// Get usage statistics
const stats = await costTrackingService.getUsageStats(startDate, endDate);
console.log(`Total cost: $${stats.totalCost}`);
console.log(`Total tokens: ${stats.totalTokens}`);
```

## Monitoring

### Spending Alerts
The system automatically checks spending limits and provides:
- Warning at 80% of monthly limit
- Hard stop at 100% of monthly limit
- Automatic fallback to mock responses when over limit

### Cost Optimization Tips
1. Use cheaper models when possible (GPT-3.5-Turbo vs GPT-4)
2. Optimize prompts to reduce token usage
3. Cache frequently requested analyses
4. Use batch processing for multiple texts
5. Monitor daily spending trends to identify anomalies

## Extending the System

### Adding New Providers/Models
Update the `AI_MODEL_PRICING` constant in `ai-cost-tracking.service.ts`:

```typescript
export const AI_MODEL_PRICING = {
  'new-provider': {
    'model-name': {
      input: 0.001,  // Cost per 1K input tokens
      output: 0.002, // Cost per 1K output tokens
    }
  }
}
```

### Custom Metadata
Add custom metadata when tracking usage:

```typescript
await costTrackingService.trackUsage({
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  inputTokens: 100,
  outputTokens: 200,
  metadata: {
    purpose: 'rental_analysis',
    userId: 'user123',
    source: 'telegram'
  }
})
```

## Migration

To apply the database schema:

```bash
# Generate Prisma client
npx prisma generate

# Run migration (when database is available)
npx prisma migrate deploy
```

## Testing

Use the provided HTTP test file `test-ai-tracking.http` to test all endpoints:
- VS Code: Install REST Client extension
- IntelliJ IDEA: Use built-in HTTP client
- Or use curl/Postman with the provided examples