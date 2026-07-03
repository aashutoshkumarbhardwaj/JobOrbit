-- Create user_settings table for storing user preferences

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- UI Preferences
  theme VARCHAR(50) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Feature Toggles
  notifications_enabled BOOLEAN DEFAULT TRUE,
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  extension_enabled BOOLEAN DEFAULT FALSE,
  dark_mode_enabled BOOLEAN DEFAULT FALSE,
  
  -- Extension Preferences
  extension_auto_capture BOOLEAN DEFAULT TRUE,
  extension_notifications BOOLEAN DEFAULT TRUE,
  
  -- AI Preferences
  ai_suggestions_enabled BOOLEAN DEFAULT TRUE,
  ai_language_level VARCHAR(20) DEFAULT 'professional',
  
  -- OAuth Providers
  oauth_providers JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_settings
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "user_settings_select_policy" ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_policy" ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_policy" ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_delete_policy" ON public.user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON public.user_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create settings on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create settings
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_settings();
