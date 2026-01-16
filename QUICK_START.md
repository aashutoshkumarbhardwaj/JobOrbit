# 🚀 Quick Start Guide

## Your Supabase is Ready!

✅ Environment variables configured
✅ TypeScript types updated
✅ React hooks created
✅ Landing page updated
✅ Build successful

## Next: Apply Database Migrations

### 1. Go to Supabase Dashboard

Visit: https://supabase.com/dashboard/project/dsbkjkwefszqqzukgdtk/editor

### 2. Run Migration #1 (Core Tables)

1. Click **SQL Editor** in left sidebar
2. Click **New Query**
3. Copy this SQL:

```sql
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create jobs table for job applications
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('to_apply', 'applied', 'interviewing', 'offer', 'rejected')),
  location TEXT,
  salary TEXT,
  applied_date DATE DEFAULT CURRENT_DATE,
  interview_date DATE,
  notes TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Users can view their own jobs" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

4. Click **Run** (bottom right)
5. Should see "Success. No rows returned"

### 3. Run Migration #2 (Landing Page Tables)

1. Click **New Query** again
2. Copy this SQL:

```sql
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
```

3. Click **Run**
4. Should see "Success. No rows returned"

### 4. Verify Tables

1. Click **Table Editor** in left sidebar
2. You should see:
   - ✅ profiles
   - ✅ jobs
   - ✅ landing_stats (with 3 rows)
   - ✅ testimonials (with 3 rows)

### 5. Test the App

```bash
npm run dev
```

Visit http://localhost:5173

You should see:
- ✅ Landing page loads
- ✅ "10k+ Active users"
- ✅ "250k+ Jobs tracked"
- ✅ "85% Success rate"
- ✅ 3 testimonial cards
- ✅ No errors in console

## 🎉 Done!

Your app is now connected to Supabase with dynamic data!

## 📝 Quick Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Update Data

Go to Supabase Dashboard > Table Editor:

1. Click `landing_stats` table
2. Click any row to edit
3. Change `stat_value` (e.g., "15k+")
4. Click Save
5. Refresh your app (wait 5 min for cache or hard refresh)

Same for `testimonials` table!

## ❓ Issues?

See `SUPABASE_SETUP_COMPLETE.md` for detailed troubleshooting.
