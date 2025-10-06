import { db } from "@/db";
import { getUserFromKinde } from "@/lib/getUserFromKinde";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getUserFromKinde();

  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      tenant: true,
    },
  });

  const redirectUrl =
    membership?.tenant.onboardingStep === "jobs"
      ? "/jobs"
      : "/onboarding/company";

  if (!membership) redirect(redirectUrl);
}
