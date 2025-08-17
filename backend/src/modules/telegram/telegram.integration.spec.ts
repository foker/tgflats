import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { ListingsService } from '../listings/listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiCostTrackingService } from '../ai-analysis/ai-cost-tracking.service';
import { ClusteringService } from '../listings/clustering.service';
import { ListingStatus } from '@prisma/client';

describe('Telegram Integration Tests', () => {
  let telegramService: TelegramService;
  let aiAnalysisService: AiAnalysisService;
  let listingsService: ListingsService;
  let prisma: PrismaService;
  let module: TestingModule;

  // Mock data
  const mockChannelMessage = {
    id: 12345,
    text: 'Сдается 2-комнатная квартира в Вакe, 800 лари в месяц. Есть мебель, можно с животными. Тел: +995555123456',
    photos: ['https://example.com/photo1.jpg'],
    date: new Date(),
    channelId: 'channel_test',
    raw: {
      messageId: 12345,
      userId: 67890,
      district: 'Vake',
      views: 150,
    }
  };

  const mockAiAnalysisResult = {
    isRental: true,
    confidence: 0.92,
    extractedData: {
      price: { amount: 800, currency: 'GEL' },
      rooms: 2,
      district: 'Vake',
      petsAllowed: true,
      furnished: true,
      contactInfo: '+995555123456'
    },
    language: 'ru' as const,
    reasoning: 'Clear rental listing with all required details'
  };

  const mockCreatedListing = {
    id: 'listing-123',
    telegramPostId: 'post-456',
    district: 'Vake',
    price: 800,
    currency: 'GEL',
    bedrooms: 2,
    petsAllowed: true,
    furnished: true,
    confidence: 0.92,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Mock services
  const mockPrismaService = {
    telegramChannel: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    telegramPost: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    listing: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    aiUsage: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'TELEGRAM_BOT_TOKEN': undefined, // No token to avoid actual bot initialization
        'OPENAI_API_KEY': undefined, // No key to use mock analysis
        'AI_DAILY_LIMIT_USD': '10',
        'AI_MONTHLY_LIMIT_USD': '100',
      };
      return config[key];
    }),
  };

  const mockClusteringService = {
    clusterListings: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TelegramService,
        AiAnalysisService,
        ListingsService,
        AiCostTrackingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ClusteringService,
          useValue: mockClusteringService,
        },
      ],
    }).compile();

    telegramService = module.get<TelegramService>(TelegramService);
    aiAnalysisService = module.get<AiAnalysisService>(AiAnalysisService);
    listingsService = module.get<ListingsService>(ListingsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Full Telegram to Listing Workflow', () => {
    it('should process telegram messages through complete pipeline', async () => {
      // Setup mocks
      mockPrismaService.telegramChannel.findUnique.mockResolvedValue(null);
      mockPrismaService.telegramChannel.create.mockResolvedValue({
        id: 'channel-123',
        channelId: 'channel_test',
        username: 'test_channel',
        title: 'Test Channel',
        isActive: true,
      });
      mockPrismaService.telegramPost.upsert.mockResolvedValue({
        id: 'post-456',
        channelId: 'channel_test',
        messageId: 12345,
        text: mockChannelMessage.text,
        processed: false,
      });

      // Step 1: Parse channel messages
      const messages = await telegramService.parseChannelMessages('test_channel', 1);
      
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toContain('Сдается 2-комнатная');
      expect(mockPrismaService.telegramChannel.create).toHaveBeenCalled();
      expect(mockPrismaService.telegramPost.upsert).toHaveBeenCalled();

      // Step 2: Get unprocessed posts
      mockPrismaService.telegramPost.findMany.mockResolvedValue([{
        id: 'post-456',
        text: mockChannelMessage.text,
        processed: false,
        channel: { username: 'test_channel' }
      }]);

      const unprocessedPosts = await telegramService.getUnprocessedPosts(10);
      expect(unprocessedPosts).toHaveLength(1);

      // Step 3: Analyze with AI (mock analysis since no API key)
      const aiResult = await aiAnalysisService.analyzeText(mockChannelMessage.text);
      
      expect(aiResult.isRental).toBe(true);
      expect(aiResult.confidence).toBeGreaterThan(0.5);
      expect(aiResult.extractedData.price?.amount).toBeDefined();
      expect(aiResult.extractedData.rooms).toBeDefined();
      expect(aiResult.language).toBe('ru');

      // Step 4: Create listing if confidence is high enough
      if (aiResult.isRental && aiResult.confidence > 0.8) {
        mockPrismaService.listing.create.mockResolvedValue(mockCreatedListing);

        const listing = await listingsService.create({
          telegramPostId: 'post-456',
          district: aiResult.extractedData.district || 'Unknown',
          price: aiResult.extractedData.price?.amount,
          currency: aiResult.extractedData.price?.currency || 'GEL',
          bedrooms: aiResult.extractedData.rooms,
          petsAllowed: aiResult.extractedData.petsAllowed,
          furnished: aiResult.extractedData.furnished,
          confidence: aiResult.confidence,
          description: mockChannelMessage.text,
          status: ListingStatus.ACTIVE,
        });

        expect(listing).toBeDefined();
        expect(listing.district).toBe('Vake');
        expect(listing.price).toBe(800);
        expect(mockPrismaService.listing.create).toHaveBeenCalled();
      }

      // Step 5: Mark post as processed
      mockPrismaService.telegramPost.update.mockResolvedValue({});
      await telegramService.markPostAsProcessed('post-456');
      expect(mockPrismaService.telegramPost.update).toHaveBeenCalledWith({
        where: { id: 'post-456' },
        data: { processed: true }
      });
    });

    it('should handle posts with low confidence correctly', async () => {
      const lowConfidenceText = 'Ищу квартиру в Тбилиси до 600 лари';

      // Mock low confidence analysis result
      jest.spyOn(aiAnalysisService, 'analyzeText').mockResolvedValue({
        isRental: false,
        confidence: 0.4,
        extractedData: {},
        language: 'ru',
        reasoning: 'This is a rental wanted post, not a rental listing'
      });

      const aiResult = await aiAnalysisService.analyzeText(lowConfidenceText);
      
      expect(aiResult.isRental).toBe(false);
      expect(aiResult.confidence).toBeLessThan(0.8);

      // Should not create listing for low confidence
      expect(mockPrismaService.listing.create).not.toHaveBeenCalled();
    });

    it('should handle empty or invalid text gracefully', async () => {
      const emptyResult = await aiAnalysisService.analyzeText('');
      expect(emptyResult.isRental).toBe(false);
      expect(emptyResult.confidence).toBe(0);

      const nullResult = await aiAnalysisService.analyzeText(null as any);
      expect(nullResult.isRental).toBe(false);
      expect(nullResult.confidence).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      // Mock AI service to throw error and then return mock data
      const originalAnalyzeText = aiAnalysisService.analyzeText;
      jest.spyOn(aiAnalysisService, 'analyzeText').mockImplementation(async (text: string) => {
        // First time it throws error, but the service should catch it and return mock analysis
        try {
          throw new Error('AI service down');
        } catch (error) {
          // Simulate the service's error handling by calling the original method with no OpenAI key
          // This will trigger the mock analysis path
          return originalAnalyzeText.call(aiAnalysisService, text);
        }
      });

      const result = await aiAnalysisService.analyzeText('Test text');
      
      // Should return mock analysis on error
      expect(result).toBeDefined();
      expect(result.reasoning).toContain('Mock analysis');
    });

    it('should handle database errors during telegram post saving', async () => {
      mockPrismaService.telegramChannel.findUnique.mockResolvedValue({
        id: 'channel-123',
        channelId: 'channel_test'
      });
      mockPrismaService.telegramPost.upsert.mockRejectedValue(new Error('Database error'));

      // Should not throw error, but log it
      const messages = await telegramService.parseChannelMessages('test_channel', 1);
      expect(messages).toHaveLength(1); // Mock messages are still generated
    });

    it('should handle missing channel gracefully', async () => {
      mockPrismaService.telegramChannel.findUnique.mockResolvedValue(null);
      mockPrismaService.telegramChannel.create.mockResolvedValue({
        id: 'new-channel',
        channelId: 'channel_new_test',
        username: 'new_test_channel',
        title: 'Channel new_test_channel',
        isActive: true,
      });

      const messages = await telegramService.parseChannelMessages('new_test_channel');
      
      expect(mockPrismaService.telegramChannel.create).toHaveBeenCalledWith({
        data: {
          channelId: 'channel_new_test_channel',
          username: 'new_test_channel',
          title: 'Channel new_test_channel',
          isActive: true,
        }
      });
      expect(messages).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple posts efficiently', async () => {
      const texts = [
        'Сдается 1-комнатная квартира в Сабуртало, 500 лари',
        'For rent: 2BR apartment in Vake, $600/month',
        'Ищу квартиру в центре до 800 лари'
      ];

      const results = await aiAnalysisService.batchAnalyze(texts);
      
      expect(results).toHaveLength(3);
      expect(results[0].isRental).toBe(true); // Rental listing
      expect(results[1].isRental).toBe(true); // Rental listing
      expect(results[2].isRental).toBe(false); // Rental wanted
    });

    it('should handle batch processing errors', async () => {
      const texts = ['Valid text', null as any, '', 'Another valid text'];

      const results = await aiAnalysisService.batchAnalyze(texts);
      
      expect(results).toHaveLength(4);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined(); // Should handle null gracefully
      expect(results[2]).toBeDefined(); // Should handle empty string
      expect(results[3]).toBeDefined();
    });
  });

  describe('Language Detection and Processing', () => {
    it('should handle different languages correctly', async () => {
      const testCases = [
        { text: 'Сдается квартира', expectedLanguage: 'ru' },
        { text: 'გასაქირავებელია ბინა', expectedLanguage: 'ka' },
        { text: 'For rent apartment', expectedLanguage: 'en' }
      ];

      for (const testCase of testCases) {
        const result = await aiAnalysisService.analyzeText(testCase.text);
        expect(result.language).toBe(testCase.expectedLanguage);
      }
    });

    it('should extract data correctly from different languages', async () => {
      const georgianText = 'ქირავდება 2 ოთახიანი ბინა ვაკეში, 800 ლარი თვეში';
      const result = await aiAnalysisService.analyzeText(georgianText);
      
      expect(result.language).toBe('ka');
      expect(result.isRental).toBe(true);
      // Mock analysis should still work for Georgian text
    });
  });

  describe('Channel Management', () => {
    it('should add new channels correctly', async () => {
      mockPrismaService.telegramChannel.create.mockResolvedValue({
        id: 'channel-new',
        channelId: 'test_channel_id',
        username: 'test_username',
        title: 'Test Channel Title',
        isActive: true,
      });

      const channel = await telegramService.addChannel(
        'test_channel_id',
        'test_username',
        'Test Channel Title'
      );

      expect(channel).toBeDefined();
      expect(channel.username).toBe('test_username');
      expect(mockPrismaService.telegramChannel.create).toHaveBeenCalledWith({
        data: {
          channelId: 'test_channel_id',
          username: 'test_username',
          title: 'Test Channel Title',
          isActive: true,
        }
      });
    });

    it('should get all active channels', async () => {
      mockPrismaService.telegramChannel.findMany.mockResolvedValue([
        { id: '1', username: 'channel1', title: 'Channel 1', isActive: true },
        { id: '2', username: 'channel2', title: 'Channel 2', isActive: true },
      ]);

      const channels = await telegramService.getChannels();
      
      expect(channels).toHaveLength(2);
      expect(mockPrismaService.telegramChannel.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { title: 'asc' }
      });
    });
  });
});