import { createAdminClient } from "@/lib/supabase/admin"
export default async function TestPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("blood_inventory").select("*").limit(1)
  return <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
}