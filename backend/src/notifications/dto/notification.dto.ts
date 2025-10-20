import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'New Client Added',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'A new client "Acme Corp" has been added to your account.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Notification type',
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.INFO;

  @ApiPropertyOptional({
    description: 'Target user ID (if not provided, uses current user)',
    example: 'user-uuid',
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: 'Whether the notification is read',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  read?: boolean;
}

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: 'notification-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'New Client Added',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'A new client "Acme Corp" has been added to your account.',
  })
  message: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.INFO,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Whether the notification is read',
    example: false,
  })
  read: boolean;

  @ApiProperty({
    description: 'User ID who owns this notification',
    example: 'user-uuid',
  })
  user_id: string;

  @ApiProperty({
    description: 'When the notification was created',
    example: '2024-01-15T10:30:00Z',
  })
  created_at: string;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Show only unread notifications',
    example: false,
    default: false,
  })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  unread_only?: boolean = false;
}