-- Create resumes table for storing user resume files

CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(50),
  file_hash VARCHAR(64) UNIQUE,
  
  is_default BOOLEAN DEFAULT FALSE,
  preview_text TEXT,
  ats_score INT,
  
  version INT DEFAULT 1,
  previous_version_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_default_per_user UNIQUE(user_id, is_default) WHERE is_default = TRUE
);

-- Create indexes for resumes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_is_default ON resumes(user_id, is_default);

-- Enable RLS on resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "resumes_select_policy" ON public.resumes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "resumes_insert_policy" ON public.resumes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_update_policy" ON public.resumes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_delete_policy" ON public.resumes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_resumes_updated_at 
  BEFORE UPDATE ON public.resumes 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
