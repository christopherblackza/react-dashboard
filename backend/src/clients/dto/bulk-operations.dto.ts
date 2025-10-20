import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum BulkOperationType {
  DELETE = 'delete',
  UPDATE_STATUS = 'update_status',
  EXPORT = 'export',
}

export class BulkOperationDto {
  @ApiProperty({
    description: 'Array of client IDs to perform bulk operation on',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({
    description: 'Type of bulk operation to perform',
    enum: BulkOperationType,
    example: BulkOperationType.DELETE,
  })
  @IsEnum(BulkOperationType)
  operation: BulkOperationType;

  @ApiProperty({
    description: 'Additional data for the operation (e.g., new status for update_status)',
    required: false,
    example: { status: 'active' },
  })
  @IsOptional()
  data?: Record<string, any>;
}

export class BulkOperationResponseDto {
  @ApiProperty({
    description: 'Number of successfully processed items',
    example: 3,
  })
  success: number;

  @ApiProperty({
    description: 'Number of failed items',
    example: 0,
  })
  failed: number;

  @ApiProperty({
    description: 'Array of error messages for failed operations',
    example: [],
  })
  errors: string[];

  @ApiProperty({
    description: 'Details of the operation performed',
    example: { operation: 'delete', totalRequested: 3 },
  })
  details: Record<string, any>;
}