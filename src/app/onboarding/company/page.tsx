import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { redirect } from "next/navigation";
import CompanyForm from "@/components/onboarding/CompanyForm";

export default async function CompanyOnboardingPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
    },
  });

  if (membership) {
    redirect("/dashboard");
  }

  return <CompanyForm />;
}