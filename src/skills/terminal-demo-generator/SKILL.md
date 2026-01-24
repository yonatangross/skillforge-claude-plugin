---
name: terminal-demo-generator
description: Reference patterns for VHS terminal recordings. Documents tape format, Claude Code CLI simulation, and terminal output patterns.
context: inherit
version: 1.0.0
author: OrchestKit
tags: [demo, video, vhs, terminal, reference, cli]
---

# Terminal Demo Generator

Reference patterns for creating VHS terminal recordings and Claude Code CLI simulations.

> **Note**: Actual generation is performed by `demo-producer/scripts/generate.sh`. This skill provides reference patterns.

## VHS Tape Format

### Horizontal (16:9)
```tape
Output ../output/{name}-demo.mp4
Set Shell "bash"
Set FontFamily "Menlo"
Set FontSize 18
Set Width 1400
Set Height 650
Set Theme "Dracula"
Set Padding 30
Set Framerate 30
Set TypingSpeed 50ms

Type "../scripts/demo-{name}.sh"
Enter
Sleep 12s
```

### Vertical (9:16)
```tape
Output ../output/{name}-demo-vertical.mp4
Set Shell "bash"
Set FontFamily "Menlo"
Set FontSize 22
Set Width 900
Set Height 1400
Set Theme "Dracula"
Set Padding 40
Set Framerate 30
Set TypingSpeed 50ms

Type "../scripts/demo-{name}.sh"
Enter
Sleep 12s
```

## Claude Code CLI Simulation

### Status Bar (CC 2.1.16+)
```bash
[Opus 4.5] ████████░░ 42% | ~/project git:(main) | ● 3m
✓ Bash ×3 | ✓ Read ×5 | ✓ Grep ×2 | ✓ Task ×∞
>> bypass permissions on (shift+Tab to cycle)
```

### Skill Activation
```bash
◆ Activating skill: {name}
  → Reading skills/{name}/SKILL.md
  → Auto-injecting: {related_skills}
✓ {description}
```

### Task Management (CC 2.1.16)
```bash
◆ TaskCreate: Created task #1 "{phase_name}"
◆ TaskUpdate: Task #1 → in_progress
⠋ [Task #1] Processing...
✓ [Task #1] {phase_name} completed
◆ TaskList: 2/2 completed
```

### Parallel Agent Spawning
```bash
⚡ Spawning {n} parallel agents via Task tool...
◆ TaskUpdate: Task #1 → in_progress
◆ TaskUpdate: Task #2 → in_progress
✓ [Task #1] ork:{agent_1} analyzing... completed
✓ [Task #2] ork:{agent_2} scanning... completed
```

## Terminal Color Codes

```bash
GREEN="\033[32m"   # Success, prompts
YELLOW="\033[33m"  # Warnings, in_progress
CYAN="\033[36m"    # Info, tasks
MAGENTA="\033[35m" # Agents, skills
DIM="\033[2m"      # Secondary text
BOLD="\033[1m"     # Emphasis
RESET="\033[0m"    # Reset formatting
```

## Spinner Animation

```bash
SPINNERS=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

spinner() {
    local message="$1"
    local duration="${2:-1}"
    local i=0
    while [ $SECONDS -lt $((SECONDS + duration)) ]; do
        printf "\r${CYAN}${SPINNERS[$i]} ${message}${RESET}"
        i=$(( (i + 1) % ${#SPINNERS[@]} ))
        sleep 0.1
    done
}
```

## References

See `references/` for detailed patterns:
- `vhs-tape-format.md` - VHS configuration options
- `cc-simulation.md` - Claude Code CLI patterns
