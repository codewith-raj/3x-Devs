import { useEffect, useRef } from 'react'
import { useSimulationContext } from '../../context/SimulationContext'
import { formatLogEntry } from '../../utils/formatLog'

export default function SystemDashboard() {
  const { logEntries, worldState } = useSimulationContext()
  const scrollRef = useRef(null)
  const simId = useRef(`sim_crisisswarm_${Math.random().toString(36).substr(2, 8)}`)

  // Auto scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logEntries])

  return (
    <div style={{
      height: 'var(--dashboard-height)',
      background: 'var(--terminal-bg)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      fontFamily: 'var(--font-terminal)',
      fontSize: 11
    }}>

      {/* Terminal header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 14px',
        borderBottom: '1px solid #1a1a1a',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          {/* Traffic light dots */}
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          </div>
          <span style={{
            color: '#444',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            SYSTEM DASHBOARD
          </span>
          {worldState && (
            <span style={{
              color: '#333',
              fontSize: 10
            }}>
              — {worldState.disaster?.type} · {worldState.disaster?.location}
            </span>
          )}
        </div>

        {/* Sim ID on right */}
        <span style={{
          color: '#333',
          fontSize: 10,
          letterSpacing: '0.05em'
        }}>
          {simId.current}
        </span>
      </div>

      {/* Log entries scroll area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {logEntries.length === 0 ? (
          <div style={{
            color: '#333',
            fontSize: 10,
            paddingTop: 6,
            fontFamily: 'var(--font-terminal)'
          }}>
            Waiting for system events...
          </div>
        ) : (
          logEntries.map((entry, i) => {
            const formatted = formatLogEntry(entry)
            return (
              <LogLine
                key={i}
                timestamp={formatted.timestamp}
                message={formatted.message}
                color={formatted.color}
                level={entry.level}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

// Single log line component
function LogLine({ timestamp, message, color, level }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      lineHeight: 1.5,
      opacity: level === 'debug' ? 0.4 : 1
    }}>

      {/* Timestamp */}
      <span style={{
        color: '#333',
        fontSize: 10,
        flexShrink: 0,
        fontFamily: 'var(--font-terminal)',
        paddingTop: 1
      }}>
        {timestamp}
      </span>

      {/* Message */}
      <span style={{
        color,
        fontSize: 10,
        fontFamily: 'var(--font-terminal)',
        wordBreak: 'break-word',
        flex: 1
      }}>
        {message}
      </span>
    </div>
  )
}