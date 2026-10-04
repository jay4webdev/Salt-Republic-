import { NextResponse } from "next/server";
import { verifyBlobConnection, getBlobStoreId, getBlobToken } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const result = await verifyBlobConnection();
    return NextResponse.json({
      ...result,
      configured: Boolean(getBlobToken()),
      storeId: getBlobStoreId(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        storeId: getBlobStoreId(),
        error: error instanceof Error ? error.message : "Blob storage check failed",
      },
      { status: 500 }
    );
  }
}
