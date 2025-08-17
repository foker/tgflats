import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import axios from 'axios'
import { createHash } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { AiCostTrackingService } from './ai-cost-tracking.service'

export interface AiAnalysisResult {
  isRental: boolean
  confidence: number
  extractedData: {
    price?: { amount: number; currency: string }
    priceRange?: { min: number; max: number; currency: string }
    area?: number
    rooms?: number
    district?: string
    address?: string
    contactInfo?: string
    amenities?: string[]
    petsAllowed?: boolean
    furnished?: boolean
  }
  language: 'ka' | 'ru' | 'en'
  reasoning?: string
}

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name)
  private openai: OpenAI | null = null
  private openrouterApiKey: string | null = null
  private readonly OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

  constructor(
    private configService: ConfigService,
    private costTrackingService: AiCostTrackingService,
    private prisma: PrismaService,
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY')
    const openrouterKey = this.configService.get<string>('OPENROUTER_API_KEY')
    
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey })
    }
    
    if (openrouterKey) {
      this.openrouterApiKey = openrouterKey
      this.logger.log('OpenRouter API configured for DeepSeek')
    }
    
    if (!openaiKey && !openrouterKey) {
      this.logger.warn('No AI API keys provided, AI analysis will use mock data')
    }
  }

  /**
   * Analyze text to extract rental information
   */
  async analyzeText(text: string, useDeepSeek: boolean = true): Promise<AiAnalysisResult> {
    if (!text || text.trim().length === 0) {
      return this.createEmptyResult()
    }

    // Check cache first
    const cached = await this.getCachedAnalysis(text)
    if (cached) {
      this.logger.log('Using cached AI analysis result')
      return cached
    }

    let result: AiAnalysisResult
    let provider = 'mock'
    let model = 'mock'

    // Try DeepSeek first if available and requested
    if (useDeepSeek && this.openrouterApiKey) {
      try {
        result = await this.analyzeWithDeepSeek(text)
        provider = 'deepseek'
        model = 'deepseek-chat'
      } catch (error) {
        this.logger.error(`DeepSeek analysis failed, falling back: ${error.message}`)
      }
    }

    // Fall back to OpenAI if available
    if (!result && this.openai) {
      result = await this.analyzeWithOpenAI(text)
      provider = 'openai'
      model = 'gpt-3.5-turbo'
    }

    // If no AI keys, return mock analysis
    if (!result) {
      result = this.generateMockAnalysis(text)
    }

    // Cache the result
    await this.cacheAnalysis(text, result, provider, model)

    return result
  }

  /**
   * Analyze text using DeepSeek through OpenRouter
   */
  private async analyzeWithDeepSeek(text: string): Promise<AiAnalysisResult> {

    try {
      const prompt = this.createDeepSeekPrompt(text)
      const model = 'deepseek/deepseek-chat'
      
      const response = await axios.post<{
        choices: Array<{ message: { content: string } }>
        usage?: { prompt_tokens: number; completion_tokens: number }
        id: string
      }>(
        `${this.OPENROUTER_BASE_URL}/chat/completions`,
        {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing real estate rental listings in Tbilisi, Georgia. You understand Georgian, Russian, and English languages. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://tbi-prop.com',
            'X-Title': 'TBI-Prop Real Estate Platform',
          }
        }
      )

      const content = response.data.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from DeepSeek')
      }

      // Track usage
      const usage = response.data.usage
      if (usage) {
        await this.costTrackingService.trackUsage({
          provider: 'openrouter',
          model: 'deepseek-chat',
          inputTokens: usage.prompt_tokens || 0,
          outputTokens: usage.completion_tokens || 0,
          requestId: response.data.id,
          metadata: {
            purpose: 'rental_analysis',
            textLength: text.length,
          }
        })
      }

      return this.parseAiResponse(content, text)
    } catch (error) {
      this.logger.error(`DeepSeek analysis failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Analyze text using OpenAI
   */
  private async analyzeWithOpenAI(text: string): Promise<AiAnalysisResult> {
    try {
      // Check spending limits before making API call
      const limits = await this.costTrackingService.checkSpendingLimits()
      if (limits.isOverLimit) {
        this.logger.warn(`AI spending limit exceeded, using mock analysis: ${limits.message}`)
        return this.generateMockAnalysis(text)
      }

      const prompt = this.createAnalysisPrompt(text)
      const model = 'gpt-3.5-turbo'
      
      // Count input tokens
      const messages: any[] = [
        {
          role: 'system',
          content: 'You are an expert at analyzing real estate rental listings in Tbilisi, Georgia. You understand Georgian, Russian, and English languages.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
      
      const inputTokens = this.costTrackingService.countMessagesTokens(messages)
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
        max_tokens: 1000,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      // Track API usage
      const outputTokens = completion.usage?.completion_tokens || this.costTrackingService.countTokens(response)
      const totalInputTokens = completion.usage?.prompt_tokens || inputTokens
      
      await this.costTrackingService.trackUsage({
        provider: 'openai',
        model,
        inputTokens: totalInputTokens,
        outputTokens,
        requestId: completion.id,
        metadata: {
          purpose: 'rental_analysis',
          textLength: text.length,
        }
      })

      return this.parseAiResponse(response, text)
    } catch (error) {
      this.logger.error(`AI analysis failed: ${error.message}`)
      return this.generateMockAnalysis(text)
    }
  }

  /**
   * Create analysis prompt for DeepSeek (optimized for better extraction)
   */
  private createDeepSeekPrompt(text: string): string {
    return `
Analyze this Tbilisi real estate listing and extract ALL information.

Text: "${text}"

Extract and return a JSON with this EXACT structure:
{
  "isRental": true/false,
  "confidence": 0.0-1.0,
  "extractedData": {
    "price": {"amount": number, "currency": "GEL"|"USD"|"EUR"},
    "priceRange": {"min": number, "max": number, "currency": string},
    "area": number_in_sqm,
    "rooms": number,
    "district": "Vake"|"Saburtalo"|"Old Tbilisi"|"Gldani"|"Isani"|"Didube"|"Nadzaladevi"|"Mtatsminda"|"Krtsanisi"|"Samgori"|"other",
    "address": "exact_address_if_mentioned",
    "contactInfo": "phone_or_contact",
    "amenities": ["list", "of", "amenities"],
    "petsAllowed": true/false/null,
    "furnished": true/false/null
  },
  "language": "ka"|"ru"|"en",
  "reasoning": "brief_explanation"
}

Key patterns to recognize:
- Georgian: გასაქირავებელია, ქირავდება, ლარი, ოთახი, კვადრატი
- Russian: сдается, сдаю, аренда, комната, квадрат, лари, доллар
- English: for rent, rental, bedroom, room, sqm, GEL, USD

Phone formats: +995XXXXXXXXX, 995XXXXXXXXX, 5XXXXXXXX

IMPORTANT: 
- Extract price even if approximate
- Identify district from any location mentions
- List ALL amenities mentioned (мебель/furniture/ავეჯი, животные/pets/ცხოველები, etc.)
- Be conservative with isRental - only true if clearly a rental listing
`
  }

  /**
   * Create analysis prompt for OpenAI
   */
  private createAnalysisPrompt(text: string): string {
    return `
Analyze the following text and determine if it's a rental listing for property in Tbilisi, Georgia.

Text to analyze:
"${text}"

Please respond with a JSON object containing:
{
  "isRental": boolean (true if this is clearly a rental listing),
  "confidence": number (0-1, how confident you are),
  "extractedData": {
    "price": { "amount": number, "currency": string } (if single price),
    "priceRange": { "min": number, "max": number, "currency": string } (if price range),
    "area": number (square meters),
    "rooms": number (number of bedrooms/rooms),
    "district": string (Tbilisi district name in English),
    "address": string (specific address if mentioned),
    "contactInfo": string (phone number or contact),
    "amenities": string[] (list of amenities mentioned),
    "petsAllowed": boolean (if pets are allowed),
    "furnished": boolean (if furnished/with furniture)
  },
  "language": string ("ka" for Georgian, "ru" for Russian, "en" for English),
  "reasoning": string (brief explanation of your decision)
}

Important notes:
- Common Georgian/Russian words: 
  - "გასაქირავებელია" / "сдается" / "for rent" = rental
  - "ლარი" / "лари" = GEL currency
  - "დოლარი" / "доллар" = USD currency
  - "ოთახი" / "комната" / "room" = room
  - "კვადრატი" / "квадрат" / "sqm" = square meters
- Tbilisi districts: Vake, Saburtalo, Old Tbilisi, Rustavi, Gldani, Isani, etc.
- Be conservative - only mark as rental if clearly indicated
- Extract all available information even if confidence is low
`
  }

  /**
   * Parse AI response to structured result
   */
  private parseAiResponse(response: string, originalText: string): AiAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and normalize the response
      return {
        isRental: Boolean(parsed.isRental),
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0)),
        extractedData: {
          price: parsed.extractedData?.price || undefined,
          priceRange: parsed.extractedData?.priceRange || undefined,
          area: parsed.extractedData?.area || undefined,
          rooms: parsed.extractedData?.rooms || undefined,
          district: parsed.extractedData?.district || undefined,
          address: parsed.extractedData?.address || undefined,
          contactInfo: parsed.extractedData?.contactInfo || undefined,
          amenities: Array.isArray(parsed.extractedData?.amenities) 
            ? parsed.extractedData.amenities 
            : [],
          petsAllowed: parsed.extractedData?.petsAllowed || undefined,
          furnished: parsed.extractedData?.furnished || undefined,
        },
        language: parsed.language || this.detectLanguage(originalText),
        reasoning: parsed.reasoning || 'AI analysis completed',
      }
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`)
      return this.generateMockAnalysis(originalText)
    }
  }

  /**
   * Generate mock analysis for testing purposes
   */
  private generateMockAnalysis(text: string): AiAnalysisResult {
    const isRental = this.simpleRentalDetection(text)
    const language = this.detectLanguage(text)
    
    let extractedData: any = {}
    
    if (isRental) {
      // Simple extraction patterns
      const priceMatch = text.match(/(\d+)\s*(лари|лар|ლარი|dollar|USD|\$)/i)
      const roomsMatch = text.match(/(\d+)[\s-]*(комн|ком|room|bedroom|ოთახ)/i)
      const areaMatch = text.match(/(\d+)\s*(кв|sqm|м2|კვადრატ)/i)
      const phoneMatch = text.match(/\+?995\s?\d{3}\s?\d{3}\s?\d{3}/g)
      
      if (priceMatch) {
        extractedData.price = {
          amount: parseInt(priceMatch[1]),
          currency: priceMatch[2].toLowerCase().includes('doll') || priceMatch[2].includes('$') ? 'USD' : 'GEL'
        }
      }
      
      if (roomsMatch) {
        extractedData.rooms = parseInt(roomsMatch[1])
      }
      
      if (areaMatch) {
        extractedData.area = parseInt(areaMatch[1])
      }
      
      if (phoneMatch) {
        extractedData.contactInfo = phoneMatch[0]
      }

      // Detect amenities
      const amenities = []
      if (text.toLowerCase().includes('мебель') || text.toLowerCase().includes('furnished') || text.toLowerCase().includes('ავეჯი')) {
        amenities.push('furnished')
        extractedData.furnished = true
      }
      if (text.toLowerCase().includes('животн') || text.toLowerCase().includes('pets') || text.toLowerCase().includes('ცხოველ')) {
        amenities.push('pets allowed')
        extractedData.petsAllowed = true
      }
      extractedData.amenities = amenities
    }

    return {
      isRental,
      confidence: isRental ? 0.7 : 0.3,
      extractedData,
      language,
      reasoning: 'Mock analysis based on simple pattern matching'
    }
  }

  /**
   * Simple rental detection for mock analysis
   */
  private simpleRentalDetection(text: string): boolean {
    const rentalKeywords = [
      'сдается', 'сдаю', 'сдам', 'аренда', 'for rent', 'rent',
      'გასაქირავებელია', 'ქირავდება', 'rental'
    ]
    
    const lowerText = text.toLowerCase()
    return rentalKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
  }

  /**
   * Detect text language
   */
  private detectLanguage(text: string): 'ka' | 'ru' | 'en' {
    // Simple language detection based on character sets
    if (/[ა-ჰ]/.test(text)) return 'ka' // Georgian
    if (/[а-я]/.test(text)) return 'ru' // Russian
    return 'en' // Default to English
  }

  /**
   * Create empty result for invalid input
   */
  private createEmptyResult(): AiAnalysisResult {
    return {
      isRental: false,
      confidence: 0,
      extractedData: {},
      language: 'en',
      reasoning: 'Empty or invalid text'
    }
  }

  /**
   * Get cached AI analysis result
   */
  private async getCachedAnalysis(text: string): Promise<AiAnalysisResult | null> {
    try {
      const textHash = this.hashText(text)
      const cached = await this.prisma.aiAnalysisCache.findFirst({
        where: {
          textHash,
          expiresAt: { gt: new Date() },
        },
      })

      if (cached) {
        // Update lastUsedAt
        await this.prisma.aiAnalysisCache.update({
          where: { id: cached.id },
          data: { lastUsedAt: new Date() },
        })

        return {
          isRental: cached.isRental,
          confidence: cached.confidence,
          extractedData: cached.extractedData as any,
          language: cached.language as 'ka' | 'ru' | 'en',
          reasoning: cached.reasoning,
        }
      }

      return null
    } catch (error) {
      this.logger.error(`Failed to get cached analysis: ${error.message}`)
      return null
    }
  }

  /**
   * Cache AI analysis result
   */
  private async cacheAnalysis(
    text: string,
    result: AiAnalysisResult,
    provider: string,
    model: string,
  ): Promise<void> {
    try {
      const textHash = this.hashText(text)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days cache

      await this.prisma.aiAnalysisCache.upsert({
        where: { textHash },
        create: {
          textHash,
          isRental: result.isRental,
          confidence: result.confidence,
          extractedData: result.extractedData,
          language: result.language,
          reasoning: result.reasoning,
          provider,
          model,
          expiresAt,
        },
        update: {
          isRental: result.isRental,
          confidence: result.confidence,
          extractedData: result.extractedData,
          language: result.language,
          reasoning: result.reasoning,
          provider,
          model,
          lastUsedAt: new Date(),
          expiresAt,
        },
      })
    } catch (error) {
      this.logger.error(`Failed to cache analysis: ${error.message}`)
    }
  }

  /**
   * Generate SHA256 hash of text for caching
   */
  private hashText(text: string): string {
    return createHash('sha256').update(text.trim().toLowerCase()).digest('hex')
  }

  /**
   * Batch analyze multiple texts
   */
  async batchAnalyze(texts: string[]): Promise<AiAnalysisResult[]> {
    const results = await Promise.allSettled(
      texts.map(text => this.analyzeText(text))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        this.logger.error(`Batch analysis failed for text ${index}: ${result.reason}`)
        return this.createEmptyResult()
      }
    })
  }
}