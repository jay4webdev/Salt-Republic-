import { NextResponse } from "next/server";
import { syncAllBlobMedia } from "@/lib/media";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  try {
    const result = await syncAllBlobMedia();
    revalidatePath("/dashboard/media");
    revalidatePath("/dashboard/settings");
    revalidatePath("/");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        count: 0,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return POST();
}
