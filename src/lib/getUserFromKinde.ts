import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function getUserFromKinde() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) return null;

    // 🧠 busca tanto por kindeId quanto por email (garante compatibilidade)
    const existing = await db.user.findFirst({
      where: {
        OR: [{ kindeId: user.id }, { email: user.email! }],
      },
    });

    // ⚙️ Se já existir, garante que o kindeId está vinculado
    if (existing) {
      if (!existing.kindeId) {
        await db.user.update({
          where: { id: existing.id },
          data: { kindeId: user.id },
        });
      }
      return existing;
    }

    // 🪄 Se não existir, cria normalmente
    return await db.user.create({
      data: {
        kindeId: user.id,
        email: user.email!,
        name: `${user.given_name ?? ""} ${user.family_name ?? ""}`.trim(),
      },
    });
  } catch (err) {
    console.warn("⚠️ getUserFromKinde() failed:", err);
    return null;
  }
}
