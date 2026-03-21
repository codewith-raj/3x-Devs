import { useSimulationContext } from '../../context/SimulationContext'
import AgentCard from '../agents/AgentCard'

export default function AgentGenStep({ status, data }) {
  const { agents, selectedAgent, setSelectedAgent } = useSimulationContext()

  // While generating — show progress
  if (status === 'processing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 4
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#f59e0b',
            animation: 'pulse-badge 1s infinite',
            flexShrink: 0
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: '#f59e0b'
          }}>
            Generating agents → Claude claude-sonnet-4-5
          </span>
        </div>

        {/* Agent counter — shows as agents stream in */}
        {agents.length > 0 && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-secondary)'
          }}>
            {agents.length} / 20 agents generated
          </div>
        )}

        {/* Partial agent cards if any already loaded */}
        {agents.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            maxHeight: 300,
            overflowY: 'auto'
          }}>
            {agents.slice(0, agents.length).map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent?.id === agent.id}
                onClick={() => setSelectedAgent(
                  selectedAgent?.id === agent.id ? null : agent
                )}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Completed — show all agent cards
  if (status === 'completed') {
    const displayAgents = agents.length > 0
      ? agents
      : data?.agents || []

    const distribution = data?.distribution || {
      blue:  displayAgents.filter(a => a.group === 'blue').length,
      red:   displayAgents.filter(a => a.group === 'red').length,
      amber: displayAgents.filter(a => a.group === 'amber').length,
      green: displayAgents.filter(a => a.group === 'green').length
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Distribution bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            marginBottom: 2
          }}>
            AGENT DISTRIBUTION — {displayAgents.length} TOTAL
          </div>

          {/* Colored bar */}
          <div style={{
            display: 'flex',
            height: 6,
            borderRadius: 3,
            overflow: 'hidden',
            gap: 1
          }}>
            <div style={{
              flex: distribution.blue,
              background: '#3b82f6',
              borderRadius: '3px 0 0 3px'
            }} />
            <div style={{
              flex: distribution.red,
              background: '#ef4444'
            }} />
            <div style={{
              flex: distribution.amber,
              background: '#f59e0b'
            }} />
            <div style={{
              flex: distribution.green,
              background: '#22c55e',
              borderRadius: '0 3px 3px 0'
            }} />
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap'
          }}>
            {[
              { color: '#3b82f6', label: 'Responders', count: distribution.blue },
              { color: '#ef4444', label: 'Vulnerable', count: distribution.red },
              { color: '#f59e0b', label: 'Mobile', count: distribution.amber },
              { color: '#22c55e', label: 'Volunteers', count: distribution.green }
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: item.color,
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)'
                }}>
                  {item.count} {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
          maxHeight: 400,
          overflowY: 'auto',
          paddingRight: 2
        }}>
          {displayAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedAgent?.id === agent.id}
              onClick={() => setSelectedAgent(
                selectedAgent?.id === agent.id ? null : agent
              )}
            />
          ))}
        </div>

      </div>
    )
  }

  return null
}