import { db } from "@/db";
import { getUserFromKinde } from "@/lib/getUserFromKinde";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  let user = null;

  try {
    user = await getUserFromKinde();
  } catch (error) {
    console.error(error);
  }

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
  return <div>Dashboard</div>;
}
