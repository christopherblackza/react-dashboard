-- Analytics Functions for Dashboard
-- This migration creates PostgreSQL functions to calculate various analytics metrics

-- Function to get total clients count
CREATE OR REPLACE FUNCTION get_total_clients(user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN (SELECT COUNT(*) FROM clients);
    ELSE
        RETURN (SELECT COUNT(*) FROM clients WHERE created_by = user_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get active clients count
CREATE OR REPLACE FUNCTION get_active_clients(user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN (SELECT COUNT(*) FROM clients WHERE status = 'active');
    ELSE
        RETURN (SELECT COUNT(*) FROM clients WHERE status = 'active' AND created_by = user_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending clients count
CREATE OR REPLACE FUNCTION get_pending_clients(user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN (SELECT COUNT(*) FROM clients WHERE status = 'pending');
    ELSE
        RETURN (SELECT COUNT(*) FROM clients WHERE status = 'pending' AND created_by = user_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get inactive clients count
CREATE OR REPLACE FUNCTION get_inactive_clients(user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN (SELECT COUNT(*) FROM clients WHERE status = 'inactive');
    ELSE
        RETURN (SELECT COUNT(*) FROM clients WHERE status = 'inactive' AND created_by = user_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get client growth over time (last 12 months)
CREATE OR REPLACE FUNCTION get_client_growth(user_id UUID DEFAULT NULL)
RETURNS TABLE(month_year TEXT, client_count BIGINT) AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(DATE_TRUNC('month', c.created_at), 'YYYY-MM') as month_year,
            COUNT(*) as client_count
        FROM clients c
        WHERE c.created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', c.created_at)
        ORDER BY DATE_TRUNC('month', c.created_at);
    ELSE
        RETURN QUERY
        SELECT 
            TO_CHAR(DATE_TRUNC('month', c.created_at), 'YYYY-MM') as month_year,
            COUNT(*) as client_count
        FROM clients c
        WHERE c.created_at >= CURRENT_DATE - INTERVAL '12 months'
        AND c.created_by = user_id
        GROUP BY DATE_TRUNC('month', c.created_at)
        ORDER BY DATE_TRUNC('month', c.created_at);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get revenue data from invoices
CREATE OR REPLACE FUNCTION get_revenue_data(user_id UUID DEFAULT NULL)
RETURNS TABLE(
    total_revenue NUMERIC,
    paid_revenue NUMERIC,
    pending_revenue NUMERIC,
    overdue_revenue NUMERIC
) AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN QUERY
        SELECT 
            COALESCE(SUM(i.amount), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as paid_revenue,
            COALESCE(SUM(CASE WHEN i.status = 'sent' THEN i.amount ELSE 0 END), 0) as pending_revenue,
            COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.amount ELSE 0 END), 0) as overdue_revenue
        FROM invoices i;
    ELSE
        RETURN QUERY
        SELECT 
            COALESCE(SUM(i.amount), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as paid_revenue,
            COALESCE(SUM(CASE WHEN i.status = 'sent' THEN i.amount ELSE 0 END), 0) as pending_revenue,
            COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.amount ELSE 0 END), 0) as overdue_revenue
        FROM invoices i
        WHERE i.created_by = user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly revenue trend (last 12 months)
CREATE OR REPLACE FUNCTION get_monthly_revenue(user_id UUID DEFAULT NULL)
RETURNS TABLE(month_year TEXT, revenue NUMERIC) AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(DATE_TRUNC('month', i.created_at), 'YYYY-MM') as month_year,
            COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as revenue
        FROM invoices i
        WHERE i.created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', i.created_at)
        ORDER BY DATE_TRUNC('month', i.created_at);
    ELSE
        RETURN QUERY
        SELECT 
            TO_CHAR(DATE_TRUNC('month', i.created_at), 'YYYY-MM') as month_year,
            COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as revenue
        FROM invoices i
        WHERE i.created_at >= CURRENT_DATE - INTERVAL '12 months'
        AND i.created_by = user_id
        GROUP BY DATE_TRUNC('month', i.created_at)
        ORDER BY DATE_TRUNC('month', i.created_at);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get client status distribution
CREATE OR REPLACE FUNCTION get_client_status_distribution(user_id UUID DEFAULT NULL)
RETURNS TABLE(status client_status, count BIGINT) AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN QUERY
        SELECT 
            c.status,
            COUNT(*) as count
        FROM clients c
        GROUP BY c.status
        ORDER BY c.status;
    ELSE
        RETURN QUERY
        SELECT 
            c.status,
            COUNT(*) as count
        FROM clients c
        WHERE c.created_by = user_id
        GROUP BY c.status
        ORDER BY c.status;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get top clients by revenue
CREATE OR REPLACE FUNCTION get_top_clients_by_revenue(user_id UUID DEFAULT NULL, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
    client_id UUID,
    client_name TEXT,
    client_company TEXT,
    total_revenue NUMERIC,
    invoice_count BIGINT
) AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN QUERY
        SELECT 
            c.id as client_id,
            c.name as client_name,
            c.company as client_company,
            COALESCE(SUM(i.amount), 0) as total_revenue,
            COUNT(i.id) as invoice_count
        FROM clients c
        LEFT JOIN invoices i ON c.id = i.client_id AND i.status = 'paid'
        GROUP BY c.id, c.name, c.company
        ORDER BY total_revenue DESC
        LIMIT limit_count;
    ELSE
        RETURN QUERY
        SELECT 
            c.id as client_id,
            c.name as client_name,
            c.company as client_company,
            COALESCE(SUM(i.amount), 0) as total_revenue,
            COUNT(i.id) as invoice_count
        FROM clients c
        LEFT JOIN invoices i ON c.id = i.client_id AND i.status = 'paid' AND i.created_by = user_id
        WHERE c.created_by = user_id
        GROUP BY c.id, c.name, c.company
        ORDER BY total_revenue DESC
        LIMIT limit_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get project statistics
CREATE OR REPLACE FUNCTION get_project_stats(user_id UUID DEFAULT NULL)
RETURNS TABLE(
    total_projects BIGINT,
    active_projects BIGINT,
    completed_projects BIGINT,
    total_budget NUMERIC
) AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN QUERY
        SELECT 
            COUNT(*) as total_projects,
            COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_projects,
            COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects,
            COALESCE(SUM(p.budget), 0) as total_budget
        FROM projects p;
    ELSE
        RETURN QUERY
        SELECT 
            COUNT(*) as total_projects,
            COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_projects,
            COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects,
            COALESCE(SUM(p.budget), 0) as total_budget
        FROM projects p
        WHERE p.created_by = user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(user_id UUID DEFAULT NULL)
RETURNS TABLE(
    total_clients INTEGER,
    active_clients INTEGER,
    pending_clients INTEGER,
    inactive_clients INTEGER,
    total_revenue NUMERIC,
    paid_revenue NUMERIC,
    pending_revenue NUMERIC,
    overdue_revenue NUMERIC,
    total_projects BIGINT,
    active_projects BIGINT,
    completed_projects BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        get_total_clients(user_id),
        get_active_clients(user_id),
        get_pending_clients(user_id),
        get_inactive_clients(user_id),
        r.total_revenue,
        r.paid_revenue,
        r.pending_revenue,
        r.overdue_revenue,
        p.total_projects,
        p.active_projects,
        p.completed_projects
    FROM get_revenue_data(user_id) r,
         get_project_stats(user_id) p;
END;
$$ LANGUAGE plpgsql;