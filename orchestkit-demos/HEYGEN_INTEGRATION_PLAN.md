# HeyGen + Remotion Integration Plan

## Overview

Create a production-ready integration between HeyGen AI avatars and Remotion video compositions for OrchestKit demo videos.

**Goal:** Generate professional AI presenter videos where an avatar introduces OrchestKit features, overlaid with motion graphics, stats animations, and branded elements.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HEYGEN + REMOTION PIPELINE                          │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
  │   Script     │────▶│   HeyGen     │────▶│   Remotion   │────▶│  Final   │
  │   (Text)     │     │   API        │     │   Compose    │     │  Video   │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────┘
        │                    │                     │                   │
        │                    │                     │                   │
        ▼                    ▼                     ▼                   ▼
  "Welcome to         POST /v2/video/       ┌─────────────┐      MP4/WebM
   OrchestKit..."     generate              │ Background  │      1080p
                           │                │ Avatar      │
                           │                │ Overlays    │
                      ┌────▼────┐           │ Captions    │
                      │ Poll    │           │ CTA         │
                      │ Status  │           └─────────────┘
                      │ ~10min  │
                      └────┬────┘
                           │
                      video_url
```

---

## Phase 1: HeyGen Service Layer

### 1.1 Create `src/lib/heygen.ts`

**Purpose:** Type-safe wrapper around HeyGen API with error handling and polling.

```typescript
// src/lib/heygen.ts

// ==================== TYPES ====================

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url: string;
  premium: boolean;
  default_voice_id: string;
}

export interface HeyGenVoice {
  voice_id: string;
  name: string;
  language: string;
  gender: string;
  preview_audio: string;
  support_pause: boolean;
  emotion_support: boolean;
}

export interface VideoGenerationRequest {
  script: string;
  avatarId: string;
  voiceId: string;
  options?: {
    style?: "normal" | "closeUp" | "circle";
    backgroundColor?: string;
    dimension?: { width: number; height: number };
    test?: boolean; // Watermarked, no credits used
  };
}

export interface VideoStatus {
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
}

// ==================== API CLIENT ====================

const HEYGEN_API_BASE = "https://api.heygen.com";

async function heygenFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new Error("HEYGEN_API_KEY not set");

  const response = await fetch(`${HEYGEN_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "HeyGen API error");
  return data.data;
}

// ==================== API METHODS ====================

/** List all available avatars */
export async function listAvatars(): Promise<HeyGenAvatar[]> {
  const data = await heygenFetch<{ avatars: HeyGenAvatar[] }>("/v2/avatars");
  return data.avatars;
}

/** List all available voices */
export async function listVoices(): Promise<HeyGenVoice[]> {
  const data = await heygenFetch<{ voices: HeyGenVoice[] }>("/v2/voices");
  return data.voices;
}

/** Generate a video - returns video_id for polling */
export async function generateVideo(
  request: VideoGenerationRequest
): Promise<string> {
  const {
    script,
    avatarId,
    voiceId,
    options = {},
  } = request;

  const {
    style = "normal",
    backgroundColor = "#1a1a2e",
    dimension = { width: 1920, height: 1080 },
    test = false,
  } = options;

  const body = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: style,
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: voiceId,
        },
        background: {
          type: "color",
          value: backgroundColor,
        },
      },
    ],
    dimension,
    test,
  };

  const data = await heygenFetch<{ video_id: string }>(
    "/v2/video/generate",
    { method: "POST", body: JSON.stringify(body) }
  );

  return data.video_id;
}

/** Check video generation status */
export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  return heygenFetch<VideoStatus>(`/v1/video_status.get?video_id=${videoId}`);
}

/** Poll until video is ready (with timeout) */
export async function waitForVideo(
  videoId: string,
  options: {
    pollInterval?: number; // ms, default 30000 (30s)
    timeout?: number; // ms, default 900000 (15min)
    onProgress?: (status: VideoStatus) => void;
  } = {}
): Promise<string> {
  const {
    pollInterval = 30000,
    timeout = 900000,
    onProgress,
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await getVideoStatus(videoId);
    onProgress?.(status);

    if (status.status === "completed" && status.video_url) {
      return status.video_url;
    }

    if (status.status === "failed") {
      throw new Error(`Video generation failed: ${status.error}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Video generation timed out after ${timeout}ms`);
}

/** Get remaining API quota */
export async function getQuota(): Promise<{
  remaining_quota: number;
  used_quota: number;
}> {
  return heygenFetch("/v1/video/quota.get");
}
```

### 1.2 Create Test Script

```typescript
// scripts/test-heygen.ts
import { listAvatars, listVoices, getQuota } from "../src/lib/heygen";
import "dotenv/config";

async function main() {
  console.log("Testing HeyGen API connection...\n");

  // Test 1: Check quota
  console.log("1. Checking quota...");
  const quota = await getQuota();
  console.log(`   ✓ Remaining: ${quota.remaining_quota} credits\n`);

  // Test 2: List avatars
  console.log("2. Listing avatars...");
  const avatars = await listAvatars();
  console.log(`   ✓ Found ${avatars.length} avatars`);
  console.log(`   Sample: ${avatars[0]?.avatar_name} (${avatars[0]?.avatar_id})\n`);

  // Test 3: List voices
  console.log("3. Listing voices...");
  const voices = await listVoices();
  console.log(`   ✓ Found ${voices.length} voices`);
  const englishVoices = voices.filter(v => v.language === "English");
  console.log(`   English voices: ${englishVoices.length}\n`);

  console.log("✅ HeyGen API connection successful!");
}

main().catch(console.error);
```

---

## Phase 2: Remotion Components

### 2.1 Create `src/components/shared/AvatarVideo.tsx`

**Purpose:** Reusable component for displaying HeyGen avatar videos with positioning presets.

```typescript
// src/components/shared/AvatarVideo.tsx
import { OffthreadVideo, useVideoConfig } from "remotion";

export type AvatarPosition =
  | "fullscreen"
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "pip-small"
  | "pip-medium"
  | "left-third"
  | "right-third";

interface AvatarVideoProps {
  src: string;
  position?: AvatarPosition;
  transparent?: boolean;
  circular?: boolean;
  scale?: number;
  offset?: { x: number; y: number };
}

const POSITION_STYLES: Record<AvatarPosition, React.CSSProperties> = {
  fullscreen: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  "bottom-right": {
    position: "absolute",
    bottom: 40,
    right: 40,
    width: "35%",
    height: "auto",
  },
  "bottom-left": {
    position: "absolute",
    bottom: 40,
    left: 40,
    width: "35%",
    height: "auto",
  },
  "top-right": {
    position: "absolute",
    top: 40,
    right: 40,
    width: "30%",
    height: "auto",
  },
  "pip-small": {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: "20%",
    height: "auto",
  },
  "pip-medium": {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: "28%",
    height: "auto",
  },
  "left-third": {
    position: "absolute",
    left: 0,
    top: 0,
    width: "33%",
    height: "100%",
    objectFit: "cover",
  },
  "right-third": {
    position: "absolute",
    right: 0,
    top: 0,
    width: "33%",
    height: "100%",
    objectFit: "cover",
  },
};

export const AvatarVideo: React.FC<AvatarVideoProps> = ({
  src,
  position = "fullscreen",
  transparent = false,
  circular = false,
  scale = 1,
  offset = { x: 0, y: 0 },
}) => {
  const baseStyle = POSITION_STYLES[position];

  const style: React.CSSProperties = {
    ...baseStyle,
    transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
    borderRadius: circular ? "50%" : undefined,
    overflow: circular ? "hidden" : undefined,
  };

  return (
    <OffthreadVideo
      src={src}
      transparent={transparent}
      style={style}
    />
  );
};
```

### 2.2 Create `src/components/shared/AvatarPlaceholder.tsx`

**Purpose:** Placeholder while HeyGen video is generating.

```typescript
// src/components/shared/AvatarPlaceholder.tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface AvatarPlaceholderProps {
  avatarName?: string;
  previewImageUrl?: string;
  message?: string;
}

export const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({
  avatarName = "AI Avatar",
  previewImageUrl,
  message = "Avatar video generating...",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulsing animation
  const pulse = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.95, 1.05]
  );

  // Loading dots
  const dots = ".".repeat((Math.floor(frame / 20) % 4));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#1a1a2e",
      }}
    >
      {/* Avatar preview or silhouette */}
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          backgroundColor: "#2a2a4e",
          border: "3px solid #8b5cf6",
          overflow: "hidden",
          transform: `scale(${pulse})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 80 }}>👤</span>
        )}
      </div>

      {/* Avatar name */}
      <h3
        style={{
          color: "white",
          fontFamily: "Inter, system-ui",
          fontSize: 24,
          marginTop: 20,
        }}
      >
        {avatarName}
      </h3>

      {/* Loading message */}
      <p
        style={{
          color: "#8b5cf6",
          fontFamily: "Inter, system-ui",
          fontSize: 16,
          marginTop: 10,
        }}
      >
        {message}{dots}
      </p>
    </div>
  );
};
```

---

## Phase 3: Demo Composition

### 3.1 Create `src/components/HeyGenDemo.tsx`

**Timeline:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│                        HEYGEN DEMO TIMELINE (60s)                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  0s        5s        15s       30s       45s       55s       60s          │
│  │─────────│─────────│─────────│─────────│─────────│─────────│            │
│  │         │         │         │         │         │         │            │
│  │  INTRO  │   AVATAR PRESENTS FEATURES   │  STATS  │   CTA   │            │
│  │         │         │         │         │         │         │            │
│  │ Logo    │ "Welcome to OrchestKit..."   │ Counter │ Install │            │
│  │ Reveal  │ Avatar explains 3 features   │ AnimBar │ Command │            │
│  │         │         │         │         │         │         │            │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘            │
│                                                                            │
│  LAYERS:                                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ L4: Overlays (text, captions, CTA)                                 │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │ L3: Motion Graphics (stats, charts, badges)                        │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │ L2: Avatar Video (HeyGen MP4/WebM)                                 │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │ L1: Background (Aurora gradient + particles)                       │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Avatar Script

```markdown
# OrchestKit Demo Script (~45 seconds)

## Opening (0-5s)
[Logo animation - no avatar]

## Introduction (5-15s)
"Welcome to OrchestKit — the AI-powered development toolkit that
transforms how you build software."

## Feature 1: Skills (15-25s)
"With 169 specialized skills covering everything from API design
to database optimization, you get expert-level guidance built right
into your workflow."

## Feature 2: Agents (25-35s)
"Our 35 AI agents work as your specialized team — from backend
architects to security auditors — each trained for specific tasks."

## Feature 3: Hooks (35-45s)
"And with 144 automation hooks, quality gates and best practices
are enforced automatically, catching issues before they become problems."

## Transition to CTA (45-50s)
[Avatar fades, stats animation plays]

## CTA (50-60s)
[Install command with confetti]
```

---

## Phase 4: Generation Workflow

### 4.1 Create `scripts/generate-avatar.ts`

```typescript
// scripts/generate-avatar.ts
import { generateVideo, waitForVideo, listAvatars, listVoices } from "../src/lib/heygen";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const SCRIPT = `
Welcome to OrchestKit — the AI-powered development toolkit that transforms how you build software.

With 169 specialized skills covering everything from API design to database optimization, you get expert-level guidance built right into your workflow.

Our 35 AI agents work as your specialized team — from backend architects to security auditors — each trained for specific tasks.

And with 144 automation hooks, quality gates and best practices are enforced automatically, catching issues before they become problems.

Get started today with a single command.
`.trim();

async function main() {
  console.log("🎬 Starting HeyGen video generation...\n");

  // Get default avatar and voice from env or use defaults
  const avatarId = process.env.HEYGEN_DEFAULT_AVATAR_ID || "josh_lite3_20230714";
  const voiceId = process.env.HEYGEN_DEFAULT_VOICE_ID || "1bd001e7e50f421d891986aad5158bc8";

  console.log(`Avatar: ${avatarId}`);
  console.log(`Voice: ${voiceId}`);
  console.log(`Script: ${SCRIPT.length} characters\n`);

  // Generate video
  console.log("📤 Submitting to HeyGen API...");
  const videoId = await generateVideo({
    script: SCRIPT,
    avatarId,
    voiceId,
    options: {
      style: "normal",
      backgroundColor: "#0a0a0f", // Match our dark theme
      dimension: { width: 1920, height: 1080 },
      test: false, // Set to true for testing (watermarked, no credits)
    },
  });

  console.log(`✓ Video ID: ${videoId}\n`);

  // Save video ID for later reference
  const metadataPath = path.join(__dirname, "../public/videos/avatar-metadata.json");
  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  fs.writeFileSync(
    metadataPath,
    JSON.stringify({ videoId, createdAt: new Date().toISOString(), script: SCRIPT }, null, 2)
  );

  // Poll for completion
  console.log("⏳ Waiting for video generation (this takes 10-15 minutes)...\n");
  const videoUrl = await waitForVideo(videoId, {
    pollInterval: 30000,
    timeout: 20 * 60 * 1000, // 20 minutes
    onProgress: (status) => {
      const elapsed = Math.round((Date.now() - Date.parse(fs.readFileSync(metadataPath, "utf-8") && JSON.parse(fs.readFileSync(metadataPath, "utf-8")).createdAt)) / 1000);
      console.log(`   Status: ${status.status} (${elapsed}s elapsed)`);
    },
  });

  console.log(`\n✅ Video ready: ${videoUrl}\n`);

  // Update metadata
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  metadata.videoUrl = videoUrl;
  metadata.completedAt = new Date().toISOString();
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  // Download video
  console.log("📥 Downloading video...");
  const videoPath = path.join(__dirname, "../public/videos/avatar-presenter.mp4");
  const response = await fetch(videoUrl);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(videoPath, Buffer.from(buffer));

  console.log(`✓ Saved to: ${videoPath}\n`);
  console.log("🎉 Done! You can now use this video in Remotion compositions.");
}

main().catch(console.error);
```

### 4.2 Add npm scripts

```json
// package.json additions
{
  "scripts": {
    "heygen:test": "npx tsx scripts/test-heygen.ts",
    "heygen:generate": "npx tsx scripts/generate-avatar.ts",
    "heygen:status": "npx tsx scripts/check-status.ts"
  }
}
```

---

## Phase 5: Render Pipeline

### 5.1 Final Composition Registration

```typescript
// src/Root.tsx addition
<Composition
  id="HeyGenDemo"
  component={HeyGenDemo}
  durationInFrames={60 * 30} // 60 seconds at 30fps
  fps={30}
  width={1920}
  height={1080}
  defaultProps={{
    avatarVideoUrl: "", // Will be set after generation
    showPlaceholder: true,
  }}
/>
```

### 5.2 Render Script

```bash
#!/bin/bash
# scripts/render-heygen.sh

# Check if avatar video exists
if [ ! -f "public/videos/avatar-presenter.mp4" ]; then
  echo "❌ Avatar video not found. Run 'npm run heygen:generate' first."
  exit 1
fi

# Render the composition
npx remotion render HeyGenDemo \
  --props='{"avatarVideoUrl":"./public/videos/avatar-presenter.mp4","showPlaceholder":false}' \
  --output=output/heygen-demo.mp4 \
  --codec=h264 \
  --crf=18

echo "✅ Rendered to output/heygen-demo.mp4"
```

---

## File Structure Summary

```
orchestkit-demos/
├── src/
│   ├── lib/
│   │   └── heygen.ts                 # HeyGen API service
│   ├── components/
│   │   ├── shared/
│   │   │   ├── AvatarVideo.tsx       # Reusable avatar component
│   │   │   └── AvatarPlaceholder.tsx # Loading placeholder
│   │   └── HeyGenDemo.tsx            # Main demo composition
│   └── Root.tsx                      # + HeyGenDemo registration
├── scripts/
│   ├── test-heygen.ts               # API connection test
│   ├── generate-avatar.ts           # Video generation CLI
│   ├── check-status.ts              # Status checker
│   └── render-heygen.sh             # Final render script
├── public/
│   └── videos/
│       ├── avatar-metadata.json     # Generation metadata
│       └── avatar-presenter.mp4     # Downloaded avatar video
└── .env                             # HEYGEN_API_KEY
```

---

## Execution Order

```
1. npm run heygen:test          # Verify API key works
2. npm run heygen:generate      # Generate avatar video (~15 min)
   ↳ While waiting: npm run dev  # Build motion graphics with placeholder
3. npm run dev                  # Preview with real video
4. npm run render:heygen        # Final render
```

---

## Success Criteria

- [ ] HeyGen API key validated
- [ ] Avatar video generated successfully
- [ ] Video plays in Remotion preview
- [ ] Motion graphics sync with avatar speech
- [ ] Final render exports at 1080p
- [ ] File size < 100MB for 60s video
