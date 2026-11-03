import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getRedis } from "@/lib/redis";

const CACHE_KEY = "help:latest";

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. Try Redis
  try {
    const redis = await getRedis();
    if (redis) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return NextResponse.json({ source: "Redis", requests: JSON.parse(cached) });
      }
    }
  } catch {}

  // 2. Cache miss -> PostgreSQL
  try {
    const result = await pool.query(
      "SELECT id, student_name, message, created_at FROM help_requests ORDER BY created_at DESC, id DESC LIMIT 10"
    );
    const requests = result.rows;

    // 3. Store in Redis with 60s TTL
    try {
      const redis = await getRedis();
      if (redis) await redis.set(CACHE_KEY, JSON.stringify(requests), { EX: 60 });
    } catch {}

    return NextResponse.json({ source: "PostgreSQL", requests });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const student_name = String(body?.student_name ?? "").trim();
  const message = String(body?.message ?? "").trim();

  if (!student_name || !message) {
    return NextResponse.json(
      { success: false, error: "student_name and message are required" },
      { status: 400 }
    );
  }
  if (student_name.length > 50 || message.length > 200) {
    return NextResponse.json(
      { success: false, error: "student_name max 50 chars, message max 200 chars" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      "INSERT INTO help_requests (student_name, message) VALUES ($1, $2) RETURNING id",
      [student_name, message]
    );

    // Invalidate cache after write (ignore Redis failures)
    try {
      const redis = await getRedis();
      if (redis) await redis.del(CACHE_KEY);
    } catch {}

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch {
    return NextResponse.json(
      { success: false, error: "Database error" },
      { status: 500 }
    );
  }
}

