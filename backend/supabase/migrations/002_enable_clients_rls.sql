-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON clients TO authenticated;
GRANT SELECT ON clients TO anon;

-- Create RLS policies for clients table
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (created_by = auth.uid());