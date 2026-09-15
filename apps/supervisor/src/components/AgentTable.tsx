import type { WallboardAgent, AgentStatus } from '@teleforce/data'
import { Badge, cn } from '@teleforce/ui'
import { elapsedSince } from './Kpi'

/**
 * The floor, one row per agent.
 *
 * Ordered by how busy they are rather than alphabetically: a supervisor
 * scanning this cares about who is mid-call, not who logged off this morning.
 * That ordering is done in SQL so every screen agrees.
 */

const STATUS_TONE: Record<AgentStatus, 'ok' | 'gold' | 'info' | 'warn' | 'neutral'> = {
  talking: 'ok',
  wrap: 'gold',
  available: 'info',
  break: 'warn',
  offline: 'neutral',
}

export function AgentTable({
  agents,
  now,
  tv,
}: {
  agents: WallboardAgent[]
  now: number
  tv?: boolean
}) {
  if (agents.length === 0) {
    return (
      <div className="panel px-6 py-14 text-center">
        <p className="text-[15px] text-pearl">No agents have signed in yet</p>
        <p className="mt-2 text-[13px] text-pearl-dim">
          Agents appear here the moment they open the workspace.
        </p>
      </div>
    )
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className={cn(
            'w-full min-w-[860px] text-left tabular-nums',
            tv ? 'text-[18px]' : 'text-[13px]',
          )}
        >
          <thead>
            <tr className="border-b border-pearl/10 text-pearl-faint">
              <Th tv={tv}>Agent</Th>
              <Th tv={tv}>Status</Th>
              <Th tv={tv}>In state</Th>
              <Th tv={tv}>Customer</Th>
              <Th tv={tv}>Number</Th>
              <Th tv={tv}>Checks</Th>
              <Th tv={tv}>Calls</Th>
              <Th tv={tv}>Leads</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pearl/8">
            {agents.map((a) => (
              <tr
                key={a.user_id}
                className={cn(
                  'transition-colors duration-500',
                  a.status === 'talking' && 'bg-ok/[0.05]',
                  a.status === 'offline' && 'opacity-45',
                )}
              >
                <Td tv={tv} className="text-pearl">
                  {a.display_name}
                </Td>
                <Td tv={tv}>
                  <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
                </Td>
                <Td tv={tv} className="font-mono text-pearl-dim">
                  {elapsedSince(a.state_since, now)}
                </Td>
                <Td tv={tv} className="text-pearl-dim">
                  {a.customer_name ?? '—'}
                </Td>
                <Td tv={tv} className="font-mono text-pearl-dim">
                  {a.customer_phone ?? '—'}
                </Td>
                <Td tv={tv}>
                  {a.call_id ? (
                    <span
                      className={cn(
                        a.checkpoints_reached >= 5 ? 'text-ok' : 'text-pearl-dim',
                      )}
                    >
                      {a.checkpoints_reached}/5
                    </span>
                  ) : (
                    <span className="text-pearl-faint">—</span>
                  )}
                </Td>
                <Td tv={tv} className="text-pearl-dim">
                  {a.calls_today}
                </Td>
                <Td tv={tv} className={a.leads_today > 0 ? 'text-gold' : 'text-pearl-dim'}>
                  {a.leads_today}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Th = ({ children, tv }: { children: React.ReactNode; tv?: boolean }) => (
  <th
    className={cn(
      'px-5 py-3 font-mono font-normal uppercase tracking-[0.16em]',
      tv ? 'text-[12px]' : 'text-[9.5px]',
    )}
  >
    {children}
  </th>
)

const Td = ({
  children,
  className,
  tv,
}: {
  children: React.ReactNode
  className?: string
  tv?: boolean
}) => <td className={cn(tv ? 'px-5 py-4' : 'px-5 py-3', className)}>{children}</td>
