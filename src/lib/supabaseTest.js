import { supabase } from "./supabase";

export async function testSupabaseConnection() {
  if (!supabase) {
    console.warn("Supabase not configured — skipping connection test.");
    return;
  }

  const { error } = await supabase.from("series").select("id").limit(1);

  if (error) {
    console.error("Supabase connection failed:", error);
    return;
  }

  console.log("Supabase connection successful.");
}