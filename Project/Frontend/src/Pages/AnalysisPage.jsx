import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─────────── Icon helpers ─────────── */
const GitHubIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.745 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const FileIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ─────────── Workflow steps ─────────── */
const workflowSteps = [
  {
    num: '01', title: 'Map Construction',
    desc: 'Reality seed extraction & Individual and group memory injection & GraphRAG construction',
    accent: '#3b82f6',
    tags: ['Reality seed extraction', 'Individual and group memory injection', 'GraphRAG construction'],
    tagColor: 'text-blue-400',
  },
  {
    num: '02', title: 'Environment setup',
    desc: 'Entity Relationship Extraction & Persona Generation & Environment Configuration Agent Injection Simulation Parameters',
    accent: '#f97316',
    tags: ['Entity Relationship Extraction', 'Persona Generation', 'Environment Configuration', 'Agent Injection Simulation Parameters'],
    tagColor: 'text-orange-400',
  },
  {
    num: '03', title: 'Start simulation',
    desc: 'Dual-platform parallel simulation & automatic demand analysis & dynamic updating of time series memory',
    accent: '#22c55e',
    tags: ['Dual-platform parallel simulation', 'automatic demand analysis', 'dynamic updating of time series memory'],
    tagColor: 'text-green-400',
  },
  {
    num: '04', title: 'Report generation',
    desc: 'ReportAgent offers a rich toolset and allows for in-depth interaction with simulated environments.',
    accent: '#a855f7',
    tags: ['ReportAgent toolset', 'in-depth interaction'],
    tagColor: 'text-purple-400',
  },
  {
    num: '05', title: 'Deep Interaction',
    desc: 'Engage in conversation with any character in the simulated world & Engage in conversation with ReportAgent',
    accent: '#ef4444',
    tags: ['Engage in conversation with any character in the simulated world', 'Engage in conversation with ReportAgent'],
    tagColor: 'text-red-400',
  },
];

/* ─────────── Main ─────────── */
export default function AnalysisPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(null);

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: '#05080f',
        color: 'white',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .an-navbar {
          background: rgba(5,8,15,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        .an-step {
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.015);
          border-radius: 14px;
          padding: 16px 18px;
          transition: all 0.18s ease;
        }
        .an-step:hover { border-color: rgba(249,115,22,0.3); background: rgba(249,115,22,0.03); }
        .an-step.active { border-color: rgba(249,115,22,0.45); background: rgba(249,115,22,0.04); }

        .an-panel {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
        }

        .an-exp-btn {
          background: linear-gradient(135deg, #dc2626 0%, #f97316 100%);
          box-shadow: 0 0 20px rgba(220,38,38,0.3);
          border: none;
          border-radius: 10px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.18s ease;
          color: white;
          width: 100%;
        }
        .an-exp-btn:hover {
          box-shadow: 0 0 30px rgba(220,38,38,0.5);
          transform: translateY(-1px);
        }

        .status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34,197,94,0.7);
          animation: sPulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes sPulse {
          0%,100% { box-shadow: 0 0 5px rgba(34,197,94,0.5); }
          50% { box-shadow: 0 0 12px rgba(34,197,94,0.9); }
        }

        .divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); flex-shrink: 0; }

        .left-scroll { overflow-y: auto; flex: 1; }
        .left-scroll::-webkit-scrollbar { width: 3px; }
        .left-scroll::-webkit-scrollbar-track { background: transparent; }
        .left-scroll::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.3); border-radius: 2px; }

        .right-scroll { overflow-y: auto; flex: 1; }
        .right-scroll::-webkit-scrollbar { width: 3px; }
        .right-scroll::-webkit-scrollbar-track { background: transparent; }
        .right-scroll::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.2); border-radius: 2px; }
      `}</style>

      {/* ── NAVBAR ── */}
      <header className="an-navbar" style={{ padding: '10px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', opacity: 1, transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <div style={{ width: 32, height: 32 }}>
            <img src="/src/assets/Black_Modern_A_letter_Logo__1_-removebg-preview.png" alt="KAVACH"
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(1)' }} />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>कवच</div>
            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.2em', color: 'white' }}>KAVACH</div>
            <div style={{ fontSize: 7.5, letterSpacing: '0.2em', color: 'rgba(249,115,22,0.65)', textTransform: 'uppercase', fontWeight: 500 }}>Crisis Swarm Platform</div>
          </div>
        </button>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 11, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
            Home
          </button>
          <ChevronRight />
          <span style={{ color: '#f97316', fontWeight: 600 }}>Analysis</span>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
          <GitHubIcon size={13} /> GitHub
        </button>
      </header>

      {/* ── CONTENT AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '22px 36px 14px' }}>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div className="status-dot" />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>System status</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1.2 }}>
              The system is{' '}
              <span style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ready.</span>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              The system is ready and <span style={{ color: '#f97316', fontWeight: 600 }}>can</span> be used.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.08)', fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: '0.1em' }}>
              ● ONLINE
            </div>
          </div>
        </div>

        <div className="divider" style={{ marginBottom: 18 }} />

        {/* Two-column main area */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 400px', gap: 16, overflow: 'hidden' }}>

          {/* LEFT — Workflow Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexShrink: 0 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, border: '1px solid rgba(255,255,255,0.2)', transform: 'rotate(45deg)', flexShrink: 0 }} />
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>Workflow steps</p>
            </div>

            <div className="left-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workflowSteps.map((step, i) => (
                <div
                  key={i}
                  className={`an-step${activeStep === i ? ' active' : ''}`}
                  onClick={() => setActiveStep(activeStep === i ? null : i)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, flexShrink: 0,
                      background: `${step.accent}20`, color: step.accent, border: `1px solid ${step.accent}30`,
                    }}>
                      {step.num}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{step.title}</span>
                        {activeStep === i && (
                          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', padding: '1px 6px', borderRadius: 10, background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.22)', textTransform: 'uppercase' }}>
                            Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, marginBottom: activeStep === i ? 9 : 0 }}>{step.desc}</p>
                      {activeStep === i && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px' }}>
                          {step.tags.map((tag, j) => (
                            <span key={j} className={step.tagColor} style={{ fontSize: 10, fontWeight: 500, cursor: 'pointer' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Config Panel */}
          <div className="right-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Panel 1: Reality Seed */}
            <div className="an-panel" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(59,130,246,0.6)', textTransform: 'uppercase' }}>01 / Reality Seed</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>PDF</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <FileIcon />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    NDMA_Flood_Advisory_Uttarakhand_2024.pdf
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.37)', marginTop: 1 }}>2.4 MB · NDMA · Chamoli &amp; Rudraprayag districts</p>
                </div>
                <span style={{ color: '#22c55e', flexShrink: 0 }}><CheckIcon /></span>
              </div>

              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { lbl: 'Affected Zones', val: 'Chamoli, Rudraprayag' },
                  { lbl: 'Flood Severity', val: 'Extreme (Level 4)' },
                ].map(f => (
                  <div key={f.lbl} style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>{f.lbl}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{f.val}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 10 }}>Extracted parameters · Read-only</p>
            </div>

            {/* Panel 2: Simulated Requirements */}
            <div className="an-panel" style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(249,115,22,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>
                &gt;_ 02 / Simulated Requirements
              </p>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '12px 14px',
                fontFamily: "'Courier New', monospace", fontSize: 12.5, lineHeight: 1.7,
                color: 'rgba(255,255,255,0.65)',
              }}>
                if the Mandakini flood reaches Gopeshwar and NH-58 is blocked, several of the 50 citizens become isolated—those in remote or mobility-constrained groups are most at risk.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', fontStyle: 'italic' }}>Engine: KAVACH-Sim v1.0 · Groq Llama 3.3</span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8,
                  background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                  fontSize: 11, fontWeight: 700, color: 'rgba(220,38,38,0.5)',
                  letterSpacing: '0.05em', cursor: 'default',
                }}>
                  ▶ Run
                </div>
              </div>
            </div>

            {/* ── Experience it now — navigates to /simulation ── */}
            <button
              className="an-exp-btn"
              onClick={() => navigate('/simulation')}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>Experience it now</span>
              <ArrowRightIcon />
            </button>

            {/* Warning */}
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.18)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: '#eab308', fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚠</span>
              <p style={{ fontSize: 10, color: 'rgba(234,179,8,0.65)', lineHeight: 1.5 }}>
                Upload your own disaster advisory PDF in the simulation to run a live multi-agent analysis for any Indian district.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}