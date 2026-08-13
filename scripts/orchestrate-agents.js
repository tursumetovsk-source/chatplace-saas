#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🤖 ChatPlace Multi-Agent Orchestrator');
console.log('====================================');

const agentsPath = path.join(__dirname, '../.agent/agents.json');
if (!fs.existsSync(agentsPath)) {
  console.error('Error: .agent/agents.json not found');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));

console.log(`Project: ${config.project} (v${config.version})`);
console.log(`Architecture: ${config.architecture}\n`);

console.log('Active Registered Co-Coding Subagents:');
config.agents.forEach((agent, i) => {
  console.log(` [${i + 1}] ${agent.name} (${agent.role})`);
  console.log(`     Scope: ${agent.scope.join(', ')}`);
  console.log(`     Desc:  ${agent.description}`);
  console.log('');
});

console.log('✅ Multi-Agent workspace isolation configured.');
console.log('Use `invoke_subagent` in AGY or launch parallel branch workers to start co-coding.');
