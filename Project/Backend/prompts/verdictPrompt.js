const getVerdictPrompt = (simulationLog, bottleneckReport) => {
  const { agents, worldState, ticks, needs, coordinatorLog, shelterLog } = simulationLog;

  const trappedAgents = agents.filter(a => a.status === 'trapped');
  const safeAgents = agents.filter(a => a.status === 'safe');
  const totalAgents = agents.length;
  const survivalRate = Math.round((safeAgents.length / totalAgents) * 100);
  const failureCount = trappedAgents.length;

  // Calculate readiness score
  // Critical failures (unrescued medical) weighted 3x
  // Non-medical trapped weighted 2x
  // Operational failures weighted 1x
  const criticalFailures = trappedAgents.filter(a => a.vulnerability === 'critical').length;
  const nonCriticalTrapped = trappedAgents.filter(a => a.vulnerability !== 'critical').length;
  const operationalFailures = coordinatorLog ? coordinatorLog.filter(l => l.overloaded).length : 2;
  const maxScore = (criticalFailures * 3 + nonCriticalTrapped * 2 + operationalFailures * 1) * 10;
  const rawReadiness = Math.max(20, Math.min(65, survivalRate - (criticalFailures * 8) - (nonCriticalTrapped * 4)));

  return `You are a senior resource planning official at the National Disaster Management Authority of India.
Based on the simulation log and bottleneck report below, generate the Final Verdict and Resource Requirements section.

CRITICAL INSTRUCTION: Return ONLY raw HTML content.
Do not return CSS styles.
Do not return markdown.
Do not return code blocks.
Do not return the outer .report div wrapper.
Start directly with the hr tag followed by section-title div.

Use EXACTLY these CSS classes — same stylesheet as the bottleneck report:
verdict-banner, verdict-score-row, score-circle, score-num, score-lbl, verdict-title, verdict-sub, verdict-meaning,
readiness-breakdown, rb-row, rb-label, rb-bar, rb-fill, rb-score, fill-red, fill-amber, fill-green,
rs-title, team-table, td-role, td-current, td-required, td-deficit, td-zone, td-reason,
zone-verdict, zv-red, zv-amber, zv-safe, zv-header, zv-badge, zvb-red, zvb-amber, zvb-safe,
zv-name, zv-readiness, zvr-red, zvr-amber, zvr-green, zv-body, zv-needs, need-tag, nt-red, nt-amber, nt-green,
inaction-box, inaction-title, inaction-row, ir-label, ir-value,
final-box, final-box-title, final-statement, final-highlight,
total-row, total-label, total-val

START WITH EXACTLY THIS:

<hr>
<div class="section-title">9. Final Verdict — Disaster Response Readiness Assessment</div>

<div class="verdict-banner">
  <div class="verdict-score-row">
    <div>
      <div class="verdict-title">${worldState.disaster.location.toUpperCase()} ${worldState.disaster.type.toUpperCase()} — RESPONSE READINESS VERDICT</div>
      <div class="verdict-sub">Based on CrisisSwarm Multi-Agent Simulation — 20 agents — 10 ticks — ${worldState.disaster.district} district</div>
      <div class="verdict-meaning">[fill: Current plan is CRITICALLY/MODERATELY/SEVERELY UNDER-RESOURCED for this disaster scenario]</div>
    </div>
    <div class="score-circle">
      <div class="score-num">[X]%</div>
      <div class="score-lbl">Readiness Score</div>
    </div>
  </div>
  <p style="font-size:11px;color:#333;margin:6px 0 0;text-align:left">
    <strong>Score Interpretation:</strong> [2-3 sentences explaining what this score means for ${worldState.disaster.location}, referencing the specific failures from the simulation]
  </p>
</div>

THEN Section 9A Readiness Score Breakdown:
Generate exactly 10 rb-row items for these categories with percentage scores derived from simulation data:
1. Medical Emergency Response — score based on whether critical medical agents were rescued
2. Alert & Communication Coverage — score based on how many agents received alerts
3. Shelter Capacity & Management — score based on shelter overflow events
4. Accessibility & Inclusion — score based on whether accessible vehicle requests were fulfilled (0% if zero accessible vehicles)
5. Coordinator & NDRF Capacity — score based on coordinator overload ratio
6. Evacuation Route Redundancy — score based on route blocking events
7. Misinformation Control — score based on misinformation what-if events
8. Volunteer Integration — score based on whether volunteers were in official plan (always low)
9. Road Connectivity Backup — score based on blocked road count vs alternate routes
10. Community Self-Organization — score based on green agent effectiveness

For each rb-row:
- use fill-red class if score under 40%
- use fill-amber class if score 40-70%
- use fill-green class if score above 70%
- set width of rb-fill div to exact percentage

THEN Section 9B Total Resource Requirements:

HUMAN RESOURCE REQUIREMENTS table (team-table class):
Headers: Role | Currently Deployed | Required | Deficit | Zone Required | Justification
Generate rows for:
- NDRF Rescue Teams
- Ambulance Crews
- Shelter Management Staff
- Emergency Coordinators
- Medical Officers (Field)
- Alert Communication Officers
- Registered Volunteers (Pre-trained)

For each row:
- Currently Deployed: derive from world state responders
- Required: calculate from simulation failures — each trapped agent justifies specific additions
- Deficit: required minus current
- Zone Required: specific zone name from world state where resource must go
- Justification: name the specific agent from simulation whose failure justifies this number

Add total-row: Total Additional Human Resources Required — calculate exact number

VEHICLE & EQUIPMENT REQUIREMENTS table:
Headers: Resource | Current | Required | Deficit | Pre-position Location | Reason from Simulation
Generate rows for:
- Standard Ambulances
- Accessible / Stretcher Vehicles (always 0 current — this is a guaranteed gap)
- Rescue Boats
- Group Transport Buses
- Portable Loudspeakers / PA Systems
- Backup Power Generators

Add total-row for vehicles and equipment separately

SHELTER CAPACITY REQUIREMENTS table:
Headers: Shelter | Current Capacity | Required Capacity | Gap | Action Required
Generate one row per shelter from world state plus one row for "New Shelter Required"

Add total-row: Total Additional Shelter Capacity Required

THEN Section 9C Zone-by-Zone Readiness Verdict:
Generate one zone-verdict div per zone from world state:
- Red zones get zv-red class and zvb-red badge
- Amber zones get zv-amber class and zvb-amber badge
- Safe zones get zv-safe class and zvb-safe badge

For each zone:
- zv-readiness: calculate percentage — red zones typically 20-35%, amber 50-65%, safe 65-80%
- zv-body: 3-4 sentences about what failed in that zone, which agents were there, what the specific gaps are
- zv-needs: 4-6 need-tag spans listing specific resources needed in that zone

THEN Section 9D Cost of Inaction:
inaction-box with these exact rows derived from simulation data:
- Estimated unrescued critical cases
- Children or dependents with unconfirmed safety
- Population receiving zero alert (non-smartphone users)
- Rescue requests unactioned at peak overload
- Zones with zero medical access after flood peak
- Persons with mobility disability with zero evacuation option
- Official system survival rate (simulation result)
- Final row with green ir-value: Projected survival rate with all recommendations implemented (always 92-96%)

THEN Section 9E Final Statement:
final-box div with:
- final-box-title: "CrisisSwarm Simulation Engine — Final Verdict"
- final-statement with these exact highlighted points using final-highlight class:
  * The readiness score percentage
  * Number of unrescued agents
  * Number of specific preventable gaps
  * Total additional human resources number
  * Total additional vehicles number
  * Total additional shelter beds number
  * The single most impactful intervention from simulation
  * The second most impactful intervention
  * Closing line: "CrisisSwarm does not predict the future. It stress-tests the present. Every failure documented here is a gap that exists today. Every recommendation is actionable today. The question is not whether the next disaster will come — it is whether these gaps will still exist when it does."

RULES:
- Use ${worldState.disaster.location} and ${worldState.disaster.state} throughout — never hardcode any other city
- Every number must be derived from simulation data
- Every resource requirement must name the specific agent failure that justifies it
- Readiness score must be between 20% and 65% — calculate from weighted failure formula
- No generic statements — every line must reference the simulation
- The final statement closing line must appear word for word as written above

Simulation log:
${JSON.stringify(simulationLog, null, 2)}

Bottleneck report:
${bottleneckReport}`;
};

module.exports = { getVerdictPrompt };