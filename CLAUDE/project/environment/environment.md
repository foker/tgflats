# Environment Variables Configuration

## Backend Environment Variables

### Application Configuration
```bash
# Node Environment
NODE_ENV=development|production|test

# Application Port
PORT=3000

# API URL (for CORS and webhooks)
API_URL=http://localhost:3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Database Configuration
```bash
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@localhost:5432/tbi_prop

# Database Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10

# Enable query logging
DB_LOGGING=true|false
```

### Redis Configuration
```bash
# Redis Connection (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Redis connection URL (alternative)
REDIS_URL=redis://localhost:6379
```

### Telegram Configuration
```bash
# Telegram API Credentials (obtain from https://my.telegram.org)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# Telegram Session
TELEGRAM_SESSION_STRING=base64_encoded_session

# Telegram Phone Number (for initial auth)
TELEGRAM_PHONE_NUMBER=+995xxxxxxxxx

# Parsing Configuration
TELEGRAM_PARSE_INTERVAL_MINUTES=30
TELEGRAM_MAX_POSTS_PER_CHANNEL=100
```

### AI Service Configuration
```bash
# OpenAI Configuration (option 1)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000

# Anthropic Claude Configuration (option 2)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229

# AI Service Selection
AI_SERVICE=openai|anthropic

# AI Analysis Thresholds
AI_CONFIDENCE_THRESHOLD=0.8
AI_REVIEW_THRESHOLD=0.6
```

### Google Maps Configuration
```bash
# Google Maps API Key
GOOGLE_MAPS_API_KEY=AIza...

# Geocoding Configuration
GEOCODING_RATE_LIMIT=50
GEOCODING_CACHE_TTL_HOURS=720
```

### Queue Configuration
```bash
# BullMQ Settings
QUEUE_PARSE_CONCURRENCY=2
QUEUE_AI_CONCURRENCY=5
QUEUE_GEO_CONCURRENCY=10

# Job Retry Settings
JOB_RETRY_ATTEMPTS=3
JOB_RETRY_DELAY_MS=5000
JOB_RETRY_BACKOFF=exponential
```

### Storage Configuration
```bash
# Digital Ocean Spaces (S3 compatible)
DO_SPACES_KEY=your_access_key
DO_SPACES_SECRET=your_secret_key
DO_SPACES_ENDPOINT=fra1.digitaloceanspaces.com
DO_SPACES_REGION=fra1
DO_SPACES_BUCKET=tbi-prop-media

# CDN Configuration
CDN_URL=https://cdn.tbi-prop.example.com

# Local storage fallback
LOCAL_STORAGE_PATH=/var/lib/tbi-prop/media
```

### Security Configuration
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Encryption
ENCRYPTION_KEY=32-character-encryption-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Monitoring & Logging
```bash
# Sentry Configuration
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Logging
LOG_LEVEL=debug|info|warn|error
LOG_FORMAT=json|pretty
LOG_FILE_PATH=/var/log/tbi-prop/app.log
```

### Email Configuration (Optional)
```bash
# SMTP Settings (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@tbi-prop.com
SMTP_PASSWORD=your_password
SMTP_FROM=TBI Property <no-reply@tbi-prop.com>

# Admin notifications
ADMIN_EMAIL=admin@tbi-prop.com
```

## Frontend Environment Variables

### API Configuration
```bash
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# WebSocket URL (for real-time updates)
VITE_WS_URL=ws://localhost:3000
```

### Google Maps
```bash
# Google Maps API Key (client-side)
VITE_GOOGLE_MAPS_API_KEY=AIza...

# Map Configuration
VITE_MAP_DEFAULT_CENTER_LAT=41.7151
VITE_MAP_DEFAULT_CENTER_LNG=44.8271
VITE_MAP_DEFAULT_ZOOM=12
```

### Feature Flags
```bash
# Enable/disable features
VITE_ENABLE_HEAT_MAP=true
VITE_ENABLE_STREET_VIEW=false
VITE_ENABLE_3D_BUILDINGS=true
VITE_ENABLE_ANALYTICS=true
```

### Analytics (Optional)
```bash
# Google Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Or Plausible Analytics
VITE_PLAUSIBLE_DOMAIN=tbi-prop.com
```

### UI Configuration
```bash
# Pagination
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100

# Map Clustering
VITE_CLUSTER_MIN_POINTS=5
VITE_CLUSTER_RADIUS=60

# Currency Display
VITE_DEFAULT_CURRENCY=USD
VITE_SUPPORTED_CURRENCIES=USD,EUR,GEL
```

## Infrastructure Environment Variables

### Deployment Configuration
```bash
# Digital Ocean
DO_AUTH_TOKEN=dop_v1_...
DO_DROPLET_REGION=fra1
DO_DROPLET_SIZE=s-2vcpu-4gb

# Domain Configuration
DOMAIN=tbi-prop.com
SSL_EMAIL=admin@tbi-prop.com
```

### Docker Configuration
```bash
# Registry
DOCKER_REGISTRY=registry.digitalocean.com/tbi-prop
DOCKER_IMAGE_TAG=latest

# Resource Limits
DOCKER_MEMORY_LIMIT=2g
DOCKER_CPU_LIMIT=1.5
```

### Backup Configuration
```bash
# Database Backup
BACKUP_SCHEDULE="0 3 * * *"
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=tbi-prop-backups
```

## Development Environment

### Development Overrides
```bash
# Disable external services in development
MOCK_TELEGRAM_API=true
MOCK_AI_SERVICE=true
MOCK_GEOCODING=true

# Development database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tbi_prop_dev

# Hot reload
WATCH_MODE=true
```

## Test Environment

### Test Configuration
```bash
# Test database (separate from development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tbi_prop_test

# Disable external API calls
MOCK_ALL_EXTERNAL_APIS=true

# Test specific settings
TEST_TIMEOUT_MS=30000
TEST_RETRY_COUNT=2
```

## Environment File Structure

```
/
├── .env                    # Default/development environment
├── .env.local             # Local overrides (gitignored)
├── .env.production        # Production environment
├── .env.test              # Test environment
├── .env.example           # Example with all variables documented
├── backend/
│   └── .env              # Backend specific (if needed)
└── frontend/
    └── .env              # Frontend specific (if needed)
```

## Security Notes

1. **Never commit** `.env` files with real credentials
2. **Use secrets management** in production (e.g., DO App Platform secrets, Kubernetes secrets)
3. **Rotate keys regularly** especially API keys and JWT secrets
4. **Use strong passwords** minimum 32 characters for secrets
5. **Limit API key scope** to minimum required permissions
6. **Monitor API usage** to detect unusual activity

## Variable Validation

The application should validate all required environment variables on startup:
- Check presence of required variables
- Validate format (URLs, emails, numbers)
- Test connections (database, Redis, external APIs)
- Fail fast with clear error messages if configuration is invalid