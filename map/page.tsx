


import Map from "@/components/map";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, latitude, longitude")
    .eq("is_active", true);

  return <Map locations={locations || []} />;
}