const express = require('express');
const multer = require('multer');
const Groq = require('groq-sdk');
const router = express.Router();

const { extractText } = require('../services/pdfParser');
const { extractWorldState } = require('../services/geminiService');
const { extractWorldState: groqExtractWorldState } = require('../services/groqService');
const { generateAgents } = require('../services/claudeService');
const { cityGraph } = require('../simulation/cityGraph');
const { getWorldStatePrompt } = require('../prompts/worldStatePrompt');
const { getAgentGenerationPrompt } = require('../prompts/agentGenerationPrompt');

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'), false);
    }
  }
});

const enrichAgents = (agents, worldState) => {
  return agents.map(agent => {
    const zoneRisk = (() => {
      if (worldState.zones.red.some(z =>
        z.toLowerCase().includes(agent.zone.toLowerCase()) ||
        agent.zone.toLowerCase().includes(z.toLowerCase())
      )) return 'red';
      if (worldState.zones.amber.some(z =>
        z.toLowerCase().includes(agent.zone.toLowerCase()) ||
        agent.zone.toLowerCase().includes(z.toLowerCase())
      )) return 'amber';
      return 'safe';
    })();

    const floodReachesAt = zoneRisk === 'red' ? 3 : zoneRisk === 'amber' ? 6 : 999;

    const routeBlocked = (() => {
      if (!worldState.blocked_roads || worldState.blocked_roads.length === 0) return false;
      return worldState.blocked_roads.some(road =>
        road.toLowerCase().includes(agent.zone.toLowerCase()) ||
        road.toLowerCase().includes((agent.neighborhood || '').toLowerCase()) ||
        (agent.neighborhood || '').toLowerCase().includes(road.toLowerCase())
      );
    })();

    const receivedAlert = agent.hasSmartphone;

    const nearestShelter = (() => {
      if (!worldState.shelters || worldState.shelters.length === 0) return 'Nearest Shelter';
      const zoneMatch = worldState.shelters.find(s =>
        s.zone && (s.zone.toLowerCase().includes(agent.zone.toLowerCase()) ||
        agent.zone.toLowerCase().includes(s.zone.toLowerCase()))
      );
      return zoneMatch ? zoneMatch.name : worldState.shelters[0].name;
    })();

    const rescueAvailable = !!(worldState.responders && worldState.responders.length > 0);

    const destCoords = (() => {
      if (!worldState.shelters || worldState.shelters.length === 0) {
        return { lat: worldState.map_center.lat, lng: worldState.map_center.lng };
      }
      const shelter = worldState.shelters.find(s => s.name === nearestShelter) || worldState.shelters[0];
      return { lat: shelter.lat, lng: shelter.lng };
    })();

    return {
      ...agent,
      zoneRisk,
      floodReachesAt,
      routeBlocked,
      receivedAlert,
      nearestShelter,
      rescueAvailable,
      destinationLat: destCoords.lat,
      destinationLng: destCoords.lng,
      status: 'active',
      currentThought: agent.initialThought,
      needsRescue: false,
      rescueType: null,
      _trappedLogged: false,
      _safeLogged: false,
      _misinformed: false
    };
  });
};

// Generate agents via Groq as fallback
const generateAgentsViaGroq = async (worldState, emitLog) => {
  emitLog('Attempting agent generation via Groq fallback...', 'warn');

  const prompt = getAgentGenerationPrompt(worldState);

  const completion = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You generate disaster simulation agents for Indian disaster scenarios. Return ONLY a valid JSON array of exactly 20 agents. No markdown, no explanation, no code blocks. The array must be directly parseable.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 4000
  });

  const text = completion.choices[0].message.content;
  const stripped = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

  // Find JSON array
  const arrayMatch = stripped.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error('No valid JSON array found in Groq response');

  const agents = JSON.parse(arrayMatch[0]);
  if (!Array.isArray(agents)) throw new Error('Groq response is not an array');

  emitLog(`✓ ${agents.length} agents generated via Groq`, 'success');
  return agents;
};

router.post('/upload', upload.single('pdf'), async (req, res) => {
  const startTime = Date.now();
  const io = global.io;

  const emitLog = (message, level = 'info') => {
    if (io) {
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });
      io.emit('log-event', { timestamp, message, level });
    }
    console.log(`[UPLOAD] ${message}`);
  };

  const emitPipelineStep = (stepNumber, status, data = {}) => {
    if (io) io.emit('pipeline-step', { stepNumber, status, data });
  };

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    emitLog(`Loading disaster advisory — ${req.file.originalname} (${Math.round(req.file.size / 1024)}KB)`, 'info');
    emitPipelineStep(1, 'processing', {});

    // ── STEP 1 — PDF text extraction ─────────────────────
    emitLog('Extracting text from PDF...', 'info');
    const pdfText = await extractText(req.file.buffer);

    if (!pdfText || pdfText.trim().length < 50) {
      emitLog('PDF text extraction returned minimal content — proceeding with available text', 'warn');
    } else {
      emitLog(`✓ PDF parsed — ${pdfText.length} characters extracted`, 'success');
    }

    // ── STEP 2 — World state extraction ──────────────────
    emitLog('World state extraction started → Gemini 1.5 Flash', 'info');
    let worldState = null;

    try {
      worldState = await extractWorldState(pdfText);
      emitLog(`✓ World state extracted — ${worldState.zones.red.length} red, ${worldState.zones.amber.length} amber, ${worldState.zones.safe.length} safe zones`, 'success');
    } catch (geminiErr) {
      emitLog(`Gemini world state failed — trying Groq backup: ${geminiErr.message}`, 'warn');
      try {
        const prompt = getWorldStatePrompt(pdfText);
        worldState = await groqExtractWorldState(pdfText, prompt);
        emitLog('✓ World state extracted via Groq backup', 'success');
      } catch (groqErr) {
        emitLog(`Groq backup also failed: ${groqErr.message}`, 'error');
        return res.status(500).json({
          success: false,
          error: 'World state extraction failed on both Gemini and Groq',
          details: groqErr.message
        });
      }
    }

    // Ensure map_center exists
    if (!worldState.map_center) {
      if (worldState.shelters && worldState.shelters.length > 0) {
        const avgLat = worldState.shelters.reduce((s, x) => s + x.lat, 0) / worldState.shelters.length;
        const avgLng = worldState.shelters.reduce((s, x) => s + x.lng, 0) / worldState.shelters.length;
        worldState.map_center = { lat: avgLat, lng: avgLng, zoom: 12 };
      } else {
        worldState.map_center = { lat: 20.5937, lng: 78.9629, zoom: 5 };
      }
    }

    emitPipelineStep(1, 'completed', {
      zones: worldState.zones,
      blockedRoads: worldState.blocked_roads,
      shelters: worldState.shelters,
      hospitals: worldState.hospitals,
      responders: worldState.responders,
      disaster: worldState.disaster,
      mapCenter: worldState.map_center
    });

    // ── STEP 3 — Build city graph ─────────────────────────
    emitLog('Building disaster graph from world state...', 'info');
    cityGraph.buildFromWorldState(worldState);
    emitLog(`✓ Graph built — ${Object.keys(cityGraph.nodes).length} nodes`, 'success');

    // ── STEP 4 — Agent generation ─────────────────────────
    emitLog('Agent generation started → Claude claude-sonnet-4-5', 'info');
    emitPipelineStep(2, 'processing', {});

    let rawAgents = null;

    // Try Claude first
    try {
      rawAgents = await generateAgents(worldState, emitLog);
      emitLog(`✓ All ${rawAgents.length} agents generated by Claude`, 'success');
    } catch (claudeErr) {
      emitLog(`Claude failed (${claudeErr.message.includes('credit') ? 'insufficient credits' : claudeErr.message}) — switching to Groq...`, 'warn');

      // Groq fallback for agents
      try {
        rawAgents = await generateAgentsViaGroq(worldState, emitLog);
      } catch (groqErr) {
        emitLog(`Groq agent generation failed: ${groqErr.message}`, 'error');
        return res.status(500).json({
          success: false,
          error: 'Agent generation failed on both Claude and Groq',
          details: groqErr.message
        });
      }
    }

    // ── STEP 5 — Enrich agents ────────────────────────────
    emitLog('Enriching agents with simulation properties...', 'info');
    const enrichedAgents = enrichAgents(rawAgents, worldState);
    emitLog('✓ All agents enriched and positioned on map', 'success');

    emitPipelineStep(2, 'completed', {
      agents: enrichedAgents,
      agentCount: enrichedAgents.length,
      distribution: {
        blue:  enrichedAgents.filter(a => a.group === 'blue').length,
        red:   enrichedAgents.filter(a => a.group === 'red').length,
        amber: enrichedAgents.filter(a => a.group === 'amber').length,
        green: enrichedAgents.filter(a => a.group === 'green').length
      }
    });

    emitPipelineStep(3, 'completed', {
      tickCount: 10,
      tickSpeed: 1500,
      startTime: '06:00 AM',
      endTime: '08:30 AM',
      disasterType: worldState.disaster.type,
      location: worldState.disaster.location,
      distribution: {
        blue:  enrichedAgents.filter(a => a.group === 'blue').length,
        red:   enrichedAgents.filter(a => a.group === 'red').length,
        amber: enrichedAgents.filter(a => a.group === 'amber').length,
        green: enrichedAgents.filter(a => a.group === 'green').length
      }
    });

    emitPipelineStep(4, 'pending', {});

    // ── STORE GLOBAL STATE ────────────────────────────────
    global.simState = { worldState, agents: enrichedAgents };

    const elapsed = Date.now() - startTime;
    emitLog(`✓ Simulation ready — ${elapsed}ms total processing time`, 'success');
    emitLog('Press Start Simulation to begin the 10-tick disaster simulation', 'info');

    return res.json({
      success: true,
      worldState,
      agents: enrichedAgents,
      mapCenter: worldState.map_center,
      graphNodes: cityGraph.getAllNodes(),
      graphEdges: cityGraph.getAllEdges(),
      processingTime: elapsed
    });

  } catch (err) {
    console.error('[UPLOAD] Unexpected error:', err);
    emitLog(`✗ Upload processing failed: ${err.message}`, 'error');
    return res.status(500).json({
      success: false,
      error: 'Upload processing failed',
      details: err.message
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    simLoaded: !!global.simState,
    agentCount: global.simState?.agents?.length || 0
  });
});

module.exports = router;