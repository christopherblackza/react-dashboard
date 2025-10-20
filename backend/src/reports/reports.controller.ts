import { Controller, Get, Query, UseGuards, Request, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  ReportMetricsQueryDto,
  ReportMetricsResponseDto,
  MetricType,
  TimeRange,
} from './dto/report-metrics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(@Request() req) {
    return this.reportsService.getDashboardStats(req.user?.id);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get report metrics' })
  @ApiQuery({
    name: 'type',
    enum: MetricType,
    required: false,
    description: 'Type of metric to retrieve',
  })
  @ApiQuery({
    name: 'range',
    enum: TimeRange,
    required: false,
    description: 'Time range for the metrics',
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
    description: 'End date (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    type: ReportMetricsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async getMetrics(@Query() query: ReportMetricsQueryDto, @Request() req): Promise<ReportMetricsResponseDto> {
    return this.reportsService.getMetrics(query, req.user.id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiQuery({
    name: 'range',
    type: String,
    required: false,
    description: 'Date range for analytics',
  })
  @ApiQuery({
    name: 'type',
    type: String,
    required: false,
    description: 'Type of analytics to retrieve',
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
    description: 'End date (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
  })
  async getAnalytics(@Query() query: any, @Request() req) {
    return this.reportsService.getAnalytics(query, req.user?.id || null);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export report data' })
  @ApiResponse({
    status: 200,
    description: 'Export data generated successfully',
  })
  async exportData(@Body() exportQuery: any, @Request() req) {
    return this.reportsService.exportData(exportQuery, req.user.id);
  }
}