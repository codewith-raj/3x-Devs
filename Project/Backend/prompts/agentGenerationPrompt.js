const getAgentGenerationPrompt = (worldState) => {
  return `You are generating disaster simulation agents for CrisisSwarm, a multi-agent disaster response simulation platform.
The simulation is set in ${worldState.disaster.location}, ${worldState.disaster.state}, India during a ${worldState.disaster.type} disaster.
Based on the world state below, generate exactly 20 realistic citizen agents who would live and work in the affected zones.
Return ONLY a valid JSON array with no explanation, no markdown, no code blocks, no preamble.
The JSON must be parseable directly.

DISTRIBUTION RULES — MANDATORY — DO NOT DEVIATE:
- Exactly 5 agents must have group value "blue" — responders or infrastructure operators (police, hospital administrator, shelter manager, ambulance driver, NDRF coordinator)
- Exactly 5 agents must have group value "red" — vulnerable people in red zones who CANNOT self-evacuate
- Exactly 5 agents must have group value "amber" — mobile citizens who CAN potentially move but face real obstacles
- Exactly 5 agents must have group value "green" — community volunteers who self-deploy to help others

UNIQUENESS RULES — MANDATORY:
Each agent must represent a DIFFERENT TYPE of person. Do not generate two similar agents.
The 20 agents together must cover ALL of these demographic types — distribute across agents:
- Pregnant woman or new mother
- Elderly person living alone (60+ years)
- Person with no smartphone (feature phone only or no phone)
- Person with mobility disability or wheelchair user
- Daily wage worker or migrant laborer
- Shop owner or small business owner
- School teacher responsible for students
- Tourist or pilgrim visiting the area
- Local NGO volunteer or community organizer
- Government official or administrator
- Auto driver or local transport operator
- Young college student
- Farmer or rural worker
- Hospital doctor or nurse
- Retired person doing community work

DIAGNOSTIC DESIGN — MANDATORY:
Each red group agent must reveal a DIFFERENT SYSTEMIC FAILURE when they get into trouble:
- One red agent: reveals single ambulance route failure (pregnant woman or critical medical case)
- One red agent: reveals digital-only alert failure (no smartphone, receives zero warning)
- One red agent: reveals zero accessibility vehicles (wheelchair user or mobility impaired)
- One red agent: reveals shelter overflow (group leader with dependents arriving after capacity fills)
- One red agent: reveals low alert compliance (delayed evacuation converting mobile person to trapped)

LOCATION CONTEXT — CRITICAL:
The disaster is in ${worldState.disaster.location}, ${worldState.disaster.state}.
Generate agents who are REALISTIC for this specific location:
- Use names, occupations, and neighborhoods appropriate for ${worldState.disaster.state}
- Reference real localities, markets, hospitals, and landmarks from ${worldState.disaster.location}
- Socioeconomic mix should reflect the actual demographics of ${worldState.disaster.location}
- Use the exact zone names from the world state zones list

Red zones in this scenario: ${worldState.zones.red.join(', ')}
Amber zones in this scenario: ${worldState.zones.amber.join(', ')}
Safe zones in this scenario: ${worldState.zones.safe.join(', ')}

COORDINATE RULES — CRITICAL:
- Assign REAL latitude and longitude coordinates within the actual geographic boundaries of each zone
- The location is ${worldState.disaster.location} — use real coordinates for this city/district
- Map center for this scenario is lat ${worldState.map_center.lat}, lng ${worldState.map_center.lng}
- Place agents within 0.05 degrees of the map center, distributed across their zones
- Red zone agents must be placed within red zone geographic boundaries
- Safe zone agents (responders) must be placed in safe zone areas
- Do NOT use identical coordinates for two agents — vary by at least 0.003 degrees
- Do NOT place any agent outside India

RETURN FORMAT — each agent must have ALL these exact fields:
{
  "id": number (1 to 20),
  "name": "realistic full name appropriate for ${worldState.disaster.state}",
  "age": number,
  "role": "specific occupation grounded in ${worldState.disaster.location} economy",
  "group": "blue" | "red" | "amber" | "green",
  "zone": "exact zone name copied from world state zones list",
  "neighborhood": "specific locality within that zone with real place name from ${worldState.disaster.location}",
  "lat": number (real coordinate near ${worldState.map_center.lat}),
  "lng": number (real coordinate near ${worldState.map_center.lng}),
  "hasVehicle": boolean,
  "hasPhone": boolean,
  "hasSmartphone": boolean,
  "vulnerability": "low" | "medium" | "high" | "critical",
  "destination": "specific place they need to reach during the disaster",
  "backstory": "one sentence explaining their specific situation and why they are vulnerable or important in this scenario",
  "initialThought": "what they are thinking at tick zero when the disaster begins — first person, specific, emotionally real, references their actual location"
}

VALIDATION BEFORE RETURNING:
- Count blue agents — must be exactly 5
- Count red agents — must be exactly 5
- Count amber agents — must be exactly 5
- Count green agents — must be exactly 5
- Every agent has a unique id from 1 to 20
- No two agents have identical lat/lng
- Every red group agent has vulnerability "high" or "critical"
- Every blue group agent has hasPhone true
- At least 3 agents have hasSmartphone false
- At least 2 agents have hasVehicle false AND hasSmartphone false

World state:
${JSON.stringify(worldState, null, 2)}`;
};

module.exports = { getAgentGenerationPrompt };