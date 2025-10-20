import { ApiProperty } from '@nestjs/swagger';

export class ClientActivityResponseDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Client ID' })
  client_id: string;

  @ApiProperty({ description: 'Activity type' })
  type: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'User who performed the activity' })
  user_name?: string;

  @ApiProperty({ description: 'User ID who performed the activity' })
  user_id?: string;

  @ApiProperty({ description: 'Activity metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;
}