const { disasterEngine } = require('./disasterEngine');
const { cityGraph } = require('./cityGraph');
const { processAgentTick } = require('./agentEngine');
const { generateNeeds, processCoordinatorQueue } = require('./needsEngine');
const { generateReport, generateVerdict } = require('../services/geminiService');
const { generateReport: groqReport, generateVerdict: groqVerdict, generateFallbackReport } = require('../services/groqService');

const TOTAL_TICKS = 10;
const DEFAULT_TICK_SPEED = 1500;

class SimulationRunner {
  constructor() {
    this.currentTick = 0;
    this.isRunning = false;
    this.tickInterval = null;
    this.tickSpeed = DEFAULT_TICK_SPEED;

    // Simulation state
    this.agents = [];
    this.worldState = null;
    this.io = null;

    // Logs
    this.simulationLog = [];
    this.pendingNeeds = [];
    this.coordinatorLog = [];
    this.shelterOccupancy = {};
    this.whatIfEvents = [];
    this.allNeedsGenerated = [];
  }

  // Start the simulation
  start(agents, worldState, io) {
    if (this.isRunning) {
      console.warn('[TICK] Simulation already running');
      return;
    }

    this.agents = agents.map(a => ({ ...a }));
    this.worldState = worldState;
    this.io = io;
    this.isRunning = true;
    this.currentTick = 0;
    this.pendingNeeds = [];
    this.simulationLog = [];
    this.coordinatorLog = [];
    this.whatIfEvents = [];
    this.allNeedsGenerated = [];

    // Initialize shelter occupancy from world state
    this.shelterOccupancy = {};
    if (worldState.shelters) {
      worldState.shelters.forEach(shelter => {
        this.shelterOccupancy[shelter.name] = 0;
      });
    }

    // Initialize disaster engine
    cityGraph.buildFromWorldState(worldState);
    disasterEngine.initialize(worldState);

    console.log('[TICK] Simulation started');
    this._emitLog('Simulation started — 10 ticks at ' + this.tickSpeed + 'ms intervals', 'success');
    this._emitLog(`Disaster type: ${worldState.disaster.type} — Location: ${worldState.disaster.location}`, 'info');

    // Run first tick immediately then set interval
    this._runTick();
    this.tickInterval = setInterval(() => {
      this._runTick();
    }, this.tickSpeed);
  }

  // Stop the simulation
  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.isRunning = false;
    console.log('[TICK] Simulation stopped');
  }

  // Set tick speed — called from socket set-tick-speed event
  setSpeed(speed) {
    this.tickSpeed = Math.max(500, Math.min(3000, speed));
    if (this.isRunning && this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = setInterval(() => {
        this._runTick();
      }, this.tickSpeed);
    }
    console.log(`[TICK] Speed set to ${this.tickSpeed}ms`);
  }

  // Handle what-if triggers from frontend
  handleWhatIf(payload, io) {
    const { triggerType } = payload;
    this.whatIfEvents.push({ triggerType, tick: this.currentTick });

    switch (triggerType) {

      case 'close_bridge':
        // Remove a major road from the graph
        const roadToClose = payload.roadName ||
          (this.worldState.blocked_roads && this.worldState.blocked_roads[0]) ||
          'main_bridge';
        cityGraph.removeRoad(roadToClose);

        // Recalculate route blocked for all moving agents
        this.agents.forEach(agent => {
          if (agent.status === 'moving') {
            const blocked = disasterEngine.isRouteBlocked(
              agent.lat, agent.lng,
              agent.destinationLat || agent.lat,
              agent.destinationLng || agent.lng
            );
            if (blocked) {
              agent.status = 'trapped';
              agent.routeBlocked = true;
              agent.needsRescue = true;
              agent.currentThought = `The bridge just collapsed. My only route out is gone. I am trapped in ${agent.neighborhood}.`;
            }
          }
        });

        this._emitLog(`⚠ What-if: Bridge closed — agents rerouting`, 'warn');
        this._emitNotification('Bridge closed — route blocked for moving agents', 'danger');
        break;

      case 'shelter_full':
        // Set first shelter to zero capacity
        const shelterName = payload.shelterName ||
          (this.worldState.shelters && this.worldState.shelters[0]?.name) ||
          'Shelter A';

        if (this.worldState.shelters) {
          const shelter = this.worldState.shelters.find(s =>
            s.name.toLowerCase().includes(shelterName.toLowerCase())
          );
          if (shelter) {
            this.shelterOccupancy[shelter.name] = shelter.capacity;
            this._emitLog(`⚠ What-if: ${shelter.name} marked as full`, 'warn');
            this._emitNotification(`${shelter.name} is now full — evacuees being redirected`, 'warning');
          }
        }
        break;

      case 'hospital_power':
        // Mark hospital as offline
        this.worldState._hospitalOffline = true;
        this.agents.forEach(agent => {
          if (agent.group === 'blue' &&
            (agent.role.toLowerCase().includes('doctor') ||
             agent.role.toLowerCase().includes('hospital') ||
             agent.role.toLowerCase().includes('nurse'))) {
            agent.status = 'overloaded';
            agent.currentThought = `Hospital power just failed. Switching to backup generator — but we only have 4 hours of fuel. All equipment at risk.`;
          }
        });
        this._emitLog('⚠ What-if: Hospital power failure triggered', 'warn');
        this._emitNotification('Hospital power failure — backup generator activated', 'danger');
        break;

      case 'misinformation':
        // Reroute 3 amber agents toward a dangerous road
        let reroutedCount = 0;
        this.agents.forEach(agent => {
          if (agent.group === 'amber' &&
              agent.status === 'moving' &&
              reroutedCount < 3) {
            agent._misinformed = true;
            agent.currentThought = `Someone posted on WhatsApp that the Bisalpur Bridge is open. Changing my route. Hope it is true.`;
            // Move them slightly toward a worse position
            agent.destinationLat = agent.lat + 0.01;
            agent.destinationLng = agent.lng + 0.01;
            reroutedCount++;
          }
        });
        this._emitLog(`⚠ What-if: Misinformation spread — ${reroutedCount} agents rerouted`, 'warn');
        this._emitNotification(`Misinformation spreading — ${reroutedCount} agents taking wrong route`, 'warning');
        break;

      case 'heavy_rain':
        // Make disaster spread faster — reduce floodReachesAt for all amber agents
        this.agents.forEach(agent => {
          if (agent.group === 'amber' || agent.group === 'red') {
            agent.floodReachesAt = Math.max(1, Math.floor((agent.floodReachesAt || 6) * 0.7));
          }
          // Reduce movement speed
          agent._movementPenalty = 0.4;
        });
        this._emitLog('⚠ What-if: Heavy rain — disaster spreading 40% faster', 'warn');
        this._emitNotification('Heavy rain triggered — disaster spreading faster, movement slowed', 'warning');
        break;

      case 'deploy_ndrf':
        // Rescue 2 most critical trapped agents
        const criticalTrapped = this.agents
          .filter(a => a.status === 'trapped' && a.vulnerability === 'critical')
          .slice(0, 2);

        criticalTrapped.forEach(agent => {
          agent.status = 'moving';
          agent.needsRescue = false;
          agent.currentThought = `Extra NDRF team just arrived at ${agent.neighborhood}. Being evacuated now. Finally.`;
        });

        if (criticalTrapped.length === 0) {
          // Rescue highest priority non-critical trapped
          const highTrapped = this.agents
            .filter(a => a.status === 'trapped')
            .slice(0, 2);
          highTrapped.forEach(agent => {
            agent.status = 'moving';
            agent.needsRescue = false;
            agent.currentThought = `NDRF reinforcement team has reached me. Moving to safety now.`;
          });
        }

        this._emitLog(`✓ What-if: Extra NDRF deployed — ${criticalTrapped.length} agents rescued`, 'success');
        this._emitNotification(`Extra NDRF team deployed — rescuing ${criticalTrapped.length} critical agents`, 'success');
        break;

      default:
        console.warn(`[WHATIF] Unknown trigger: ${triggerType}`);
    }

    // Push immediate state update after what-if
    this._pushTickState(this.currentTick, {
      whatIfTriggered: triggerType
    });
  }

  // ── PRIVATE ──────────────────────────────────────────────────

  _runTick() {
    if (this.currentTick > TOTAL_TICKS) {
      this.stop();
      return;
    }

    console.log(`[TICK] Running tick ${this.currentTick}`);
    this._emitLog(`[TICK ${this.currentTick}]  ${this._tickToTime(this.currentTick)}  — Processing ${this.agents.length} agents`, 'info');

    // Step 1 — Spread disaster
    const disasterState = disasterEngine.spreadDisaster(this.currentTick);
    this._emitLog(
      `Disaster spread — ${disasterState.affectedNodes.length} zones affected, ${disasterState.newlyAffected.length} newly`,
      disasterState.newlyAffected.length > 0 ? 'warn' : 'info'
    );

    // Step 2 — Process each agent
    this.agents = this.agents.map(agent => {
      return processAgentTick(
        agent,
        this.currentTick,
        this.worldState,
        this.shelterOccupancy
      );
    });

    // Step 3 — Update shelter occupancy
    this._updateShelterOccupancy();

    // Step 4 — Generate needs from current agent states
    const newNeeds = generateNeeds(this.agents, this.currentTick, this.worldState);
    newNeeds.forEach(need => {
      // Only add if not already in pending
      const exists = this.pendingNeeds.some(p =>
        p.agentId === need.agentId && p.needType === need.needType
      );
      if (!exists) {
        this.pendingNeeds.push(need);
        this.allNeedsGenerated.push(need);
      }
    });

    // Step 5 — Coordinator processes queue — max 3 per tick
    const coordinatorResult = processCoordinatorQueue(
      this.pendingNeeds,
      this.agents,
      this.currentTick
    );

    this.pendingNeeds = coordinatorResult.stillPending;

    this.coordinatorLog.push({
      tick: this.currentTick,
      time: this._tickToTime(this.currentTick),
      received: newNeeds.length,
      actioned: coordinatorResult.actionedCount,
      pending: coordinatorResult.pendingCount,
      overloaded: coordinatorResult.overloaded
    });

    if (coordinatorResult.overloaded) {
      this._emitLog(
        `⚠ Coordinator overloaded — ${coordinatorResult.pendingCount} requests pending, only 3 actioned`,
        'warn'
      );
    }

    // Step 6 — Compute stats
    const stats = this._computeStats();

    // Step 7 — Log tick state
    const tickState = {
      tick: this.currentTick,
      time: this._tickToTime(this.currentTick),
      agents: this.agents.map(a => ({ ...a })),
      disasterState,
      shelterOccupancy: { ...this.shelterOccupancy },
      newNeeds,
      coordinatorResult,
      pendingCount: this.pendingNeeds.length,
      stats,
      whatIfEvents: this.whatIfEvents.filter(e => e.tick === this.currentTick)
    };

    this.simulationLog.push(tickState);

    // Step 8 — Emit to frontend
    this._pushTickState(this.currentTick, { stats });

    // Step 9 — Log key events
    this._logKeyEvents(stats);

    // Step 10 — Check if simulation complete
    if (this.currentTick === TOTAL_TICKS) {
      this._onSimulationComplete();
    }

    this.currentTick++;
  }

  _onSimulationComplete() {
    console.log('[TICK] Simulation complete — generating reports');
    this._emitLog('Simulation complete — generating bottleneck report via Gemini...', 'info');

    // Emit simulation-complete event with full log
    this.io.emit('simulation-complete', {
      simulationLog: this.simulationLog,
      agents: this.agents,
      worldState: this.worldState,
      stats: this._computeStats()
    });

    // Build complete simulation log object for report generation
    const fullLog = {
      agents: this.agents,
      worldState: this.worldState,
      ticks: this.simulationLog,
      needs: this.allNeedsGenerated,
      coordinatorLog: this.coordinatorLog,
      shelterLog: this.shelterOccupancy,
      whatIfEvents: this.whatIfEvents,
      finalStats: this._computeStats()
    };

    // Generate reports with fallback chain
    this._generateReports(fullLog);
  }

  async _generateReports(simulationLog) {
    let bottleneckReport = null;
    let verdict = null;

    // Try Gemini first
    try {
      this._emitLog('Generating bottleneck report → Gemini 1.5 Flash...', 'info');
      bottleneckReport = await generateReport(simulationLog);
      this._emitLog('✓ Bottleneck report generated by Gemini', 'success');
    } catch (geminiErr) {
      console.error('[REPORT] Gemini report failed:', geminiErr.message);
      this._emitLog('Gemini report failed — trying Groq backup...', 'warn');

      // Try Groq backup
      try {
        const { getReportPrompt } = require('../prompts/reportPrompt');
        const prompt = getReportPrompt(simulationLog);
        bottleneckReport = await groqReport(prompt);
        this._emitLog('✓ Bottleneck report generated by Groq', 'success');
      } catch (groqErr) {
        console.error('[REPORT] Groq report failed:', groqErr.message);
        this._emitLog('Groq failed — using fallback report generator', 'warn');
        bottleneckReport = generateFallbackReport(simulationLog);
        this._emitLog('✓ Fallback report generated from simulation data', 'success');
      }
    }

    // Try Gemini verdict
    try {
      this._emitLog('Generating final verdict → Gemini 1.5 Flash...', 'info');
      verdict = await generateVerdict(simulationLog, bottleneckReport);
      this._emitLog('✓ Final verdict generated by Gemini', 'success');
    } catch (geminiErr) {
      console.error('[VERDICT] Gemini verdict failed:', geminiErr.message);
      this._emitLog('Gemini verdict failed — trying Groq backup...', 'warn');

      try {
        const { getVerdictPrompt } = require('../prompts/verdictPrompt');
        const prompt = getVerdictPrompt(simulationLog, bottleneckReport);
        verdict = await groqVerdict(prompt);
        this._emitLog('✓ Final verdict generated by Groq', 'success');
      } catch (groqErr) {
        console.error('[VERDICT] Groq verdict failed:', groqErr.message);
        verdict = `<hr><div class="section-title">9. Final Verdict</div>
          <p class="body-text">Verdict generation unavailable. Simulation survival rate: ${this._computeStats().survivalRate}%.</p>`;
        this._emitLog('Using minimal fallback verdict', 'warn');
      }
    }

    // Emit report-ready to frontend
    this.io.emit('report-ready', {
      bottleneckReport,
      verdict,
      stats: this._computeStats()
    });

    this._emitLog('✓ Report ready — check the Report tab', 'success');
  }

  _updateShelterOccupancy() {
    if (!this.worldState.shelters) return;

    this.worldState.shelters.forEach(shelter => {
      const occupants = this.agents.filter(agent =>
        agent.status === 'safe' &&
        agent.destination &&
        (agent.destination.toLowerCase().includes(shelter.name.toLowerCase()) ||
         shelter.name.toLowerCase().includes(agent.destination.toLowerCase()) ||
         agent.zone === shelter.zone)
      ).length;

      this.shelterOccupancy[shelter.name] = Math.min(occupants, shelter.capacity);
    });
  }

  _computeStats() {
    const safe = this.agents.filter(a => a.status === 'safe').length;
    const trapped = this.agents.filter(a => a.status === 'trapped').length;
    const moving = this.agents.filter(a =>
      ['moving', 'active', 'helping'].includes(a.status)
    ).length;
    const managing = this.agents.filter(a =>
      ['managing', 'overloaded'].includes(a.status)
    ).length;

    return {
      safe,
      trapped,
      moving,
      managing,
      total: this.agents.length,
      survivalRate: Math.round((safe / this.agents.length) * 100),
      disasterCoverage: disasterEngine.getDisasterCoverage()
    };
  }

  _pushTickState(tick, extra = {}) {
    const mapData = disasterEngine.getMapData();
    const stats = this._computeStats();

    this.io.emit('tick-update', {
      tick,
      time: this._tickToTime(tick),
      agents: this.agents,
      floodedNodes: mapData.floodedNodes,
      floodedRoads: mapData.floodedRoads,
      affectedNodes: mapData.affectedNodes,
      affectedRoads: mapData.affectedRoads,
      disasterColor: mapData.disasterColor,
      disasterLabel: mapData.disasterLabel,
      disasterCoverage: mapData.disasterCoverage,
      shelterOccupancy: this.shelterOccupancy,
      pendingRequests: this.pendingNeeds.length,
      safe: stats.safe,
      moving: stats.moving,
      trapped: stats.trapped,
      managing: stats.managing,
      graphEdges: cityGraph.getAllEdges(),
      ...extra
    });
  }

  _logKeyEvents(stats) {
    // Log significant events
    const trapped = this.agents.filter(a => a.status === 'trapped');
    trapped.forEach(agent => {
      if (!agent._trappedLogged) {
        this._emitLog(
          `⚠ ${agent.name} — TRAPPED in ${agent.neighborhood} — ${agent.rescueType || 'rescue'} needed`,
          'warn'
        );
        agent._trappedLogged = true;
      }
    });

    const newlySafe = this.agents.filter(a =>
      a.status === 'safe' && !a._safeLogged
    );
    newlySafe.forEach(agent => {
      this._emitLog(`✓ ${agent.name} reached safety at ${agent.destination}`, 'success');
      agent._safeLogged = true;
    });

    if (this.pendingNeeds.length >= 6) {
      this._emitLog(
        `⚠ COORDINATOR OVERLOAD — ${this.pendingNeeds.length} pending requests`,
        'warn'
      );
    }
  }

  _emitLog(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    this.io.emit('log-event', { timestamp, message, level });
    console.log(`[LOG] ${timestamp} ${message}`);
  }

  _emitNotification(message, type = 'info') {
    this.io.emit('notification', { message, type, tick: this.currentTick });
  }

  _tickToTime(tick) {
    const totalMinutes = tick * 15;
    const hours = 6 + Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHour = hours > 12 ? hours - 12 : hours;
    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  }
}

module.exports = { SimulationRunner };