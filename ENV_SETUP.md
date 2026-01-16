# Environment Setup Guide

## Supabase Configuration

Your `.env` file is already configured with Supabase credentials:

```env
VITE_SUPABASE_PROJECT_ID="idlwpzouxgmqhexjdefc"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://idlwpzouxgmqhexjdefc.supabase.co"
```

## Database Setup

### 1. Run Migrations

Apply the database migrations to create the necessary tables:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard > SQL Editor
```

### 2. Database Schema

The following tables are created:

#### `profiles` Table
- User profile information
- Linked to auth.users

#### `jobs` Table
- Job application tracking
- Fields: company, role, status, location, salary, dates, notes
- Status options: to_apply, applied, interviewing, offer, rejected

#### `landing_stats` Table (NEW)
- Dynamic statistics for landing page
- Fields: stat_key, stat_value, stat_label, display_order
- Public read access (no authentication required)

#### `testimonials` Table (NEW)
- User testimonials for landing page
- Fields: quote, author_name, author_role, author_company, rating
- Public read access for featured testimonials

### 3. Default Data

The migration automatically inserts default data:

**Landing Stats:**
- Active users: 10k+
- Jobs tracked: 250k+
- Success rate: 85%

**Testimonials:**
- Sarah Chen (Google)
- Mike Johnson (Apple)
- Emily Davis (Netflix)

## Dynamic Data Features

### Landing Page
- ✅ Statistics fetched from `landing_stats` table
- ✅ Testimonials fetched from `testimonials` table
- ✅ Cached for 5 minutes for performance
- ✅ Loading states with skeleton UI

### Dashboard
- ✅ User-specific job statistics
- ✅ Real-time data from `jobs` table
- ✅ Cached for 1 minute

## Updating Landing Page Data

### Update Statistics

```sql
-- Update active users count
UPDATE landing_stats 
SET stat_value = '15k+' 
WHERE stat_key = 'active_users';

-- Update jobs tracked
UPDATE landing_stats 
SET stat_value = '300k+' 
WHERE stat_key = 'jobs_tracked';

-- Update success rate
UPDATE landing_stats 
SET stat_value = '90%' 
WHERE stat_key = 'success_rate';
```

### Add New Testimonial

```sql
INSERT INTO testimonials (
  quote, 
  author_name, 
  author_role, 
  author_company, 
  rating, 
  is_featured, 
  display_order
) VALUES (
  'Amazing tool! Helped me land my dream job in 6 weeks.',
  'John Doe',
  'Senior Engineer',
  'Microsoft',
  5,
  true,
  4
);
```

### Hide/Show Testimonials

```sql
-- Hide a testimonial
UPDATE testimonials 
SET is_featured = false 
WHERE id = 'testimonial-id';

-- Show a testimonial
UPDATE testimonials 
SET is_featured = true 
WHERE id = 'testimonial-id';
```

### Reorder Items

```sql
-- Change display order
UPDATE landing_stats 
SET display_order = 1 
WHERE stat_key = 'success_rate';

UPDATE testimonials 
SET display_order = 1 
WHERE author_name = 'John Doe';
```

## API Hooks

### `useLandingStats()`
Fetches landing page statistics from Supabase.

```typescript
const { data: stats, isLoading } = useLandingStats();
```

### `useTestimonials()`
Fetches featured testimonials from Supabase.

```typescript
const { data: testimonials, isLoading } = useTestimonials();
```

### `useJobStats(userId)`
Fetches user-specific job statistics.

```typescript
const { data: stats } = useJobStats(user?.id);
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

- **landing_stats**: Public read access
- **testimonials**: Public read for featured items only
- **jobs**: Users can only access their own data
- **profiles**: Users can only access their own profile

### Environment Variables

- Never commit `.env` file to git
- `.env` is already in `.gitignore`
- Use environment variables for all sensitive data

## Caching Strategy

### Landing Page Data
- **Cache Time**: 5 minutes
- **Reason**: Rarely changes, reduces database load
- **Invalidation**: Automatic after 5 minutes

### User Job Data
- **Cache Time**: 1 minute
- **Reason**: Frequently updated, needs to be fresh
- **Invalidation**: Automatic after 1 minute

## Performance Optimizations

1. **Query Optimization**
   - Indexed columns for fast lookups
   - Minimal data fetching
   - Proper ordering in database

2. **Caching**
   - React Query for client-side caching
   - Stale-while-revalidate strategy
   - Reduced API calls

3. **Loading States**
   - Skeleton UI for better UX
   - No layout shift
   - Smooth transitions

## Troubleshooting

### Data Not Showing

1. Check Supabase connection:
```bash
# Test connection
curl https://idlwpzouxgmqhexjdefc.supabase.co/rest/v1/landing_stats \
  -H "apikey: YOUR_ANON_KEY"
```

2. Verify migrations ran:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

3. Check RLS policies:
```sql
-- View policies
SELECT * FROM pg_policies 
WHERE tablename IN ('landing_stats', 'testimonials');
```

### Cache Issues

Clear React Query cache:
```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ["landing-stats"] });
queryClient.invalidateQueries({ queryKey: ["testimonials"] });
```

## Next Steps

1. ✅ Run migrations
2. ✅ Verify data in Supabase Dashboard
3. ✅ Test landing page
4. ✅ Customize statistics and testimonials
5. ✅ Monitor performance

## Admin Panel (Future Enhancement)

Consider building an admin panel to:
- Update statistics without SQL
- Manage testimonials
- View analytics
- Moderate content
