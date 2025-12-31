# 🧠 Context Awareness System

*Load this file for multi-session work or agent handoffs*

## How Context Works

1. **First Agent**: Creates session, initializes context
2. **Subsequent Agents**: Read context, build on existing work
3. **Continuous Updates**: Every decision shared immediately
4. **Next Session**: Picks up exactly where you left off

## Context Files

```
.claude/context/
├── shared-context.json  # All agent decisions
├── session.json         # Session continuity
└── vocabulary.json      # Project terminology
```

## Context Protocol

### Before Starting Work
1. ALWAYS read `.claude/context/shared-context.json`
2. Check what has been done already
3. Identify dependencies and related work
4. Avoid duplicating existing solutions

### During Work
1. Document major decisions in context
2. Use consistent terminology
3. Reference previous work by ID
4. Keep updates concise and actionable

### After Completing Work
1. Update shared-context.json with results
2. Mark tasks as completed
3. Add new pending tasks if discovered
4. Suggest next agent if handoff needed

## Vocabulary Learning

The system adapts to project-specific terminology:
- Learns from code patterns
- Adapts to domain language
- Maintains consistency across agents
- Updates `.claude/context/vocabulary.json`

## Session Persistence

Work continues seamlessly across Claude sessions:
- Session ID persists indefinitely
- All decisions preserved
- Task progress tracked
- No repeated explanations needed
