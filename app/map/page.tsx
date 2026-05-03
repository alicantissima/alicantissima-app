


import Map from "@/components/map";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, latitude, longitude")
    .eq("is_active", true);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <Map
      locations={locations || []}
      googleMapsApiKey={googleMapsApiKey}
    />
  );
}