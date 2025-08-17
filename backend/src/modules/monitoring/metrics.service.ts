import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: Registry;
  
  // HTTP metrics
  public readonly httpRequestDuration: Histogram<string>;
  public readonly httpRequestTotal: Counter<string>;
  public readonly httpRequestErrors: Counter<string>;
  
  // Database metrics
  public readonly dbQueryDuration: Histogram<string>;
  public readonly dbConnectionPool: Gauge<string>;
  
  // Business metrics
  public readonly listingsTotal: Gauge<string>;
  public readonly activeUsersTotal: Gauge<string>;
  public readonly aiApiCalls: Counter<string>;
  public readonly aiApiCost: Counter<string>;
  
  // Queue metrics
  public readonly queueJobsProcessed: Counter<string>;
  public readonly queueJobsFailed: Counter<string>;
  public readonly queueJobDuration: Histogram<string>;
  
  // WebSocket metrics
  public readonly wsConnectionsActive: Gauge<string>;
  public readonly wsMessagesTotal: Counter<string>;

  constructor() {
    this.register = new Registry();
    
    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.register });
    
    // HTTP metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });
    
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });
    
    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.register],
    });
    
    // Database metrics
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.register],
    });
    
    this.dbConnectionPool = new Gauge({
      name: 'db_connection_pool_size',
      help: 'Database connection pool statistics',
      labelNames: ['status'],
      registers: [this.register],
    });
    
    // Business metrics
    this.listingsTotal = new Gauge({
      name: 'listings_total',
      help: 'Total number of listings',
      labelNames: ['status', 'type'],
      registers: [this.register],
    });
    
    this.activeUsersTotal = new Gauge({
      name: 'active_users_total',
      help: 'Total number of active users',
      registers: [this.register],
    });
    
    this.aiApiCalls = new Counter({
      name: 'ai_api_calls_total',
      help: 'Total number of AI API calls',
      labelNames: ['provider', 'model', 'status'],
      registers: [this.register],
    });
    
    this.aiApiCost = new Counter({
      name: 'ai_api_cost_usd',
      help: 'Total cost of AI API calls in USD',
      labelNames: ['provider', 'model'],
      registers: [this.register],
    });
    
    // Queue metrics
    this.queueJobsProcessed = new Counter({
      name: 'queue_jobs_processed_total',
      help: 'Total number of processed queue jobs',
      labelNames: ['queue', 'job_type'],
      registers: [this.register],
    });
    
    this.queueJobsFailed = new Counter({
      name: 'queue_jobs_failed_total',
      help: 'Total number of failed queue jobs',
      labelNames: ['queue', 'job_type', 'error'],
      registers: [this.register],
    });
    
    this.queueJobDuration = new Histogram({
      name: 'queue_job_duration_seconds',
      help: 'Duration of queue job processing in seconds',
      labelNames: ['queue', 'job_type'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120],
      registers: [this.register],
    });
    
    // WebSocket metrics
    this.wsConnectionsActive = new Gauge({
      name: 'ws_connections_active',
      help: 'Number of active WebSocket connections',
      registers: [this.register],
    });
    
    this.wsMessagesTotal = new Counter({
      name: 'ws_messages_total',
      help: 'Total number of WebSocket messages',
      labelNames: ['direction', 'type'],
      registers: [this.register],
    });
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }

  // Helper method to track HTTP request
  trackHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration / 1000, // Convert to seconds
    );
    this.httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
    
    if (statusCode >= 400) {
      this.httpRequestErrors.inc({
        method,
        route,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }
  }

  // Helper method to track database query
  trackDbQuery(operation: string, table: string, duration: number) {
    this.dbQueryDuration.observe(
      { operation, table },
      duration / 1000, // Convert to seconds
    );
  }

  // Helper method to track AI API usage
  trackAiApiCall(provider: string, model: string, success: boolean, cost?: number) {
    this.aiApiCalls.inc({
      provider,
      model,
      status: success ? 'success' : 'failure',
    });
    
    if (cost && cost > 0) {
      this.aiApiCost.inc({ provider, model }, cost);
    }
  }

  // Helper method to track queue job
  trackQueueJob(queue: string, jobType: string, success: boolean, duration?: number, error?: string) {
    if (success) {
      this.queueJobsProcessed.inc({ queue, job_type: jobType });
    } else {
      this.queueJobsFailed.inc({ queue, job_type: jobType, error: error || 'unknown' });
    }
    
    if (duration) {
      this.queueJobDuration.observe(
        { queue, job_type: jobType },
        duration / 1000, // Convert to seconds
      );
    }
  }
}