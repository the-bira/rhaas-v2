import { NextResponse } from "next/server";

export async function POST() {
  // No futuro: enviar para vercel-blob
  return NextResponse.json({ success: true, message: "Upload placeholder" });
}
