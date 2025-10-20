import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationQueryDto,
  NotificationType,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getNotifications(
    userId: string,
    query: NotificationQueryDto
  ): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    unread_count: number;
  }> {
    const { page = 1, limit = 20, unread_only = false } = query;
    const offset = (page - 1) * limit;

    // Build the query
    let notificationsQuery = this.databaseService.getClient()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unread_only) {
      notificationsQuery = notificationsQuery.eq('read', false);
    }

    // Get paginated notifications
    const { data: notifications, error: notificationsError } = await notificationsQuery
      .range(offset, offset + limit - 1);

    if (notificationsError) {
      throw new Error(`Failed to fetch notifications: ${notificationsError.message}`);
    }

    // Get total count
    let countQuery = this.databaseService.getClient()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (unread_only) {
      countQuery = countQuery.eq('read', false);
    }

    const { count: total, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Failed to count notifications: ${countError.message}`);
    }

    // Get unread count
    const { count: unread_count, error: unreadError } = await this.databaseService.getClient()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (unreadError) {
      throw new Error(`Failed to count unread notifications: ${unreadError.message}`);
    }

    return {
      notifications: notifications || [],
      total: total || 0,
      unread_count: unread_count || 0,
    };
  }

  async createNotification(
    createNotificationDto: CreateNotificationDto,
    currentUserId: string
  ): Promise<NotificationResponseDto> {
    const { title, message, type = NotificationType.INFO, user_id } = createNotificationDto;
    
    // Use provided user_id or default to current user
    const targetUserId = user_id || currentUserId;

    const { data: notification, error } = await this.databaseService.getClient()
      .from('notifications')
      .insert({
        title,
        message,
        type,
        user_id: targetUserId,
        read: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<NotificationResponseDto> {
    // First check if notification exists and belongs to user
    const { data: existingNotification, error: fetchError } = await this.databaseService.getClient()
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    const { data: notification, error } = await this.databaseService.getClient()
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return notification;
  }

  async markAsUnread(id: string, userId: string): Promise<NotificationResponseDto> {
    // First check if notification exists and belongs to user
    const { data: existingNotification, error: fetchError } = await this.databaseService.getClient()
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    const { data: notification, error } = await this.databaseService.getClient()
      .from('notifications')
      .update({ read: false })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as unread: ${error.message}`);
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ message: string; count: number }> {
    const { data, error } = await this.databaseService.getClient()
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .select();

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }

    return {
      message: 'All notifications marked as read',
      count: data?.length || 0,
    };
  }

  async deleteNotification(id: string, userId: string): Promise<{ message: string }> {
    // First check if notification exists and belongs to user
    const { data: existingNotification, error: fetchError } = await this.databaseService.getClient()
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    const { error } = await this.databaseService.getClient()
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    return { message: 'Notification deleted successfully' };
  }

  async deleteAllRead(userId: string): Promise<{ message: string; count: number }> {
    const { data, error } = await this.databaseService.getClient()
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true)
      .select();

    if (error) {
      throw new Error(`Failed to delete read notifications: ${error.message}`);
    }

    return {
      message: 'All read notifications deleted',
      count: data?.length || 0,
    };
  }

  // Helper method to create system notifications
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO
  ): Promise<NotificationResponseDto> {
    return this.createNotification(
      {
        title,
        message,
        type,
        user_id: userId,
      },
      userId
    );
  }
}