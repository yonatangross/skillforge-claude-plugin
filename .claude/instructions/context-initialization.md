# Context Window Initialization Protocol

**Version:** 1.0
**Purpose:** Ensure Claude understands project state at the start of every conversation

---

## MANDATORY: Execute This Protocol on Every New Context Window

**EVERY TIME a new conversation/context window starts, YOU MUST follow these steps:**

---

## Step 1: Understand Current Project State (REQUIRED)

Read these files **in order** to understand where the project is at:

| Priority | File | What You'll Learn |
|----------|------|-------------------|
| 1 | `docs/CURRENT_STATUS.md` | Sprint progress, completed issues, what's in progress, blockers |
| 2 | `docs/ROADMAP.md` | Overall project phases, tech stack, detailed task breakdown |
| 3 | `.claude/context/shared-context.json` | Decisions, patterns, and context from previous sessions |

**Command to read all three:**
```
Read docs/CURRENT_STATUS.md, docs/ROADMAP.md, .claude/context/shared-context.json
```

---

## Step 2: Review Active Work (IF WORKING ON TASKS)

Based on the domain of work, read the relevant task breakdown:

| Domain | File to Read |
|--------|--------------|
| Backend development | `docs/YONATAN_BACKEND_TASKS.md` |
| Frontend development | `docs/ARIE_FRONTEND_TASKS.md` |
| Frontend-Backend integration | `docs/INTEGRATION_POINTS.md` |
| Architecture questions | `docs/ARCHITECTURE.md` |
| Frontend patterns | `docs/FRONTEND_ARCHITECTURE.md` |

---

## Step 3: Check Recent Changes (RECOMMENDED)

Run these git commands to understand recent activity:

```bash
git log --oneline -10  # Recent commits
git status             # Uncommitted changes
git branch             # Current branch
```

---

## Quick Reference - Key Documentation Files

| Doc | Purpose | Read When |
|-----|---------|-----------|
| `docs/CURRENT_STATUS.md` | Sprint status, blockers, completed work | **Always first** |
| `docs/ROADMAP.md` | Tech stack, phases, all tasks | Need full context |
| `docs/ARCHITECTURE.md` | System diagrams, data flow | Architecture questions |
| `docs/INTEGRATION_POINTS.md` | API contracts, SSE schemas | Frontend-backend work |
| `docs/FRONTEND_ARCHITECTURE.md` | Component patterns, folder structure | Frontend work |
| `docs/PROJECT_SUMMARY.md` | High-level overview | Quick orientation |
| `docs/USER_STORIES.md` | User requirements, acceptance criteria | Feature work |

---

## Why This Protocol Matters

Without reading these docs, you will lack context about:

1. **What has already been completed** - Avoid duplicate work and re-implementing solved problems
2. **Current sprint focus and priorities** - Know what's most important right now
3. **Existing patterns and conventions** - Follow established code patterns
4. **Known issues and their fixes** - Don't repeat past mistakes
5. **Integration points** - Understand how frontend and backend connect
6. **Team assignments** - Know who is working on what (Arie = Frontend, Yonatan = Backend)

---

## Context Persistence

After completing significant work, **always update** `.claude/context/shared-context.json` with:
- Key decisions made
- Patterns established
- Issues discovered
- Progress updates

This ensures the next context window has access to your learnings.

---

## Checklist for New Context Window

- [ ] Read `docs/CURRENT_STATUS.md`
- [ ] Read `docs/ROADMAP.md`
- [ ] Read `.claude/context/shared-context.json`
- [ ] Check `git log --oneline -10` and `git status`
- [ ] Read domain-specific docs based on task
- [ ] Understand current sprint and priorities
- [ ] Ready to work with full context

---

**Last Updated:** November 2024
