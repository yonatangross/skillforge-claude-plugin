# OrchestKit Demo Videos

Authentic Claude Code CLI demo recordings for marketplace promotion.

## Approach

We use **VHS** (by Charmbracelet) to record terminal sessions that faithfully reproduce the real Claude Code CLI experience. No fake UIs - users see exactly what they'll get.

## Structure

```
orchestkit-demos/
├── scripts/
│   ├── demo-simulator.sh      # Simulates CC output with real formatting
│   └── generate-all-demos.sh  # Generate all videos
├── tapes/
│   ├── sim-explore.tape       # /explore demo script
│   ├── sim-verify.tape        # /verify demo script
│   ├── sim-commit.tape        # /commit demo script
│   ├── sim-brainstorming.tape # /brainstorming demo script
│   ├── sim-review-pr.tape     # /review-pr demo script
│   └── sim-remember.tape      # /remember demo script
└── output/
    └── *.mp4                  # Generated videos
```

## Generate All Demos

```bash
./scripts/generate-all-demos.sh
```

## Generate Single Demo

```bash
cd tapes
vhs sim-explore.tape
```

## Preview Simulator

```bash
# See raw terminal output
./scripts/demo-simulator.sh explore
./scripts/demo-simulator.sh verify
./scripts/demo-simulator.sh commit
./scripts/demo-simulator.sh brainstorming
./scripts/demo-simulator.sh review-pr
./scripts/demo-simulator.sh remember
```

## Demo Descriptions

| Demo | Duration | Description |
|------|----------|-------------|
| explore | ~15s | Codebase exploration with parallel agents |
| verify | ~18s | 6-agent validation pipeline with progress |
| commit | ~12s | AI-generated conventional commits |
| brainstorming | ~18s | Socratic method design phases |
| review-pr | ~18s | PR review with findings (blocking/suggestions/passed) |
| remember | ~12s | Knowledge graph storage |

## Customization

### Edit Simulator Output
Modify `scripts/demo-simulator.sh` to change:
- Terminal colors
- Output text and timing
- Demo content

### Edit Recording Settings
Modify `.tape` files to change:
- Terminal size (`Set Width/Height`)
- Font (`Set FontFamily/FontSize`)
- Theme (`Set Theme`)
- Duration (`Sleep`)

## Requirements

- VHS: `brew install charmbracelet/tap/vhs`
- JetBrains Mono font (for faithful rendering)

## Why This Approach?

1. **Authentic**: Shows real CLI styling, no fake UIs
2. **Reproducible**: Scripted demos can be regenerated anytime
3. **Controllable**: Timing and content are deterministic
4. **Honest**: Users see exactly what they'll experience

## Alternative: Remotion Components

The `src/components/` directory contains Remotion components if you prefer React-based video generation:
- `StyledDemo.tsx` - CSS-styled terminal boxes
- `RichDemo.tsx` - ASCII art version (deprecated - rendering issues)

Run with `npm run dev` to preview in Remotion Studio.
