import { db } from "@/db";
import { getUserFromKinde } from "@/lib/getUserFromKinde";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getUserFromKinde();

  if (!user) {
    redirect("/sign-in");
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      tenant: true,
    },
  });

  const redirectUrl =
    membership?.tenant.onboardingStep === "users"
      ? "/users"
      : "/onboarding/company";

  if (!membership) redirect(redirectUrl);
}
