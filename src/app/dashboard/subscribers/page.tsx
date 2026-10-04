import SubscribersManager from "./SubscribersManager";
import { getSubscribers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const subscribers = await getSubscribers();
  return <SubscribersManager subscribers={subscribers} />;
}
