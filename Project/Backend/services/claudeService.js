const Anthropic = require('@anthropic-ai/sdk');
const { getAgentGenerationPrompt } = require('../prompts/agentGenerationPrompt');

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// Strip markdown code fences if Claude wraps JSON despite instructions
const stripCodeFences = (text) => {
  return text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim();
};

// Parse and validate agent array from Claude response
const parseAgents = (text) => {
  const stripped = stripCodeFences(text);

  try {
    const parsed = JSON.parse(stripped);

    if (!Array.isArray(parsed)) {
      throw new Error('Claude response is not a JSON array');
    }

    if (parsed.length !== 20) {
      console.warn(`[CLAUDE] Expected 20 agents, got ${parsed.length}`);
    }

    return parsed;

  } catch (err) {
    // Try to find JSON array in the text
    const arrayMatch = stripped.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          console.log(`[CLAUDE] Extracted array with ${parsed.length} agents`);
          return parsed;
        }
      } catch (e) {
        throw new Error(`Array parse failed after extraction: ${e.message}`);
      }
    }
    throw new Error(`No valid JSON array found in Claude response: ${err.message}`);
  }
};

// Validate individual agent has all required fields
const validateAgent = (agent, index) => {
  const required = [
    'id', 'name', 'age', 'role', 'group', 'zone',
    'neighborhood', 'lat', 'lng', 'hasVehicle', 'hasPhone',
    'hasSmartphone', 'vulnerability', 'destination',
    'backstory', 'initialThought'
  ];

  const missing = required.filter(field => agent[field] === undefined || agent[field] === null);

  if (missing.length > 0) {
    console.warn(`[CLAUDE] Agent ${index + 1} missing fields: ${missing.join(', ')}`);
    // Fill missing fields with safe defaults
    missing.forEach(field => {
      if (field === 'hasVehicle' || field === 'hasPhone' || field === 'hasSmartphone') {
        agent[field] = false;
      } else if (field === 'vulnerability') {
        agent[field] = 'medium';
      } else if (field === 'lat') {
        agent[field] = 20.5937;
      } else if (field === 'lng') {
        agent[field] = 78.9629;
      } else if (field === 'id') {
        agent[field] = index + 1;
      } else {
        agent[field] = 'Unknown';
      }
    });
  }

  // Validate group value
  const validGroups = ['blue', 'red', 'amber', 'green'];
  if (!validGroups.includes(agent.group)) {
    console.warn(`[CLAUDE] Agent ${agent.id} has invalid group: ${agent.group} — defaulting to amber`);
    agent.group = 'amber';
  }

  // Validate vulnerability value
  const validVulnerabilities = ['low', 'medium', 'high', 'critical'];
  if (!validVulnerabilities.includes(agent.vulnerability)) {
    agent.vulnerability = 'medium';
  }

  return agent;
};

// Validate distribution — must be 5 of each group
const validateDistribution = (agents) => {
  const groups = { blue: 0, red: 0, amber: 0, green: 0 };
  agents.forEach(a => {
    if (groups[a.group] !== undefined) groups[a.group]++;
  });

  console.log(`[CLAUDE] Distribution — blue: ${groups.blue}, red: ${groups.red}, amber: ${groups.amber}, green: ${groups.green}`);

  if (groups.blue !== 5 || groups.red !== 5 || groups.amber !== 5 || groups.green !== 5) {
    console.warn('[CLAUDE] Distribution warning — expected exactly 5 of each group');
  }

  return groups;
};

// Main function — generate 20 agents from world state
const generateAgents = async (worldState, emitLog) => {
  console.log('[CLAUDE] Starting agent generation...');

  if (emitLog) emitLog('Agent generation started → Claude claude-sonnet-4-5', 'info');

  try {
    const prompt = getAgentGenerationPrompt(worldState);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = response.content[0].text;
    console.log(`[CLAUDE] Response received — ${responseText.length} characters`);

    // Parse the agent array
    let agents = parseAgents(responseText);

    // Validate and fix each agent
    agents = agents.map((agent, index) => {
      if (emitLog && index % 5 === 0) {
        emitLog(`→ Agent ${index + 1}/20: ${agent.name || 'Unknown'} — ${agent.role || 'Unknown'} — ${agent.zone || 'Unknown'}`, 'info');
      }
      return validateAgent(agent, index);
    });

    // Log final agent
    if (emitLog && agents.length > 0) {
      const last = agents[agents.length - 1];
      emitLog(`→ Agent 20/20: ${last.name} — ${last.role} — ${last.zone}`, 'info');
      emitLog(`✓ All ${agents.length} agents generated successfully`, 'success');
    }

    // Validate distribution
    validateDistribution(agents);

    return agents;

  } catch (err) {
    console.error('[CLAUDE] Agent generation failed:', err.message);
    if (emitLog) emitLog(`✗ Claude agent generation failed: ${err.message}`, 'error');
    throw err;
  }
};

module.exports = { generateAgents };