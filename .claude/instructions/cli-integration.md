# 🔌 CLI Integration & Auto-Detection

*Load this file for Claude Code CLI interactions*

## Auto-Detection Protocol

When a user interacts with Claude Code CLI, automatically:

1. **Check Project Structure**
   - Look for `.claude/agents/` directory
   - Verify `.claude/instructions/` exists
   - Check for `CLAUDE.md` presence
   - Detect `.claude/context/shared-context.json`

2. **Activate Orchestration**
   - If AI Agent Hub detected → Use intelligent routing
   - Load minimal instructions first
   - Dynamically load specialized instructions as needed

## Session Continuity

### Cross-Session Context
```json
{
  "session_id": "unique-session-id",
  "previous_agents": ["studio-coach", "frontend-ui-developer"],
  "current_workflow": "feature_implementation",
  "decisions_made": [...],
  "tasks_in_progress": [...]
}
```

### Session Persistence Rules
1. Maintain context between CLI commands
2. Resume workflows from last state
3. Remember user preferences and patterns
4. Track agent performance across sessions

## Transparent Orchestration

### Automatic Routing
For EVERY user command, silently:
1. Analyze intent and complexity
2. Check context for related work
3. Route to appropriate agent(s)
4. Coordinate multi-agent workflows

### Progressive Enhancement
- Work with existing Claude Code features
- Enhance without breaking current workflows
- Provide suggestions, not mandates
- Learn from user corrections

## CLI Command Patterns

### Direct Agent Invocation
```
User: "Use backend architect to design my API"
→ Route directly to backend-system-architect
```

### Implicit Agent Selection
```
User: "Help me build a dashboard"
→ Analyze complexity → Route to rapid-ui-designer + frontend-ui-developer
```

### Multi-Agent Coordination
```
User: "Create a viral TikTok clone"
→ Activate Studio Coach → Coordinate 5+ agents in parallel
```

## Performance Optimization

### Token Management
- Track token usage per session
- Cache frequent decisions
- Reuse context where possible
- Alert when approaching limits

### Speed Optimization
- Parallel execution by default
- Lazy loading of instructions
- Smart caching of agent responses
- Background context updates

## Backward Compatibility

CRITICAL: Never break existing workflows
- All current commands continue to work
- Orchestration is additive, not replacive
- Gradual adoption path
- User can disable if needed

## CLI Integration Examples

### Example 1: Auto-Detection
```
$ claude-code "Fix the authentication bug"
# System detects: bug fix workflow needed
# Auto-routes to: code-quality-reviewer → backend-system-architect
# Maintains context for future related fixes
```

### Example 2: Session Resume
```
$ claude-code "Continue where we left off"
# System checks: shared-context.json
# Resumes: feature_implementation workflow
# Activates: last active agents with context
```

### Example 3: Learning Patterns
```
$ claude-code "The usual dashboard setup"
# System recalls: user's dashboard preferences
# Applies: learned component patterns
# Routes to: preferred agent combination
```

## Best Practices

1. **Silent Intelligence**: Orchestration happens behind the scenes
2. **Context First**: Always check existing context before routing
3. **User Control**: User can always override agent selection
4. **Performance Focus**: Minimize overhead, maximize value
5. **Continuous Learning**: Adapt to user patterns over time