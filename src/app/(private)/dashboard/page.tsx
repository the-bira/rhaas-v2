import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function getUserFromKinde() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) return null; // 👈 evita crash na build

    const existing = await db.user.findUnique({
      where: {
        kindeId: user.id,
      },
    });

    if (existing) return existing;

    return db.user.create({
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
