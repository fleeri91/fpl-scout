'use client'

import type { KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="flex w-full max-w-[430px] flex-col gap-4.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-[30px] items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
            FS
          </div>
          <div className="text-base font-semibold tracking-tight">FPL Scout</div>
        </div>

        <Card className="gap-0 rounded-xl py-0 ring-border">
          <CardHeader className="gap-1 border-b border-border py-4.5">
            <CardTitle className="text-base font-semibold tracking-tight">Connect your team</CardTitle>
            <CardDescription className="text-[12.5px] leading-relaxed">
              Enter your FPL team ID so Scout can pull your squad, transfers and chip history.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5 py-4.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-id" className="text-[10px] font-normal tracking-wider text-[var(--fg3)] uppercase">
                Team ID
              </Label>
              <Input
                id="team-id"
                className="mono h-auto rounded-lg border-border bg-muted px-3 py-2.5 text-sm text-foreground"
                value={entry}
                onChange={(e) => onEntryChange(e.target.value)}
                onKeyDown={onEntryKeyDown}
                placeholder="e.g. 3842106"
                inputMode="numeric"
              />
              {entryError ? (
                <span data-delta="down" className="text-xs">
                  {entryError}
                </span>
              ) : null}
              {recentTeamIds.length > 0 ? (
                <div className="mt-0.5 flex flex-col gap-1.5">
                  <span className="text-[10px] font-normal tracking-wider text-[var(--fg3)] uppercase">Recent teams</span>
                  <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-muted">
                    {recentTeamIds.map((id) => (
                      <div key={id} className="flex items-center">
                        <Button
                          variant="ghost"
                          onClick={() => onSelectRecent(id)}
                          className="mono h-auto flex-1 justify-start rounded-none px-3 py-2.5 text-[13px] font-normal text-foreground"
                        >
                          {id}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onRemoveRecent(id)}
                          aria-label={`Remove ${id} from recent teams`}
                          className="mr-1.5 rounded-md text-[var(--fg3)]"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <Button onClick={onConnect} className="h-auto rounded-lg py-2.5 text-[13px] font-semibold">
              {connectLabel}
            </Button>
            <div className="h-px bg-border" />
            <div className="text-xs leading-relaxed text-[var(--fg3)]">
              Find it in the URL of your points page on the official site:{' '}
              <span className="mono text-[var(--fg2)]">/entry/&lt;your-id&gt;/event/3</span>. Scout only reads public
              data.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
