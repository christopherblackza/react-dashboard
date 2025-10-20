-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients policies
CREATE POLICY "Authenticated users can view clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers and admins can insert clients" ON clients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers and admins can update clients" ON clients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete clients" ON clients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Projects policies
CREATE POLICY "Authenticated users can view projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers and admins can insert projects" ON projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers and admins can update projects" ON projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete projects" ON projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tasks policies
CREATE POLICY "Users can view tasks in their projects or assigned to them" ON tasks
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            assigned_to = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'manager')
            )
        )
    );

CREATE POLICY "Managers and admins can insert tasks" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can update their assigned tasks, managers and admins can update all" ON tasks
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete tasks" ON tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Invoices policies
CREATE POLICY "Authenticated users can view invoices" ON invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers and admins can insert invoices" ON invoices
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Managers and admins can update invoices" ON invoices
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete invoices" ON invoices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications for any user" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT ON clients TO authenticated;
GRANT INSERT, UPDATE ON clients TO authenticated;
GRANT DELETE ON clients TO authenticated;
GRANT SELECT ON projects TO authenticated;
GRANT INSERT, UPDATE ON projects TO authenticated;
GRANT DELETE ON projects TO authenticated;
GRANT SELECT ON tasks TO authenticated;
GRANT INSERT, UPDATE ON tasks TO authenticated;
GRANT DELETE ON tasks TO authenticated;
GRANT SELECT ON invoices TO authenticated;
GRANT INSERT, UPDATE ON invoices TO authenticated;
GRANT DELETE ON invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- Grant basic read access to anon users (for public pages)
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON clients TO anon;
GRANT SELECT ON projects TO anon;