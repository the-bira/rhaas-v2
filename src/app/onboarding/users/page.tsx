import InviteUsersForm from '@/components/onboarding/InviteUsersForm';
import { db } from '@/db';
import { headers } from 'next/headers';

const setOnboardingStep = async () => {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId) {
    return new Response(JSON.stringify({ error: "Tenant not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  await db.tenant.update({
    where: { id: tenantId },
    data: { onboardingStep: "done" },
  });
}
export default async function UsersOnboardingPage() {

  await setOnboardingStep();
  
  return <InviteUsersForm />;
}