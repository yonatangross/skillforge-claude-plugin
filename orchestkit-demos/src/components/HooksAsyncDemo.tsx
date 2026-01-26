import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { z } from "zod";

import {
  MeshGradient,
  ParticleBackground,
  Vignette,
  NoiseTexture,
} from "./shared/BackgroundEffects";
import { ORCHESTKIT_STATS } from "../constants";

/**
 * HooksAsyncDemo - 15-second X/Twitter video (1080x1080)
 *
 * "31 Workers, Zero Wait" - Demonstrating async hooks power
 *
 * Responds to Boris Cherny's tweet about async: true hooks
 *
 * Timeline (15 seconds @ 30fps = 450 frames):
 * 0-3s (0-90):     HOOK - "31 hooks. Zero blocking."
 * 3-8s (90-240):   SESSION START - Rapid hook messages appearing
 * 8-12s (240-360): SPLIT VIEW - Hooks running vs Claude responding
 * 12-15s (360-450): STATS + CTA
 */

export const hooksAsyncDemoSchema = z.object({
  primaryColor: z.string().default("#8b5cf6"),
  secondaryColor: z.string().default("#22c55e"),
  accentColor: z.string().default("#06b6d4"),
});

type HooksAsyncDemoProps = z.infer<typeof hooksAsyncDemoSchema>;

// Async hook categories from hooks.json
const ASYNC_HOOKS = [
  { category: "SessionStart", count: 7, timeout: "30s" },
  { category: "PostToolUse", count: 14, timeout: "30s" },
  { category: "Stop", count: 4, timeout: "30-60s" },
  { category: "SubagentStop", count: 4, timeout: "30s" },
  { category: "Notification", count: 2, timeout: "10s" },
];

// Sample hook messages that appear rapidly
const HOOK_MESSAGES = [
  "SessionStart:mem0-context-retrieval",
  "SessionStart:coordination-init",
  "SessionStart:pattern-sync-pull",
  "SessionStart:decision-sync-pull",
  "SessionStart:mem0-webhook-setup",
  "SessionStart:mem0-analytics-tracker",
  "SessionStart:dependency-version-check",
  "PostToolUse:session-metrics",
  "PostToolUse:audit-logger",
  "PostToolUse:calibration-tracker",
  "PostToolUse:code-style-learner",
  "PostToolUse:realtime-sync",
];

export const HooksAsyncDemo: React.FC<HooksAsyncDemoProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene boundaries
  const SCENE_1_END = fps * 3; // Hook (0-3s)
  const SCENE_2_END = fps * 8; // Session Start (3-8s)
  const SCENE_3_END = fps * 12; // Split View (8-12s)
  // Scene 4: Stats + CTA (12-15s)

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0f" }}>
      {/* Background effects */}
      <MeshGradient
        colors={[primaryColor, secondaryColor, accentColor]}
        speed={0.6}
        opacity={0.12}
      />
      <ParticleBackground
        particleCount={15}
        particleColor={secondaryColor}
        opacity={0.25}
        speed={0.3}
      />

      {/* ==================== SCENE 1: HOOK (0-3s) ==================== */}
      <Sequence durationInFrames={SCENE_1_END}>
        <HookIntroScene frame={frame} fps={fps} primaryColor={primaryColor} />
      </Sequence>

      {/* ==================== SCENE 2: SESSION START (3-8s) ==================== */}
      <Sequence from={SCENE_1_END} durationInFrames={SCENE_2_END - SCENE_1_END}>
        <SessionStartScene
          frame={frame - SCENE_1_END}
          fps={fps}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </Sequence>

      {/* ==================== SCENE 3: SPLIT VIEW (8-12s) ==================== */}
      <Sequence from={SCENE_2_END} durationInFrames={SCENE_3_END - SCENE_2_END}>
        <SplitViewScene
          frame={frame - SCENE_2_END}
          fps={fps}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
        />
      </Sequence>

      {/* ==================== SCENE 4: STATS + CTA (12-15s) ==================== */}
      <Sequence from={SCENE_3_END}>
        <StatsCtaScene
          frame={frame - SCENE_3_END}
          fps={fps}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
        />
      </Sequence>

      {/* Overlays */}
      <Vignette intensity={0.3} />
      <NoiseTexture opacity={0.025} animated />

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(frame / durationInFrames) * 100}%`,
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE COMPONENTS
// ============================================================================

interface SceneProps {
  frame: number;
  fps: number;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
}

// HOOK INTRO Scene - "31 hooks. Zero blocking."
const HookIntroScene: React.FC<SceneProps> = ({ frame, fps, primaryColor }) => {
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const numberScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 8, stiffness: 250 },
  });

  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Pulsing glow effect
  const glowIntensity = 0.5 + Math.sin(frame * 0.15) * 0.2;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          transform: `scale(${scale})`,
        }}
      >
        {/* Big number */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            transform: `scale(${numberScale})`,
          }}
        >
          <span
            style={{
              fontSize: 180,
              fontWeight: 900,
              fontFamily: "Inter, system-ui",
              color: primaryColor,
              lineHeight: 1,
              textShadow: `0 0 ${80 * glowIntensity}px ${primaryColor}`,
            }}
          >
            31
          </span>
          <span
            style={{
              fontSize: 48,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              fontFamily: "Inter, system-ui",
            }}
          >
            async hooks
          </span>
        </div>

        {/* Zero blocking text */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            fontFamily: "Inter, system-ui",
            color: "white",
            letterSpacing: "-0.02em",
            opacity: subtitleOpacity,
          }}
        >
          Zero blocking.
        </div>

        {/* Code snippet */}
        <div
          style={{
            marginTop: 24,
            opacity: interpolate(frame, [60, 80], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          <code
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "Menlo, monospace",
              padding: "12px 24px",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {"{"} "async": true, "timeout": 30 {"}"}
          </code>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SESSION START Scene - Rapid hook messages
const SessionStartScene: React.FC<SceneProps> = ({
  frame,
  fps,
  primaryColor,
  secondaryColor,
}) => {
  // Calculate how many messages to show (rapid fire)
  const messagesPerSecond = 4;
  const framesPerMessage = fps / messagesPerSecond;
  const visibleMessages = Math.min(
    Math.floor(frame / framesPerMessage) + 1,
    HOOK_MESSAGES.length
  );

  const containerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          width: "90%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: secondaryColor,
              boxShadow: `0 0 20px ${secondaryColor}`,
              animation: "pulse 1s infinite",
            }}
          />
          <span
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
              fontFamily: "Inter, system-ui",
              fontWeight: 600,
            }}
          >
            Session Starting...
          </span>
        </div>

        {/* Hook messages container */}
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 800,
            border: "1px solid rgba(255,255,255,0.1)",
            minHeight: 300,
            overflow: "hidden",
          }}
        >
          {HOOK_MESSAGES.slice(0, visibleMessages).map((msg, i) => {
            const messageFrame = frame - i * framesPerMessage;
            const msgOpacity = interpolate(messageFrame, [0, 8], [0, 1], {
              extrapolateRight: "clamp",
            });
            const msgSlide = interpolate(messageFrame, [0, 8], [20, 0], {
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                  opacity: msgOpacity,
                  transform: `translateX(${msgSlide}px)`,
                }}
              >
                <span
                  style={{
                    color: secondaryColor,
                    fontFamily: "Menlo, monospace",
                    fontSize: 16,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "Menlo, monospace",
                    fontSize: 16,
                  }}
                >
                  {msg}
                </span>
                <span
                  style={{
                    color: secondaryColor,
                    fontFamily: "Menlo, monospace",
                    fontSize: 14,
                    marginLeft: "auto",
                  }}
                >
                  Success
                </span>
              </div>
            );
          })}
        </div>

        {/* Counter badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 24px",
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: primaryColor,
              fontFamily: "Inter, system-ui",
            }}
          >
            {visibleMessages}
          </span>
          <span
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "Inter, system-ui",
            }}
          >
            hooks fired in background
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SPLIT VIEW Scene - Hooks running vs Claude responding
const SplitViewScene: React.FC<SceneProps> = ({
  frame,
  fps,
  primaryColor,
  secondaryColor,
}) => {
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Running hooks indicator
  const hookProgress = Math.min((frame / (fps * 3.5)) * 100, 100);

  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        padding: 32,
        gap: 24,
      }}
    >
      {/* Left side - Background hooks */}
      <div
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 20,
          padding: 24,
          border: `2px solid ${primaryColor}30`,
          transform: `translateX(${(1 - slideIn) * -100}px)`,
          opacity: slideIn,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: primaryColor,
              boxShadow: `0 0 15px ${primaryColor}`,
            }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: primaryColor,
              fontFamily: "Inter, system-ui",
              letterSpacing: "0.05em",
            }}
          >
            BACKGROUND HOOKS
          </span>
        </div>

        {/* Hook categories */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: 1,
          }}
        >
          {ASYNC_HOOKS.map((hook, i) => {
            const delay = i * 15;
            const barWidth = interpolate(
              frame - delay,
              [0, fps * 2],
              [0, 100],
              { extrapolateRight: "clamp" }
            );

            return (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "Menlo, monospace",
                    }}
                  >
                    {hook.category}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: primaryColor,
                      fontFamily: "Menlo, monospace",
                    }}
                  >
                    {hook.count}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barWidth}%`,
                      backgroundColor: primaryColor,
                      borderRadius: 3,
                      boxShadow: `0 0 10px ${primaryColor}50`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 24,
            fontWeight: 700,
            color: primaryColor,
            fontFamily: "Inter, system-ui",
          }}
        >
          {Math.round(hookProgress)}% complete
        </div>
      </div>

      {/* Right side - You work, uninterrupted */}
      <div
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 20,
          padding: 24,
          border: `2px solid ${secondaryColor}30`,
          transform: `translateX(${(1 - slideIn) * 100}px)`,
          opacity: slideIn,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: secondaryColor,
              boxShadow: `0 0 15px ${secondaryColor}`,
            }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: secondaryColor,
              fontFamily: "Inter, system-ui",
              letterSpacing: "0.05em",
            }}
          >
            YOU WORK
          </span>
        </div>

        {/* Big impact number */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: secondaryColor,
              fontFamily: "Inter, system-ui",
              textShadow: `0 0 40px ${secondaryColor}60`,
            }}
          >
            0ms
          </div>
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
              fontFamily: "Inter, system-ui",
              fontWeight: 600,
            }}
          >
            wait time
          </div>

          {/* Checkmarks */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 20,
            }}
          >
            {["Instant response", "No freezing", "Full speed"].map((text, i) => {
              const checkOpacity = interpolate(
                frame - 20 - i * 15,
                [0, 10],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    opacity: checkOpacity,
                  }}
                >
                  <span style={{ color: secondaryColor, fontSize: 20 }}>✓</span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "Inter, system-ui",
                      fontSize: 18,
                    }}
                  >
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// STATS + CTA Scene
const StatsCtaScene: React.FC<SceneProps> = ({
  frame,
  fps,
  primaryColor,
  secondaryColor,
  accentColor,
}) => {
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const stats = [
    { value: "31", label: "ASYNC", color: primaryColor },
    { value: "0ms", label: "BLOCKING", color: secondaryColor },
    { value: String(ORCHESTKIT_STATS.hooks), label: "TOTAL", color: accentColor! },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          transform: `scale(${scale})`,
        }}
      >
        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 48,
          }}
        >
          {stats.map((stat, i) => {
            const delay = i * 10;
            const statScale = spring({
              frame: frame - delay,
              fps,
              config: { damping: 10, stiffness: 200 },
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transform: `scale(${statScale})`,
                }}
              >
                <span
                  style={{
                    fontSize: 64,
                    fontWeight: 900,
                    color: stat.color,
                    fontFamily: "Inter, system-ui",
                    textShadow: `0 0 40px ${stat.color}60`,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "Inter, system-ui",
                    letterSpacing: "0.2em",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 16,
            opacity: interpolate(frame, [40, 60], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              padding: "20px 40px",
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              borderRadius: 16,
              boxShadow: `0 0 40px ${primaryColor}40`,
            }}
          >
            <code
              style={{
                fontSize: 24,
                color: "white",
                fontFamily: "Menlo, monospace",
                fontWeight: 600,
              }}
            >
              /plugin install ork
            </code>
          </div>
        </div>

        {/* Tagline */}
        <span
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.6)",
            fontFamily: "Inter, system-ui",
            opacity: interpolate(frame, [50, 70], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          {ORCHESTKIT_STATS.hooks} hooks • {ORCHESTKIT_STATS.skills} skills •{" "}
          {ORCHESTKIT_STATS.agents} agents
        </span>
      </div>
    </AbsoluteFill>
  );
};
