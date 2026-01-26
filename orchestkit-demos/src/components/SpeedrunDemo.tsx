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
  ConfettiBurst,
} from "./shared/BackgroundEffects";
import { ORCHESTKIT_STATS } from "../constants";

/**
 * SpeedrunDemo - 15-second X/Twitter video
 *
 * "The Speedrun" - Timer gimmick, hook in 1 second
 *
 * Timeline (15 seconds @ 30fps = 450 frames):
 * 0-1s (0-30):     HOOK - "3 seconds to level up" with countdown
 * 1-4s (30-120):   Typing animation with timer counting down
 * 4-7s (120-210):  SUCCESS flash, stats explode
 * 7-12s (210-360): Quick command showcase (3 commands)
 * 12-15s (360-450): End card with CTA
 */

export const speedrunDemoSchema = z.object({
  primaryColor: z.string().default("#8b5cf6"),
  secondaryColor: z.string().default("#22c55e"),
  accentColor: z.string().default("#06b6d4"),
});

type SpeedrunDemoProps = z.infer<typeof speedrunDemoSchema>;

// Featured commands for quick showcase
const SHOWCASE_COMMANDS = [
  { cmd: "/commit", desc: "AI commits", color: "#06b6d4" },
  { cmd: "/review-pr", desc: "Expert review", color: "#f97316" },
  { cmd: "/implement", desc: "Build features", color: "#8b5cf6" },
];

export const SpeedrunDemo: React.FC<SpeedrunDemoProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene boundaries
  const SCENE_1_END = fps * 1; // Hook (0-1s)
  const SCENE_2_END = fps * 4; // Typing (1-4s)
  const SCENE_3_END = fps * 7; // Success (4-7s)
  const SCENE_4_END = fps * 12; // Commands (7-12s)
  // Scene 5: CTA (12-15s)

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0f" }}>
      {/* Background effects */}
      <MeshGradient
        colors={[primaryColor, secondaryColor, accentColor]}
        speed={0.8}
        opacity={0.15}
      />
      <ParticleBackground
        particleCount={20}
        particleColor={primaryColor}
        opacity={0.3}
        speed={0.4}
      />

      {/* ==================== SCENE 1: HOOK (0-1s) ==================== */}
      <Sequence durationInFrames={SCENE_1_END}>
        <HookScene frame={frame} fps={fps} primaryColor={primaryColor} />
      </Sequence>

      {/* ==================== SCENE 2: TYPING (1-4s) ==================== */}
      <Sequence from={SCENE_1_END} durationInFrames={SCENE_2_END - SCENE_1_END}>
        <TypingScene
          frame={frame - SCENE_1_END}
          fps={fps}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </Sequence>

      {/* ==================== SCENE 3: SUCCESS (4-7s) ==================== */}
      <Sequence from={SCENE_2_END} durationInFrames={SCENE_3_END - SCENE_2_END}>
        <SuccessScene
          frame={frame - SCENE_2_END}
          fps={fps}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
        />
      </Sequence>

      {/* ==================== SCENE 4: COMMANDS (7-12s) ==================== */}
      <Sequence from={SCENE_3_END} durationInFrames={SCENE_4_END - SCENE_3_END}>
        <CommandShowcaseScene
          frame={frame - SCENE_3_END}
          fps={fps}
          commands={SHOWCASE_COMMANDS}
        />
      </Sequence>

      {/* ==================== SCENE 5: CTA (12-15s) ==================== */}
      <Sequence from={SCENE_4_END}>
        <CTAEndScene
          frame={frame - SCENE_4_END}
          fps={fps}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </Sequence>

      {/* Confetti on success */}
      <ConfettiBurst
        startFrame={SCENE_2_END + 10}
        particleCount={80}
        colors={[primaryColor, secondaryColor, accentColor, "#f59e0b", "#ec4899"]}
        duration={60}
        origin={{ x: 50, y: 50 }}
      />

      {/* Overlays */}
      <Vignette intensity={0.35} />
      <NoiseTexture opacity={0.03} animated />

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

// HOOK Scene - "3 seconds to level up Claude Code"
const HookScene: React.FC<SceneProps> = ({ frame, fps, primaryColor }) => {
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

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
          gap: 24,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {/* Big countdown number */}
        <div
          style={{
            fontSize: 200,
            fontWeight: 900,
            fontFamily: "Inter, system-ui",
            color: primaryColor,
            lineHeight: 1,
            textShadow: `0 0 80px ${primaryColor}80`,
          }}
        >
          3
        </div>

        {/* Hook text */}
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            fontFamily: "Inter, system-ui",
            color: "white",
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          seconds to level up
          <br />
          <span style={{ color: primaryColor }}>Claude Code</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// TYPING Scene - Command being typed with countdown
const TypingScene: React.FC<SceneProps> = ({
  frame,
  fps,
  primaryColor,
  secondaryColor,
}) => {
  const COMMAND = "/plugin install ork";
  const TYPING_DURATION = fps * 2; // 2 seconds to type

  // Calculate how many characters to show
  const typingProgress = interpolate(frame, [0, TYPING_DURATION], [0, 1], {
    extrapolateRight: "clamp",
  });
  const charsToShow = Math.floor(typingProgress * COMMAND.length);
  const displayedCommand = COMMAND.slice(0, charsToShow);

  // Countdown from 3 to 0
  const countdown = Math.max(0, 3 - Math.floor(frame / fps));

  // Timer pulse effect
  const timerScale =
    frame % fps < fps / 10
      ? spring({
          frame: frame % fps,
          fps,
          config: { damping: 8, stiffness: 300 },
        })
      : 1;

  const containerOpacity = interpolate(frame, [0, 10], [0, 1], {
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
          gap: 40,
        }}
      >
        {/* Countdown timer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            transform: `scale(${timerScale})`,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: `4px solid ${primaryColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 40px ${primaryColor}50`,
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: primaryColor,
                fontFamily: "Inter, system-ui",
              }}
            >
              {countdown}
            </span>
          </div>
        </div>

        {/* Terminal mockup */}
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 16,
            padding: "24px 40px",
            border: "1px solid rgba(255,255,255,0.1)",
            minWidth: 600,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                color: secondaryColor,
                fontFamily: "Menlo, monospace",
                fontSize: 20,
              }}
            >
              $
            </span>
            <span
              style={{
                color: "white",
                fontFamily: "Menlo, monospace",
                fontSize: 28,
                fontWeight: 500,
              }}
            >
              {displayedCommand}
              {/* Cursor blink */}
              {typingProgress < 1 && (
                <span
                  style={{
                    opacity: frame % 15 < 8 ? 1 : 0,
                    color: primaryColor,
                  }}
                >
                  |
                </span>
              )}
            </span>
          </div>
        </div>

        {/* "Installing..." text after typing completes */}
        {typingProgress >= 1 && (
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "Inter, system-ui",
              opacity: interpolate(
                frame - TYPING_DURATION,
                [0, 15],
                [0, 1],
                { extrapolateRight: "clamp" }
              ),
            }}
          >
            Installing OrchestKit...
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// SUCCESS Scene - Stats explode
const SuccessScene: React.FC<SceneProps> = ({
  frame,
  fps,
  primaryColor,
  secondaryColor,
  accentColor,
}) => {
  const stats = [
    { value: ORCHESTKIT_STATS.SKILLS, label: "SKILLS", color: primaryColor! },
    { value: ORCHESTKIT_STATS.AGENTS, label: "AGENTS", color: secondaryColor! },
    { value: ORCHESTKIT_STATS.HOOKS, label: "HOOKS", color: accentColor! },
  ];

  // Flash effect
  const flashOpacity = interpolate(frame, [0, 5, 15], [1, 1, 0], {
    extrapolateRight: "clamp",
  });

  // Success checkmark scale
  const checkScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  return (
    <AbsoluteFill>
      {/* Flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: secondaryColor,
          opacity: flashOpacity * 0.3,
        }}
      />

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
            gap: 40,
          }}
        >
          {/* Success checkmark */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: secondaryColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${checkScale})`,
              boxShadow: `0 0 60px ${secondaryColor}80`,
            }}
          >
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={30}
                strokeDashoffset={interpolate(
                  frame,
                  [10, 30],
                  [30, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                )}
              />
            </svg>
          </div>

          {/* SUCCESS text */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: secondaryColor,
              fontFamily: "Inter, system-ui",
              letterSpacing: "0.1em",
              opacity: interpolate(frame, [15, 30], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            INSTALLED
          </div>

          {/* Stats row - exploding in */}
          <div
            style={{
              display: "flex",
              gap: 40,
              marginTop: 20,
            }}
          >
            {stats.map((stat, i) => {
              const delay = 25 + i * 8;
              const statScale = spring({
                frame: frame - delay,
                fps,
                config: { damping: 10, stiffness: 200 },
              });

              // Counter animation
              const counterProgress = interpolate(
                frame,
                [delay + 5, delay + 35],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const displayValue = Math.round(stat.value * counterProgress);

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    transform: `scale(${statScale})`,
                    opacity: statScale,
                  }}
                >
                  <span
                    style={{
                      fontSize: 72,
                      fontWeight: 900,
                      color: stat.color,
                      fontFamily: "Inter, system-ui",
                      lineHeight: 1,
                      textShadow: `0 0 40px ${stat.color}60`,
                    }}
                  >
                    {displayValue}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: "Inter, system-ui",
                      letterSpacing: "0.2em",
                      fontWeight: 600,
                    }}
                  >
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// COMMAND SHOWCASE Scene - 3 commands flash by
const CommandShowcaseScene: React.FC<
  Omit<SceneProps, "primaryColor"> & { commands: typeof SHOWCASE_COMMANDS }
> = ({ frame, fps, commands }) => {
  const COMMAND_DURATION = fps * 1.5; // 1.5 seconds per command

  // Which command is currently showing
  const currentIndex = Math.min(
    Math.floor(frame / COMMAND_DURATION),
    commands.length - 1
  );
  const currentCommand = commands[currentIndex];

  // Progress within current command
  const commandFrame = frame % COMMAND_DURATION;

  // Scale and opacity animations
  const scale = spring({
    frame: commandFrame,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const opacity = interpolate(
    commandFrame,
    [0, 10, COMMAND_DURATION - 10, COMMAND_DURATION],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

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
          gap: 24,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {/* Command */}
        <code
          style={{
            fontSize: 72,
            fontWeight: 700,
            fontFamily: "Menlo, monospace",
            color: currentCommand.color,
            textShadow: `0 0 60px ${currentCommand.color}60`,
          }}
        >
          {currentCommand.cmd}
        </code>

        {/* Description */}
        <span
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.8)",
            fontFamily: "Inter, system-ui",
            fontWeight: 500,
          }}
        >
          {currentCommand.desc}
        </span>

        {/* Dots indicator */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
          }}
        >
          {commands.map((cmd, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor:
                  i === currentIndex ? cmd.color : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// CTA END Scene - Final card
const CTAEndScene: React.FC<SceneProps> = ({
  frame,
  fps,
  primaryColor,
  secondaryColor,
}) => {
  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 180 },
  });

  const badgeOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

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
        {/* Logo */}
        <h1
          style={{
            fontSize: 80,
            fontWeight: 800,
            fontFamily: "Inter, system-ui",
            margin: 0,
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.03em",
            textShadow: `0 0 80px ${primaryColor}40`,
          }}
        >
          OrchestKit
        </h1>

        {/* CTA */}
        <div
          style={{
            padding: "20px 48px",
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: 16,
            boxShadow: `0 0 40px ${primaryColor}50`,
          }}
        >
          <code
            style={{
              fontSize: 28,
              color: "white",
              fontFamily: "Menlo, monospace",
              fontWeight: 600,
            }}
          >
            /plugin install ork
          </code>
        </div>

        {/* Badge */}
        <span
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "Menlo, monospace",
            padding: "10px 24px",
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.15)",
            opacity: badgeOpacity,
          }}
        >
          Claude Code Marketplace
        </span>
      </div>
    </AbsoluteFill>
  );
};
