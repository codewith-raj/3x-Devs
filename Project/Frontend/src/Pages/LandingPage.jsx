import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chatbot from './Chatbot';

const GitHubIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.745 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const TwitterIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.732-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PulseDot = () => (
  <span style={{ position: 'relative', display: 'inline-flex' }}>
    <span style={{
      animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      position: 'absolute',
      display: 'inline-flex',
      height: '100%',
      width: '100%',
      borderRadius: '9999px',
      backgroundColor: '#ef4444',
      opacity: 0.5
    }} />
    <span style={{
      position: 'relative',
      display: 'inline-flex',
      borderRadius: '9999px',
      width: '8px',
      height: '8px',
      backgroundColor: '#ef4444'
    }} />
    <style>{`
      @keyframes ping {
        75%, 100% { transform: scale(2); opacity: 0; }
      }
    `}</style>
  </span>
);

const DisasterCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const PIXEL = 10;
    let cols, rows, terrain, flood, agents, rain, frame = 0, animId;

    const rand = (min, max) => Math.random() * (max - min) + min;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.floor(canvas.width / PIXEL);
      rows = Math.floor(canvas.height / PIXEL);
      init();
    };

    const init = () => {
      terrain = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => {
          const r = Math.random();
          return r < 0.12 ? 2 : r < 0.22 ? 1 : 0;
        })
      );
      flood = Array.from({ length: rows }, () => new Float32Array(cols));
      const seeds = [
        [Math.floor(rows * 0.75), Math.floor(cols * 0.08)],
        [Math.floor(rows * 0.82), Math.floor(cols * 0.20)],
        [Math.floor(rows * 0.68), Math.floor(cols * 0.15)],
      ];
      seeds.forEach(([r, c]) => { if (r < rows && c < cols) flood[r][c] = 0.6; });

      agents = Array.from({ length: 22 }, (_, i) => ({
        x: rand(0, cols), y: rand(0, rows),
        vx: rand(-0.15, 0.15), vy: rand(-0.15, 0.15),
        color: i < 9 ? '#ef4444' : i < 15 ? '#f97316' : '#22c55e',
        trapped: false,
        blinkPhase: rand(0, Math.PI * 2),
      }));

      rain = Array.from({ length: 100 }, () => ({
        x: rand(0, cols), y: rand(0, rows),
        speed: rand(0.4, 0.9),
      }));
    };

    const spreadFlood = () => {
      if (frame % 6 !== 0) return;
      const next = flood.map(r => new Float32Array(r));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (flood[r][c] > 0.05) {
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            dirs.forEach(([dr, dc]) => {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && next[nr][nc] < 0.1 && terrain[nr][nc] !== 2) {
                if (Math.random() < 0.12) next[nr][nc] = flood[r][c] * rand(0.55, 0.82);
              }
            });
            next[r][c] = Math.min(next[r][c] + 0.008, 0.88);
          }
        }
      }
      flood = next;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const fl = flood[r][c];
          if (fl > 0.05) {
            const wave = 0.7 + 0.3 * Math.sin(frame * 0.04 + r * 0.3 + c * 0.2);
            ctx.fillStyle = `rgba(20,100,220,${fl * 0.65 * wave})`;
            ctx.fillRect(c * PIXEL, r * PIXEL, PIXEL, PIXEL);
            if (fl < 0.3) {
              ctx.fillStyle = `rgba(180,220,255,${(0.3 - fl) * 1.2})`;
              ctx.fillRect(c * PIXEL, r * PIXEL, PIXEL, 2);
            }
          } else {
            const t = terrain[r][c];
            if (t === 2) {
              ctx.fillStyle = 'rgba(45,55,80,0.55)';
              ctx.fillRect(c * PIXEL, r * PIXEL, PIXEL, PIXEL);
            } else if (t === 1) {
              ctx.fillStyle = 'rgba(55,60,80,0.35)';
              ctx.fillRect(c * PIXEL, r * PIXEL, PIXEL, PIXEL);
            } else {
              ctx.fillStyle = 'rgba(15,28,52,0.28)';
              ctx.fillRect(c * PIXEL, r * PIXEL, PIXEL, PIXEL);
            }
          }
        }
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 0.5;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * PIXEL); ctx.lineTo(canvas.width, r * PIXEL); ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * PIXEL, 0); ctx.lineTo(c * PIXEL, canvas.height); ctx.stroke();
      }

      const zones = [
        { r: Math.floor(rows * 0.25), c: Math.floor(cols * 0.55), w: 9, h: 5 },
        { r: Math.floor(rows * 0.55), c: Math.floor(cols * 0.70), w: 7, h: 4 },
      ];
      zones.forEach(z => {
        const pulse = 0.12 + 0.10 * Math.sin(frame * 0.04);
        ctx.fillStyle = `rgba(220,38,38,${pulse})`;
        ctx.fillRect(z.c * PIXEL, z.r * PIXEL, z.w * PIXEL, z.h * PIXEL);
      });

      ctx.fillStyle = 'rgba(147,200,255,0.18)';
      rain.forEach(drop => {
        ctx.fillRect(Math.floor(drop.x) * PIXEL + PIXEL / 2, Math.floor(drop.y) * PIXEL, 1, PIXEL * 2);
        drop.y += drop.speed;
        if (drop.y > rows) { drop.y = -1; drop.x = rand(0, cols); }
      });

      agents.forEach(agent => {
        const r = Math.floor(agent.y), c = Math.floor(agent.x);
        if (r >= 0 && r < rows && c >= 0 && c < cols && flood[r][c] > 0.5) agent.trapped = true;
        if (!agent.trapped) {
          let fx = 0, fy = 0;
          if (r > 0 && flood[r - 1]?.[c] > 0.1) fy += 0.4;
          if (r < rows - 1 && flood[r + 1]?.[c] > 0.1) fy -= 0.4;
          if (c > 0 && flood[r]?.[c - 1] > 0.1) fx += 0.4;
          if (c < cols - 1 && flood[r]?.[c + 1] > 0.1) fx -= 0.4;
          agent.x = Math.max(0, Math.min(cols - 1, agent.x + agent.vx + fx * 0.08));
          agent.y = Math.max(0, Math.min(rows - 1, agent.y + agent.vy + fy * 0.08));
        }
        const px = Math.floor(agent.x) * PIXEL;
        const py = Math.floor(agent.y) * PIXEL;
        const blink = agent.trapped ? (Math.sin(frame * 0.15 + agent.blinkPhase) > 0 ? 1 : 0.2) : 1;
        ctx.globalAlpha = blink;
        ctx.fillStyle = agent.color;
        ctx.fillRect(px, py, PIXEL, PIXEL);
        ctx.globalAlpha = 1;
      });

      frame++;
    };

    const loop = () => { spreadFlood(); draw(); animId = requestAnimationFrame(loop); };
    resize();
    animId = requestAnimationFrame(loop);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        imageRendering: 'pixelated'
      }}
    />
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const problems = [
    {
      title: 'The Plan Problem',
      desc: 'Disaster response plans are written months in advance on paper. The moment a real disaster is different from what was planned — which is every time — the plan is wrong.',
    },
    {
      title: 'The Simulation Problem',
      desc: 'No tool exists that lets government officials stress-test their plan before the disaster. No system simulates human behavior inside a disaster — who panics, who helps, who ignores alerts, who gets trapped.',
    },
    {
      title: 'The Report Problem',
      desc: 'After every disaster India produces reports. They name what went wrong. They name it six months later. KAVACH names it six months before.',
    },
  ];

  const steps = [
    { icon: '📄', num: '01', title: 'Upload', desc: 'Upload any real government disaster advisory PDF.' },
    { icon: '🧠', num: '02', title: 'Extract', desc: 'Gemini AI extracts affected zones, roads, shelters, hospitals.' },
    { icon: '👥', num: '03', title: 'Generate', desc: 'Generate 20 real citizens specific to the zones.' },
    { icon: '🗺️', num: '04', title: 'Simulate', desc: 'Watch tick-by-tick simulation unfold in real time.' },
    { icon: '⚡', num: '05', title: 'Interact', desc: 'Break things in real time and see the cascade.' },
    { icon: '📊', num: '06', title: 'Report', desc: 'Get government-style bottleneck report.' },
  ];

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#05080f',
      color: 'white',
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      overflowX: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=EB+Garamond:ital@1&display=swap');
        
        body { margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(239,68,68,0.25); }
      `}</style>

      {/* NAVBAR */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(5,8,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/src/assets/Black_Modern_A_letter_Logo__1_-removebg-preview.png"
                alt="KAVACH" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(1)' }} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>कवच</div>
              <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '2px', color: 'white', lineHeight: 1, margin: 0 }}>KAVACH</div>
            </div>
          </a>

          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            {['The Problem', 'How It Works', 'Why India'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  transition: 'color 0.3s'
                }}
                onMouseEnter={e => e.target.style.color = 'white'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
              >
                {l}
              </a>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.target.borderColor = 'rgba(255,255,255,0.2)'; e.target.color = 'white'; }}
            onMouseLeave={e => { e.target.borderColor = 'rgba(255,255,255,0.1)'; e.target.color = 'rgba(255,255,255,0.6)'; }}
            >
              <GitHubIcon size={14} /> GitHub
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingBottom: '128px',
        overflow: 'hidden',
        background: '#05080f'
      }}>
        <DisasterCanvas />

        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(5,8,15,0.45) 0%, rgba(5,8,15,0.92) 100%)'
        }} />

        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '300px',
          borderRadius: '9999px',
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.18) 0%, transparent 70%)'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.1)',
            color: '#f87171',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '40px'
          }}>
            <PulseDot /> Live Simulation Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 8vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-1px',
            lineHeight: 1.2,
            marginBottom: '12px'
          }}>
            <span style={{ display: 'block' }}>विपदं पूर्वं अभ्यस्य,</span>
            <span style={{
              display: 'block',
              backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #fbbf24 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              यत् सा त्वां न अभ्यसेत्
            </span>
          </h1>

          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.4)',
            fontStyle: 'italic',
            marginBottom: '40px',
            letterSpacing: '0.5px'
          }}>
            "Rehearse the disaster before it rehearses you"
          </p>

          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '48rem',
            margin: '0 auto 32px',
            lineHeight: 1.6
          }}>
            Kavach is a multi-agent disaster simulation platform that uses real government advisories to model how diverse populations respond to disasters.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/analysis')} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.5px',
              border: 'none',
              background: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(220,38,38,0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.transform = 'translateY(0)'; }}
            >
              <span>▶</span> Start Analysis
            </button>
            <button style={{
              padding: '16px 32px',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.target.borderColor = 'rgba(255,255,255,0.4)'; e.target.color = 'white'; }}
            onMouseLeave={e => { e.target.borderColor = 'rgba(255,255,255,0.2)'; e.target.color = 'rgba(255,255,255,0.8)'; }}
            >
              About Us →
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { stat: '20+', label: 'AI-generated agents' },
              { stat: '10+', label: 'Simulation ticks' },
              { stat: '1', label: 'Bottleneck report' },
            ].map(({ stat, label }) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(8px)'
              }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#fb923c' }}>{stat}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section id="the-problem" style={{
        position: 'relative',
        paddingTop: '112px',
        paddingBottom: '112px',
        background: '#07091a',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: '#fb923c', textTransform: 'uppercase', marginBottom: '24px' }}>The Problem</p>
            <h2 style={{
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              maxWidth: '64rem',
              margin: '0 auto'
            }}>
              India's Disaster Plans Are Written For<br />
              <span style={{
                backgroundImage: 'linear-gradient(135deg, #ef4444, #f97316)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                The Wrong Disaster
              </span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '80px'
          }}>
            {problems.map((p, i) => (
              <div key={i} style={{
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                transition: 'all 0.25s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(249,115,22,0.1))'
                }}>
                  <span style={{ color: '#fb923c', fontWeight: 900, fontSize: '14px' }}>0{i + 1}</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'white' }}>{p.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>

          <div style={{
            padding: '48px',
            borderRadius: '24px',
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(220,38,38,0.04)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '64rem', margin: '0 auto' }}>
              The <span style={{ color: 'white', fontWeight: 700 }}>2013 Kedarnath disaster</span> killed over 5,000 people. The <span style={{ color: 'white', fontWeight: 700 }}>2021 Chamoli GLOF</span> wiped out entire villages. <span style={{ color: '#fb923c', fontWeight: 700 }}>Joshimath is sinking right now.</span> The plans exist. No one has stress-tested them. <span style={{ color: 'white', fontWeight: 700 }}>Until now.</span>
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" style={{
        position: 'relative',
        paddingTop: '112px',
        paddingBottom: '112px',
        background: '#05080f'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: '#fb923c', textTransform: 'uppercase', marginBottom: '24px' }}>How It Works</p>
            <h2 style={{
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              maxWidth: '64rem',
              margin: '0 auto'
            }}>
              From PDF to Bottleneck Report<br />
              <span style={{
                backgroundImage: 'linear-gradient(135deg, #f97316, #fbbf24)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                In Under 30 Seconds
              </span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px'
          }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                transition: 'all 0.25s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  fontSize: '24px',
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(220,38,38,0.1))'
                }}>
                  {step.icon}
                </div>
                <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(251,146,60,0.6)', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>{step.num}</span>
                <h4 style={{ fontWeight: 700, color: 'white', marginBottom: '12px' }}>{step.title}</h4>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        background: 'linear-gradient(to right, rgba(220,38,38,0.1) 0%, rgba(249,115,22,0.08) 100%)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1rem' }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 5vw, 3rem)',
            fontWeight: 900,
            marginBottom: '24px',
            lineHeight: 1.2
          }}>
            Stress-test your disaster plan<br />
            <span style={{
              backgroundImage: 'linear-gradient(135deg, #ef4444, #f97316)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              before the disaster does.
            </span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '40px', fontSize: '14px', lineHeight: 1.6 }}>
            Upload any disaster advisory. Watch citizens survive or get trapped in real time. Get a report naming every gap.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/analysis')} style={{
              padding: '16px 40px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              ▶ Start Analysis
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        paddingTop: '40px',
        paddingBottom: '40px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#03040a'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
            A multi-agent disaster simulation platform built for Uttarakhand and India's most disaster-prone regions.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.3)', transition: 'color 0.3s' }}
              onMouseEnter={e => e.target.style.color = 'white'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
            >
              <TwitterIcon size={18} />
            </a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.3)', transition: 'color 0.3s' }}
              onMouseEnter={e => e.target.style.color = 'white'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
            >
              <GitHubIcon size={18} />
            </a>
          </div>
        </div>
      </footer>

      <Chatbot />
    </div>
  );
}