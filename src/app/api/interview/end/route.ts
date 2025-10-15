// /api/interview/end/route.ts
import { db } from "@/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "accessToken é obrigatório" },
        { status: 400 }
      );
    }

    await db.interview.update({
      where: { accessToken },
      data: { status: "completed" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ [API] Erro em /api/interview/end:", err);
    return NextResponse.json(
      { success: false, message: "Erro ao encerrar entrevista" },
      { status: 500 }
    );
  }
}
