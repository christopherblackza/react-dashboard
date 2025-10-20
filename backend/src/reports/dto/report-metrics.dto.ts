import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum MetricType {
  REVENUE = 'revenue',
  CLIENTS = 'clients',
  PROJECTS = 'projects',
  PERFORMANCE = 'performance',
}

export enum TimeRange {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class ReportMetricsQueryDto {
  @ApiProperty({
    description: 'Metric type to retrieve',
    enum: MetricType,
    example: MetricType.REVENUE,
    required: false,
  })
  @IsEnum(MetricType)
  @IsOptional()
  type?: MetricType;

  @ApiProperty({
    description: 'Time range for metrics',
    enum: TimeRange,
    example: TimeRange.MONTHLY,
    required: false,
  })
  @IsEnum(TimeRange)
  @IsOptional()
  range?: TimeRange;

  @ApiProperty({
    description: 'Start date for metrics (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for metrics (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class MetricDataPoint {
  @ApiProperty({
    description: 'Date for this data point',
    example: '2024-01-01',
  })
  date: string;

  @ApiProperty({
    description: 'Value for this data point',
    example: 1250.50,
  })
  value: number;

  @ApiProperty({
    description: 'Label for this data point',
    example: 'January Revenue',
    required: false,
  })
  label?: string;
}

export class ReportMetricsResponseDto {
  @ApiProperty({
    description: 'Metric type',
    enum: MetricType,
    example: MetricType.REVENUE,
  })
  type: MetricType;

  @ApiProperty({
    description: 'Time range',
    enum: TimeRange,
    example: TimeRange.MONTHLY,
  })
  range: TimeRange;

  @ApiProperty({
    description: 'Total value for the period',
    example: 15000.75,
  })
  total: number;

  @ApiProperty({
    description: 'Percentage change from previous period',
    example: 12.5,
  })
  change: number;

  @ApiProperty({
    description: 'Data points for the metric',
    type: [MetricDataPoint],
  })
  data: MetricDataPoint[];

  @ApiProperty({
    description: 'Start date of the report',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of the report',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate: string;
}