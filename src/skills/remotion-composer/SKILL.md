---
name: remotion-composer
description: Compose final demo videos using Remotion. Combines terminal recordings, Manim animations, and branded overlays into polished marketing videos.
context: fork
version: 1.0.0
author: OrchestKit
tags: [remotion, video, composition, marketing, demo]
---

# Remotion Composer

Final video composition combining all demo assets.

## Quick Start

```bash
# Add composition for a skill
./scripts/add-composition.sh explore

# Render
npx remotion render ExploreDemo out/ExploreDemo.mp4
```

## Composition Structure

```tsx
<Composition
  id="{SkillName}Demo"
  component={HybridDemo}
  durationInFrames={FPS * duration}
  fps={30}
  width={1920}  // or 1080 for vertical
  height={1080} // or 1920 for vertical
  schema={hybridDemoSchema}
  defaultProps={{
    skillName: "{name}",
    hook: "{marketing_hook}",
    terminalVideo: "{name}-demo.mp4",
    ccVersion: "CC 2.1.19",
    primaryColor: "{color}",
    showHook: true,
    showCTA: true,
    hookDuration: 45,
    ctaDuration: 75,
    backgroundMusic: "audio/ambient-tech.mp3",
    musicVolume: 0.12,
    enableSoundEffects: true,
  }}
/>
```

## Layer Stack

```
┌─────────────────────────────────────────┐
│  Layer 5: CTA Overlay (bottom)          │
├─────────────────────────────────────────┤
│  Layer 4: Watermark (top-right)         │
├─────────────────────────────────────────┤
│  Layer 3: Progress Bar (bottom)         │
├─────────────────────────────────────────┤
│  Layer 2: Manim Animation (optional)    │
├─────────────────────────────────────────┤
│  Layer 1: Terminal Video (VHS)          │
├─────────────────────────────────────────┤
│  Layer 0: Background + Vignette         │
└─────────────────────────────────────────┘
```

## Timeline

```
Frame:  0    45   hookEnd        ctaStart  end
        |----|----|--------------|---------|
        Hook      Terminal Video      CTA
        Intro     (VHS + Manim)       Outro
```

## Audio

- **Background**: Subtle ambient track (0.12 volume)
- **SFX**: Success chime on CTA reveal (0.3 volume)
- **Fades**: 0.5s fade-in, 1s fade-out

## Formats

| Format | Resolution | Use Case |
|--------|------------|----------|
| Horizontal | 1920x1080 | YouTube, Twitter |
| Vertical | 1080x1920 | TikTok, Reels, Shorts |
| Square | 1080x1080 | Instagram, LinkedIn |

## Color Mapping

Skills have associated colors:
- explore: #8b5cf6 (purple)
- verify: #22c55e (green)
- commit: #06b6d4 (cyan)
- brainstorming: #f59e0b (amber)
- review-pr: #f97316 (orange)
- remember: #ec4899 (pink)

Default: #8b5cf6 (purple)
