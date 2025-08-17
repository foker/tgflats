import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../../modules/monitoring/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Capture the original end function
    const originalEnd = res.end;
    
    // Override the end function to capture metrics
    res.end = (...args: any[]) => {
      const duration = Date.now() - startTime;
      const route = req.route?.path || req.path || 'unknown';
      const method = req.method;
      const statusCode = res.statusCode;
      
      // Track the request metrics
      this.metricsService.trackHttpRequest(method, route, statusCode, duration);
      
      // Call the original end function
      return originalEnd.apply(res, args);
    };
    
    next();
  }
}