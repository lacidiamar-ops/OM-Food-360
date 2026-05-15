import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTripWithDetails, listHotels, listHotelProfiles } from "@/lib/supabase/queries";
import TripDetail from "@/components/domain/TripDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [trip, hotels, hotelProfiles] = await Promise.all([
    getTripWithDetails(supabase, id),
    listHotels(supabase),
    listHotelProfiles(supabase),
  ]);

  if (!trip) notFound();

  return <TripDetail trip={trip} hotels={hotels} hotelProfiles={hotelProfiles} />;
}
