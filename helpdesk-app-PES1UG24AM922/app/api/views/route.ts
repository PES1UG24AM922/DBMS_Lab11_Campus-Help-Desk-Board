import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const redis = await getRedis();
    if (!redis) return NextResponse.json({ views: null });
    const views = await redis.incr("help:views"); // atomic INCR
    return NextResponse.json({ views });
  } catch {
    return NextResponse.json({ views: null });
  }
}
