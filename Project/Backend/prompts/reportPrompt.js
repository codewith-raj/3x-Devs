const getReportPrompt = (simulationLog) => {
  const { agents, worldState, ticks, needs, coordinatorLog, shelterLog, whatIfEvents } = simulationLog;

  const trappedAgents = agents.filter(a => a.status === 'trapped');
  const safeAgents = agents.filter(a => a.status === 'safe');
  const totalAgents = agents.length;
  const survivalRate = Math.round((safeAgents.length / totalAgents) * 100);

  return `You are a senior official at the National Disaster Management Authority of India writing a formal post-simulation analysis report.
Based on the simulation log below, generate a complete government-style bottleneck report.

CRITICAL INSTRUCTION: Return ONLY the inner HTML content that goes inside the report div.
Do not return the outer .report div wrapper.
Do not return any CSS styles.
Do not return markdown.
Do not return code blocks.
Return only raw HTML starting from the report-header div.

Use EXACTLY this HTML structure and CSS classes — do not invent new classes:

START WITH THIS EXACT STRUCTURE:

<div class="report-header">
  <div class="gov-line">National Disaster Management Authority — Government of India</div>
  <div class="gov-line" style="margin-top:2px">${worldState.disaster.issued_by} — District Emergency Operations Centre</div>
  <div class="report-title">POST-SIMULATION BOTTLENECK ANALYSIS REPORT</div>
  <div class="report-sub">CrisisSwarm Multi-Agent Disaster Response Simulation — ${worldState.disaster.location} ${worldState.disaster.type} Scenario</div>
</div>

<div class="alert-strip">
  <p>SIMULATION CLASSIFICATION: [CRITICAL/HIGH/MODERATE] — [X] OF 20 AGENTS UNRESCUED AT SIMULATION END</p>
</div>

THEN meta-table with these exact rows:
- Report Reference: CRISISSWARM/[STATE_ABBR]/[DISASTER_TYPE]/2024/SIM-001
- Simulation Scenario: [location] [disaster type] — [river name if any] Overflow
- Affected Districts: [districts from world state]
- Simulation Duration: 10 Ticks — 6:00 AM to 8:30 AM (2 hours 30 minutes simulated)
- Total Agents Simulated: 20 representative citizens across 4 behavioral categories
- Population Represented: Approximately [X] lakh residents across affected zones
- Simulation Engine: CrisisSwarm v1.0 — Multi-agent BFS flood propagation model
- Report Generated: Tick 10 — 8:30 AM — Groq LLM Analysis Engine
- Classification: FOR OFFICIAL USE — DISASTER PREPAREDNESS PLANNING

THEN Section 1 Executive Summary:
- Write 3 paragraphs summarizing what happened in the simulation
- Reference specific agent names, tick numbers, and events from the log
- State exact number of critical failures, secondary failures, misinformation events
- Third paragraph must mention coordinator overload tick and pending requests count

THEN summary-grid with 4 boxes:
- Safe count (s-safe class)
- Trapped count (s-trapped class)  
- Partial outcome count (s-partial class)
- Survival rate percentage (s-total class)

THEN Section 2 Critical Failure Analysis:
For each trapped or unrescued agent generate a failure-block with:
- failure-num: "Critical Failure 0X — Life-Safety Impact: Extreme/High/Medium-High"
- failure-title: descriptive title naming the systemic failure
- agent-tag badge with agent ID
- failure-agent: agent name, age, role, zone in italic red
- Full narrative paragraph: what happened tick by tick, when they called for help, what failed, what the situation was at tick 10
- Root Cause statement in bold
- failure-pop: population category this agent represents with estimated number

THEN Section 3 Secondary Coordination Failures:
- warning-block for coordinator overload with exact tick numbers and request counts
- warning-block for misinformation cascade if any what-if events triggered it
- success-block for any positive volunteer outcomes

THEN Section 4 Disaster Timeline table:
Generate one row per tick (Tick 0 through Tick 10) with:
- td-tick: Tick number
- Time: starting 6:00 AM, each tick = 15 minutes
- td-event: what happened that tick based on simulation log
- td-impact: consequence in red italic

THEN Section 5 Resource Utilization Analysis table:
For each resource (ambulances, shelters, hospital, NDRF, coordinator, accessible vehicles, volunteers):
- Resource name
- Capacity
- Peak usage
- Status at Tick 10 with res-full/res-ok/res-warn class
- Utilization bar with bar-fill div and percentage width

THEN Section 6 Community Volunteer Contribution:
- success-block listing each green group agent
- For each volunteer: name, what they did, how many people they helped
- Critical observation paragraph about volunteer gap in official plan

THEN Section 7 Recommendations — generate exactly 7:
Each rec-block with:
- rec-num: "Recommendation 0X — Priority: Immediate/High/Medium — [category]"
- rec-title: specific actionable title
- rec-body: 3-4 sentences — what to do, why, what simulation failure justifies it, estimated impact

THEN Section 8 Methodology Note:
- Standard paragraph about 20 agents representing larger population
- How BFS flood propagation works
- highlight-box with key finding about cascade failure tick

THEN signature section and footer using location-specific details.

RULES FOR CONTENT:
- Every failure must name the specific agent from the simulation log
- Every recommendation must reference the simulation failure that justifies it
- Every number must come from the simulation data
- Use ${worldState.disaster.location} and ${worldState.disaster.state} throughout — never say Uttarakhand unless that is the actual location
- Tick 0 = 6:00 AM, Tick 1 = 6:15 AM, Tick 2 = 6:30 AM, Tick 3 = 6:45 AM, Tick 4 = 7:00 AM, Tick 5 = 7:15 AM, Tick 6 = 7:30 AM, Tick 7 = 7:45 AM, Tick 8 = 8:00 AM, Tick 9 = 8:15 AM, Tick 10 = 8:30 AM
- No generic statements — every sentence must reference the simulation
- Write in formal government report language throughout

Simulation log:
${JSON.stringify(simulationLog, null, 2)}`;
};

module.exports = { getReportPrompt };