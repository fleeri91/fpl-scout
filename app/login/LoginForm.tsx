'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm({
  action,
}: {
  action: (
    prevState: string | undefined,
    formData: FormData
  ) => Promise<string | undefined>
}) {
  const [error, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="email"
          className="text-[10px] font-normal tracking-wider text-(--fg3) uppercase"
        >
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="border-border bg-muted text-foreground h-auto rounded-lg px-3 py-2.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="password"
          className="text-[10px] font-normal tracking-wider text-(--fg3) uppercase"
        >
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border-border bg-muted text-foreground h-auto rounded-lg px-3 py-2.5 text-sm"
        />
      </div>
      {error ? (
        <span data-delta="down" className="text-xs">
          {error}
        </span>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-auto rounded-lg py-2.5 text-[13px] font-semibold"
      >
        {pending ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  )
}
