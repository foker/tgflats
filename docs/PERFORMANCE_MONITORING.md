# Performance Monitoring & Optimization Guide

## Overview
This document describes the performance optimization and monitoring setup for the TBI-Prop platform.

## Backend Performance

### 1. Response Compression
- **Gzip compression** enabled for all responses > 1KB
- Compression level: 6 (balanced performance/size)
- Location: `src/main.ts`

### 2. Database Optimization
- **Connection pooling** via Prisma
- **Query optimization** with indexed fields
- **Lazy loading** for related data
- **Redis caching** for frequently accessed data (5 min TTL)

### 3. Redis Caching
- Cache service: `src/modules/cache/cache.service.ts`
- Cache patterns:
  - Cache-aside pattern for listings
  - TTL-based expiration
  - Key namespace organization
- Cache invalidation on data updates

### 4. Monitoring Endpoints

#### Health Checks
- `/api/health` - Comprehensive health check
- `/api/health/ready` - Readiness probe
- `/api/health/live` - Liveness probe

#### Metrics (Prometheus format)
- `/api/metrics` - Application metrics
- Port 9464 - OpenTelemetry metrics

### 5. Prometheus Metrics

#### HTTP Metrics
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total request counter
- `http_request_errors_total` - Error counter

#### Database Metrics
- `db_query_duration_seconds` - Query duration
- `db_connection_pool_size` - Connection pool stats

#### Business Metrics
- `listings_total` - Total listings by status
- `ai_api_calls_total` - AI API usage
- `ai_api_cost_usd` - AI API costs

#### Queue Metrics
- `queue_jobs_processed_total` - Processed jobs
- `queue_jobs_failed_total` - Failed jobs
- `queue_job_duration_seconds` - Job duration

### 6. OpenTelemetry Tracing
- Automatic instrumentation for HTTP, Express, Database
- Jaeger exporter (optional)
- Custom span attributes for debugging

## Frontend Performance

### 1. Bundle Optimization
- **Code splitting** by route and vendor
- Manual chunks:
  - `react-vendor` - React core libraries
  - `ui-vendor` - UI framework (Chakra UI)
  - `map-vendor` - Map libraries
  - `utils-vendor` - Utilities
- **Tree shaking** enabled
- **Minification** with Terser

### 2. Asset Optimization
- **Gzip & Brotli compression** for static assets
- **Source maps** for production debugging
- **Bundle analyzer** at `/dist/stats.html`

### 3. Image Optimization
- **Lazy loading** with Intersection Observer
- **WebP format** support with fallback
- **Responsive images** based on DPR
- **Progressive loading** with skeleton UI
- Component: `src/components/LazyImage.tsx`

### 4. Service Worker & Caching
- **Offline support** with Service Worker
- Cache strategies:
  - Network-first for API calls
  - Cache-first for static assets
  - Stale-while-revalidate for HTML
- Separate caches for images
- Background sync for failed requests

### 5. Web Vitals Monitoring
- Core Web Vitals:
  - **LCP** (Largest Contentful Paint) < 2.5s
  - **FID** (First Input Delay) < 100ms
  - **CLS** (Cumulative Layout Shift) < 0.1
- Additional metrics:
  - **FCP** (First Contentful Paint)
  - **TTFB** (Time to First Byte)
- Local storage history for debugging

### 6. React Optimizations
- **React.memo** for expensive components
- **useMemo/useCallback** for computations
- **Virtual scrolling** for long lists
- **React Query** caching (5 min stale time)

## Load Testing

### Artillery Configuration
- Config file: `backend/artillery.yml`
- Scenarios:
  - Browse Listings (40%)
  - Search and Filter (30%)
  - Map Clustering (20%)
  - Health Check (10%)
- Load phases:
  1. Warm up: 10 req/s for 60s
  2. Ramp up: 50 req/s for 120s
  3. Sustained: 100 req/s for 300s

### Running Load Tests
```bash
# Install Artillery
npm install -g artillery

# Run load test
cd backend
artillery run artillery.yml

# Generate HTML report
artillery report artillery-report.json
```

## Production Checklist

### Security Headers
- [x] Helmet.js configured
- [x] CSP headers set
- [x] CORS properly configured
- [x] Rate limiting enabled (100 req/min)

### Performance Targets
- [ ] Server response time < 200ms (p95)
- [ ] Database queries < 50ms (p95)
- [ ] Frontend TTI < 3s
- [ ] Lighthouse score > 90

### Monitoring Setup
- [ ] Prometheus scraping configured
- [ ] Grafana dashboards created
- [ ] Alert rules defined
- [ ] Log aggregation setup

### Scaling Considerations
- [ ] Database read replicas
- [ ] Redis cluster mode
- [ ] CDN for static assets
- [ ] Horizontal pod autoscaling

## Environment Variables

### Backend
```env
# Monitoring
PROMETHEUS_PORT=9464
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL=300

# Performance
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=2048"
```

### Frontend
```env
# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com/vitals

# Performance
VITE_ENABLE_SW=true
VITE_ENABLE_VITALS=true
```

## Troubleshooting

### High Memory Usage
1. Check for memory leaks in event listeners
2. Review Redis memory usage
3. Analyze heap snapshots
4. Check connection pool sizes

### Slow Queries
1. Run EXPLAIN ANALYZE on slow queries
2. Add missing indexes
3. Review N+1 query problems
4. Enable query logging

### Poor Frontend Performance
1. Check bundle size with analyzer
2. Review Web Vitals metrics
3. Profile with Chrome DevTools
4. Check image sizes and formats

### Cache Issues
1. Verify Redis connectivity
2. Check cache hit rates
3. Review TTL settings
4. Monitor memory usage

## Grafana Dashboard Queries

### Request Rate
```promql
rate(http_requests_total[5m])
```

### Error Rate
```promql
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])
```

### Response Time (p95)
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Cache Hit Rate
```promql
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

## References
- [Web Vitals](https://web.dev/vitals/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)
- [React Performance](https://react.dev/learn/render-and-commit)