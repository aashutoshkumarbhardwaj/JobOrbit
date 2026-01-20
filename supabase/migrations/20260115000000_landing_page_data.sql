-- Create landing_stats table for dynamic statistics
CREATE TABLE public.landing_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_key TEXT NOT NULL UNIQUE,
  stat_value TEXT NOT NULL,
  stat_label TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_company TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read access for landing page)
ALTER TABLE public.landing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can view landing stats" ON public.landing_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can view testimonials" ON public.testimonials FOR SELECT USING (is_featured = true);

-- Insert default statistics
INSERT INTO public.landing_stats (stat_key, stat_value, stat_label, display_order) VALUES
  ('active_users', '10k+', 'Active users', 1),
  ('jobs_tracked', '250k+', 'Jobs tracked', 2),
  ('success_rate', '85%', 'Success rate', 3);

-- Insert default testimonials
INSERT INTO public.testimonials (quote, author_name, author_role, author_company, rating, display_order) VALUES
  ('JobTracker made my search so much easier. Got 3 offers in 2 months!', 'Sarah Chen', 'Product Designer', 'Google', 5, 1),
  ('Finally, a tracker that doesn''t feel like work. Love the clean interface.', 'Mike Johnson', 'Software Engineer', 'Apple', 5, 2),
  ('The analytics helped me understand what was working. Game changer!', 'Emily Davis', 'UX Researcher', 'Netflix', 5, 3);

-- Triggers for updated_at
CREATE TRIGGER update_landing_stats_updated_at 
  BEFORE UPDATE ON public.landing_stats 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at 
  BEFORE UPDATE ON public.testimonials 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
