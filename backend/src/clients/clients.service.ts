import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { PaginatedClientsDto } from './dto/paginated-clients.dto';
import { BulkOperationDto, BulkOperationResponseDto, BulkOperationType } from './dto/bulk-operations.dto';
import { CreateClientNoteDto, ClientNoteResponseDto } from './dto/client-note.dto';
import { ClientActivityResponseDto } from './dto/client-activity.dto';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private databaseService: DatabaseService) {}

  async create(createClientDto: CreateClientDto, userId: string): Promise<ClientResponseDto> {
    try {
      const supabase = this.databaseService.getClient();
      
      const clientData = {
        ...createClientDto,
        created_by: userId,
      };
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to create client:', error);
        throw new Error('Failed to create client');
      }

      return data;
    } catch (error) {
      this.logger.error('Create client error:', error);
      throw error;
    }
  }

  async findAll(userId?: string, query?: QueryClientsDto): Promise<PaginatedClientsDto> {
    try {
      this.logger.log(`Finding clients for user: ${userId || 'ALL'}`);
      this.logger.log(`Query parameters:`, query);
      
      const supabase = this.databaseService.getAdminClient();
      
      // Build the base query - let's first get ALL clients to see what's in the database
      let queryBuilder = supabase
        .from('clients')
        .select('*', { count: 'exact' });

      this.logger.log(`Base query built (no user filter initially)`);

      // Apply user filter only if userId is provided
      if (userId) {
        queryBuilder = queryBuilder.eq('created_by', userId);
        this.logger.log(`Applied user filter for: ${userId}`);
      }

      // Apply search filter
      if (query?.search) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query.search}%,email.ilike.%${query.search}%,company.ilike.%${query.search}%`
        );
        this.logger.log(`Applied search filter: ${query.search}`);
      }

      // Apply status filter
      if (query?.status) {
        queryBuilder = queryBuilder.eq('status', query.status);
        this.logger.log(`Applied status filter: ${query.status}`);
      }

      // Apply sorting
      const sortBy = query?.sortBy || 'created_at';
      const sortOrder = query?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
      queryBuilder = queryBuilder.order(sortBy, sortOrder);
      this.logger.log(`Applied sorting: ${sortBy} ${sortOrder.ascending ? 'ASC' : 'DESC'}`);

      // Apply pagination
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const offset = (page - 1) * limit;
      
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);
      this.logger.log(`Applied pagination: page ${page}, limit ${limit}, offset ${offset}`);

      const { data, error, count } = await queryBuilder;

      this.logger.log(`Query executed. Count: ${count}, Data length: ${data?.length || 0}`);
      if (error) {
        this.logger.error('Supabase query error:', error);
      }
      if (data) {
        this.logger.log('Sample data:', data.slice(0, 2));
      }

      if (error) {
        this.logger.error('Failed to fetch clients:', error);
        throw new Error('Failed to fetch clients');
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      const result = {
        data: data || [],
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      this.logger.log(`Returning result:`, {
        dataCount: result.data.length,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });

      return result;
    } catch (error) {
      this.logger.error('Find all clients error:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async findAllSimple(userId: string): Promise<ClientResponseDto[]> {
    const result = await this.findAll(userId);
    return result.data;
  }

  async findOne(id: string, userId: string): Promise<ClientResponseDto> {
    try {
      const supabase = this.databaseService.getClient();
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('created_by', userId)
        .single();

      if (error || !data) {
        this.logger.error('Client not found:', error);
        throw new NotFoundException('Client not found');
      }

      return data;
    } catch (error) {
      this.logger.error('Find client error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to fetch client');
    }
  }

  async update(id: string, updateClientDto: UpdateClientDto, userId: string): Promise<ClientResponseDto> {
    try {
      const supabase = this.databaseService.getClient();
      
      const { data, error } = await supabase
        .from('clients')
        .update(updateClientDto)
        .eq('id', id)
        .eq('created_by', userId)
        .select()
        .single();

      if (error || !data) {
        this.logger.error('Failed to update client:', error);
        throw new NotFoundException('Client not found');
      }

      return data;
    } catch (error) {
      this.logger.error('Update client error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to update client');
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const supabase = this.databaseService.getClient();
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('created_by', userId);

      if (error) {
        this.logger.error('Failed to delete client:', error);
        throw new NotFoundException('Client not found');
      }
    } catch (error) {
      this.logger.error('Delete client error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to delete client');
    }
  }

  async getClientStats(userId: string): Promise<any> {
    try {
      const supabase = this.databaseService.getClient();
      
      const { data, error } = await supabase
        .from('clients')
        .select('status')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Failed to fetch client stats:', error);
        throw new Error('Failed to fetch client stats');
      }

      const stats = {
        total: data?.length || 0,
        active: data?.filter(client => client.status === 'active').length || 0,
        inactive: data?.filter(client => client.status === 'inactive').length || 0,
        pending: data?.filter(client => client.status === 'pending').length || 0,
      };

      return stats;
    } catch (error) {
      this.logger.error('Get client stats error:', error);
      throw error;
    }
  }

  async bulkOperation(bulkOperationDto: BulkOperationDto, userId: string): Promise<BulkOperationResponseDto> {
    try {
      const { ids, operation, data } = bulkOperationDto;
      const supabase = this.databaseService.getClient();

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      switch (operation) {
        case BulkOperationType.DELETE:
          try {
            const { error } = await supabase
              .from('clients')
              .delete()
              .in('id', ids)
              .eq('created_by', userId);

            if (error) {
              this.logger.error('Bulk delete error:', error);
              failed = ids.length;
              errors.push(`Failed to delete clients: ${error.message}`);
            } else {
              success = ids.length;
            }
          } catch (error) {
            this.logger.error('Bulk delete error:', error);
            failed = ids.length;
            errors.push(`Failed to delete clients: ${error.message}`);
          }
          break;

        case BulkOperationType.UPDATE_STATUS:
          if (!data?.status) {
            throw new Error('Status is required for update_status operation');
          }

          try {
            const { error } = await supabase
              .from('clients')
              .update({ status: data.status, updated_at: new Date().toISOString() })
              .in('id', ids)
              .eq('created_by', userId);

            if (error) {
              this.logger.error('Bulk update status error:', error);
              failed = ids.length;
              errors.push(`Failed to update client status: ${error.message}`);
            } else {
              success = ids.length;
            }
          } catch (error) {
            this.logger.error('Bulk update status error:', error);
            failed = ids.length;
            errors.push(`Failed to update client status: ${error.message}`);
          }
          break;

        case BulkOperationType.EXPORT:
          try {
            const { data: clients, error } = await supabase
              .from('clients')
              .select('*')
              .in('id', ids)
              .eq('created_by', userId);

            if (error) {
              this.logger.error('Bulk export error:', error);
              failed = ids.length;
              errors.push(`Failed to export clients: ${error.message}`);
            } else {
              success = clients?.length || 0;
              // In a real implementation, you might want to return the exported data
              // or save it to a file and return a download link
            }
          } catch (error) {
            this.logger.error('Bulk export error:', error);
            failed = ids.length;
            errors.push(`Failed to export clients: ${error.message}`);
          }
          break;

        default:
          throw new Error(`Unsupported bulk operation: ${operation}`);
      }

      return {
        success,
        failed,
        errors,
        details: {
          operation,
          totalRequested: ids.length,
          data: operation === BulkOperationType.EXPORT ? data : undefined,
        },
      };
    } catch (error) {
      this.logger.error('Bulk operation error:', error);
      throw error;
    }
  }

  // Client Notes methods
  async getClientNotes(clientId: string, userId: string): Promise<ClientNoteResponseDto[]> {
    try {
      const supabase = this.databaseService.getClient();
      
      // First verify the client exists and belongs to the user
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('created_by', userId)
        .single();

      if (clientError || !client) {
        throw new NotFoundException('Client not found');
      }

      const { data: notes, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Error fetching client notes:', error);
        throw new Error('Failed to fetch client notes');
      }

      return (notes || []).map(note => ({
        id: note.id,
        client_id: note.client_id,
        body: note.body,
        author_id: note.author_id,
        author_name: note.author_name,
        created_at: note.created_at,
        updated_at: note.updated_at,
      }));
    } catch (error) {
      this.logger.error('Error fetching client notes:', error);
      throw error;
    }
  }

  async addClientNote(
    clientId: string,
    createNoteDto: CreateClientNoteDto,
    userId: string,
    userName: string
  ): Promise<ClientNoteResponseDto> {
    try {
      const supabase = this.databaseService.getClient();
      
      // First verify the client exists and belongs to the user
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('created_by', userId)
        .single();

      if (clientError || !client) {
        throw new NotFoundException('Client not found');
      }

      const { data: note, error } = await supabase
        .from('client_notes')
        .insert({
          client_id: clientId,
          body: createNoteDto.body,
          author_id: userId,
          author_name: userName,
        })
        .select()
        .single();

      if (error || !note) {
        this.logger.error('Error adding client note:', error);
        throw new Error('Failed to add client note');
      }

      // Log activity
      await this.logClientActivity(
        clientId,
        'note_added',
        `Note added: ${createNoteDto.body.substring(0, 50)}${createNoteDto.body.length > 50 ? '...' : ''}`,
        userId,
        userName
      );

      return {
        id: note.id,
        client_id: note.client_id,
        body: note.body,
        author_id: note.author_id,
        author_name: note.author_name,
        created_at: note.created_at,
        updated_at: note.updated_at,
      };
    } catch (error) {
      this.logger.error('Error adding client note:', error);
      throw error;
    }
  }

  // Client Activity methods
  async getClientActivity(clientId: string, userId: string): Promise<ClientActivityResponseDto[]> {
    try {
      const supabase = this.databaseService.getClient();
      
      // First verify the client exists and belongs to the user
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('created_by', userId)
        .single();

      if (clientError || !client) {
        throw new NotFoundException('Client not found');
      }

      const { data: activities, error } = await supabase
        .from('client_activity')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        this.logger.error('Error fetching client activity:', error);
        throw new Error('Failed to fetch client activity');
      }

      return (activities || []).map(activity => ({
        id: activity.id,
        client_id: activity.client_id,
        type: activity.type,
        description: activity.description,
        user_name: activity.user_name,
        user_id: activity.user_id,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
        created_at: activity.created_at,
      }));
    } catch (error) {
      this.logger.error('Error fetching client activity:', error);
      throw error;
    }
  }

  private async logClientActivity(
    clientId: string,
    type: string,
    description: string,
    userId: string,
    userName: string,
    metadata?: any
  ): Promise<void> {
    try {
      const supabase = this.databaseService.getClient();
      
      const { error } = await supabase
        .from('client_activity')
        .insert({
          client_id: clientId,
          type,
          description,
          user_id: userId,
          user_name: userName,
          metadata: metadata ? JSON.stringify(metadata) : null,
        });

      if (error) {
        this.logger.error('Error logging client activity:', error);
      }
    } catch (error) {
      this.logger.error('Error logging client activity:', error);
      // Don't throw error here to avoid breaking the main operation
    }
  }
}