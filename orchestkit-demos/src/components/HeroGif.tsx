import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
} from "remotion";
import { z } from "zod";
import { ORCHESTKIT_STATS } from "../constants";

/**
 * HeroGif - 8-second GIF for README hero section
 *
 * Optimized for GIF output:
 * - 800x450 resolution (16:9, web-optimized)
 * - 15 FPS (GIF-friendly, smaller file size)
 * - Simple animations (no complex gradients)
 * - Dark terminal theme
 *
 * Timeline (8 seconds @ 15fps = 120 frames):
 * 0-2s (0-30):   Typing animation: "$ /ork:doctor"
 * 2-5s (30-75):  Progress bar with "Running health checks..."
 * 5-8s (75-120): Success checkmarks appearing one-by-one
 */

export const heroGifSchema = z.object({
  primaryColor: z.string().default("#8b5cf6"),
  secondaryColor: z.string().default("#22c55e"),
});

type HeroGifProps = z.infer<typeof heroGifSchema>;

const TERMINAL_BG = "#1e1e2e";
const TERMINAL_HEADER = "#313244";
const TEXT_PRIMARY = "#cdd6f4";
const TEXT_DIM = "#6c7086";
const SUCCESS_GREEN = "#a6e3a1";

// Health check items that will appear
const HEALTH_CHECKS = [
  { label: "Plugin loaded", delay: 0 },
  { label: `${ORCHESTKIT_STATS.skills} skills available`, delay: 5 },
  { label: `${ORCHESTKIT_STATS.agents} agents ready`, delay: 10 },
  { label: `${ORCHESTKIT_STATS.hooks} hooks registered`, delay: 15 },
];

const COMMAND = "$ /ork:doctor";

export const HeroGif: React.FC<HeroGifProps> = ({
  primaryColor,
  secondaryColor: _secondaryColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene boundaries (8 seconds @ 15fps)
  const SCENE_1_END = fps * 2; // 0-2s: Typing
  const SCENE_2_END = fps * 5; // 2-5s: Progress
  // Scene 3: 5-8s: Success

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f0f17" }}>
      {/* Terminal Window */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 50,
          right: 50,
          bottom: 40,
          backgroundColor: TERMINAL_BG,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)`,
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            height: 36,
            backgroundColor: TERMINAL_HEADER,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
          }}
        >
          {/* Traffic lights */}
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#f38ba8",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#f9e2af",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#a6e3a1",
            }}
          />
          <span
            style={{
              marginLeft: 12,
              color: TEXT_DIM,
              fontSize: 13,
              fontFamily: "SF Mono, Monaco, Menlo, monospace",
            }}
          >
            orchestkit — zsh
          </span>
        </div>

        {/* Terminal Content */}
        <div
          style={{
            padding: 24,
            fontFamily: "SF Mono, Monaco, Menlo, monospace",
            fontSize: 18,
            lineHeight: 1.6,
          }}
        >
          {/* Scene 1: Typing Animation */}
          <Sequence durationInFrames={SCENE_1_END}>
            <TypingLine frame={frame} primaryColor={primaryColor} />
          </Sequence>

          {/* Scene 2: Progress */}
          <Sequence from={SCENE_1_END} durationInFrames={SCENE_2_END - SCENE_1_END}>
            <div>
              {/* Show completed command */}
              <div style={{ color: TEXT_PRIMARY, marginBottom: 16 }}>
                <span style={{ color: SUCCESS_GREEN }}>$</span>{" "}
                <span style={{ color: primaryColor }}>/ork:doctor</span>
              </div>
              <ProgressSection
                frame={frame - SCENE_1_END}
                fps={fps}
                primaryColor={primaryColor}
              />
            </div>
          </Sequence>

          {/* Scene 3: Success */}
          <Sequence from={SCENE_2_END}>
            <div>
              {/* Show completed command */}
              <div style={{ color: TEXT_PRIMARY, marginBottom: 16 }}>
                <span style={{ color: SUCCESS_GREEN }}>$</span>{" "}
                <span style={{ color: primaryColor }}>/ork:doctor</span>
              </div>
              <SuccessSection
                frame={frame - SCENE_2_END}
                fps={fps}
              />
            </div>
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 1: Typing animation
const TypingLine: React.FC<{
  frame: number;
  primaryColor: string;
}> = ({ frame, primaryColor }) => {
  // Type one character every 3 frames (5 chars/sec at 15fps)
  const charsTyped = Math.min(Math.floor(frame / 3), COMMAND.length);
  const displayText = COMMAND.slice(0, charsTyped);

  // Blinking cursor
  const cursorVisible = Math.floor(frame / 7) % 2 === 0;

  return (
    <div style={{ color: TEXT_PRIMARY }}>
      {/* Dollar sign */}
      <span style={{ color: SUCCESS_GREEN }}>
        {displayText.startsWith("$") ? "$" : ""}
      </span>
      {/* Command after $ */}
      <span style={{ color: displayText.includes("/ork") ? primaryColor : TEXT_PRIMARY }}>
        {displayText.slice(1)}
      </span>
      {/* Cursor */}
      <span
        style={{
          display: "inline-block",
          width: 10,
          height: 20,
          backgroundColor: cursorVisible ? TEXT_PRIMARY : "transparent",
          marginLeft: 2,
          verticalAlign: "middle",
        }}
      />
    </div>
  );
};

// Scene 2: Progress bar
const ProgressSection: React.FC<{
  frame: number;
  fps: number;
  primaryColor: string;
}> = ({ frame, fps, primaryColor }) => {
  const duration = fps * 3; // 3 seconds

  const progress = interpolate(frame, [0, duration], [0, 100], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const filledBlocks = Math.floor(progress / 10);

  return (
    <div>
      <div style={{ color: TEXT_DIM, marginBottom: 12 }}>
        Running health checks...
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ color: TEXT_DIM }}>[</span>
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            style={{
              color: i < filledBlocks ? primaryColor : TEXT_DIM,
              fontWeight: i < filledBlocks ? "bold" : "normal",
            }}
          >
            {i < filledBlocks ? "█" : "░"}
          </span>
        ))}
        <span style={{ color: TEXT_DIM }}>]</span>
        <span style={{ color: TEXT_DIM, marginLeft: 8 }}>
          {Math.floor(progress)}%
        </span>
      </div>
    </div>
  );
};

// Scene 3: Success checkmarks
const SuccessSection: React.FC<{
  frame: number;
  fps: number;
}> = ({ frame, fps }) => {
  return (
    <div>
      {HEALTH_CHECKS.map((check, index) => {
        const showFrame = check.delay;
        const isVisible = frame >= showFrame;

        if (!isVisible) return null;

        const localFrame = frame - showFrame;

        const scale = spring({
          frame: localFrame,
          fps,
          config: {
            damping: 12,
            stiffness: 200,
            mass: 0.5,
          },
        });

        const opacity = interpolate(localFrame, [0, 5], [0, 1], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
              opacity,
              transform: `scale(${scale})`,
              transformOrigin: "left center",
            }}
          >
            <span style={{ color: SUCCESS_GREEN, fontSize: 20 }}>✓</span>
            <span style={{ color: TEXT_PRIMARY }}>{check.label}</span>
          </div>
        );
      })}

      {/* Final success message */}
      {frame >= 25 && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            backgroundColor: "rgba(166, 227, 161, 0.1)",
            borderRadius: 8,
            borderLeft: `3px solid ${SUCCESS_GREEN}`,
            opacity: interpolate(frame, [25, 30], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span style={{ color: SUCCESS_GREEN, fontWeight: "bold" }}>
            All systems operational! 🎉
          </span>
        </div>
      )}
    </div>
  );
};
