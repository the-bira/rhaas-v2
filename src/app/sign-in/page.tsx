

import { Button } from "@/components/ui/button";
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <RegisterLink postLoginRedirectURL="/dashboard">
        <Button>Registrar-se</Button>
      </RegisterLink>

      <LoginLink postLoginRedirectURL="/dashboard">
        <Button>Entrar</Button>
      </LoginLink>
    </div>
  );
}
