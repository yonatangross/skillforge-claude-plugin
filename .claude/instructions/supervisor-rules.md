# Orchestration Rules

Guidelines for coordinating multiple subagents via the Task tool.

## Agent Specialization Matrix

| Agent | Domain | Use For |
|-------|--------|---------|
| `frontend-ui-developer` | Frontend | React components, state, styling, hooks |
| `backend-system-architect` | Backend | APIs, database, auth, services |
| `ai-ml-engineer` | AI/ML | LLM integration, embeddings, RAG pipelines |
| `code-quality-reviewer` | Quality | Code review, security, tests, lint |
| `rapid-ui-designer` | Design | Mockups, design tokens, component specs |
| `Explore` | Research | Codebase exploration, finding implementations |

## Parallel vs Sequential

### Run in Parallel (single message, multiple Task calls)
- Frontend components while backend builds APIs
- Independent feature modules
- Tests for different domains

```python
# CORRECT: Independent tasks in ONE message = parallel execution
Task(subagent_type="frontend-ui-developer", prompt="Build UserCard component")
Task(subagent_type="backend-system-architect", prompt="Create /api/users endpoint")
```

### Run Sequentially (separate messages)
- Integration after implementation
- Quality review after development
- Tasks that depend on previous output

```python
# First message
Task(subagent_type="backend-system-architect", prompt="Create API")
# Wait for result, then second message
Task(subagent_type="frontend-ui-developer", prompt="Connect to API created above")
```

## Quality Gates

### Before Assigning Tasks
1. **Complexity Check**: Break Level 4-5 tasks into smaller pieces
2. **Dependencies**: Ensure required work is complete
3. **Clarity**: No more than 3 unanswered critical questions

### After Task Completion
1. **Evidence Required**: Tests pass, lint clean, build succeeds
2. **No Claims Without Proof**: Agent must run checks, not just claim success

### Stuck Detection
- If a task fails 3+ times → escalate to user
- Don't let agents retry indefinitely

## Task Assignment Best Practices

1. **Small deliverables**: Each task completable in one focused session
2. **Include tests**: Every implementation task includes its tests
3. **Clear boundaries**: Specify which files/directories agent can modify
4. **Success criteria**: Define measurable outcomes

## Example Task Prompt

```markdown
Create the UserProfile component:

**Scope**:
- frontend/src/components/UserProfile.tsx
- frontend/src/components/UserProfile.test.tsx

**Requirements**:
- Display user avatar, name, email
- Edit button triggers modal
- Loading skeleton while fetching

**Success Criteria**:
- Component renders without errors
- Tests cover happy path + error state
- TypeScript strict mode passes
```

## Model Selection

| Complexity | Model | Use Case |
|------------|-------|----------|
| Simple (1-2) | `haiku` | Status checks, simple edits |
| Medium (3) | `sonnet` | Most implementation tasks |
| Complex (4-5) | `opus` | Architecture decisions, complex debugging |
