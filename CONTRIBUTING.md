# Contributing to SkillForge Plugin

Welcome to the SkillForge plugin for Claude Code! We're excited that you're interested in contributing. This plugin extends Claude Code with specialized skills, commands, and agents for AI-native development workflows.

## How to Contribute

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SkillForge.git
   cd SkillForge
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or for issues:
   git checkout -b issue/123-description
   ```
4. **Make your changes** following the guidelines below
5. **Test your changes** thoroughly
6. **Submit a Pull Request** to the `main` branch

### Branch Naming Convention

- `feature/` - New features or enhancements
- `issue/` - Bug fixes or issue resolutions
- `docs/` - Documentation updates

## Adding New Skills

Skills are markdown files that provide specialized knowledge and workflows to Claude Code.

### Directory Structure

```
.claude-plugin/
└── skills/
    └── your-skill-name.md
```

### Skill File Format

Each skill should follow this structure:

```markdown
# Skill Name

Brief description of what this skill provides.

## When to Use

- Use case 1
- Use case 2

## Key Concepts

Detailed explanation of concepts, patterns, or workflows.

## Examples

Code examples and usage patterns.

## Best Practices

- Practice 1
- Practice 2
```

### Updating capabilities.json

After adding a skill, register it in `.claude-plugin/capabilities.json`:

```json
{
  "skills": {
    "your-skill-name": {
      "name": "your-skill-name",
      "description": "Brief description for skill discovery",
      "file": "skills/your-skill-name.md",
      "category": "appropriate-category",
      "triggers": ["keyword1", "keyword2"]
    }
  }
}
```

**Categories**: `ai-development`, `backend`, `frontend`, `devops`, `testing`, `security`, `observability`, `workflow`

## Adding New Commands

Commands are markdown files that define slash commands for Claude Code.

### Directory Structure

```
.claude-plugin/
└── commands/
    └── your-command.md
```

### Command File Format

```markdown
# /your-command

Brief description of what this command does.

## Usage

```
/your-command [arguments]
```

## Arguments

- `arg1` - Description of argument 1
- `arg2` - (Optional) Description of argument 2

## Workflow

1. Step 1 of what the command does
2. Step 2
3. Step 3

## Example

```bash
/your-command example-usage
```
```

### Registering Commands

Add to `.claude-plugin/capabilities.json`:

```json
{
  "commands": {
    "your-command": {
      "name": "your-command",
      "description": "What the command does",
      "file": "commands/your-command.md"
    }
  }
}
```

## Adding New Agents

Agents are specialized AI personas with focused capabilities.

### Directory Structure

```
.claude-plugin/
└── agents/
    └── your-agent.md
```

### Agent File Format

```markdown
# Agent: Your Agent Name

## Role

Brief description of the agent's specialized role.

## Capabilities

- Capability 1
- Capability 2
- Capability 3

## Workflow

How the agent approaches tasks.

## Collaboration

How this agent works with other agents or the main Claude instance.

## Constraints

Any limitations or boundaries for this agent.
```

### Registering Agents

Add to `.claude-plugin/capabilities.json`:

```json
{
  "agents": {
    "your-agent": {
      "name": "your-agent",
      "description": "Agent's specialized purpose",
      "file": "agents/your-agent.md"
    }
  }
}
```

## Code Style for Hooks

All shell hooks must follow these conventions for security and reliability.

### Required Header

Every hook script must start with:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Source common utilities
source "$(dirname "$0")/common.sh"
```

### Flags Explained

- `set -e` - Exit immediately on error
- `set -u` - Error on undefined variables
- `set -o pipefail` - Catch errors in pipelines

### Example Hook

```bash
#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/common.sh"

# Your hook logic here
log_info "Starting hook execution"

# Use functions from common.sh
validate_input "$1"
```

## Security Guidelines

Security is critical for Claude Code plugins. Follow these rules strictly:

### Prohibited Patterns

1. **No `eval`** - Never use `eval` or similar dynamic execution
   ```bash
   # BAD - Never do this
   eval "$user_input"

   # GOOD - Use explicit commands
   case "$user_input" in
     "option1") do_thing_1 ;;
     "option2") do_thing_2 ;;
   esac
   ```

2. **No network calls in hooks** - Hooks must not make HTTP requests
   ```bash
   # BAD - No network calls
   curl "$some_url"
   wget "$some_url"

   # GOOD - Work with local files only
   cat "$local_file"
   ```

3. **Escape user input** - Always sanitize and quote user input
   ```bash
   # BAD - Unquoted variable
   echo $user_input

   # GOOD - Quoted variable
   echo "${user_input}"

   # GOOD - Using printf for safety
   printf '%s\n' "${user_input}"
   ```

### Additional Security Requirements

- Never store secrets or credentials in skill files
- Validate all file paths before operations
- Use `readonly` for constants
- Prefer explicit allowlists over denylists

## Testing Guidelines

### Testing Skills

1. Test skill discovery by searching for relevant keywords
2. Verify the skill content is accurate and up-to-date
3. Test all code examples in the skill documentation

### Testing Commands

1. Test command execution with various arguments
2. Test error handling with invalid inputs
3. Verify output formatting

### Testing Agents

1. Test agent invocation through the Task tool
2. Verify agent stays within its defined scope
3. Test collaboration with other agents

### Testing Hooks

```bash
# Run hook tests
cd .claude-plugin/hooks
./test_hooks.sh

# Test individual hook
bash -x your-hook.sh test-argument
```

### Before Submitting

- [ ] All new skills/commands/agents are registered in `capabilities.json`
- [ ] Documentation is clear and complete
- [ ] Code examples are tested and working
- [ ] Hook scripts use `set -euo pipefail`
- [ ] No security violations (eval, network calls, unescaped input)
- [ ] Changelog updated with your changes

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

In summary:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Maintain a harassment-free environment

## Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Open a new discussion for general questions
3. Open an issue for bug reports or feature requests

Thank you for contributing to SkillForge!
