import { supabase } from "./src/integrations/supabase/client";

async function testConnection() {
  console.log("🔍 Testing Supabase Connection...\n");
  
  // Test 1: Check environment variables
  console.log("1. Environment Variables:");
  console.log("   URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log("   Key:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "✅ Set" : "❌ Missing");
  console.log("");

  // Test 2: Test landing_stats table
  console.log("2. Testing landing_stats table:");
  try {
    const { data, error } = await supabase
      .from("landing_stats")
      .select("*")
      .order("display_order");
    
    if (error) {
      console.log("   ❌ Error:", error.message);
    } else {
      console.log("   ✅ Success! Found", data?.length, "stats");
      data?.forEach(stat => {
        console.log(`      - ${stat.stat_label}: ${stat.stat_value}`);
      });
    }
  } catch (err) {
    console.log("   ❌ Exception:", err);
  }
  console.log("");

  // Test 3: Test testimonials table
  console.log("3. Testing testimonials table:");
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_featured", true)
      .order("display_order");
    
    if (error) {
      console.log("   ❌ Error:", error.message);
    } else {
      console.log("   ✅ Success! Found", data?.length, "testimonials");
      data?.forEach(test => {
        console.log(`      - ${test.author_name} (${test.author_company})`);
      });
    }
  } catch (err) {
    console.log("   ❌ Exception:", err);
  }
  console.log("");

  // Test 4: Test jobs table (requires auth)
  console.log("4. Testing jobs table:");
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("count");
    
    if (error) {
      console.log("   ⚠️  Error (expected if not authenticated):", error.message);
    } else {
      console.log("   ✅ Success! Table accessible");
    }
  } catch (err) {
    console.log("   ❌ Exception:", err);
  }
  console.log("");

  console.log("✅ Connection test complete!");
}

testConnection();
