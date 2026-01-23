/**
 * Agent Auto-Suggest - UserPromptSubmit Hook
 * Proactive agent dispatch suggestion based on prompt analysis
 * Issue #197: Agent Orchestration Layer
 *
 * Parses "Activates for" keywords from agent descriptions and matches
 * against user prompts. At high confidence, recommends spawning agents.
 *
 * CC 2.1.9 Compliant: Uses hookSpecificOutput.additionalContext
 */

import type { HookInput, HookResult } from '../types.js';
import { outputSilentSuccess, outputPromptContext, logHook, getPluginRoot } from '../lib/common.js';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Maximum number of agents to suggest
const MAX_SUGGESTIONS = 2;

// Confidence thresholds
const CONF_AUTO_DISPATCH = 85;  // "SPAWN THIS AGENT"
const CONF_RECOMMENDED = 70;    // "RECOMMENDED"
const CONF_CONSIDER = 50;       // "Consider"
const CONF_MINIMUM = 40;        // Don't show below this

// Cache for agent keywords (built once per session)
let agentKeywordsCache: Map<string, { keywords: string[]; description: string }> | null = null;

/**
 * Extract "Activates for" keywords from agent markdown files
 */
function buildAgentKeywordsIndex(agentsDir: string): Map<string, { keywords: string[]; description: string }> {
  if (agentKeywordsCache) return agentKeywordsCache;

  const index = new Map<string, { keywords: string[]; description: string }>();

  try {
    const files = readdirSync(agentsDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const agentName = file.replace('.md', '');
      const filePath = join(agentsDir, file);

      try {
        const content = readFileSync(filePath, 'utf8');

        // Extract description from frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) continue;

        const frontmatter = frontmatterMatch[1];
        const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
        if (!descMatch) continue;

        const description = descMatch[1].trim();

        // Extract keywords after "Activates for"
        const activatesMatch = description.match(/Activates for\s+(.+?)\.?$/i);
        if (!activatesMatch) continue;

        const keywordsStr = activatesMatch[1];
        const keywords = keywordsStr
          .split(/,\s*/)
          .map(k => k.trim().toLowerCase())
          .filter(k => k.length > 1);

        if (keywords.length > 0) {
          index.set(agentName, { keywords, description: description.split('.')[0] });
        }
      } catch {
        // Skip files that can't be read
      }
    }
  } catch {
    // Agents dir not found
  }

  agentKeywordsCache = index;
  return index;
}

interface AgentMatch {
  agent: string;
  confidence: number;
  description: string;
  matchedKeywords: string[];
}

/**
 * Find matching agents based on prompt keywords
 */
function findMatchingAgents(prompt: string, agentsDir: string): AgentMatch[] {
  const promptLower = prompt.toLowerCase();
  const promptWords = promptLower.split(/\s+/);
  const index = buildAgentKeywordsIndex(agentsDir);
  const matches: AgentMatch[] = [];

  for (const [agentName, { keywords, description }] of index) {
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      // Multi-word keyword matching
      if (keyword.includes(' ')) {
        if (promptLower.includes(keyword)) {
          score += 30;
          matchedKeywords.push(keyword);
        }
      } else {
        // Single word - check word boundaries
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(promptLower)) {
          score += 20;
          matchedKeywords.push(keyword);
        }
      }
    }

    // Boost for multiple keyword matches
    if (matchedKeywords.length >= 3) score += 20;
    if (matchedKeywords.length >= 5) score += 15;

    // Cap at 100
    score = Math.min(score, 100);

    if (score >= CONF_MINIMUM) {
      matches.push({
        agent: agentName,
        confidence: score,
        description,
        matchedKeywords,
      });
    }
  }

  // Sort by confidence and return top matches
  return matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_SUGGESTIONS);
}

/**
 * Build suggestion message based on confidence level
 */
function buildSuggestionMessage(matches: AgentMatch[]): string {
  if (matches.length === 0) return '';

  const topMatch = matches[0];
  let message = '';

  if (topMatch.confidence >= CONF_AUTO_DISPATCH) {
    // HIGH CONFIDENCE - Strong directive
    message = `## 🎯 AGENT DISPATCH RECOMMENDED

**Agent:** \`${topMatch.agent}\` (${topMatch.confidence}% confidence)

This task strongly matches the agent's specialization. **Spawn this agent:**

\`\`\`
Task tool with subagent_type: "${topMatch.agent}"
\`\`\`

Matched: ${topMatch.matchedKeywords.slice(0, 5).join(', ')}`;

  } else if (topMatch.confidence >= CONF_RECOMMENDED) {
    // MEDIUM-HIGH - Recommendation
    message = `## Agent Recommendation

**RECOMMENDED:** \`${topMatch.agent}\` (${topMatch.confidence}% match)
${topMatch.description}

Matched keywords: ${topMatch.matchedKeywords.slice(0, 4).join(', ')}

Consider spawning with: \`Task tool, subagent_type: "${topMatch.agent}"\``;

  } else if (topMatch.confidence >= CONF_CONSIDER) {
    // MEDIUM - Suggestion
    message = `## Agent Suggestion

**Consider:** \`${topMatch.agent}\` (${topMatch.confidence}% match)

This agent specializes in: ${topMatch.matchedKeywords.slice(0, 3).join(', ')}`;
  }

  // Add second match if exists and significant
  if (matches.length > 1 && matches[1].confidence >= CONF_CONSIDER) {
    const second = matches[1];
    message += `\n\n**Alternative:** \`${second.agent}\` (${second.confidence}% match)`;
  }

  return message;
}

/**
 * Agent auto-suggest hook
 */
export function agentAutoSuggest(input: HookInput): HookResult {
  const prompt = input.prompt || '';
  const pluginRoot = getPluginRoot();
  const agentsDir = join(pluginRoot, 'agents');

  if (!prompt || prompt.length < 10) {
    return outputSilentSuccess();
  }

  // Skip if prompt is asking about agents (meta question)
  if (/what agents|list agents|available agents/i.test(prompt)) {
    return outputSilentSuccess();
  }

  logHook('agent-auto-suggest', 'Analyzing prompt for agent matches...');

  // Find matching agents
  const matches = findMatchingAgents(prompt, agentsDir);

  if (matches.length === 0) {
    logHook('agent-auto-suggest', 'No agent matches found');
    return outputSilentSuccess();
  }

  logHook(
    'agent-auto-suggest',
    `Found matches: ${matches.map(m => `${m.agent}:${m.confidence}`).join(', ')}`
  );

  // Build suggestion message
  const suggestionMessage = buildSuggestionMessage(matches);

  if (suggestionMessage) {
    logHook('agent-auto-suggest', `Suggesting ${matches[0].agent} at ${matches[0].confidence}%`);
    return outputPromptContext(suggestionMessage);
  }

  return outputSilentSuccess();
}
