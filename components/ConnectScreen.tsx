'use client'

import type { KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ConnectScreen({
  entry,
  entryError,
  connectLabel,
  recentTeamIds,
  onEntryChange,
  onEntryKeyDown,
  onConnect,
  onSelectRecent,
  onRemoveRecent,
}: {
  entry: string
  entryError: string
  connectLabel: string
  recentTeamIds: string[]
  onEntryChange: (value: string) => void
  onEntryKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  onConnect: () => void
  onSelectRecent: (id: string) => void
  onRemoveRecent: (id: string) => void
}) {
  return (
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
              Connect your team
            </CardTitle>
            <CardDescription className="text-[12.5px] leading-relaxed">
              Enter your FPL team ID so Scout can pull your squad, transfers and
              chip history.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5 py-4.5">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="team-id"
                className="text-[10px] font-normal tracking-wider text-(--fg3) uppercase"
              >
                Team ID
              </Label>
              <Input
                id="team-id"
                className="mono border-border bg-muted text-foreground h-auto rounded-lg px-3 py-2.5 text-sm"
                value={entry}
                onChange={(e) => onEntryChange(e.target.value)}
                onKeyDown={onEntryKeyDown}
                placeholder="e.g. 3842106"
                inputMode="numeric"
                // base-ui's Input primitive sets caret-color on the client only
                // (to draw its own caret) — an expected, benign SSR mismatch.
                suppressHydrationWarning
              />
              {entryError ? (
                <span data-delta="down" className="text-xs">
                  {entryError}
                </span>
              ) : null}
              {recentTeamIds.length > 0 ? (
                <div className="mt-0.5 flex flex-col gap-1.5">
                  <span className="text-[10px] font-normal tracking-wider text-(--fg3) uppercase">
                    Recent teams
                  </span>
                  <div className="divide-border border-border bg-muted divide-y overflow-hidden rounded-lg border">
                    {recentTeamIds.map((id) => (
                      <div key={id} className="flex items-center">
                        <Button
                          variant="ghost"
                          onClick={() => onSelectRecent(id)}
                          className="mono text-foreground h-auto flex-1 justify-start rounded-none px-3 py-2.5 text-[13px] font-normal"
                        >
                          {id}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onRemoveRecent(id)}
                          aria-label={`Remove ${id} from recent teams`}
                          className="mr-1.5 rounded-md text-(--fg3)"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <Button
              onClick={onConnect}
              className="h-auto rounded-lg py-2.5 text-[13px] font-semibold"
            >
              {connectLabel}
            </Button>
            <div className="bg-border h-px" />
            <div className="text-xs leading-relaxed text-(--fg3)">
              Find it in the URL of your points page on the official site:{' '}
              <span className="mono text-(--fg2)">
                /entry/&lt;your-id&gt;/event/3
              </span>
              . Scout only reads public data.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
