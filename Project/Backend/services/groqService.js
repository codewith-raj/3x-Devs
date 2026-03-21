const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Use the fast small model only for world state (simple JSON)
const FAST_MODEL   = 'llama-3.1-8b-instant';
// Use the large model for reports (complex long HTML)
const REPORT_MODEL = 'llama-3.3-70b-versatile';

// Strip markdown code fences
const stripCodeFences = (text) => {
  return text
    .replace(/```json\n?/gi, '')
    .replace(/```html\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim();
};

// ── World state extraction backup ────────────────────────────
const extractWorldState = async (pdfText, prompt) => {
  console.log('[GROQ] Attempting world state extraction as Gemini backup...');

  try {
    const completion = await groq.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a disaster data extractor for Indian emergency management systems. Return only valid JSON. No explanation, no markdown, no code blocks.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content;
    const stripped = stripCodeFences(responseText);

    try {
      const parsed = JSON.parse(stripped);
      console.log('[GROQ] World state extraction successful');
      return parsed;
    } catch (err) {
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('[GROQ] World state extracted from partial match');
        return parsed;
      }
      throw new Error(`Groq world state parse failed: ${err.message}`);
    }
  } catch (err) {
    console.error('[GROQ] World state extraction failed:', err.message);
    throw err;
  }
};

// ── Bottleneck report generation ─────────────────────────────
// Uses llama-3.3-70b with 8000 tokens — required for full HTML report
const generateReport = async (prompt) => {
  console.log('[GROQ] Generating bottleneck report via llama-3.3-70b-versatile...');

  try {
    const completion = await groq.chat.completions.create({
      model: REPORT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a senior NDMA official writing a formal disaster response report.
Return ONLY raw HTML content starting with <div class="report-header">.
Do NOT include <html>, <head>, <body>, or <style> tags.
Do NOT include markdown, code fences, or any text before the first HTML tag.
Use ONLY the CSS classes specified in the prompt — do not invent new classes.
Your entire response must be valid HTML that can be injected directly into a webpage.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8000
    });

    const responseText = completion.choices[0].message.content;
    const cleaned = stripCodeFences(responseText);

    // Verify it looks like HTML
    if (!cleaned.includes('<div') && !cleaned.includes('<table')) {
      throw new Error(`Response does not appear to be HTML. Starts with: ${cleaned.slice(0, 100)}`);
    }

    console.log(`[GROQ] Bottleneck report generated — ${cleaned.length} characters`);
    return cleaned;

  } catch (err) {
    console.error('[GROQ] Report generation failed:', err.message);
    throw err;
  }
};

// ── Final verdict generation ──────────────────────────────────
// Uses llama-3.3-70b with 8000 tokens — required for full verdict HTML
const generateVerdict = async (prompt) => {
  console.log('[GROQ] Generating final verdict via llama-3.3-70b-versatile...');

  try {
    const completion = await groq.chat.completions.create({
      model: REPORT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a senior NDMA resource planning official writing a formal disaster readiness verdict.
Return ONLY raw HTML content starting with <hr>.
Do NOT include <html>, <head>, <body>, or <style> tags.
Do NOT include markdown, code fences, or any text before the first HTML tag.
Use ONLY the CSS classes specified in the prompt — do not invent new classes.
Your entire response must be valid HTML that can be injected directly into a webpage.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8000
    });

    const responseText = completion.choices[0].message.content;
    const cleaned = stripCodeFences(responseText);

    if (!cleaned.includes('<hr') && !cleaned.includes('<div')) {
      throw new Error(`Response does not appear to be HTML. Starts with: ${cleaned.slice(0, 100)}`);
    }

    console.log(`[GROQ] Verdict generated — ${cleaned.length} characters`);
    return cleaned;

  } catch (err) {
    console.error('[GROQ] Verdict generation failed:', err.message);
    throw err;
  }
};

// ── Hard fallback — only if BOTH Gemini and Groq fail ────────
const generateFallbackReport = (simulationLog) => {
  console.log('[GROQ] Generating fallback report from raw simulation data...');

  const { agents, worldState } = simulationLog;
  const trapped     = agents.filter(a => a.status === 'trapped');
  const safe        = agents.filter(a => a.status === 'safe');
  const survivalRate = Math.round((safe.length / agents.length) * 100);

  const stateAbbr   = (worldState.disaster.state || 'IN')
    .split(' ').map(w => w[0]).join('').toUpperCase();
  const disasterAbbr = (worldState.disaster.type || 'DIS')
    .split(' ').map(w => w[0]).join('').toUpperCase();

  const failureBlocks = trapped.map((a, i) => `
    <div class="failure-block">
      <div class="failure-num">Critical Failure ${String(i + 1).padStart(2, '0')} — Life-Safety Impact: ${a.vulnerability === 'critical' ? 'Extreme' : 'High'}</div>
      <div class="failure-title">Agent Unrescued at Simulation End — ${a.role}</div>
      <div class="failure-body">
        <span class="agent-tag">AGENT ${a.id}</span>
        <span class="failure-agent">${a.name}, ${a.age}, ${a.role}, ${a.zone}</span><br><br>
        ${a.name}, ${a.age}-year-old ${a.role} located in ${a.neighborhood}, ${a.zone}.
        Status at Tick 10: TRAPPED. ${a.currentThought || 'Awaiting rescue.'}<br><br>
        <strong>Root Cause:</strong> Simulation engine identified this agent as unrescued at simulation end.
        Zone risk: ${a.zoneRisk}. Route blocked: ${a.routeBlocked}. Rescue needed: ${a.needsRescue}.
      </div>
      <div class="failure-pop">This agent represents the vulnerable population in ${a.zone}.</div>
    </div>`
  ).join('');

  return `
<div class="report-header">
  <div class="gov-line">National Disaster Management Authority — Government of India</div>
  <div class="gov-line" style="margin-top:2px">${worldState.disaster.state} State Disaster Management Authority — District Emergency Operations Centre</div>
  <div class="report-title">POST-SIMULATION BOTTLENECK ANALYSIS REPORT</div>
  <div class="report-sub">CrisisSwarm Multi-Agent Disaster Response Simulation — ${worldState.disaster.location} ${worldState.disaster.type} Scenario</div>
</div>

<div class="alert-strip">
  <p>SIMULATION CLASSIFICATION: ${trapped.length >= 3 ? 'CRITICAL' : trapped.length >= 1 ? 'HIGH' : 'MODERATE'} — ${trapped.length} OF ${agents.length} AGENTS UNRESCUED AT SIMULATION END</p>
</div>

<table class="meta-table">
  <tr><td>Report Reference</td><td>CRISISSWARM/${stateAbbr}/${disasterAbbr}/2024/SIM-001</td></tr>
  <tr><td>Simulation Scenario</td><td>${worldState.disaster.location} ${worldState.disaster.type}</td></tr>
  <tr><td>Simulation Duration</td><td>10 Ticks — 6:00 AM to 8:30 AM (2 hours 30 minutes simulated)</td></tr>
  <tr><td>Total Agents Simulated</td><td>${agents.length} representative citizens across 4 behavioral categories</td></tr>
  <tr><td>Simulation Engine</td><td>CrisisSwarm v1.0 — Multi-agent BFS propagation model</td></tr>
  <tr><td>Report Generated</td><td>Tick 10 — 8:30 AM — Fallback Engine (API limits reached)</td></tr>
  <tr><td>Classification</td><td>FOR OFFICIAL USE — DISASTER PREPAREDNESS PLANNING</td></tr>
</table>

<div class="section-title">1. Executive Summary</div>
<p class="body-text">
  This simulation modeled ${agents.length} agents across ${worldState.disaster.location} during a ${worldState.disaster.type} event.
  Of ${agents.length} agents, ${safe.length} reached safety and ${trapped.length} remained unrescued at simulation end.
  Overall survival rate: ${survivalRate}%.
</p>

<div class="summary-grid">
  <div class="summary-box s-safe"><div class="snum">${safe.length}</div><div class="slbl">Reached Safety</div></div>
  <div class="summary-box s-trapped"><div class="snum">${trapped.length}</div><div class="slbl">Trapped / Unrescued</div></div>
  <div class="summary-box s-partial"><div class="snum">${agents.filter(a => ['blocked','unaware'].includes(a.status)).length}</div><div class="slbl">Partial Outcome</div></div>
  <div class="summary-box s-total"><div class="snum">${survivalRate}%</div><div class="slbl">Survival Rate</div></div>
</div>

<hr>

<div class="section-title">2. Critical Failure Analysis</div>
${failureBlocks}

<hr>

<div class="section-title">3. Note — Report Generation Status</div>
<p class="body-text">
  Full AI-generated narrative analysis was unavailable due to API rate limits during this session.
  The above represents raw simulation output. Agent names, zones, vulnerability levels, and outcomes
  are accurate simulation data. For the full narrative report including coordinator analysis,
  misinformation events, volunteer contributions, and detailed recommendations, please retry
  after API quota resets.
</p>

<div class="sig-section">
  <div class="sig-block">
    <div class="sig-line"></div>
    <div style="font-size:10px">Simulation Analysis Lead</div>
    <div style="font-size:9px;color:#555;margin-top:2px">CrisisSwarm Research Team</div>
  </div>
  <div class="sig-block" style="text-align:center">
    <div class="stamp">CRISISSWARM<br>SIMULATION REPORT<br>${stateAbbr}-${disasterAbbr}-2024<br>OFFICIAL OUTPUT</div>
  </div>
  <div class="sig-block">
    <div class="sig-line"></div>
    <div style="font-size:10px">Technical Verification</div>
    <div style="font-size:9px;color:#555;margin-top:2px">Multi-Agent Engine v1.0</div>
  </div>
</div>

<div class="footer">
  <span>Report Ref: CRISISSWARM/${stateAbbr}/${disasterAbbr}/2024/SIM-001</span>
  <span>Generated: Tick 10 — 8:30 AM Simulation Time</span>
  <span>CrisisSwarm v1.0 — Hackerz Street 4.0</span>
</div>
<div class="page-label">Page 1 of 1 — Generated by CrisisSwarm Fallback Engine (Groq/Gemini API unavailable)</div>`;
};

module.exports = {
  extractWorldState,
  generateReport,
  generateVerdict,
  generateFallbackReport
};