import { AuthError } from 'next-auth'
import { signIn } from '@/auth'
import '@/components/fpl-scout.css'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm } from './LoginForm'

async function loginWithCredentials(
  _prevState: string | undefined,
  formData: FormData
) {
  'use server'
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return 'Invalid email or password.'
    }
    throw error
  }
}

async function loginWithGoogle() {
  'use server'
  await signIn('google', { redirectTo: '/' })
}

export default function LoginPage() {
  return (
    <div className="fpl-scout min-h-screen" data-theme="dark">
      <div className="grid min-h-screen place-items-center p-6">
        <div className="flex w-full max-w-107.5 flex-col gap-4.5">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground flex size-7.5 items-center justify-center rounded-lg text-sm font-extrabold">
              FS
            </div>
            <div className="font-heading text-xl font-extrabold tracking-[-0.03em] uppercase">
              FPL Scout
            </div>
          </div>

          <Card className="ring-border gap-0 rounded-xl py-0">
            <CardHeader className="border-border gap-1 border-b py-4.5">
              <CardTitle className="text-[22px] font-extrabold tracking-[-0.035em]">
                Log in
              </CardTitle>
              <CardDescription className="text-[12.5px] leading-relaxed">
                Sign in to open your Scout dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5 py-4.5">
              <form action={loginWithGoogle}>
                <button
                  type="submit"
                  className="border-border bg-muted text-foreground flex h-auto w-full items-center justify-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold"
                >
                  Continue with Google
                </button>
              </form>

              <div className="flex items-center gap-2.5 text-[10px] tracking-wider text-(--fg3) uppercase">
                <div className="bg-border h-px flex-1" />
                or
                <div className="bg-border h-px flex-1" />
              </div>

              <LoginForm action={loginWithCredentials} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
