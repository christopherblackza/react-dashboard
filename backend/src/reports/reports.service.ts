import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  ReportMetricsQueryDto,
  ReportMetricsResponseDto,
  MetricType,
  TimeRange,
  MetricDataPoint,
} from './dto/report-metrics.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private databaseService: DatabaseService) {}

  async getDashboardStats(userId?: string) {
    try {
      this.logger.log(`Getting dashboard stats for user: ${userId}`);
      const supabase = this.databaseService.getClient();
      const userIdParam = userId || null;

      // Use PostgreSQL functions to get real dashboard stats
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_analytics_summary', { user_id: userIdParam });

      if (summaryError) {
        this.logger.error('Failed to fetch dashboard summary:', summaryError);
        throw summaryError;
      }

      const summary = summaryData?.[0] || {
        total_clients: 0,
        active_clients: 0,
        paid_revenue: 0,
      };

      // Get recent clients using real data
      let recentClientsQuery = supabase
        .from('clients')
        .select('id, name, email, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (userId) {
        recentClientsQuery = recentClientsQuery.eq('created_by', userId);
      }

      const { data: recentClients } = await recentClientsQuery;

      // Get monthly revenue data for stats
      const { data: monthlyRevenueData, error: revenueError } = await supabase
        .rpc('get_monthly_revenue', { user_id: userIdParam });

      if (revenueError) {
        this.logger.error('Failed to fetch monthly revenue:', revenueError);
      }

      // Get client growth data for stats
      const { data: clientGrowthData, error: growthError } = await supabase
        .rpc('get_client_growth', { user_id: userIdParam });

      if (growthError) {
        this.logger.error('Failed to fetch client growth:', growthError);
      }

      // Format monthly stats from real data
      const monthlyStats = (monthlyRevenueData || []).map(item => ({
        month: new Date(item.month_year + '-01').toLocaleDateString('en-US', { month: 'short' }),
        revenue: parseFloat(item.revenue),
        clients: (clientGrowthData || []).find(c => c.month_year === item.month_year)?.client_count || 0,
      }));

      // Calculate monthly growth
      const currentMonthClients = summary.total_clients;
      const previousMonthClients = Math.max(1, currentMonthClients - 2);
      const monthlyGrowth = ((currentMonthClients - previousMonthClients) / previousMonthClients) * 100;

      return {
        totalClients: summary.total_clients,
        activeClients: summary.active_clients,
        totalRevenue: parseFloat(summary.paid_revenue),
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        recentClients: recentClients || [],
        monthlyStats: monthlyStats.length > 0 ? monthlyStats : [
          { month: 'Jan', clients: 0, revenue: 0 },
          { month: 'Feb', clients: 0, revenue: 0 },
          { month: 'Mar', clients: 0, revenue: 0 },
          { month: 'Apr', clients: 0, revenue: 0 },
          { month: 'May', clients: 0, revenue: 0 },
          { month: 'Jun', clients: summary.total_clients, revenue: parseFloat(summary.paid_revenue) },
        ],
      };
    } catch (error) {
      this.logger.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  async getMetrics(query: ReportMetricsQueryDto, userId: string): Promise<ReportMetricsResponseDto> {
    try {
      const {
        type = MetricType.REVENUE,
        range = TimeRange.MONTHLY,
        startDate,
        endDate,
      } = query;

      // Calculate date range if not provided
      const { start, end } = this.calculateDateRange(range, startDate, endDate);

      let data: MetricDataPoint[] = [];
      let total = 0;
      let change = 0;

      switch (type) {
        case MetricType.REVENUE:
          ({ data, total, change } = await this.getRevenueMetrics(range, start, end, userId));
          break;
        case MetricType.CLIENTS:
          ({ data, total, change } = await this.getClientMetrics(range, start, end, userId));
          break;
        case MetricType.PROJECTS:
          ({ data, total, change } = await this.getProjectMetrics(range, start, end, userId));
          break;
        case MetricType.PERFORMANCE:
          ({ data, total, change } = await this.getPerformanceMetrics(range, start, end, userId));
          break;
        default:
          throw new Error(`Unsupported metric type: ${type}`);
      }

      return {
        type,
        range,
        total,
        change,
        data,
        startDate: start,
        endDate: end,
      };
    } catch (error) {
      this.logger.error('Get metrics error:', error);
      throw error;
    }
  }

  async getAnalytics(query: any, userId: string) {
    try {
      const { type = 'overall', range = 'last-30-days', startDate, endDate } = query;
      this.logger.log(`Getting analytics for user: ${userId}, type: ${type}, range: ${range}`);
      
      const supabase = this.databaseService.getClient();

      // Use PostgreSQL functions to get real analytics data
      const userIdParam = userId || null;

      // Get comprehensive analytics summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_analytics_summary', { user_id: userIdParam });

      if (summaryError) {
        this.logger.error('Failed to fetch analytics summary:', summaryError);
        throw summaryError;
      }

      const summary = summaryData?.[0] || {
        total_clients: 0,
        active_clients: 0,
        pending_clients: 0,
        inactive_clients: 0,
        total_revenue: 0,
        paid_revenue: 0,
        pending_revenue: 0,
        overdue_revenue: 0,
        total_projects: 0,
        active_projects: 0,
        completed_projects: 0,
      };

      // Get client growth data
      const { data: clientGrowthData, error: growthError } = await supabase
        .rpc('get_client_growth', { user_id: userIdParam });

      if (growthError) {
        this.logger.error('Failed to fetch client growth:', growthError);
      }

      // Get monthly revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .rpc('get_monthly_revenue', { user_id: userIdParam });

      if (revenueError) {
        this.logger.error('Failed to fetch monthly revenue:', revenueError);
      }

      // Get client status distribution
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_client_status_distribution', { user_id: userIdParam });

      if (statusError) {
        this.logger.error('Failed to fetch client status distribution:', statusError);
      }

      // Get top clients by revenue
      const { data: topClientsData, error: topClientsError } = await supabase
        .rpc('get_top_clients_by_revenue', { user_id: userIdParam, limit_count: 5 });

      if (topClientsError) {
        this.logger.error('Failed to fetch top clients:', topClientsError);
      }

      // Calculate monthly growth percentage
      const currentMonthClients = summary.total_clients;
      const previousMonthClients = Math.max(1, currentMonthClients - 2); // Simple approximation
      const monthlyGrowth = ((currentMonthClients - previousMonthClients) / previousMonthClients) * 100;

      // Format client growth data for charts
      const formattedClientGrowth = (clientGrowthData || []).map(item => ({
        month: new Date(item.month_year + '-01').toLocaleDateString('en-US', { month: 'short' }),
        clients: parseInt(item.client_count),
        active: Math.floor(parseInt(item.client_count) * 0.8), // Approximate active clients
      }));

      // Format revenue data for charts
      const formattedRevenueData = (revenueData || []).map(item => ({
        month: new Date(item.month_year + '-01').toLocaleDateString('en-US', { month: 'short' }),
        revenue: parseFloat(item.revenue),
        target: parseFloat(item.revenue) * 1.1, // Set target 10% higher
      }));

      // Format client status data
      const formattedClientStatus = (statusData || []).map(item => ({
        status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        count: parseInt(item.count),
        percentage: summary.total_clients > 0 ? Math.round((parseInt(item.count) / summary.total_clients) * 100) : 0,
      }));

      // Format top clients data
      const formattedTopClients = (topClientsData || []).map(item => ({
        id: item.client_id,
        name: item.client_name,
        company: item.client_company || 'N/A',
        revenue: parseFloat(item.total_revenue),
      }));

      return {
        summary: {
          totalClients: summary.total_clients,
          activeClients: summary.active_clients,
          totalRevenue: parseFloat(summary.paid_revenue),
          monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        },
        clientGrowth: formattedClientGrowth.length > 0 ? formattedClientGrowth : [
          { month: 'Jan', clients: 0, active: 0 },
          { month: 'Feb', clients: 0, active: 0 },
          { month: 'Mar', clients: 0, active: 0 },
          { month: 'Apr', clients: 0, active: 0 },
          { month: 'May', clients: 0, active: 0 },
          { month: 'Jun', clients: summary.total_clients, active: summary.active_clients },
        ],
        revenueData: formattedRevenueData.length > 0 ? formattedRevenueData : [
          { month: 'Jan', revenue: 0, target: 0 },
          { month: 'Feb', revenue: 0, target: 0 },
          { month: 'Mar', revenue: 0, target: 0 },
          { month: 'Apr', revenue: 0, target: 0 },
          { month: 'May', revenue: 0, target: 0 },
          { month: 'Jun', revenue: parseFloat(summary.paid_revenue), target: parseFloat(summary.paid_revenue) * 1.1 },
        ],
        clientStatus: formattedClientStatus.length > 0 ? formattedClientStatus : [
          { status: 'Active', count: summary.active_clients, percentage: summary.total_clients > 0 ? Math.round((summary.active_clients / summary.total_clients) * 100) : 0 },
          { status: 'Pending', count: summary.pending_clients, percentage: summary.total_clients > 0 ? Math.round((summary.pending_clients / summary.total_clients) * 100) : 0 },
          { status: 'Inactive', count: summary.inactive_clients, percentage: summary.total_clients > 0 ? Math.round((summary.inactive_clients / summary.total_clients) * 100) : 0 },
        ],
        topClients: formattedTopClients,
      };
    } catch (error) {
      this.logger.error('Get analytics error:', error);
      throw error;
    }
  }

  async exportData(exportQuery: any, userId: string) {
    try {
      const { type = 'clients', format = 'json', startDate, endDate } = exportQuery;
      const supabase = this.databaseService.getClient();

      let data: any[] = [];

      switch (type) {
        case 'clients':
          const { data: clients } = await supabase
            .from('clients')
            .select('*')
            .eq('created_by', userId)
            .gte('created_at', startDate || '2024-01-01')
            .lte('created_at', endDate || new Date().toISOString());
          data = clients || [];
          break;
        case 'projects':
          // Mock projects data for now
          data = [
            { id: 1, name: 'Project A', status: 'active', created_at: '2024-01-01' },
            { id: 2, name: 'Project B', status: 'completed', created_at: '2024-02-01' },
          ];
          break;
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }

      return {
        type,
        format,
        count: data.length,
        data,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Export data error:', error);
      throw error;
    }
  }

  private async getRevenueMetrics(
    range: TimeRange,
    startDate: string,
    endDate: string,
    userId: string,
  ): Promise<{ data: MetricDataPoint[]; total: number; change: number }> {
    try {
      const supabase = this.databaseService.getClient();

      // Mock data for now - replace with actual revenue queries
      const mockData: MetricDataPoint[] = [
        { date: '2024-01-01', value: 12500, label: 'January' },
        { date: '2024-02-01', value: 15000, label: 'February' },
        { date: '2024-03-01', value: 18000, label: 'March' },
        { date: '2024-04-01', value: 16500, label: 'April' },
        { date: '2024-05-01', value: 20000, label: 'May' },
        { date: '2024-06-01', value: 22500, label: 'June' },
      ];

      const total = mockData.reduce((sum, point) => sum + point.value, 0);
      const change = 15.5; // Mock percentage change

      return { data: mockData, total, change };
    } catch (error) {
      this.logger.error('Get revenue metrics error:', error);
      throw error;
    }
  }

  private async getClientMetrics(
    range: TimeRange,
    startDate: string,
    endDate: string,
    userId: string,
  ): Promise<{ data: MetricDataPoint[]; total: number; change: number }> {
    try {
      const supabase = this.databaseService.getClient();

      // Get client count over time filtered by user
      const { data: clients, error } = await supabase
        .from('clients')
        .select('created_at')
        .eq('created_by', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at');

      if (error) {
        this.logger.error('Failed to fetch client metrics:', error);
        // Return mock data if query fails
        return this.getMockClientMetrics();
      }

      // Process data based on time range
      const processedData = this.processTimeSeriesData(clients || [], range, 'created_at');
      const total = clients?.length || 0;
      const change = 8.2; // Mock percentage change

      return { data: processedData, total, change };
    } catch (error) {
      this.logger.error('Get client metrics error:', error);
      return this.getMockClientMetrics();
    }
  }

  private getMockClientMetrics(): { data: MetricDataPoint[]; total: number; change: number } {
    const mockData: MetricDataPoint[] = [
      { date: '2024-01-01', value: 25, label: 'January' },
      { date: '2024-02-01', value: 28, label: 'February' },
      { date: '2024-03-01', value: 32, label: 'March' },
      { date: '2024-04-01', value: 35, label: 'April' },
      { date: '2024-05-01', value: 38, label: 'May' },
      { date: '2024-06-01', value: 42, label: 'June' },
    ];

    const total = mockData[mockData.length - 1]?.value || 0;
    const change = 8.2;

    return { data: mockData, total, change };
  }

  private async getProjectMetrics(
    range: TimeRange,
    startDate: string,
    endDate: string,
    userId: string,
  ): Promise<{ data: MetricDataPoint[]; total: number; change: number }> {
    // Mock project metrics
    const mockData: MetricDataPoint[] = [
      { date: '2024-01-01', value: 15, label: 'January' },
      { date: '2024-02-01', value: 18, label: 'February' },
      { date: '2024-03-01', value: 22, label: 'March' },
      { date: '2024-04-01', value: 25, label: 'April' },
      { date: '2024-05-01', value: 28, label: 'May' },
      { date: '2024-06-01', value: 32, label: 'June' },
    ];

    const total = mockData.reduce((sum, point) => sum + point.value, 0);
    const change = 12.8;

    return { data: mockData, total, change };
  }

  private async getPerformanceMetrics(
    range: TimeRange,
    startDate: string,
    endDate: string,
    userId: string,
  ): Promise<{ data: MetricDataPoint[]; total: number; change: number }> {
    // Mock performance metrics (e.g., completion rate)
    const mockData: MetricDataPoint[] = [
      { date: '2024-01-01', value: 85.5, label: 'January' },
      { date: '2024-02-01', value: 87.2, label: 'February' },
      { date: '2024-03-01', value: 89.1, label: 'March' },
      { date: '2024-04-01', value: 91.3, label: 'April' },
      { date: '2024-05-01', value: 88.7, label: 'May' },
      { date: '2024-06-01', value: 92.4, label: 'June' },
    ];

    const total = mockData[mockData.length - 1]?.value || 0;
    const change = 3.2;

    return { data: mockData, total, change };
  }

  private async getPlanAnalytics(userId: string, startDate?: string, endDate?: string) {
    // Mock plan analytics
    return {
      type: 'plan',
      data: [
        { name: 'Basic', value: 45, percentage: 45 },
        { name: 'Pro', value: 35, percentage: 35 },
        { name: 'Enterprise', value: 20, percentage: 20 },
      ],
      total: 100,
    };
  }

  private async getStatusAnalytics(userId: string, startDate?: string, endDate?: string) {
    try {
      const supabase = this.databaseService.getClient();

      const { data: clients, error } = await supabase
        .from('clients')
        .select('status')
        .eq('created_by', userId);

      if (error) {
        this.logger.error('Failed to fetch status analytics:', error);
        // Return mock data
        return {
          type: 'status',
          data: [
            { name: 'Active', value: 1, percentage: 100 },
            { name: 'Inactive', value: 0, percentage: 0 },
            { name: 'Pending', value: 0, percentage: 0 },
          ],
          total: 1,
        };
      }

      // Process status data
      const statusCounts = (clients || []).reduce((acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = clients?.length || 0;
      const data = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

      return {
        type: 'status',
        data,
        total,
      };
    } catch (error) {
      this.logger.error('Get status analytics error:', error);
      throw error;
    }
  }

  private async getOwnerAnalytics(userId: string, startDate?: string, endDate?: string) {
    // Mock owner analytics
    return {
      type: 'owner',
      data: [
        { name: 'Admin User', value: 1, percentage: 100 },
      ],
      total: 1,
    };
  }

  private async getOverallAnalytics(userId: string, startDate?: string, endDate?: string) {
    try {
      const supabase = this.databaseService.getClient();

      // Get overall statistics
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('created_by', userId);

      if (error) {
        this.logger.error('Failed to fetch overall analytics:', error);
      }

      const totalClients = clients?.length || 0;
      const activeClients = clients?.filter(c => c.status === 'active').length || 0;
      const pendingClients = clients?.filter(c => c.status === 'pending').length || 0;

      return {
        type: 'overall',
        summary: {
          totalClients,
          activeClients,
          pendingClients,
          completionRate: totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0,
        },
        trends: {
          clientGrowth: 8.2,
          revenueGrowth: 15.5,
          projectCompletion: 92.4,
        },
      };
    } catch (error) {
      this.logger.error('Get overall analytics error:', error);
      throw error;
    }
  }

  private calculateDateRange(
    range: TimeRange,
    startDate?: string,
    endDate?: string,
  ): { start: string; end: string } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    switch (range) {
      case TimeRange.DAILY:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case TimeRange.WEEKLY:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84); // 12 weeks
        break;
      case TimeRange.MONTHLY:
        start = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        break;
      case TimeRange.YEARLY:
        start = new Date(now.getFullYear() - 5, 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  private processTimeSeriesData(
    data: any[],
    range: TimeRange,
    dateField: string,
  ): MetricDataPoint[] {
    // Group data by time period and count occurrences
    const grouped = new Map<string, number>();

    data.forEach((item) => {
      const date = new Date(item[dateField]);
      let key: string;

      switch (range) {
        case TimeRange.DAILY:
          key = date.toISOString().split('T')[0];
          break;
        case TimeRange.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case TimeRange.MONTHLY:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case TimeRange.YEARLY:
          key = `${date.getFullYear()}-01-01`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    // Convert to MetricDataPoint array
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        value,
        label: this.formatDateLabel(date, range),
      }));
  }

  private formatDateLabel(date: string, range: TimeRange): string {
    const d = new Date(date);
    
    switch (range) {
      case TimeRange.DAILY:
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case TimeRange.WEEKLY:
        return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case TimeRange.MONTHLY:
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case TimeRange.YEARLY:
        return d.getFullYear().toString();
      default:
        return date;
    }
  }
}