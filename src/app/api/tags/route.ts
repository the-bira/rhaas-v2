import { db } from "@/db";
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  try {

    const tags = await db.jobTag.findMany({
      where: {
        tag: query !== null ? {
          contains: query,
          mode: "insensitive",
        } : undefined,
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("API /tags failed:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  const { tag } = await request.json();

  try {
    // busca por tag existente (case-insensitive)
    const existingTag = await db.jobTag.findFirst({
      where: {
        tag: {
          equals: tag,
          mode: "insensitive",
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(existingTag);
    }

    const newTag = await db.jobTag.create({
      data: { tag },
    });

    return NextResponse.json(newTag);
  } catch (error) {
    console.error("API /tags failed:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}