# Code Quality Rules - SkillForge Backend

**Version:** 1.0
**Enforcement:** CI/CD pipeline + pre-commit validation
**AI Assistant:** Code Quality Reviewer agent for refactoring help
**Linter:** Ruff (Rust-based Python linter/formatter)

---

## Pre-Commit Validation (MANDATORY)

**Before EVERY commit, run:**

```bash
cd backend
poetry run ruff format --check app/  # Format check (CI runs this!)
poetry run ruff check app/           # Lint check
poetry run ty check app/ --exclude "app/evaluation/*"  # Type check
```

---

## PLR0915: Too Many Statements

**Rule:** `max-statements: 50`

**Rationale:**

- Forces function decomposition
- Improves testability (smaller units)
- Reduces cognitive load
- Makes code reviews easier

**When violated:**

```bash
PLR0915 Too many statements (72 > 50) in function `_run_agent_with_tracking_impl`
```

**Refactoring strategy (Issue #507 pattern):**

1. **Identify logical units** - Look for code blocks that do one thing
2. **Extract helper functions** - Move units to private `_helper()` functions
3. **Use dataclasses for parameters** - Group related params to reduce arguments
4. **Extract to modules** - For reusable logic, create new modules

**Example refactoring:**

**Before (72 statements):**

```python
async def _run_agent_with_tracking_impl(params, config):
    start_time = time.time()
    await emit_agent_progress(...)
    logger.info(...)

    try:
        user_prompt = build_agent_user_prompt(...)
        input_messages = {"messages": [...]}

        max_retries = get_specificity_max_retries()
        min_score = get_specificity_min_score()
        min_findings = get_min_agent_findings()

        # 50+ more lines of retry loop, validation, etc.
        attempts = 0
        while attempts <= max_retries:
            final_result = await invoke_agent(...)
            findings = extract_structured_response(...)
            # more validation logic...
            # more self-correction logic...
            attempts += 1

        return await process_agent_result(...)
    except Exception as e:
        await handle_agent_error(...)
        raise
```

**After (~35 statements):**

```python
async def _run_agent_with_tracking_impl(params, config):
    start_time = time.time()
    await emit_agent_progress(...)

    try:
        user_prompt = build_agent_user_prompt(...)
        input_messages = {"messages": [...]}

        # Initialize validation configuration
        max_retries = get_specificity_max_retries()
        min_score = get_specificity_min_score()

        # Execute retry loop (extracted to helper)
        findings = await _execute_agent_retry_loop(
            params=params,
            config=config,
            input_messages=input_messages,
            max_retries=max_retries,
            min_score=min_score,
            ...
        )

        return await process_agent_result(...)
    except Exception as e:
        await handle_agent_error(...)
        raise


async def _execute_agent_retry_loop(  # noqa: PLR0913
    params, config, input_messages, max_retries, min_score, ...
):
    """Execute agent with retry loop for validation failures."""
    attempts = 0
    while attempts <= max_retries:
        final_result = await _invoke_agent_with_timeout(params, config, input_messages)
        findings = extract_structured_response(...)

        # Validation checks...
        if validation_passed:
            break
        attempts += 1

    return findings
```

**Key patterns used:**

1. **Extract retry loop** to `_execute_agent_retry_loop()`
2. **Extract timeout handling** to `_invoke_agent_with_timeout()`
3. **Extract to modules** for reusable validation logic (`validation/self_correction.py`)

---

## PLR0913: Too Many Arguments

**Rule:** `max-args: 5`

**When violated:**

```bash
PLR0913 Too many arguments in function definition (9 > 5)
```

**Refactoring strategies:**

### Strategy 1: Use Dataclasses (Preferred)

```python
# Before
async def run_agent_with_tracking(
    agent, content, content_type, analysis_id, agent_type,
    session, max_content_length, proactive_context, specificity_threshold
):
    ...

# After
@dataclass
class AgentExecutionParams:
    agent: Runnable
    content: str
    content_type: str
    analysis_id: AnalysisID
    agent_type: str
    proactive_context: str = ""

@dataclass
class AgentExecutionConfig:
    session: AsyncSession
    max_content_length: int = 12000
    specificity_threshold: float | None = None

async def run_agent_with_tracking(params: AgentExecutionParams, config: AgentExecutionConfig):
    ...
```

### Strategy 2: Use noqa for Intentional Complexity

When refactoring would hurt readability (e.g., internal helper functions that are only called once):

```python
async def _execute_agent_retry_loop(  # noqa: PLR0913
    params: AgentExecutionParams,
    config: AgentExecutionConfig,
    input_messages: dict[str, Any],
    max_retries: int,
    min_score: float,
    min_findings: int,
    self_correction_ctx: SelfCorrectionContext,
    validator: Any | None,
    use_compact_prompts: bool,
) -> dict[str, Any]:
    """Execute agent with retry loop for validation failures.

    Note: Many parameters are intentional for this internal helper.
    """
    ...
```

---

## ARG001: Unused Function Argument

**When violated:**

```bash
ARG001 Unused function argument: `findings`
```

**Refactoring strategies:**

### Strategy 1: Remove Unused Arguments

```python
# Before
def validate_findings_count(
    findings: dict,  # ARG001: Unused!
    agent_type: str,
    insights_count: int,
):
    # findings is never used, only insights_count
    if insights_count < MIN_FINDINGS:
        ...

# After
def validate_findings_count(
    agent_type: str,
    insights_count: int,  # Pass the count directly
):
    if insights_count < MIN_FINDINGS:
        ...
```

### Strategy 2: Underscore Prefix for Intentional Non-Use

For callback signatures that must match a protocol:

```python
def validate_callback(
    _findings: dict,  # Underscore signals intentional non-use
    agent_type: str,
) -> bool:
    return agent_type in SUPPORTED_AGENTS
```

---

## D413: Missing Blank Line After Docstring Section

**When violated:**

```bash
D413 Missing blank line after last section
```

**Auto-fix:**

```bash
poetry run ruff check --fix app/
```

**Manual fix:**

```python
# Before
def my_function():
    """Do something.

    Returns:
        The result.
    """  # No blank line before closing quotes
    return result

# After
def my_function():
    """Do something.

    Returns:
        The result.

    """  # Blank line before closing quotes
    return result
```

---

## UP035: Import from collections.abc

**When violated:**

```bash
UP035 Import from `collections.abc` instead of `typing`
```

**Auto-fix:**

```bash
poetry run ruff check --fix app/
```

**Manual fix:**

```python
# Before (deprecated in Python 3.9+)
from typing import Callable, Coroutine

# After
from collections.abc import Callable, Coroutine
```

---

## F401: Unused Imports

**When violated:**

```bash
F401 `module.unused_function` imported but unused
```

**Auto-fix:**

```bash
poetry run ruff check --fix app/
```

**Handling re-exports in __init__.py:**

```python
# In __init__.py - use __all__ for explicit re-exports
from .validators import ValidationResult
from .helpers import validate_findings_count

__all__ = [
    "ValidationResult",
    "validate_findings_count",
]
```

---

## Module Extraction Pattern

**When to extract to a new module:**

1. Code block is 50+ lines of cohesive logic
2. Logic is reusable across multiple callers
3. Logic has its own clear domain/responsibility
4. Unit testing would be easier with isolation

**Issue #507 example:**

```
app/domains/analysis/workflows/agents/
├── execution.py           # Main orchestration (reduced from 72 to 35 statements)
└── validation/
    ├── __init__.py        # Re-exports for clean imports
    ├── execution_helpers.py    # Validation check logic
    ├── self_correction.py      # Self-correction loop logic
    ├── output_validators.py    # Per-agent validators
    └── correction_prompts.py   # Correction prompt templates
```

**Benefits:**

- Each module < 200 lines
- Single responsibility per module
- Easy to test in isolation
- Clear import paths

---

## Test Patching After Refactoring

**Critical:** When you move functions to new modules, update test patches!

**Problem:**

```python
# Test that worked before refactoring
monkeypatch.setattr(execution, "score_agent_output", fake_fn)

# After moving to execution_helpers.py:
# AttributeError: <module 'execution'> has no attribute 'score_agent_output'
```

**Solution:**

```python
# Import the new module
from app.domains.analysis.workflows.agents.validation import execution_helpers

# Patch at the new location
monkeypatch.setattr(execution_helpers, "score_agent_output", fake_fn)
```

**Best practice:** Add a comment explaining the patch location:

```python
# Issue #507 Refactoring: score_agent_output moved to execution_helpers
monkeypatch.setattr(execution_helpers, "score_agent_output", fake_fn)
```

---

## noqa Usage Guidelines

**When to use noqa comments:**

1. **Intentional complexity** that aids readability
2. **Legacy code** being gradually refactored
3. **Framework requirements** (e.g., callback signatures)

**Format:**

```python
# Single rule
async def complex_function(a, b, c, d, e, f):  # noqa: PLR0913

# Multiple rules
def legacy_function(...):  # noqa: PLR0913, PLR0915

# With explanation (recommended)
async def _retry_loop(  # noqa: PLR0913 - internal helper, params intentional
    ...
):
```

**Never use noqa for:**

- Actual bugs or code smells
- Issues that should be fixed
- Avoiding legitimate refactoring

---

## Quality Commands

```bash
# Full quality check (what CI runs)
cd backend
poetry run ruff format --check app/  # Format check
poetry run ruff check app/           # Lint check
poetry run ty check app/ --exclude "app/evaluation/*"  # Type check

# Auto-fix what can be fixed
poetry run ruff check --fix app/
poetry run ruff format app/

# Run tests with coverage
poetry run pytest tests/unit/ --tb=short -v 2>&1 | tee /tmp/test_results.log
```

---

## AI-Assisted Refactoring

### When CI Fails

**Step 1:** CI fails with error:

```bash
PLR0915 Too many statements (72 > 50) in function `_run_agent_with_tracking_impl`
```

**Step 2:** Ask Code Quality Reviewer agent:

```
"Help me refactor _run_agent_with_tracking_impl in execution.py - it has 72 statements, need < 50"
```

**Step 3:** Agent analyzes and suggests:

- Which code blocks to extract
- New helper function signatures
- New module structure if needed
- Test updates required

**Step 4:** Apply suggestions and run checks again

### Refactoring Prompts

**For PLR0915 (too many statements):**

```
"Refactor [function] in [file] - has [N] statements, need < 50. Show extraction strategy."
```

**For PLR0913 (too many arguments):**

```
"Reduce parameters in [function] - has [N] args, need < 5. Suggest dataclass grouping."
```

**For module extraction:**

```
"Help me extract [logic description] from [file] into a new module. Show new structure."
```

---

## Best Practices Summary

| Practice | Description |
|----------|-------------|
| **Extract early** | Don't wait for lint failures - refactor at 40 statements |
| **Use dataclasses** | Group related parameters for cleaner APIs |
| **Name helpers clearly** | `_execute_retry_loop()` > `_helper()` |
| **Document noqa usage** | Explain why the rule is bypassed |
| **Update tests** | Patch at new locations after moves |
| **Run full checks** | `ruff format --check` + `ruff check` + `ty check` |

---

**Remember:** These rules exist to help you write maintainable code. When you hit a limit, it's a signal to decompose, not a burden. Use the Code Quality Reviewer agent to help!
