import { notFound } from "next/navigation";
import YachtForm from "./YachtForm";
import { getYacht } from "@/lib/queries";
import { getAllMedia } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function YachtPage() {
  const [yacht, mediaList] = await Promise.all([
    getYacht("finch-65"),
    getAllMedia(),
  ]);
  if (!yacht) notFound();
  return <YachtForm yacht={yacht} availableMedia={mediaList} />;
}
