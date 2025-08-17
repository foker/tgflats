import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'TBI-Prop API is running! 🏠';
  }

  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'tbi-prop-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}