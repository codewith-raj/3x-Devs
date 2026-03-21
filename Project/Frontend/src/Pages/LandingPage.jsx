import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chatbot from './Chatbot';

/* ─────────── tiny icon set (inline SVG components) ─────────── */
const Icon = ({ d, size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
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

/* ─────────── Animated Counter ─────────── */
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const animate = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─────────── Pulse Dot ─────────── */
const PulseDot = ({ color = 'bg-red-500', size = 'w-3 h-3' }) => (
  <span className="relative inline-flex">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-50`} />
    <span className={`relative inline-flex rounded-full ${size} ${color}`} />
  </span>
);

/* ─────────── Section Label ─────────── */
const SectionLabel = ({ children }) => (
  <p className="text-xs font-extrabold tracking-[0.3em] text-orange-500 uppercase mb-4">{children}</p>
);

/* ─────────── Pixel Disaster Canvas ─────────── */
const DisasterCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const PIXEL = 10;
    let cols, rows, terrain, flood, agents, rain, frame = 0, animId;

    const rand = (min, max) => Math.random() * (max - min) + min;
    const irnd = (n) => Math.floor(Math.random() * n);

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.floor(canvas.width / PIXEL);
      rows = Math.floor(canvas.height / PIXEL);
      init();
    };

    const init = () => {
      // terrain: 0=land 1=road 2=building
      terrain = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => {
          const r = Math.random();
          return r < 0.12 ? 2 : r < 0.22 ? 1 : 0;
        })
      );
      // flood seed points bottom-left cluster
      flood = Array.from({ length: rows }, () => new Float32Array(cols));
      const seeds = [
        [Math.floor(rows * 0.75), Math.floor(cols * 0.08)],
        [Math.floor(rows * 0.82), Math.floor(cols * 0.20)],
        [Math.floor(rows * 0.68), Math.floor(cols * 0.15)],
      ];
      seeds.forEach(([r, c]) => { if (r < rows && c < cols) flood[r][c] = 0.6; });

      // agents
      agents = Array.from({ length: 22 }, (_, i) => ({
        x: rand(0, cols), y: rand(0, rows),
        vx: rand(-0.15, 0.15), vy: rand(-0.15, 0.15),
        color: i < 9 ? '#ef4444' : i < 15 ? '#f97316' : '#22c55e',
        trapped: false,
        blinkPhase: rand(0, Math.PI * 2),
      }));

      // rain drops
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

      // ── terrain & flood ──
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const fl = flood[r][c];
          if (fl > 0.05) {
            const wave = 0.7 + 0.3 * Math.sin(frame * 0.04 + r * 0.3 + c * 0.2);
            ctx.fillStyle = `rgba(20,100,220,${fl * 0.65 * wave})`;
            ctx.fillRect(c * PIXEL, r * PIXEL, PIXEL, PIXEL);
            // foam edge
            if (fl < 0.3) {
              ctx.fillStyle = `rgba(180,220,255,${(0.3 - fl) * 1.2})`;
              ctx.fillRect(c * PIXEL, r * PIXEL, PIXEL, 2);
            }
          } else {
            const t = terrain[r][c];
            if (t === 2) {
              ctx.fillStyle = 'rgba(45,55,80,0.55)';
              ctx.fillRect(c * PIXEL, r * PIXEL, PIXEL, PIXEL);
              ctx.fillStyle = 'rgba(80,95,130,0.25)';
              ctx.fillRect(c * PIXEL, r * PIXEL, PIXEL, 2);
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

      // ── pixel grid lines ──
      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 0.5;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * PIXEL); ctx.lineTo(canvas.width, r * PIXEL); ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * PIXEL, 0); ctx.lineTo(c * PIXEL, canvas.height); ctx.stroke();
      }

      // ── danger zone overlays ──
      const zones = [
        { r: Math.floor(rows * 0.25), c: Math.floor(cols * 0.55), w: 9, h: 5 },
        { r: Math.floor(rows * 0.55), c: Math.floor(cols * 0.70), w: 7, h: 4 },
      ];
      zones.forEach(z => {
        const pulse = 0.12 + 0.10 * Math.sin(frame * 0.04);
        ctx.fillStyle = `rgba(220,38,38,${pulse})`;
        ctx.fillRect(z.c * PIXEL, z.r * PIXEL, z.w * PIXEL, z.h * PIXEL);
        ctx.strokeStyle = `rgba(239,68,68,${pulse * 2.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(z.c * PIXEL, z.r * PIXEL, z.w * PIXEL, z.h * PIXEL);
      });

      // ── alert scan line ──
      const scanY = ((frame * 1.2) % canvas.height);
      const scanGrad = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4);
      scanGrad.addColorStop(0, 'rgba(249,115,22,0)');
      scanGrad.addColorStop(0.5, 'rgba(249,115,22,0.07)');
      scanGrad.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 4, canvas.width, 8);

      // ── rain ──
      ctx.fillStyle = 'rgba(147,200,255,0.18)';
      rain.forEach(drop => {
        ctx.fillRect(Math.floor(drop.x) * PIXEL + PIXEL / 2, Math.floor(drop.y) * PIXEL, 1, PIXEL * 2);
        drop.y += drop.speed;
        if (drop.y > rows) { drop.y = -1; drop.x = rand(0, cols); }
      });

      // ── agents (citizen pixels) ──
      agents.forEach(agent => {
        const r = Math.floor(agent.y), c = Math.floor(agent.x);
        if (r >= 0 && r < rows && c >= 0 && c < cols && flood[r][c] > 0.5) agent.trapped = true;
        if (!agent.trapped) {
          // flee flood
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
        ctx.shadowColor = agent.color;
        ctx.shadowBlur = agent.trapped ? 10 : 5;
        ctx.globalAlpha = blink;
        ctx.fillStyle = agent.color;
        ctx.fillRect(px, py, PIXEL, PIXEL);
        // inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(px + 1, py + 1, 2, 2);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
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
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

/* ─────────── Main Component ─────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [activeAgent, setActiveAgent] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Cycle active agent
  useEffect(() => {
    const t = setInterval(() => setActiveAgent(a => (a + 1) % 3), 3000);
    return () => clearInterval(t);
  }, []);

  const agents = [
    {
      name: 'Rekha Sharma', age: 67,
      role: 'Elderly widow · Gopeshwar, Chamoli',
      quote: '"Called 112 at 6 AM. Ambulance road flooded at Tick 6. Still waiting at Tick 10."',
      status: 'TRAPPED', statusColor: 'text-red-400 border-red-500/30 bg-red-500/10',
      dotColor: 'bg-red-500', tick: 'Flood reaches her at Tick 3',
    },
    {
      name: 'Vikram Singh', age: 34,
      role: 'NDRF Coordinator · Dehradun HQ',
      quote: '"Queue has 14 pending requests. I can only reach 3 this tick."',
      status: 'OVERLOADED', statusColor: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      dotColor: 'bg-orange-400', tick: 'Managing 20 rescue requests, can action 3/tick',
    },
    {
      name: 'Priya Rawat', age: 28,
      role: 'Schoolteacher · Rishikesh',
      quote: '"The government bus never came. We are walking to the shelter."',
      status: 'HELPING', statusColor: 'text-green-400 border-green-500/30 bg-green-500/10',
      dotColor: 'bg-green-500', tick: 'Evacuating 35 children on foot',
    },
  ];

  const steps = [
    { icon: '📄', num: '01', title: 'Upload', desc: 'Upload any real government disaster advisory PDF — NDMA flood warning, IMD cloudburst advisory, DDMA notice.' },
    { icon: '🧠', num: '02', title: 'Extract', desc: 'Gemini AI reads the PDF and extracts affected zones, blocked roads, shelter locations, hospital positions, NDRF deployments.' },
    { icon: '👥', num: '03', title: 'Generate', desc: 'Gemini generates 20 real Uttarakhand citizens specific to the zones — farmers in Chamoli, tourists in Rishikesh, elderly in Rudraprayag.' },
    { icon: '🗺️', num: '04', title: 'Simulate', desc: 'Watch tick-by-tick — flood spreads road by road, citizens move or get trapped, shelters fill, coordinator gets overloaded.' },
    { icon: '⚡', num: '05', title: 'Interact', desc: 'Break things in real time — collapse a bridge, fill a shelter, cut hospital power, spread misinformation — watch the map react instantly.' },
    { icon: '📊', num: '06', title: 'Report', desc: 'Groq AI generates a formal government bottleneck report — every failure named, every person named, every gap with a specific recommendation.' },
  ];

  const techCards = [
    { title: 'Gemini AI', tag: 'EXTRACTION', desc: 'World state extraction from any PDF. Dynamic agent generation specific to the exact zones and demographics mentioned in the advisory.' },
    { title: 'Groq + Llama 3.1', tag: 'REPORTING', desc: 'Bottleneck report generation at 500 tokens/sec. Formal government language. Every failure named with agent name, tick number, and population category.' },
    { title: 'Leaflet.js + OpenStreetMap', tag: 'GEOGRAPHY', desc: 'Real Uttarakhand geography. Real district boundaries. Real road networks. Real shelter and hospital coordinates.' },
    { title: 'BFS Flood Algorithm', tag: 'SIMULATION', desc: 'Flood spreads road by road from red zone boundaries using breadth-first search on the actual Uttarakhand road graph. Rivers determine flood resistance scores.' },
    { title: 'Socket.io Real-time', tag: 'INFRASTRUCTURE', desc: 'Simulation state pushed to frontend every 1.5 seconds. No polling. No lag. The map feels alive because it is alive.' },
    { title: 'Multi-Agent Decision Engine', tag: 'AI CORE', desc: '20 agents. Each with unique properties. Each making decisions every tick based on vehicle access, smartphone ownership, vulnerability level, and route availability.' },
  ];

  const problems = [
    {
      title: 'The Plan Problem',
      desc: 'Disaster response plans are written months in advance on paper. The moment a real disaster is different from what was planned — which is every time — the plan is wrong.',
    },
    {
      title: 'The Simulation Problem',
      desc: 'No tool exists that lets government officials stress-test their plan before the disaster. No system simulates human behavior inside a disaster — who panics, who helps, who ignores alerts, who gets trapped not because of the disaster but because of gaps in the response.',
    },
    {
      title: 'The Report Problem',
      desc: 'After every disaster India produces reports. They name what went wrong. They name it six months later. KAVACH names it six months before.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#05080f] text-white font-sans overflow-x-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=EB+Garamond:ital@1&display=swap');
        
        :root {
          --navy: #05080f;
          --navy-2: #0a0f1e;
          --navy-3: #0e1628;
          --red: #dc2626;
          --red-2: #ef4444;
          --orange: #f97316;
          --orange-2: #fb923c;
          --border: rgba(255,255,255,0.06);
        }

        * { box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        ::selection { background: rgba(239,68,68,0.25); }

        .hero-glow {
          background: radial-gradient(ellipse 70% 50% at 50% -10%, rgba(220, 38, 38, 0.18) 0%, transparent 70%);
        }

        .map-bg {
          background:
            radial-gradient(ellipse 80% 80% at 50% 50%, rgba(14, 22, 40, 0.95) 0%, rgba(5,8,15,1) 100%);
        }

        .dot-grid {
          background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .stat-pill {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(8px);
        }

        .section-divider {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          height: 1px;
          width: 100%;
        }

        .card-hover {
          transition: all 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-3px);
          border-color: rgba(249,115,22,0.25) !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #dc2626 0%, #f97316 100%);
          box-shadow: 0 0 30px rgba(220,38,38,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 40px rgba(220,38,38,0.45), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .flood-bar {
          background: linear-gradient(90deg, rgba(59,130,246,0.7), rgba(99,179,237,0.9));
          animation: flood 3s ease-in-out infinite;
        }
        @keyframes flood {
          0%, 100% { width: 40%; }
          50% { width: 70%; }
        }

        .tick-bar {
          background: linear-gradient(90deg, #f97316, #dc2626);
        }

        .report-text {
          font-family: 'Courier New', monospace;
        }

        .quote-font {
          font-family: 'EB Garamond', 'Georgia', serif;
        }

        .nav-blur {
          background: rgba(5,8,15,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .agent-card-active {
          border-color: rgba(249,115,22,0.4) !important;
          background: rgba(249,115,22,0.04) !important;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }

        .flood-zone {
          background: radial-gradient(ellipse at 40% 50%, rgba(59,130,246,0.25) 0%, transparent 65%),
                      radial-gradient(ellipse at 70% 30%, rgba(220,38,38,0.2) 0%, transparent 50%);
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-blur' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="w-9 h-9 flex items-center justify-center">
              <img src="/src/assets/Black_Modern_A_letter_Logo__1_-removebg-preview.png"
                alt="KAVACH" className="w-full h-full object-contain invert" />
            </div>
            <div className="leading-none">
              <div className="text-[10px] font-extrabold tracking-[0.25em] text-white/40 uppercase">कवच</div>
              <div className="text-base font-black tracking-widest text-white leading-none">KAVACH</div>
              <div className="text-[8px] tracking-[0.2em] text-orange-500/70 uppercase font-medium">Crisis Swarm Platform</div>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {['The Problem', 'How It Works', 'Why India'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-xs font-medium text-white/50 hover:text-white transition-colors tracking-wide uppercase">
                {l}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all">
              <TwitterIcon size={14} /> Follow
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all">
              <GitHubIcon size={14} /> GitHub
            </button>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 overflow-hidden" style={{ background: '#05080f' }}>
        {/* Pixel Disaster Canvas Background */}
        <DisasterCanvas />

        {/* Dark vignette overlay so text stays readable */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(5,8,15,0.45) 0%, rgba(5,8,15,0.92) 100%)'
        }} />
        {/* Top red glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.18) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold tracking-widest uppercase mb-10">
            <PulseDot color="bg-red-500" size="w-2 h-2" /> Live Simulation Platform
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-3 text-center">
            <span className="block">विपदं पूर्वं अभ्यस्य,</span>
            <span className="block text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #fbbf24 100%)' }}>
              यत् सा त्वां न अभ्यसेत्
            </span>
          </h1>
          <p className="text-base md:text-lg text-white/40 italic text-center mb-10 tracking-wide font-semibold">
            "Rehearse the disaster before it rehearses you"
          </p>

          <p className="text-base md:text-lg text-white/55 max-w-3xl mx-auto leading-relaxed mb-8 font-light">
            Kavach is a multi-agent disaster simulation platform that uses real government advisories to model how diverse populations respond to disasters, providing real-time outcomes and generating reports that highlight critical gaps and failures.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <button onClick={() => navigate('/analysis')} className="btn-primary flex items-center gap-3 px-8 py-4 rounded-full font-bold text-sm tracking-wide">
              <span>▶</span> Start Analysis
            </button>
            <button className="flex items-center gap-3 px-8 py-4 rounded-full border border-white/20 text-white/80 hover:border-white/40 hover:text-white font-semibold text-sm transition-all">
              About Us →
            </button>
          </div>

          {/* Stat pills */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            {[
              { stat: '20+', label: 'AI-generated agents' },
              { stat: '10+', label: 'Simulation ticks' },
              { stat: '1', label: 'Bottleneck report' },
            ].map(({ stat, label }) => (
              <div key={label} className="stat-pill flex items-center gap-3 px-6 py-3 rounded-full">
                <span className="text-2xl font-black text-orange-400">{stat}</span>
                <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: THE PROBLEM ── */}
      <section id="the-problem" className="relative py-28 bg-[#07091a]">
        <div className="section-divider absolute top-0 left-0 right-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight max-w-4xl mx-auto">
              India's Disaster Plans Are Written For<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
                The Wrong Disaster
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {problems.map((p, i) => (
              <div key={i} className="card-hover p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(249,115,22,0.1))' }}>
                  <span className="text-orange-400 font-black text-sm">0{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold mb-4 text-white">{p.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="relative p-8 md:p-12 rounded-3xl border border-red-500/20 text-center overflow-hidden" style={{ background: 'rgba(220,38,38,0.04)' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-900/10 to-transparent pointer-events-none" />
            <p className="relative text-base md:text-lg text-white/70 leading-relaxed max-w-4xl mx-auto font-medium">
              The <span className="text-white font-bold">2013 Kedarnath disaster</span> killed over 5,000 people. The <span className="text-white font-bold">2021 Chamoli GLOF</span> wiped out entire villages. <span className="text-orange-400 font-bold">Joshimath is sinking right now.</span> The plans exist. The gaps in those plans exist too. No one has stress-tested them. <span className="text-white font-bold">Until now.</span>
            </p>
          </div>
        </div>
        <div className="section-divider absolute bottom-0 left-0 right-0" />
      </section>

      {/* ── SECTION 3: HOW IT WORKS ── */}
      <section id="how-it-works" className="relative py-28 dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight max-w-3xl mx-auto">
              From PDF to Bottleneck Report<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
                In Under 30 Seconds
              </span>
            </h2>
          </div>

          {/* Flow connector */}
          <div className="relative">
            <div className="hidden lg:block absolute top-[52px] left-[8%] right-[8%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.3) 20%, rgba(249,115,22,0.3) 80%, transparent)' }} />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {steps.map((step, i) => (
                <div key={i} className="card-hover relative flex flex-col items-start p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-2xl mb-4 text-2xl"
                    style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(220,38,38,0.1))' }}>
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-extrabold text-orange-500/60 tracking-widest mb-2">{step.num}</span>
                  <h4 className="font-bold text-white mb-3">{step.title}</h4>
                  <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── SECTION 7: WHY UTTARAKHAND ── */}
      <section id="why-india" className="relative py-28 dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <SectionLabel>Why India</SectionLabel>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight max-w-4xl mx-auto">
              India's Most Disaster-Prone Regions.<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
                The Least Prepared Plans.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                label: 'THE HISTORY',
                title: '2013 Kedarnath',
                icon: '🏔️',
                desc: '5,000+ dead. Entire villages erased. The Mandakini river rose 20 feet in 6 hours. The response plan had no protocol for roads that no longer existed.',
              },
              {
                label: 'THE PRESENT',
                title: 'Joshimath Sinking',
                icon: '⚠️',
                desc: 'Joshimath is sinking right now. Chamoli district had a GLOF in 2021 that hit without warning. Every monsoon brings new cloudbursts to Uttarkashi, Rudraprayag, and Tehri Garhwal.',
              },
              {
                label: 'THE FUTURE',
                title: 'Accelerating Risk',
                icon: '🌊',
                desc: 'Climate change is accelerating glacier melt. GLOF risk is increasing every year. The response plans have not been stress-tested against the new reality. KAVACH does exactly that.',
              },
            ].map((col, i) => (
              <div key={i} className="card-hover p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-4xl mb-4">{col.icon}</div>
                <div className="text-[9px] font-extrabold tracking-[0.25em] text-orange-500/60 uppercase mb-2">{col.label}</div>
                <h3 className="text-xl font-black text-white mb-4">{col.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{col.desc}</p>
              </div>
            ))}
          </div>

          {/* Quote block */}
          <div className="relative p-10 md:p-16 rounded-3xl border border-white/[0.06] text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(14,22,40,0.8), rgba(7,9,26,0.9))' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-orange-900/10 pointer-events-none" />
            <div className="quote-font text-2xl md:text-3xl lg:text-4xl text-white/70 leading-relaxed italic relative max-w-4xl mx-auto">
              "Uttarakhand is called <span className="text-orange-400 not-italic font-normal">Devbhumi</span> — the land of gods. Its people deserve a response plan that has been rehearsed before the disaster, not written after it."
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(249,115,22,0.08) 100%)' }}>
        <div className="section-divider absolute top-0 left-0 right-0" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            Stress-test your disaster plan<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
              before the disaster does.
            </span>
          </h2>
          <p className="text-white/50 mb-10 text-sm max-w-xl mx-auto leading-relaxed">
            Upload any disaster advisory. Watch Uttarakhand's citizens survive or get trapped in real time. Get a report naming every gap.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/analysis')} className="btn-primary px-10 py-4 rounded-full font-bold text-sm tracking-wide">
              ▶ Start Analysis
            </button>
            <button className="px-10 py-4 rounded-full border border-white/20 text-white/70 hover:border-white/40 hover:text-white font-semibold text-sm transition-all">
              About Us →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-white/[0.06] bg-[#03040a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7">
              <img src="/src/assets/Black_Modern_A_letter_Logo__1_-removebg-preview.png"
                alt="KAVACH" className="w-full h-full object-contain invert" />
            </div>
            <div>
              <div className="font-black tracking-widest text-white text-sm">KAVACH</div>
              <div className="text-[8px] text-white/30 tracking-[0.2em] uppercase">Crisis Swarm Platform</div>
            </div>
          </div>

          <p className="text-xs text-white/25 text-center max-w-sm leading-relaxed">
            A multi-agent disaster simulation platform built for Uttarakhand and India's most disaster-prone regions.
          </p>

          <div className="flex items-center gap-4">
            <a href="#" className="text-white/30 hover:text-white transition-colors"><TwitterIcon size={18} /></a>
            <a href="#" className="text-white/30 hover:text-white transition-colors"><GitHubIcon size={18} /></a>
            <button className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-white text-black rounded-full hover:bg-gray-100 transition-colors">
              <GitHubIcon size={14} /> Star on GitHub
            </button>
          </div>
        </div>
      </footer>

      <Chatbot />
    </div>
  );
}
