# Hooks Improvement Plan

**Score: 7.4/10 (Grade B) -> Target: 9.0/10**
**Created:** 2026-01-27

---

## Phase 1: Foundation (7.4 -> 8.0)

### [1] Hook-Level Behavioral Tests

Priority-ordered by risk:

**Tier 1 - Security-critical:**
- [ ] `pretool/bash/dangerous-command-blocker`
- [ ] `pretool/write-edit/file-guard`
- [ ] `permission/auto-approve-safe-bash`
- [ ] `skill/redact-secrets`
- [ ] `pretool/bash/git-branch-protection`
- [ ] `agent/security-command-audit`

**Tier 2 - Data-loss risk:**
- [ ] `stop/auto-save-context`
- [ ] `stop/mem0-pre-compaction-sync`
- [ ] `posttool/mem0-webhook-handler`
- [ ] `lifecycle/session-context-loader`
- [ ] `subagent-stop/retry-handler`

**Tier 3 - Quality gates:**
- [ ] `skill/coverage-threshold-gate`
- [ ] `skill/merge-readiness-checker`
- [ ] `subagent-stop/subagent-quality-gate`
- [ ] `posttool/unified-error-handler`

**Tier 4 - Everything else:**
- [ ] Remaining ~73 hooks (analytics, learning, suggestions, formatting)

### [4] Doc Sync (Quick Win)
- [ ] Fix README.md reference to missing `docs/async-hooks.md`
- [ ] Verify hook counts in CLAUDE.md match hooks.json
- [ ] Fix lifecycle hook count discrepancy (docs say 13, dir has 17)
- [ ] Normalize directory casing (`Write/` vs `write-edit/`)

---

## Phase 2: Governance (8.0 -> 8.5)

### [2] Hook Auto-Discovery
- [ ] Add `hookMeta` export convention to hook files
- [ ] Build script scans filesystem for hookMeta exports
- [ ] Auto-generate hooks.json + entry files from metadata
- [ ] Single source of truth = the .ts file itself

### [3] Hook Toggle System
- [ ] Create `.claude/hook-overrides.json` schema
- [ ] Modify `run-hook.mjs` to check overrides before execution
- [ ] Support `disabled` array and per-hook `timeouts`
- [ ] Gitignore the overrides file

---

## Phase 3: Hardening (8.5 -> 9.0)

### [5] Runtime Input Validation
- [ ] Define input schemas per hook event type
- [ ] Validate at boundary (JSON.parse -> validate -> hook)
- [ ] Fail fast with clear errors on malformed input

### [6] Reduce Dispatcher Indirection (DEFERRED)
- Not worth the churn risk. Dispatchers work fine.

---

## Scoring Reference

| Dimension | Current | Target |
|-----------|---------|--------|
| Correctness | 8 | 9 |
| Maintainability | 7 | 8.5 |
| Performance | 9 | 9 |
| Security | 8 | 9 |
| Scalability | 6 | 8 |
| Testability | 6 | 8.5 |
| **Weighted** | **7.4** | **8.7** |
