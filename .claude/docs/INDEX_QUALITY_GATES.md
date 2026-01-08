# Multi-Instance Quality Gates - File Index

Complete index of all files created for the multi-instance quality gate system.

## Implementation Summary

**MULTI_INSTANCE_QUALITY_GATES_SUMMARY.md** (Root directory)
- Complete implementation summary
- Architecture overview
- Usage examples
- Deployment checklist

## Core Hooks (5 files)

### .claude/hooks/skill/

1. **duplicate-code-detector.sh** (8.8KB)
   - Detects exact duplicates across worktrees
   - Identifies copy-paste patterns
   - Flags utility duplication
   - Checks worktree conflicts

2. **pattern-consistency-enforcer.sh** (13KB)
   - Enforces backend patterns (layer separation, async DB, Pydantic v2)
   - Enforces frontend patterns (React 19, Zod, exhaustive types)
   - Enforces testing patterns (AAA, MSW, pytest)
   - References pattern-registry.json

3. **cross-instance-test-validator.sh** (11KB)
   - Finds corresponding test files
   - Extracts testable units (functions/classes)
   - Validates test coverage
   - Checks integration test needs

4. **merge-conflict-predictor.sh** (12KB)
   - Detects concurrent modifications
   - Analyzes overlapping changes
   - Checks branch divergence
   - Validates API contract consistency
   - Checks import/export consistency

5. **merge-readiness-checker.sh** (12KB)
   - Comprehensive pre-merge validation
   - Runs all quality gates
   - Executes test suite
   - Runs linting and type checking
   - Checks worktree coordination
   - Generates merge readiness report

## Orchestrator

### .claude/hooks/pretool/bash/

6. **multi-instance-quality-gate.sh** (8.8KB)
   - Pre-commit hook orchestrator
   - Gets staged files from git
   - Runs all 4 quality gates on each file
   - Checks cross-file consistency
   - Validates worktree coordination
   - Reports final status

## Configuration

### .claude/context/knowledge/patterns/

7. **pattern-registry.json** (11KB)
   - Centralized pattern definitions
   - Naming conventions (TypeScript, Python)
   - Architecture patterns (backend, frontend, testing)
   - Anti-patterns (duplication, inconsistency, coupling)
   - Worktree coordination rules
   - Merge readiness checklist

## Documentation

### .claude/docs/

8. **MULTI_INSTANCE_QUALITY_GATES.md** (16KB)
   - Complete implementation guide
   - Problems solved
   - Hook architecture
   - Pattern registry details
   - Activation methods (automatic/manual)
   - Worktree workflow
   - Configuration options
   - Slop detection heuristics
   - Integration with existing hooks
   - Performance characteristics
   - Troubleshooting guide
   - Examples
   - Best practices
   - Metrics and monitoring

9. **QUALITY_GATES_QUICK_REFERENCE.md** (5.7KB)
   - Quick start guide
   - What gets checked
   - Common failures and fixes
   - Pattern registry cheat sheet
   - Command reference
   - Worktree setup
   - Configuration shortcuts
   - Exit codes
   - Emergency override
   - Performance notes
   - Tips and tricks

10. **INDEX_QUALITY_GATES.md** (This file)
    - Complete file index
    - Brief descriptions
    - File sizes and purposes

### .claude/hooks/skill/

11. **README_MULTI_INSTANCE_GATES.md** (3.5KB)
    - Hook-specific documentation
    - Individual hook usage
    - Environment variables
    - Exit codes
    - Integration examples
    - Maintenance instructions

## Tests

### tests/integration/

12. **test-multi-instance-gates.sh** (4.2KB)
    - Integration test suite
    - Tests duplicate detection
    - Tests pattern enforcement
    - Tests test validation
    - Tests conflict prediction
    - Test results reporting

## File Structure

```
skillforge-claude-plugin/
├── MULTI_INSTANCE_QUALITY_GATES_SUMMARY.md  (Root summary)
│
├── .claude/
│   ├── hooks/
│   │   ├── skill/
│   │   │   ├── duplicate-code-detector.sh
│   │   │   ├── pattern-consistency-enforcer.sh
│   │   │   ├── cross-instance-test-validator.sh
│   │   │   ├── merge-conflict-predictor.sh
│   │   │   ├── merge-readiness-checker.sh
│   │   │   └── README_MULTI_INSTANCE_GATES.md
│   │   │
│   │   └── pretool/
│   │       └── bash/
│   │           └── multi-instance-quality-gate.sh
│   │
│   ├── context/
│   │   └── knowledge/
│   │       └── patterns/
│   │           └── pattern-registry.json
│   │
│   └── docs/
│       ├── MULTI_INSTANCE_QUALITY_GATES.md
│       ├── QUALITY_GATES_QUICK_REFERENCE.md
│       └── INDEX_QUALITY_GATES.md (This file)
│
└── tests/
    └── integration/
        └── test-multi-instance-gates.sh
```

## Quick Access

### For Users

**Getting Started:**
1. Read: `MULTI_INSTANCE_QUALITY_GATES_SUMMARY.md`
2. Quick Reference: `.claude/docs/QUALITY_GATES_QUICK_REFERENCE.md`

**Troubleshooting:**
- Full Guide: `.claude/docs/MULTI_INSTANCE_QUALITY_GATES.md`
- Hook Docs: `.claude/hooks/skill/README_MULTI_INSTANCE_GATES.md`

### For Developers

**Implementation:**
- Hook Scripts: `.claude/hooks/skill/*.sh`
- Orchestrator: `.claude/hooks/pretool/bash/multi-instance-quality-gate.sh`

**Configuration:**
- Patterns: `.claude/context/knowledge/patterns/pattern-registry.json`
- Chain Config: `.claude/hooks/_orchestration/chain-config.json`

**Testing:**
- Test Suite: `tests/integration/test-multi-instance-gates.sh`

## Statistics

| Category | Files | Total Size |
|----------|-------|------------|
| Core Hooks | 5 | ~56KB |
| Orchestrator | 1 | ~9KB |
| Configuration | 1 | ~11KB |
| Documentation | 4 | ~28KB |
| Tests | 1 | ~4KB |
| **Total** | **12** | **~108KB** |

## Usage Frequency

| File | Usage | When |
|------|-------|------|
| multi-instance-quality-gate.sh | Automatic | Every git commit |
| duplicate-code-detector.sh | Automatic | Via orchestrator |
| pattern-consistency-enforcer.sh | Automatic | Via orchestrator |
| cross-instance-test-validator.sh | Automatic | Via orchestrator |
| merge-conflict-predictor.sh | Automatic | Via orchestrator |
| merge-readiness-checker.sh | Manual | Before merge |
| pattern-registry.json | Reference | By all hooks |
| QUALITY_GATES_QUICK_REFERENCE.md | Reference | When issues occur |
| MULTI_INSTANCE_QUALITY_GATES.md | Reference | For deep dives |
| test-multi-instance-gates.sh | Testing | After modifications |

## Maintenance

### Regular Updates

**Pattern Registry** (`pattern-registry.json`)
- Update when new patterns are established
- Add new prohibited patterns as discovered
- Adjust thresholds based on project maturity

**Documentation** (`.claude/docs/*.md`)
- Keep examples current with actual code
- Add new troubleshooting scenarios as they arise
- Update quick reference with common fixes

**Hooks** (`.claude/hooks/skill/*.sh`)
- Add new detection heuristics
- Improve performance for large codebases
- Enhance error messages based on user feedback

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-08 | Initial release with all 12 files |

## Integration Points

### With Existing Systems

**Hook System:**
- Uses `.claude/hooks/_lib/common.sh`
- Follows hook chain architecture
- Compatible with existing quality gates

**Context System:**
- Integrates with `.claude/context/` structure
- Follows knowledge organization patterns
- Uses established JSON schemas

**Testing Framework:**
- Follows `tests/integration/` conventions
- Compatible with existing test runners
- Uses common test helpers

## Access Patterns

### Command Line

```bash
# Run specific gate
.claude/hooks/skill/duplicate-code-detector.sh

# Run orchestrator (automatic on commit)
.claude/hooks/pretool/bash/multi-instance-quality-gate.sh

# Run merge check
.claude/hooks/skill/merge-readiness-checker.sh main

# Run tests
tests/integration/test-multi-instance-gates.sh
```

### Via Chain Executor

```bash
# Execute chain
echo '{"tool_name":"Write","tool_input":{"file_path":"file.ts"}}' | \
  .claude/hooks/_orchestration/chain-executor.sh execute multi_instance_quality
```

### Via Git Hooks

```bash
# Automatic (no command needed)
git commit -m "Message"
# ↑ Triggers multi-instance-quality-gate.sh
```

## Documentation Map

```
Start Here
    │
    ├─► Quick Start?
    │   └─► QUALITY_GATES_QUICK_REFERENCE.md
    │
    ├─► Complete Guide?
    │   └─► MULTI_INSTANCE_QUALITY_GATES.md
    │
    ├─► Implementation Details?
    │   └─► MULTI_INSTANCE_QUALITY_GATES_SUMMARY.md
    │
    ├─► Hook Usage?
    │   └─► README_MULTI_INSTANCE_GATES.md
    │
    └─► All Files?
        └─► INDEX_QUALITY_GATES.md (This file)
```

## Support

For issues or questions:
1. Check quick reference first
2. Search full documentation
3. Review hook logs: `.claude/logs/multi-instance-gates.log`
4. Run tests to verify installation
5. File issue with relevant file paths and log excerpts

---

**Index Version:** 1.0.0  
**Last Updated:** 2026-01-08  
**Total Files:** 12  
**Total Documentation:** ~28KB  
**Total Implementation:** ~80KB
