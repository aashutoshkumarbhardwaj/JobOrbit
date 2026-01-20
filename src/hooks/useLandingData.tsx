import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandingStat {
  id: string;
  stat_key: string;
  stat_value: string;
  stat_label: string;
  display_order: number;
}

export interface Testimonial {
  id: string;
  quote: string;
  author_name: string;
  author_role: string;
  author_company: string;
  rating: number;
  display_order: number;
}

export function useLandingStats() {
  return useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_stats")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as LandingStat[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_featured", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Testimonial[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Hook to get aggregate job statistics (for logged-in users)
export function useJobStats(userId?: string) {
  return useQuery({
    queryKey: ["job-stats", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("jobs")
        .select("status")
        .eq("user_id", userId);
      
      if (error) throw error;
      
      // Calculate statistics
      const stats = {
        total: data.length,
        applied: data.filter(j => j.status === "applied").length,
        interviewing: data.filter(j => j.status === "interviewing").length,
        offers: data.filter(j => j.status === "offer").length,
        rejected: data.filter(j => j.status === "rejected").length,
      };
      
      return stats;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // Cache for 1 minute
  });
}
