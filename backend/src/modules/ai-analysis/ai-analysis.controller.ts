import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AiAnalysisService } from './ai-analysis.service'

@ApiTags('ai-analysis')
@Controller('ai-analysis')
export class AiAnalysisController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze text for rental information' })
  @ApiResponse({ status: 200, description: 'Analysis result' })
  async analyzeText(@Body() body: { text: string }) {
    return this.aiAnalysisService.analyzeText(body.text)
  }

  @Post('batch-analyze')
  @ApiOperation({ summary: 'Analyze multiple texts in batch' })
  @ApiResponse({ status: 200, description: 'Batch analysis results' })
  async batchAnalyze(@Body() body: { texts: string[] }) {
    return this.aiAnalysisService.batchAnalyze(body.texts)
  }
}