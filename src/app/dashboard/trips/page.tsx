import TripManager from "./TripManager";
import { getAllTripTypes } from "@/lib/queries";
import { getAllMedia } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const [trips, mediaList] = await Promise.all([
    getAllTripTypes(),
    getAllMedia(),
  ]);
  return <TripManager trips={trips} availableMedia={mediaList} />;
}
