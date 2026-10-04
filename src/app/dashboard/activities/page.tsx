import ActivityManager from "./ActivityManager";
import { getAllActivities } from "@/lib/queries";
import { getAllMedia } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const [activities, mediaList] = await Promise.all([
    getAllActivities(),
    getAllMedia(),
  ]);
  return <ActivityManager activities={activities} availableMedia={mediaList} />;
}
