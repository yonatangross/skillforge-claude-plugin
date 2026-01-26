import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
  Sequence,
  Audio,
  staticFile,
  Img,
  Easing,
} from "remotion";
import { makeTransform, scale as scaleTransform, translateX, translateY } from "@remotion/animation-utils";
import { z } from "zod";

import {
  MeshGradient,
  Vignette,
  NoiseTexture,
} from "./shared/BackgroundEffects";

// Import configs - resolved by name to avoid serialization issues with functions
import { brainstormingConfig } from "./configs/brainstorming";

const CONFIGS: Record<string, SkillShowcaseConfig> = {
  brainstorming: brainstormingConfig,
};

/**
 * SkillShowcase - Generic skill demo video factory
 *
 * Reusable component for creating 15-second skill demo videos.
 * Configure via props for any skill, not just brainstorming.
 *
 * Features:
 * - Configurable terminal content
 * - Custom result visualization via render prop
 * - Flexible timeline
 * - Advanced Remotion animations
 */

// =============================================================================
// SCHEMA & TYPES
// =============================================================================

export const skillShowcaseSchema = z.object({
  configName: z.string(), // Config resolved by name to avoid function serialization issues
  primaryColor: z.string().default("#f59e0b"),
  secondaryColor: z.string().default("#8b5cf6"),
  accentColor: z.string().default("#22c55e"),
});

export interface TerminalLine {
  text: string;
  color: string;
  frame: number;
}

export interface SkillShowcaseConfig {
  // Skill identification
  skillName: string;
  command: string;

  // Terminal content
  headerLines: TerminalLine[];
  contentLines: TerminalLine[];

  // Agent colors (optional override)
  agentColors?: Record<string, string>;

  // Timeline (in seconds)
  timeline: {
    terminalEnd: number;
    resultStart: number;
    resultEnd: number;
    ctaStart: number;
  };

  // Spinner settings
  spinner?: {
    text: string;
    startFrame: number;
    endFrame: number;
  };

  // CTA content
  cta: {
    headline: string;
    highlightWord: string;
    buttonText: string;
    stats: Array<{ value: string; label: string }>;
  };

  // Audio (optional)
  audioFile?: string;
  audioVolume?: number;

  // Branding
  showClaudeBadge?: boolean;
  badgeStartSeconds?: number;

  // Result visualization (render prop)
  renderResult?: (props: ResultRenderProps) => React.ReactNode;
}

export interface ResultRenderProps {
  frame: number;
  fps: number;
  primaryColor: string;
  secondaryColor: string;
  opacity: number;
  scale: number;
}

type Props = z.infer<typeof skillShowcaseSchema>;

// =============================================================================
// SPRING & EASING PRESETS
// =============================================================================

const SPRING = {
  SNAPPY: { damping: 15, stiffness: 180 },
  SMOOTH: { damping: 12, stiffness: 120 },
  BOUNCY: { damping: 8, stiffness: 200 },
  SLOW: { damping: 20, stiffness: 80 },
} as const;

const EASE = {
  OUT_EXPO: Easing.bezier(0.16, 1, 0.3, 1),
  IN_OUT_QUART: Easing.bezier(0.76, 0, 0.24, 1),
  OUT_BACK: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

// =============================================================================
// HELPERS
// =============================================================================

const SPINNER_CHARS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const safeSpring = (
  frame: number,
  fps: number,
  config: { damping: number; stiffness: number },
  minValue = 0.9
) => {
  const springValue = spring({ frame, fps, config });
  return minValue + (1 - minValue) * springValue;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const SkillShowcase: React.FC<Props> = ({
  configName,
  primaryColor,
  secondaryColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Resolve config by name (avoids function serialization issues)
  const config = CONFIGS[configName];
  if (!config) {
    throw new Error(`Unknown config: ${configName}. Available: ${Object.keys(CONFIGS).join(", ")}`);
  }

  const {
    timeline,
    audioFile,
    audioVolume = 0.35,
    showClaudeBadge = true,
    badgeStartSeconds = 12,
  } = config;

  const TERMINAL_END = fps * timeline.terminalEnd;
  const RESULT_START = fps * timeline.resultStart;
  const RESULT_END = fps * timeline.resultEnd;
  const CTA_START = fps * timeline.ctaStart;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117" }}>
      {audioFile && (
        <Audio
          src={staticFile(audioFile)}
          volume={audioVolume}
        />
      )}

      <MeshGradient
        colors={[primaryColor, secondaryColor, "#0d1117"]}
        speed={0.4}
        opacity={0.08}
      />

      <Sequence from={0} durationInFrames={TERMINAL_END}>
        <Terminal
          frame={frame}
          fps={fps}
          primaryColor={primaryColor}
          config={config}
        />
      </Sequence>

      {config.renderResult && (
        <Sequence from={RESULT_START} durationInFrames={RESULT_END - RESULT_START}>
          <ResultWrapper
            frame={frame - RESULT_START}
            fps={fps}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            renderResult={config.renderResult}
          />
        </Sequence>
      )}

      <Sequence from={CTA_START}>
        <CTAScene
          frame={frame - CTA_START}
          fps={fps}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          config={config.cta}
        />
      </Sequence>

      {showClaudeBadge && (
        <ClaudeCodeBadge frame={frame} fps={fps} startSeconds={badgeStartSeconds} />
      )}

      <Vignette intensity={0.3} />
      <NoiseTexture opacity={0.02} animated />
    </AbsoluteFill>
  );
};

// =============================================================================
// CLAUDE CODE BADGE
// =============================================================================

const ClaudeCodeBadge: React.FC<{ frame: number; fps: number; startSeconds: number }> = ({
  frame,
  fps,
  startSeconds,
}) => {
  const ctaStart = fps * startSeconds;

  if (frame < ctaStart) return null;

  const opacity = interpolate(frame, [ctaStart, ctaStart + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.OUT_EXPO,
  });

  const slideIn = interpolate(frame, [ctaStart, ctaStart + 25], [20, 0], {
    extrapolateRight: "clamp",
    easing: EASE.OUT_EXPO,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 28,
        right: 32,
        opacity,
        transform: makeTransform([translateX(slideIn)]),
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Img
        src={staticFile("claude-logo.png")}
        style={{ width: 32, height: 32, borderRadius: 6 }}
      />
      <span
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#E07A5F",
          fontFamily: "Inter, system-ui",
        }}
      >
        Claude Code
      </span>
    </div>
  );
};

// =============================================================================
// TERMINAL COMPONENT
// =============================================================================

const Terminal: React.FC<{
  frame: number;
  fps: number;
  primaryColor: string;
  config: SkillShowcaseConfig;
}> = ({ frame, fps, primaryColor, config }) => {
  const LINE_HEIGHT = 22;
  const MAX_VISIBLE = 10;

  const { headerLines, contentLines, spinner, timeline, agentColors } = config;

  const spinnerIdx = Math.floor(frame / 3) % SPINNER_CHARS.length;
  const visibleHeader = headerLines.filter(line => frame >= line.frame);
  const visibleContent = contentLines.filter(line => frame >= line.frame);
  const showSpinner = spinner && frame >= spinner.startFrame && frame < spinner.endFrame;

  const contentHeight = (visibleContent.length + (showSpinner ? 1 : 0)) * LINE_HEIGHT;
  const scrollOffset = Math.max(0, contentHeight - MAX_VISIBLE * LINE_HEIGHT);

  const fadeEnd = fps * timeline.terminalEnd;
  const opacity = interpolate(frame, [fadeEnd - 20, fadeEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.IN_OUT_QUART,
  });

  const scale = safeSpring(frame, fps, SPRING.SNAPPY);

  // Color pulse using agent colors if provided
  const colorStops = agentColors
    ? [0, 30, 60, 90]
    : [0, 30, 60, 90];
  const colors = agentColors
    ? ["#30363d", Object.values(agentColors)[0] || "#8b5cf6", Object.values(agentColors)[1] || "#06b6d4", "#30363d"]
    : ["#30363d", "#8b5cf6", "#06b6d4", "#30363d"];

  const borderColor = interpolateColors(frame, colorStops, colors);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity }}>
      <div
        style={{
          width: 900,
          height: 420,
          backgroundColor: "#0d1117",
          borderRadius: 12,
          overflow: "hidden",
          transform: makeTransform([scaleTransform(scale)]),
          border: `1px solid ${borderColor}`,
          boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            backgroundColor: "#161b22",
            borderBottom: "1px solid #30363d",
          }}
        >
          <WindowButton color="#ff5f57" />
          <WindowButton color="#febc2e" />
          <WindowButton color="#28c840" />
          <span style={{ marginLeft: 12, fontSize: 12, color: "#8b949e", fontFamily: "Menlo" }}>
            claude — orchestkit
          </span>
        </div>

        <div style={{ padding: "12px 16px 8px 16px", borderBottom: "1px solid #21262d" }}>
          {visibleHeader.map((line, i) => (
            <TerminalLine
              key={i}
              text={line.text}
              color={line.color}
              frame={frame}
              appearFrame={line.frame}
            />
          ))}
        </div>

        <div style={{ padding: "8px 16px", height: 280, overflow: "hidden" }}>
          <div style={{ transform: makeTransform([translateY(-scrollOffset)]) }}>
            {visibleContent.map((line, i) => (
              <TerminalLine
                key={i}
                text={line.text}
                color={line.color}
                frame={frame}
                appearFrame={line.frame}
              />
            ))}

            {showSpinner && spinner && (
              <div
                style={{
                  height: LINE_HEIGHT,
                  fontFamily: "Menlo, Monaco, monospace",
                  fontSize: 13,
                  color: primaryColor,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {SPINNER_CHARS[spinnerIdx]} {spinner.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// TERMINAL SUB-COMPONENTS
// =============================================================================

const WindowButton: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: color }} />
);

const TerminalLine: React.FC<{
  text: string;
  color: string;
  frame: number;
  appearFrame: number;
}> = ({ text, color, frame, appearFrame }) => {
  const opacity = appearFrame === 0
    ? 1
    : interpolate(frame - appearFrame, [0, 5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE.OUT_EXPO,
      });

  const slideIn = appearFrame === 0
    ? 0
    : interpolate(frame - appearFrame, [0, 5], [10, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE.OUT_EXPO,
      });

  return (
    <div
      style={{
        height: 22,
        opacity,
        transform: makeTransform([translateX(slideIn)]),
        fontFamily: "Menlo, Monaco, monospace",
        fontSize: 13,
        color,
        display: "flex",
        alignItems: "center",
      }}
    >
      {text}
    </div>
  );
};

// =============================================================================
// RESULT WRAPPER
// =============================================================================

const ResultWrapper: React.FC<{
  frame: number;
  fps: number;
  primaryColor: string;
  secondaryColor: string;
  renderResult?: (props: ResultRenderProps) => React.ReactNode;
}> = ({ frame, fps, primaryColor, secondaryColor, renderResult }) => {
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
    easing: EASE.OUT_EXPO,
  });

  const fadeOut = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.IN_OUT_QUART,
  });

  const scale = safeSpring(frame, fps, SPRING.SMOOTH, 0.85);

  if (!renderResult) return null;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {renderResult({
        frame,
        fps,
        primaryColor,
        secondaryColor,
        opacity: opacity * fadeOut,
        scale,
      })}
    </AbsoluteFill>
  );
};

// =============================================================================
// CTA SCENE
// =============================================================================

const CTAScene: React.FC<{
  frame: number;
  fps: number;
  primaryColor: string;
  secondaryColor: string;
  config: SkillShowcaseConfig["cta"];
}> = ({ frame, fps, primaryColor, secondaryColor, config }) => {
  const { headline, highlightWord, buttonText, stats } = config;

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
    easing: EASE.OUT_EXPO,
  });

  const scale = safeSpring(Math.max(0, frame - 7), fps, SPRING.SNAPPY);

  const statsOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.OUT_EXPO,
  });

  const gradientAngle = interpolate(frame, [0, 90], [135, 225], {
    extrapolateRight: "extend",
  });

  const glowIntensity = interpolate(
    frame % 60,
    [0, 30, 60],
    [40, 60, 40],
    { extrapolateRight: "clamp" }
  );

  // Split headline at highlight word
  const parts = headline.split(highlightWord);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          transform: makeTransform([scaleTransform(scale)]),
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "white",
            fontFamily: "Inter, system-ui",
            textAlign: "center",
          }}
        >
          {parts[0]}
          <span style={{ color: primaryColor }}>{highlightWord}</span>
          {parts[1] || ""}
        </div>

        <div
          style={{
            padding: "18px 44px",
            background: `linear-gradient(${gradientAngle}deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: 14,
            boxShadow: `0 0 ${glowIntensity}px ${primaryColor}50`,
          }}
        >
          <code
            style={{
              fontSize: 26,
              color: "white",
              fontFamily: "Menlo, monospace",
              fontWeight: 600,
            }}
          >
            {buttonText}
          </code>
        </div>

        <div style={{ display: "flex", gap: 28, marginTop: 4, opacity: statsOpacity }}>
          {stats.map((stat, i) => (
            <StatItem key={i} {...stat} primaryColor={primaryColor} frame={frame} index={i} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StatItem: React.FC<{
  value: string;
  label: string;
  primaryColor: string;
  frame: number;
  index: number;
}> = ({ value, label, primaryColor, frame, index }) => {
  const countProgress = interpolate(frame, [35 + index * 8, 55 + index * 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.OUT_EXPO,
  });

  const displayValue = Math.round(parseInt(value) * countProgress);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: primaryColor,
          fontFamily: "Inter, system-ui",
        }}
      >
        {displayValue}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
          fontFamily: "Menlo",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export { SPRING, EASE, safeSpring };
