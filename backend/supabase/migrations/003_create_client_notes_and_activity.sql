-- Create client_notes table
CREATE TABLE client_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_id UUID NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_activity table
CREATE TABLE client_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX idx_client_notes_created_at ON client_notes(created_at DESC);
CREATE INDEX idx_client_activity_client_id ON client_activity(client_id);
CREATE INDEX idx_client_activity_created_at ON client_activity(created_at DESC);
CREATE INDEX idx_client_activity_type ON client_activity(type);

-- Enable RLS on client_notes table
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users for client_notes
GRANT ALL PRIVILEGES ON client_notes TO authenticated;
GRANT SELECT ON client_notes TO anon;

-- Create RLS policies for client_notes table
CREATE POLICY "Users can view notes for their own clients" ON client_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_notes.client_id 
      AND clients.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes for their own clients" ON client_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_notes.client_id 
      AND clients.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notes" ON client_notes
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own notes" ON client_notes
  FOR DELETE USING (author_id = auth.uid());

-- Enable RLS on client_activity table
ALTER TABLE client_activity ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users for client_activity
GRANT ALL PRIVILEGES ON client_activity TO authenticated;
GRANT SELECT ON client_activity TO anon;

-- Create RLS policies for client_activity table
CREATE POLICY "Users can view activity for their own clients" ON client_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_activity.client_id 
      AND clients.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity for their own clients" ON client_activity
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_activity.client_id 
      AND clients.created_by = auth.uid()
    )
  );

-- Create trigger to update updated_at on client_notes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_notes_updated_at 
  BEFORE UPDATE ON client_notes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();