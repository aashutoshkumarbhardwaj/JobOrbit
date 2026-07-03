-- Create ai_answers table for storing AI-generated interview answers

CREATE TABLE IF NOT EXISTS public.ai_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  difficulty_level VARCHAR(20),
  estimated_delivery_seconds INT,
  
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ai_answers
CREATE INDEX idx_ai_answers_user_id ON ai_answers(user_id);
CREATE INDEX idx_ai_answers_category ON ai_answers(user_id, category);
CREATE INDEX idx_ai_answers_favorite ON ai_answers(user_id, is_favorite);

-- Enable RLS on ai_answers
ALTER TABLE public.ai_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "ai_answers_select_policy" ON public.ai_answers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_answers_insert_policy" ON public.ai_answers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_answers_update_policy" ON public.ai_answers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_answers_delete_policy" ON public.ai_answers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_answers_updated_at 
  BEFORE UPDATE ON public.ai_answers 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
