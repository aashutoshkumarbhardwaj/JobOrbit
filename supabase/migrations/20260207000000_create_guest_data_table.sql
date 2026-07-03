-- Create guest_data table for temporary guest user data migration

CREATE TABLE IF NOT EXISTS public.guest_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stored as JSONB for flexibility
  resumes JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  applications JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  migrated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for guest_data
CREATE INDEX idx_guest_data_user_id ON guest_data(user_id);

-- Enable RLS on guest_data
ALTER TABLE public.guest_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "guest_data_select_policy" ON public.guest_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "guest_data_insert_policy" ON public.guest_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "guest_data_update_policy" ON public.guest_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "guest_data_delete_policy" ON public.guest_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_guest_data_updated_at 
  BEFORE UPDATE ON public.guest_data 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
