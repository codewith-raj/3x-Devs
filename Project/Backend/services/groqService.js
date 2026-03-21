const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = 'llama-3.1-8b-instant';

// Strip markdown code fences
const stripCodeFences = (text) => {
  return text
    .replace(/```json\n?/gi, '')
    .replace(/```html\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim();
};

// Backup for extractWorldState if Gemini fails
const extractWorldState = async (pdfText, prompt) => {
  console.log('[GROQ] Attempting world state extraction as Gemini backup...');

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a disaster data extractor for Indian emergency management systems. Return only valid JSON. No explanation, no markdown, no code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
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
      // Try to find JSON object
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

// Backup for generateReport if Gemini fails
const generateReport = async (prompt) => {
  console.log('[GROQ] Attempting report generation as Gemini backup...');

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a senior NDMA official writing a formal disaster response report. Return only raw HTML content using the exact CSS classes provided. No markdown, no code blocks, no preamble.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    const responseText = completion.choices[0].message.content;
    const cleaned = stripCodeFences(responseText);

    console.log(`[GROQ] Report generated — ${cleaned.length} characters`);
    return cleaned;

  } catch (err) {
    console.error('[GROQ] Report generation failed:', err.message);
    throw err;
  }
};

// Backup for generateVerdict if Gemini fails
const generateVerdict = async (prompt) => {
  console.log('[GROQ] Attempting verdict generation as Gemini backup...');

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a senior NDMA resource planning official. Return only raw HTML content using the exact CSS classes provided. No markdown, no code blocks, no preamble.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    const responseText = completion.choices[0].message.content;
    const cleaned = stripCodeFences(responseText);

    console.log(`[GROQ] Verdict generated — ${cleaned.length} characters`);
    return cleaned;

  } catch (err) {
    console.error('[GROQ] Verdict generation failed:', err.message);
    throw err;
  }
};

// Last resort fallback — generate minimal report from raw simulation data
// Used if both Gemini and Groq fail
const generateFallbackReport = (simulationLog) => {
  console.log('[GROQ] Generating hardcoded fallback report from simulation data...');

  const { agents, worldState } = simulationLog;
  const trapped = agents.filter(a => a.status === 'trapped');
  const safe = agents.filter(a => a.status === 'safe');
  const survivalRate = Math.round((safe.length / agents.length) * 100);

  const trappedList = trapped.map(a =>
    `<div class="failure-block">
      <div class="failure-num">Critical Failure — Agent ${a.id}</div>
      <div class="failure-title">${a.name} — ${a.role} — ${a.zone}</div>
      <div class="failure-body">
        ${a.name}, ${a.age}, ${a.role} located in ${a.neighborhood}, ${a.zone}.
        Status at Tick 10: TRAPPED. ${a.currentThought || ''}
        <br><br><strong>Root Cause:</strong> Simulation engine identified this agent as unrescued at simulation end.
      </div>
      <div class="failure-pop">This agent represents vulnerable population in ${a.zone}.</div>
    </div>`
  ).join('');

  return `
    <div class="report-header">
      <div class="gov-line">National Disaster Management Authority — Government of India</div>
      <div class="report-title">POST-SIMULATION BOTTLENECK ANALYSIS REPORT</div>
      <div class="report-sub">CrisisSwarm Multi-Agent Disaster Response Simulation — ${worldState.disaster.location} ${worldState.disaster.type} Scenario</div>
    </div>

    <div class="alert-strip">
      <p>SIMULATION CLASSIFICATION: CRITICAL — ${trapped.length} OF 20 AGENTS UNRESCUED AT SIMULATION END</p>
    </div>

    <div class="section-title">1. Executive Summary</div>
    <p class="body-text">
      This simulation modeled ${agents.length} agents across ${worldState.disaster.location} during a ${worldState.disaster.type} event.
      Of ${agents.length} agents, ${safe.length} reached safety and ${trapped.length} remained unrescued at simulation end.
      Overall survival rate: ${survivalRate}%.
    </p>

    <div class="summary-grid">
      <div class="summary-box s-safe"><div class="snum">${safe.length}</div><div class="slbl">Reached Safety</div></div>
      <div class="summary-box s-trapped"><div class="snum">${trapped.length}</div><div class="slbl">Trapped</div></div>
      <div class="summary-box s-partial"><div class="snum">${agents.length - safe.length - trapped.length}</div><div class="slbl">Partial</div></div>
      <div class="summary-box s-total"><div class="snum">${survivalRate}%</div><div class="slbl">Survival Rate</div></div>
    </div>

    <div class="section-title">2. Critical Failure Analysis</div>
    ${trappedList}

    <div class="section-title">3. Note</div>
    <p class="body-text">
      Full AI-generated analysis was unavailable due to API limitations during this session.
      The above represents raw simulation output. Agent names, zones, and outcomes are accurate
      simulation data. Detailed narrative analysis requires Gemini or Groq API availability.
    </p>
  `;
};

module.exports = {
  extractWorldState,
  generateReport,
  generateVerdict,
  generateFallbackReport
};