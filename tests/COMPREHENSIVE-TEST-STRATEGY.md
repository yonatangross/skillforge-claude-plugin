# SkillForge Plugin Comprehensive Test Strategy

## Executive Summary

This document defines an exhaustive test suite for SkillForge Claude Plugin v4.5.0, covering all 82 skills, 20 agents, 63 hooks, and the Context Engineering 2.0 system.

**Total Test Cases Required: ~450+**

| Category | Test Count | Priority |
|----------|------------|----------|
| Security Tests | 35 | CRITICAL |
| Hook Unit Tests | 126 (63 hooks × 2) | HIGH |
| Skill Validation | 164 (82 skills × 2) | HIGH |
| Agent Tests | 40 (20 agents × 2) | HIGH |
| Integration Tests | 50 | MEDIUM |
| Performance Tests | 20 | MEDIUM |
| JSON Schema Validation | 15 | HIGH |

---

## 1. Security Tests (35 Test Cases)

### 1.1 JQ Filter Injection (CRITICAL) - 4 Tests
```bash
# Location: tests/security/test-jq-injection.sh

TEST 1.1.1: JQ Filter Injection - Basic
  Input: MALICIOUS_FILTER='.tool_input) | debug | (.'
  Expected: BLOCKED - debug not executed

TEST 1.1.2: JQ Filter Injection - Data Exfiltration
  Input: MALICIOUS_FILTER='["secret"][]'
  Expected: PASS - Only intended fields returned

TEST 1.1.3: JQ Filter Injection - Recursive Descent
  Input: MALICIOUS_FILTER='.. | objects | select(.api_key)'
  Expected: PASS - Sensitive keys not extracted

TEST 1.1.4: JQ Filter Injection - Alternative Operators
  Input: MALICIOUS_FILTER='.config.db_host as $x | $x'
  Expected: PASS - Cannot access unintended paths
```

### 1.2 Path Traversal & Symlink Attacks (CRITICAL) - 6 Tests
```bash
# Location: tests/security/test-path-traversal.sh

TEST 1.2.1: Path Traversal - Parent Directory Escape
  Input: FILE_PATH="../protected_file.txt"
  Expected: BLOCKED

TEST 1.2.2: Path Traversal - Double Encoding
  Input: FILE_PATH="..%2F..%2Fetc%2Fpasswd"
  Expected: BLOCKED after decode

TEST 1.2.3: Symlink to Parent Directory
  Setup: ln -s /etc project/subdir/etc_link
  Input: FILE_PATH="subdir/etc_link/passwd"
  Expected: BLOCKED

TEST 1.2.4: Symlink Chain Attack
  Setup: ln -s /etc/passwd link1; ln -s link1 link2
  Expected: BLOCKED - fully resolved

TEST 1.2.5: Race Condition - TOCTOU
  Expected: Re-validate before write

TEST 1.2.6: Null Byte Injection
  Input: FILE_PATH="/tmp/safe.txt\x00/tmp/unsafe.txt"
  Expected: BLOCKED
```

### 1.3 Command Injection (HIGH) - 5 Tests
```bash
# Location: tests/security/test-command-injection.sh

TEST 1.3.1: Hook Script Path Injection
TEST 1.3.2: cd Path Injection
TEST 1.3.3: Backtick Injection
TEST 1.3.4: Regex ReDoS
TEST 1.3.5: Variable Expansion
```

### 1.4 Input Validation (HIGH) - 5 Tests
```bash
# Location: tests/security/test-input-validation.sh

TEST 1.4.1: Bypass - Extra Spaces ("rm  -rf  /")
TEST 1.4.2: Bypass - Newlines ("rm\n-rf\n/")
TEST 1.4.3: Bypass - Case Variation ("RM -RF /")
TEST 1.4.4: Missing Dangerous Patterns
TEST 1.4.5: Malicious Rules File (ReDoS)
```

### 1.5-1.10 Additional Security Tests - 15 Tests
- Temporary File Handling (4 tests)
- Regex Injection & ReDoS (2 tests)
- File Operations & Permissions (3 tests)
- Environment Variable Injection (2 tests)
- Information Disclosure (2 tests)
- Permission Bypass (2 tests)

---

## 2. Hook Unit Tests (126 Test Cases)

### 2.1 Test Structure
```
tests/unit/hooks/
├── pretool/
│   ├── test-path-normalizer.sh
│   ├── test-bash-defaults.sh
│   ├── test-git-branch-protection.sh
│   ├── test-file-guard.sh
│   ├── test-context-gate.sh         # NEW
│   ├── test-subagent-validator.sh
│   └── test-*.sh (13 hooks × 2 tests)
├── posttool/
│   ├── test-audit-logger.sh
│   ├── test-error-tracker.sh
│   ├── test-session-metrics.sh
│   └── test-*.sh (5 hooks × 2 tests)
├── permission/
│   ├── test-auto-approve-readonly.sh
│   ├── test-auto-approve-project-writes.sh
│   └── test-auto-approve-safe-bash.sh
├── lifecycle/
│   ├── test-session-context-loader.sh
│   ├── test-session-cleanup.sh
│   └── test-*.sh (5 hooks × 2 tests)
├── skill/
│   ├── test-test-pattern-validator.sh
│   ├── test-backend-layer-validator.sh
│   ├── test-import-direction-enforcer.sh
│   └── test-*.sh (17 hooks × 2 tests)
├── subagent/
│   ├── test-subagent-resource-allocator.sh
│   ├── test-subagent-quality-gate.sh
│   └── test-*.sh (5 hooks × 2 tests)
└── notification/
    ├── test-desktop.sh
    └── test-sound.sh
```

### 2.2 Hook Test Template
```bash
#!/bin/bash
# tests/unit/hooks/pretool/test-context-gate.sh

set -euo pipefail
source "$(dirname "$0")/../../../fixtures/test-helpers.sh"

describe "context-gate.sh"

test_allows_single_agent() {
  input='{"tool_input":{"subagent_type":"test-generator","run_in_background":"true"}}'
  result=$(echo "$input" | run_hook "pretool/task/context-gate.sh")
  assert_exit_code 0
  assert_log_contains "Context gate passed"
}

test_blocks_excessive_concurrent_agents() {
  # Simulate 5 recent spawns
  for i in {1..5}; do
    echo '{"timestamp":"'$(date -Iseconds)'","subagent_type":"test"}' >> "$SPAWN_LOG"
  done

  input='{"tool_input":{"subagent_type":"test","run_in_background":"true"}}'
  result=$(echo "$input" | run_hook "pretool/task/context-gate.sh" 2>&1)
  assert_exit_code 2
  assert_stderr_contains "Background Agent Limit"
}

test_warns_at_threshold() {
  # Simulate 3 recent spawns (warning threshold)
  for i in {1..3}; do
    echo '{"timestamp":"'$(date -Iseconds)'","subagent_type":"test"}' >> "$SPAWN_LOG"
  done

  input='{"tool_input":{"subagent_type":"test","run_in_background":"false"}}'
  result=$(echo "$input" | run_hook "pretool/task/context-gate.sh" 2>&1)
  assert_exit_code 0
  assert_stderr_contains "Context Budget Warning"
}

run_tests
```

### 2.3 Hook Categories & Test Counts
| Category | Hooks | Tests | Priority |
|----------|-------|-------|----------|
| pretool/input-mod | 3 | 6 | HIGH |
| pretool/bash | 4 | 8 | HIGH |
| pretool/task | 2 | 4 | CRITICAL |
| pretool/mcp | 3 | 6 | MEDIUM |
| pretool/skill | 1 | 2 | MEDIUM |
| pretool/write-edit | 1 | 2 | HIGH |
| posttool | 5 | 10 | HIGH |
| permission | 3 | 6 | CRITICAL |
| lifecycle | 5 | 10 | HIGH |
| skill | 17 | 34 | HIGH |
| subagent-start | 3 | 6 | MEDIUM |
| subagent-stop | 2 | 4 | MEDIUM |
| stop | 3 | 6 | MEDIUM |
| prompt | 2 | 4 | MEDIUM |
| notification | 2 | 4 | LOW |
| agent | 3 | 6 | MEDIUM |
| _orchestration | 3 | 6 | MEDIUM |
| _lib | 1 | 8 | CRITICAL |
| **TOTAL** | **63** | **126** | - |

---

## 3. Skill Validation Tests (164 Test Cases)

### 3.1 Skill Manifest Validation
```bash
# tests/unit/skills/test-skill-manifests.sh

for skill_dir in .claude/skills/*/; do
  skill_name=$(basename "$skill_dir")

  test_has_skill_md() {
    assert_file_exists "$skill_dir/SKILL.md"
  }

  test_skill_md_has_required_sections() {
    content=$(cat "$skill_dir/SKILL.md")
    assert_contains "$content" "## When to Use"
    assert_contains "$content" "## Instructions"
  }

  test_manifest_json_valid() {
    if [[ -f "$skill_dir/manifest.json" ]]; then
      jq . "$skill_dir/manifest.json" > /dev/null
      assert_exit_code 0
    fi
  }
done
```

### 3.2 Skill Categories & Test Counts
| Category | Skills | Tests |
|----------|--------|-------|
| Testing Skills | 8 | 16 |
| LLM/AI Skills | 15 | 30 |
| Architecture Skills | 10 | 20 |
| Security Skills | 6 | 12 |
| Database Skills | 4 | 8 |
| Frontend Skills | 8 | 16 |
| Backend Skills | 12 | 24 |
| DevOps Skills | 5 | 10 |
| Documentation Skills | 6 | 12 |
| Other Skills | 8 | 16 |
| **TOTAL** | **82** | **164** |

---

## 4. Agent Tests (40 Test Cases)

### 4.1 Agent Manifest Validation
```bash
# tests/unit/agents/test-agent-manifests.sh

test_agent_registry_valid() {
  jq . .claude/agent-registry.json > /dev/null
  assert_exit_code 0
}

test_all_agents_have_manifests() {
  for agent in $(jq -r '.agents | keys[]' .claude/agent-registry.json); do
    assert_file_exists ".claude/agents/$agent/manifest.json"
  done
}

test_agent_tool_permissions_valid() {
  for manifest in .claude/agents/*/manifest.json; do
    tools=$(jq -r '.tools[]' "$manifest" 2>/dev/null || echo "")
    for tool in $tools; do
      # Verify tool exists in Claude Code
      assert_valid_tool "$tool"
    done
  done
}
```

### 4.2 Agent Categories
| Agent Type | Count | Tests |
|------------|-------|-------|
| System Architects | 4 | 8 |
| Test Specialists | 3 | 6 |
| Security Agents | 2 | 4 |
| Business Analysts | 3 | 6 |
| Frontend/Backend | 4 | 8 |
| Workflow/Pipeline | 2 | 4 |
| Research Agents | 2 | 4 |
| **TOTAL** | **20** | **40** |

---

## 5. Integration Tests (50 Test Cases)

### 5.1 Hook Chain Integration
```bash
# tests/integration/test-hook-chains.sh

test_pretool_to_posttool_flow() {
  # Simulate tool execution
  pretool_input='{"tool_name":"Bash","tool_input":{"command":"git status"}}'
  posttool_input='{"tool_name":"Bash","tool_result":"success","exit_code":0}'

  # Run pretool hooks
  pretool_result=$(echo "$pretool_input" | run_hook_chain "PreToolUse" "Bash")
  assert_exit_code 0

  # Run posttool hooks
  posttool_result=$(echo "$posttool_input" | run_hook_chain "PostToolUse" "*")
  assert_exit_code 0

  # Verify audit log entry
  assert_file_contains ".claude/logs/audit.log" "Bash"
}

test_permission_request_flow() {
  # Test auto-approve for Read
  input='{"tool_name":"Read","tool_input":{"file_path":"src/index.ts"}}'
  result=$(echo "$input" | run_hook_chain "PermissionRequest" "Read")
  assert_output_contains "approve"
}

test_session_lifecycle() {
  # Start
  run_hook_chain "SessionStart"
  assert_file_exists ".claude/logs/session-*.json"

  # Multiple tool uses
  for i in {1..5}; do
    run_tool_simulation "Bash" "git status"
  done

  # End
  run_hook_chain "SessionEnd"
  assert_metrics_recorded
}
```

### 5.2 Context System Integration
```bash
# tests/integration/test-context-system.sh

test_context_loader_loads_identity() {
  run_hook "lifecycle/context-loader.sh"
  # Verify identity.json loaded
  assert_env_contains "SKILLFORGE_VERSION"
}

test_context_budget_monitor_triggers_compression() {
  # Create oversized context
  create_large_session_state 3000  # > 2200 budget

  run_hook "posttool/context-budget-monitor.sh"

  # Verify compression triggered
  assert_file_contains ".claude/logs/context-budget.log" "compression"
}

test_context_gate_prevents_overflow() {
  # Spawn max concurrent agents
  for i in {1..4}; do
    spawn_background_agent "test-generator" "Task $i"
  done

  # Next spawn should block
  result=$(spawn_background_agent "test-generator" "Task 5" 2>&1)
  assert_exit_code 2
  assert_contains "$result" "Background Agent Limit"
}
```

### 5.3 Skill-Hook Integration
```bash
# tests/integration/test-skill-hooks.sh

test_test_standards_enforcer_blocks_bad_tests() {
  # Write test file without AAA pattern
  bad_test='def test_foo(): x = 1; assert x == 1'
  result=$(validate_test_file "$bad_test" 2>&1)
  assert_exit_code 1
  assert_contains "$result" "AAA pattern"
}

test_backend_layer_validator_enforces_architecture() {
  # Write service with HTTPException
  bad_service='from fastapi import HTTPException\nraise HTTPException(404)'
  result=$(validate_python_file "services/user_service.py" "$bad_service" 2>&1)
  assert_exit_code 1
  assert_contains "$result" "HTTPException not allowed in services"
}
```

---

## 6. Performance Tests (20 Test Cases)

### 6.1 Hook Execution Time
```bash
# tests/performance/test-hook-timing.sh

TARGET_MS=100  # Max hook execution time

for hook in .claude/hooks/**/*.sh; do
  test_hook_under_100ms() {
    start=$(date +%s%N)
    echo '{}' | bash "$hook" > /dev/null 2>&1
    end=$(date +%s%N)

    duration_ms=$(( (end - start) / 1000000 ))
    assert_less_than $duration_ms $TARGET_MS
  }
done
```

### 6.2 Context Budget Compliance
```bash
# tests/performance/test-context-budget.sh

test_context_layer_under_budget() {
  total_tokens=0
  for file in .claude/context/**/*.json; do
    tokens=$(estimate_tokens "$file")
    total_tokens=$((total_tokens + tokens))
  done

  assert_less_than $total_tokens 2200
}

test_skill_loading_under_5k_tokens() {
  for skill in .claude/skills/*/SKILL.md; do
    tokens=$(estimate_tokens "$skill")
    assert_less_than $tokens 5000
  done
}
```

### 6.3 Concurrent Agent Stress Test
```bash
# tests/performance/test-concurrent-agents.sh

test_handles_max_concurrent_agents() {
  # Spawn 4 agents (max allowed)
  pids=()
  for i in {1..4}; do
    spawn_background_agent "test-generator" "Task $i" &
    pids+=($!)
  done

  # All should complete without errors
  for pid in "${pids[@]}"; do
    wait $pid
    assert_exit_code 0
  done
}
```

---

## 7. JSON Schema Validation (15 Test Cases)

### 7.1 Schema Definitions
```
tests/schemas/
├── plugin.schema.json
├── settings.schema.json
├── agent-registry.schema.json
├── agent-manifest.schema.json
├── skill-manifest.schema.json
├── context-identity.schema.json
├── context-session.schema.json
├── chain-config.schema.json
└── hook-input.schema.json
```

### 7.2 Schema Validation Tests
```bash
# tests/unit/test-json-schemas.sh

test_plugin_json_valid() {
  validate_against_schema "plugin.json" "tests/schemas/plugin.schema.json"
  assert_exit_code 0
}

test_settings_json_valid() {
  validate_against_schema ".claude/settings.json" "tests/schemas/settings.schema.json"
  assert_exit_code 0
}

test_all_agent_manifests_valid() {
  for manifest in .claude/agents/*/manifest.json; do
    validate_against_schema "$manifest" "tests/schemas/agent-manifest.schema.json"
    assert_exit_code 0
  done
}
```

---

## 8. Test Fixtures

### 8.1 Hook Input Fixtures
```json
// tests/fixtures/hook-inputs.json
{
  "pretool_read": {
    "tool_name": "Read",
    "tool_input": {
      "file_path": "/project/src/index.ts"
    },
    "session_id": "test-session-001"
  },
  "pretool_bash_safe": {
    "tool_name": "Bash",
    "tool_input": {
      "command": "git status"
    }
  },
  "pretool_bash_dangerous": {
    "tool_name": "Bash",
    "tool_input": {
      "command": "rm -rf /"
    }
  },
  "pretool_task": {
    "tool_name": "Task",
    "tool_input": {
      "subagent_type": "test-generator",
      "description": "Generate tests",
      "run_in_background": true
    }
  },
  "posttool_success": {
    "tool_name": "Bash",
    "tool_result": "success output",
    "exit_code": 0
  },
  "posttool_error": {
    "tool_name": "Bash",
    "tool_error": "command not found",
    "exit_code": 127
  }
}
```

### 8.2 Security Attack Payloads
```json
// tests/fixtures/security-payloads.json
{
  "path_traversal": [
    "../../../etc/passwd",
    "..%2F..%2Fetc%2Fpasswd",
    "/tmp/safe.txt\u0000/etc/passwd"
  ],
  "command_injection": [
    "git status; rm -rf /",
    "$(touch /tmp/pwned)",
    "`whoami`"
  ],
  "jq_injection": [
    ".tool_input) | debug | (.",
    "[\"secret\"][]",
    ".. | objects | select(.api_key)"
  ]
}
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Plugin Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Unit Tests
        run: ./tests/run-all-tests.sh --unit

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Security Tests
        run: ./tests/run-all-tests.sh --security

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - name: Run Integration Tests
        run: ./tests/run-all-tests.sh --integration

  performance-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v4
      - name: Run Performance Tests
        run: ./tests/run-all-tests.sh --performance

  validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate JSON Files
        run: ./tests/run-all-tests.sh --json-validation
      - name: ShellCheck
        run: shellcheck .claude/hooks/**/*.sh
      - name: Validate Manifests
        run: ./tests/run-all-tests.sh --manifests
```

---

## 10. Coverage Targets

| Component | Current | Target |
|-----------|---------|--------|
| Hooks | 30% | 90% |
| Skills | 10% | 80% |
| Agents | 5% | 80% |
| Security | 0% | 100% |
| Integration | 20% | 75% |
| JSON Schemas | 50% | 100% |

---

## 11. Implementation Priority

### Phase 1: Critical (Week 1)
1. Security tests (35 tests)
2. Hook _lib/common.sh tests (8 tests)
3. Permission hooks tests (6 tests)
4. Context gate tests (4 tests)

### Phase 2: High (Week 2)
1. All pretool hook tests (26 tests)
2. All posttool hook tests (10 tests)
3. JSON schema validation (15 tests)
4. Core skill validation (40 tests)

### Phase 3: Medium (Week 3)
1. Integration tests (50 tests)
2. Remaining skill tests (124 tests)
3. Agent tests (40 tests)
4. Lifecycle hook tests (10 tests)

### Phase 4: Complete (Week 4)
1. Performance tests (20 tests)
2. Notification hook tests (4 tests)
3. Edge case tests
4. Documentation

---

## 12. Test Execution

```bash
# Run all tests
./tests/run-all-tests.sh

# Run specific category
./tests/run-all-tests.sh --security
./tests/run-all-tests.sh --unit
./tests/run-all-tests.sh --integration
./tests/run-all-tests.sh --performance

# Run with verbose output
./tests/run-all-tests.sh --verbose

# Run quick validation (no integration)
./tests/run-all-tests.sh --quick

# Generate coverage report
./tests/run-all-tests.sh --coverage
```

---

*Generated: 2026-01-08*
*Version: v4.5.0*
*Total Test Cases: 450+*
