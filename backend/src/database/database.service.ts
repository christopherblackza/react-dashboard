import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('database.supabaseUrl');
    const supabaseAnonKey = this.configService.get<string>('database.supabaseAnonKey');
    const supabaseServiceRoleKey = this.configService.get<string>('database.supabaseServiceRoleKey');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Client for user operations
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client for service operations
    if (supabaseServiceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    this.logger.log('Database service initialized');
  }

  // Convenience getters for table access
  get client(): any {
    return this.supabase.from('clients');
  }

  get clientNote(): any {
    return this.supabase.from('client_notes');
  }

  get clientActivity(): any {
    return this.supabase.from('client_activity');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    if (!this.supabaseAdmin) {
      throw new Error('Admin client not configured');
    }
    return this.supabaseAdmin;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.from('clients').select('count').limit(1);
      if (error) {
        this.logger.error('Database connection test failed:', error);
        return false;
      }
      this.logger.log('Database connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Database connection test failed:', error);
      return false;
    }
  }
}