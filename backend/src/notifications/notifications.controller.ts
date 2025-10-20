import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  UpdateNotificationDto,
  NotificationQueryDto,
} from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unread_only', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    type: [NotificationResponseDto],
  })
  async getNotifications(
    @Query() query: NotificationQueryDto,
    @Request() req
  ): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    unread_count: number;
  }> {
    const userId = req.user?.id;
    return this.notificationsService.getNotifications(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a notification' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req
  ): Promise<NotificationResponseDto> {
    const userId = req.user?.id;
    return this.notificationsService.createNotification(createNotificationDto, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  async markAsRead(
    @Param('id') id: string,
    @Request() req
  ): Promise<NotificationResponseDto> {
    const userId = req.user?.id;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch(':id/unread')
  @ApiOperation({ summary: 'Mark notification as unread' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as unread',
    type: NotificationResponseDto,
  })
  async markAsUnread(
    @Param('id') id: string,
    @Request() req
  ): Promise<NotificationResponseDto> {
    const userId = req.user?.id;
    return this.notificationsService.markAsUnread(id, userId);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Request() req): Promise<{ message: string; count: number }> {
    const userId = req.user?.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully',
  })
  async deleteNotification(
    @Param('id') id: string,
    @Request() req
  ): Promise<{ message: string }> {
    const userId = req.user?.id;
    return this.notificationsService.deleteNotification(id, userId);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all read notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Read notifications deleted successfully',
  })
  async deleteAllRead(@Request() req): Promise<{ message: string; count: number }> {
    const userId = req.user?.id;
    return this.notificationsService.deleteAllRead(userId);
  }
}