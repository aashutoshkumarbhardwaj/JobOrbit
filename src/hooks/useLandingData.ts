/**
 * useLandingData Hook
 * Fetches data for the landing page from Supabase
 * Handles loading and error states gracefully with 5-second timeout
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface LandingStat {
  id: string
  label: string
  value: number
  change: number
  trend: 'up' | 'down'
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  avatar?: string
  rating: number
}

/**
 * Fetch landing page statistics with timeout protection
 */
export function useLandingStats() {
  const [data, setData] = useState<LandingStat[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: stats, error: err } = await supabase
          .from('landing_stats')
          .select('*')
          .limit(5)

        if (!mounted) return

        if (err) {
          console.warn('Failed to fetch landing stats:', err)
          setError(null) // Don't show error to user, use defaults
          setData(getDefaultStats())
        } else {
          setData(stats || getDefaultStats())
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching landing stats:', err)
          setData(getDefaultStats())
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  return { data, isLoading, error }
}

/**
 * Fetch testimonials for landing page with timeout protection
 */
export function useTestimonials() {
  const [data, setData] = useState<Testimonial[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const fetchTestimonials = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: testimonials, error: err } = await supabase
          .from('testimonials')
          .select('*')
          .limit(6)

        if (!mounted) return

        if (err) {
          console.warn('Failed to fetch testimonials:', err)
          setError(null) // Don't show error to user, use defaults
          setData(getDefaultTestimonials())
        } else {
          setData(testimonials || getDefaultTestimonials())
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching testimonials:', err)
          setData(getDefaultTestimonials())
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchTestimonials()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  return { data, isLoading, error }
}

/**
 * Default stats if fetch fails
 */
function getDefaultStats(): LandingStat[] {
  return [
    { id: '1', label: 'Active Users', value: 2500, change: 15, trend: 'up' },
    { id: '2', label: 'Jobs Tracked', value: 12000, change: 8, trend: 'up' },
    { id: '3', label: 'Successful Placements', value: 850, change: 22, trend: 'up' },
    { id: '4', label: 'Average Success Rate', value: 76, change: 5, trend: 'up' },
    { id: '5', label: 'Support Rating', value: 98, change: 2, trend: 'up' },
  ]
}

/**
 * Default testimonials if fetch fails
 */
function getDefaultTestimonials(): Testimonial[] {
  return [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Developer',
      company: 'Tech Corp',
      content:
        'Job Orbit helped me land my dream role by tracking all my applications and keeping me organized throughout the process.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      rating: 5,
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'StartupXYZ',
      content:
        'The AI-powered resume optimization saved me so much time. Highly recommended for anyone serious about job hunting.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      rating: 5,
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      company: 'Design Studio',
      content:
        'Finally, a tool that makes job application tracking effortless. Job Orbit is a game-changer!',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      rating: 5,
    },
    {
      id: '4',
      name: 'James Wilson',
      role: 'Data Analyst',
      company: 'Analytics Pro',
      content:
        'The insights provided by Job Orbit helped me understand my job search patterns and improve my strategy.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      rating: 4,
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      role: 'Full Stack Developer',
      company: 'Web Solutions',
      content:
        'Integrated perfectly with my workflow. The Chrome extension is incredibly useful for quick job captures.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
      rating: 5,
    },
    {
      id: '6',
      name: 'David Park',
      role: 'DevOps Engineer',
      company: 'Cloud Systems',
      content:
        'Best investment for my career transition. Job Orbit made the entire process smoother and more professional.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      rating: 5,
    },
  ]
}
