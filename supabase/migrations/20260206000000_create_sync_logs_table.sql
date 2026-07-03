-- Create sync_logs table for audit trail of syncs

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sync Details
  source VARCHAR(50) NOT NULL CHECK (source IN ('web', 'extension', 'api')),
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'fetch')),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('profile', 'resume', 'application', 'answer', 'setting')),
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  
  -- Performance
  sync_duration_ms INT,
  
  -- Context
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sync_logs
CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);
CREATE INDEX idx_sync_logs_user_created ON sync_logs(user_id, created_at DESC);

-- Enable RLS on sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "sync_logs_select_policy" ON public.sync_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sync_logs_insert_policy" ON public.sync_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sync_logs_delete_policy" ON public.sync_logs
  FOR DELETE
  USING (auth.uid() = user_id);
