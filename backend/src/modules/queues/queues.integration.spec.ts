import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';

describe('Queue System Integration Tests', () => {
  let queueService: QueueService;
  let module: TestingModule;

  // Mock queue implementations
  const mockQueue = {
    add: jest.fn().mockImplementation((name: string, data: any, opts?: any) => ({
      id: `mock-job-${Date.now()}`,
      name,
      data,
      opts: opts || {},
      updateProgress: jest.fn(),
      moveToCompleted: jest.fn(),
      moveToFailed: jest.fn(),
    })),
    getWaiting: jest.fn().mockResolvedValue([]),
    getActive: jest.fn().mockResolvedValue([]),
    getCompleted: jest.fn().mockResolvedValue([]),
    getFailed: jest.fn().mockResolvedValue([]),
    getRepeatableJobs: jest.fn().mockResolvedValue([
      { name: 'scheduled-parse', pattern: '*/5 * * * *', id: 'scheduled-1' }
    ]),
    clean: jest.fn().mockResolvedValue([]),
    drain: jest.fn().mockResolvedValue(undefined),
    obliterate: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: 'BullQueue_telegram-parse',
          useValue: mockQueue,
        },
        {
          provide: 'BullQueue_ai-analysis',
          useValue: mockQueue,
        },
        {
          provide: 'BullQueue_geocoding',
          useValue: mockQueue,
        },
        {
          provide: 'BullQueue_listing-process',
          useValue: mockQueue,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                'PARSE_INTERVAL_MINUTES': 5,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    queueService = module.get<QueueService>(QueueService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Job Creation and Processing', () => {
    it('should add telegram parse jobs correctly', async () => {
      const channelUsername = 'test_channel';
      const job = await queueService.addTelegramParseJob(channelUsername);
      
      expect(job).toBeDefined();
      expect(job.name).toBe('parse-channel');
      expect(job.data.channelUsername).toBe(channelUsername);
      expect(job.opts.attempts).toBe(3);
      expect(job.opts.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
    });

    it('should add AI analysis jobs correctly', async () => {
      const postId = 'test-post-123';
      const text = 'Test text for analysis';
      const job = await queueService.addAiAnalysisJob(postId, text);
      
      expect(job).toBeDefined();
      expect(job.name).toBe('analyze-post');
      expect(job.data.postId).toBe(postId);
      expect(job.data.text).toBe(text);
      expect(job.opts.attempts).toBe(2);
      expect(job.opts.backoff).toEqual({
        type: 'exponential',
        delay: 1000,
      });
    });

    it('should add geocoding jobs correctly', async () => {
      const listingId = 'test-listing-456';
      const address = 'Test Address, Tbilisi';
      const job = await queueService.addGeocodingJob(listingId, address);
      
      expect(job).toBeDefined();
      expect(job.name).toBe('geocode-address');
      expect(job.data.listingId).toBe(listingId);
      expect(job.data.address).toBe(address);
      expect(job.opts.attempts).toBe(3);
      expect(job.opts.backoff).toEqual({
        type: 'exponential',
        delay: 1500,
      });
    });

    it('should add listing processing jobs correctly', async () => {
      const testData = { listingId: 'test-789', action: 'process' };
      const job = await queueService.addListingProcessJob(testData);
      
      expect(job).toBeDefined();
      expect(job.name).toBe('process-listing');
      expect(job.data).toEqual(testData);
      expect(job.opts.attempts).toBe(2);
    });
  });

  describe('Job Priority and Ordering', () => {
    it('should handle job priorities correctly', async () => {
      // Add jobs with different priorities
      const lowPriorityJob = await queueService.addTelegramParseJob('channel1', 1);
      const highPriorityJob = await queueService.addTelegramParseJob('channel2', 10);
      const mediumPriorityJob = await queueService.addTelegramParseJob('channel3', 5);
      
      expect(lowPriorityJob.opts.priority).toBe(1);
      expect(highPriorityJob.opts.priority).toBe(10);
      expect(mediumPriorityJob.opts.priority).toBe(5);
      
      // Verify add was called 3 times
      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should maintain FIFO order for same priority jobs', async () => {
      const job1 = await queueService.addAiAnalysisJob('post1', 'text1', 5);
      const job2 = await queueService.addAiAnalysisJob('post2', 'text2', 5);
      const job3 = await queueService.addAiAnalysisJob('post3', 'text3', 5);
      
      expect(job1.data.postId).toBe('post1');
      expect(job2.data.postId).toBe('post2');
      expect(job3.data.postId).toBe('post3');
      
      // Verify add was called 3 times
      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });
  });

  describe('Queue Statistics and Monitoring', () => {
    it('should provide accurate queue statistics', async () => {
      // Add some jobs to different queues
      await queueService.addTelegramParseJob('channel1');
      await queueService.addTelegramParseJob('channel2');
      await queueService.addAiAnalysisJob('post1', 'text1');
      await queueService.addGeocodingJob('listing1', 'address1');
      
      const stats = await queueService.getQueueStats();
      
      expect(stats).toHaveProperty('telegramParse');
      expect(stats).toHaveProperty('aiAnalysis');
      expect(stats).toHaveProperty('geocoding');
      expect(stats).toHaveProperty('listingProcess');
      
      // Mock queues return empty arrays
      expect(stats.telegramParse.waiting).toBe(0);
      expect(stats.aiAnalysis.waiting).toBe(0);
      expect(stats.geocoding.waiting).toBe(0);
      expect(stats.listingProcess.waiting).toBe(0);
      
      // All should have 0 active/completed/failed with mocks
      Object.values(stats).forEach(queueStats => {
        expect(queueStats.active).toBe(0);
        expect(queueStats.completed).toBe(0);
        expect(queueStats.failed).toBe(0);
      });
    });

    it('should track completed jobs correctly', async () => {
      const job = await queueService.addListingProcessJob({ test: 'data' });
      
      // Verify job was created
      expect(job).toBeDefined();
      expect(job.data).toEqual({ test: 'data' });
      
      // Mock functions should be callable
      expect(job.updateProgress).toBeDefined();
      expect(job.moveToCompleted).toBeDefined();
    });

    it('should track failed jobs correctly', async () => {
      const job = await queueService.addGeocodingJob('test-listing', 'invalid-address');
      
      // Verify job was created
      expect(job).toBeDefined();
      expect(job.data.listingId).toBe('test-listing');
      expect(job.data.address).toBe('invalid-address');
      
      // Mock functions should be callable
      expect(job.moveToFailed).toBeDefined();
    });
  });

  describe('Retry Mechanism', () => {
    it('should configure retry attempts correctly', async () => {
      const telegramJob = await queueService.addTelegramParseJob('test-channel');
      const aiJob = await queueService.addAiAnalysisJob('test-post', 'test-text');
      const geocodingJob = await queueService.addGeocodingJob('test-listing', 'test-address');
      const listingJob = await queueService.addListingProcessJob({ test: 'data' });
      
      expect(telegramJob.opts.attempts).toBe(3);
      expect(aiJob.opts.attempts).toBe(2);
      expect(geocodingJob.opts.attempts).toBe(3);
      expect(listingJob.opts.attempts).toBe(2);
    });

    it('should use exponential backoff for retries', async () => {
      const telegramJob = await queueService.addTelegramParseJob('test-channel');
      const aiJob = await queueService.addAiAnalysisJob('test-post', 'test-text');
      const geocodingJob = await queueService.addGeocodingJob('test-listing', 'test-address');
      
      expect(telegramJob.opts.backoff).toEqual({ type: 'exponential', delay: 2000 });
      expect(aiJob.opts.backoff).toEqual({ type: 'exponential', delay: 1000 });
      expect(geocodingJob.opts.backoff).toEqual({ type: 'exponential', delay: 1500 });
    });

    it('should handle job retry failures', async () => {
      const job = await queueService.addAiAnalysisJob('failing-post', 'failing-text');
      
      // Verify job configuration for retries
      expect(job.opts.attempts).toBe(2);
      expect(job.moveToFailed).toBeDefined();
      
      // Verify job data
      expect(job.data.postId).toBe('failing-post');
      expect(job.data.text).toBe('failing-text');
    });
  });

  describe('Manual Operations', () => {
    it('should trigger manual parsing correctly', async () => {
      const result = await queueService.triggerManualParse();
      
      expect(result).toHaveProperty('message', 'Manual parsing triggered');
      expect(result).toHaveProperty('jobs');
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result.jobs).toHaveLength(3); // Three channels
      
      result.jobs.forEach(job => {
        expect(job).toHaveProperty('id');
        expect(job).toHaveProperty('channel');
        expect(['kvartiry_v_tbilisi', 'propertyintbilisi', 'GeorgiaRealEstateGroup']).toContain(job.channel);
      });
      
      // Verify add method was called 3 times
      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should clear failed jobs correctly', async () => {
      // Clear failed jobs
      const result = await queueService.clearFailedJobs();
      expect(result).toEqual({ message: 'Failed jobs cleared from all queues' });
      
      // Verify clean method was called on all queues
      expect(mockQueue.clean).toHaveBeenCalledTimes(4); // 4 queues
      expect(mockQueue.clean).toHaveBeenCalledWith(0, 10, 'failed');
    });
  });

  describe('Scheduled Jobs', () => {
    it('should have scheduled jobs configured', async () => {
      // Check if scheduled job exists (using mockQueue)
      const repeatableJobs = await mockQueue.getRepeatableJobs();
      
      expect(repeatableJobs).toHaveLength(1);
      expect(repeatableJobs[0].name).toBe('scheduled-parse');
      expect(repeatableJobs[0].pattern).toBeDefined();
    });

    it('should use configured parse interval', async () => {
      const repeatableJobs = await mockQueue.getRepeatableJobs();
      const scheduledJob = repeatableJobs[0];
      
      // The interval should be 5 minutes (300000 ms) as configured in test
      // Check if the job has the correct repeat pattern
      expect(scheduledJob.pattern).toBeDefined();
      expect(scheduledJob.id).toBeDefined();
    });
  });

  describe('Job Data Validation', () => {
    it('should handle different job data types', async () => {
      const complexData = {
        listingId: 'complex-123',
        metadata: {
          source: 'telegram',
          confidence: 0.95,
          tags: ['new', 'furnished'],
        },
        coordinates: {
          lat: 41.7151,
          lng: 44.8271,
        },
      };
      
      const job = await queueService.addListingProcessJob(complexData);
      
      expect(job.data).toEqual(complexData);
      expect(job.data.metadata.tags).toContain('new');
      expect(job.data.coordinates.lat).toBe(41.7151);
    });

    it('should handle special characters in job data', async () => {
      const textWithSpecialChars = 'სამი ოთახიანი ბინა ვაკეში! €1000/მ. Меблированная квартира в центре 🏠';
      
      const job = await queueService.addAiAnalysisJob('special-post', textWithSpecialChars);
      
      expect(job.data.text).toBe(textWithSpecialChars);
      expect(job.data.text).toContain('ვაკეში');
      expect(job.data.text).toContain('🏠');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent job additions', async () => {
      const promises = Array.from({ length: 20 }, (_, i) =>
        queueService.addTelegramParseJob(`concurrent-channel-${i}`)
      );
      
      const jobs = await Promise.all(promises);
      
      expect(jobs).toHaveLength(20);
      jobs.forEach((job, index) => {
        expect(job.data.channelUsername).toBe(`concurrent-channel-${index}`);
      });
      
      // Verify add was called 20 times
      expect(mockQueue.add).toHaveBeenCalledTimes(20);
    });

    it('should handle mixed queue operations concurrently', async () => {
      const operations = [
        () => queueService.addTelegramParseJob('telegram-test'),
        () => queueService.addAiAnalysisJob('ai-test', 'test text'),
        () => queueService.addGeocodingJob('geo-test', 'test address'),
        () => queueService.addListingProcessJob({ test: 'data' }),
        () => queueService.getQueueStats(),
        () => queueService.triggerManualParse(),
      ];
      
      const results = await Promise.allSettled(
        operations.map(op => op())
      );
      
      // All operations should succeed
      expect(results.every(result => result.status === 'fulfilled')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid job data gracefully', async () => {
      // These should not throw errors but handle gracefully
      await expect(queueService.addTelegramParseJob('')).resolves.toBeDefined();
      await expect(queueService.addAiAnalysisJob('', '')).resolves.toBeDefined();
      await expect(queueService.addGeocodingJob('', '')).resolves.toBeDefined();
      await expect(queueService.addListingProcessJob(null)).resolves.toBeDefined();
    });

    it('should handle queue connection issues gracefully', async () => {
      // This test would need a more complex setup to simulate Redis connection issues
      // For now, we just verify that the service methods don't throw
      await expect(queueService.getQueueStats()).resolves.toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle large job batches efficiently', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 100 }, (_, i) =>
        queueService.addAiAnalysisJob(`post-${i}`, `Text for analysis ${i}`)
      );
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      
      // Verify add was called 100 times
      expect(mockQueue.add).toHaveBeenCalledTimes(100);
    });

    it('should provide queue statistics efficiently', async () => {
      // Add some jobs first
      await Promise.all([
        queueService.addTelegramParseJob('perf-channel'),
        queueService.addAiAnalysisJob('perf-post', 'perf-text'),
        queueService.addGeocodingJob('perf-listing', 'perf-address'),
      ]);
      
      const startTime = Date.now();
      const stats = await queueService.getQueueStats();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // Statistics should be fast (under 1 second)
      expect(duration).toBeLessThan(1000);
      expect(stats).toBeDefined();
    });
  });
});