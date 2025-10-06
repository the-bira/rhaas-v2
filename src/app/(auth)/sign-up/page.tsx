import { RegisterLink, LoginLink } from '@kinde-oss/kinde-auth-nextjs/components'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { GoogleIcon, GitHubIcon } from '@/components/auth/SocialIcons'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Criar conta</CardTitle>
          <CardDescription className="text-base">
            Comece sua jornada conosco hoje
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegisterLink className="w-full">
            <Button className="w-full" size="lg">
              Criar conta com Email
            </Button>
          </RegisterLink>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                ou continue com
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <RegisterLink authUrlParams={{ connection_id: 'google' }}>
              <Button variant="outline" className="w-full" size="lg">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Google
              </Button>
            </RegisterLink>
            
            <RegisterLink authUrlParams={{ connection_id: 'github' }}>
              <Button variant="outline" className="w-full" size="lg">
                <GitHubIcon className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </RegisterLink>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-xs text-center text-muted-foreground px-4">
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="/terms" className="text-primary hover:underline">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </a>
          </div>
          <Separator />
          <div className="text-sm text-center text-muted-foreground">
            Já tem uma conta?{' '}
            <LoginLink className="text-primary hover:underline font-medium">
              Entrar
            </LoginLink>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

