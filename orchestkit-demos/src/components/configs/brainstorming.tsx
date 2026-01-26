import React from "react";
import { interpolate, spring } from "remotion";
import { makeTransform, translateX, translateY } from "@remotion/animation-utils";
import type { SkillShowcaseConfig, ResultRenderProps } from "../SkillShowcase";

/**
 * Brainstorming skill showcase configuration
 *
 * Usage:
 * <SkillShowcase config={brainstormingConfig} primaryColor="#f59e0b" secondaryColor="#8b5cf6" />
 */

// Agent colors (official palette)
const AGENT_COLORS = {
  workflow: "#8b5cf6",
  backend: "#06b6d4",
  security: "#ef4444",
  performance: "#22c55e",
};

export const brainstormingConfig: SkillShowcaseConfig = {
  skillName: "brainstorming",
  command: '/brainstorming "design real-time notifications"',

  headerLines: [
    { text: '❯ /brainstorming "design real-time notifications"', color: "#e6edf3", frame: 0 },
    { text: "✓ Task #1 created: Brainstorm notification system", color: "#8b949e", frame: 15 },
  ],

  contentLines: [
    // Agents spawn (frames 18-38)
    { text: "├─ Task #2: workflow-architect", color: AGENT_COLORS.workflow, frame: 18 },
    { text: "├─ Task #3: backend-architect", color: AGENT_COLORS.backend, frame: 24 },
    { text: "├─ Task #4: security-auditor", color: AGENT_COLORS.security, frame: 30 },
    { text: "└─ Task #5: performance-engineer", color: AGENT_COLORS.performance, frame: 36 },

    // Phases (frames 44-68)
    { text: "Analyzing topic → 3 patterns found", color: "#f59e0b", frame: 44 },
    { text: "Generating ideas → 12 options", color: "#f59e0b", frame: 56 },
    { text: "Filtering → 3 viable approaches", color: "#f59e0b", frame: 68 },

    // Agent completions (frames 80-104)
    { text: "✓ #2 patterns", color: AGENT_COLORS.workflow, frame: 80 },
    { text: "✓ #3 scored", color: AGENT_COLORS.backend, frame: 88 },
    { text: "✓ #4 threats", color: AGENT_COLORS.security, frame: 96 },
    { text: "✓ #5 benchmarks", color: AGENT_COLORS.performance, frame: 104 },

    // Synthesis (frames 115-145)
    { text: "Synthesized Options:", color: "#f59e0b", frame: 115 },
    { text: "   A: Event-driven + Redis   8.5 ★", color: "#22c55e", frame: 125 },
    { text: "   B: WebSocket              7.8", color: "#9ca3af", frame: 135 },
    { text: "   C: Polling                6.2", color: "#9ca3af", frame: 145 },

    // Final (frames 160-175)
    { text: "✓ Option A recommended", color: "#22c55e", frame: 160 },
    { text: "✓ Task #1 completed • 4 agents", color: "#22c55e", frame: 175 },
  ],

  agentColors: AGENT_COLORS,

  timeline: {
    terminalEnd: 7,
    resultStart: 7,
    resultEnd: 11,
    ctaStart: 11,
  },

  spinner: {
    text: "Brainstorming notification system...",
    startFrame: 15,
    endFrame: 45,
  },

  cta: {
    headline: "From idea to design in seconds",
    highlightWord: "seconds",
    buttonText: "/plugin install ork",
    stats: [
      { value: "179", label: "Skills" },
      { value: "35", label: "Agents" },
      { value: "23", label: "Commands" },
    ],
  },

  audioFile: "audio/snap-attack.mp3",
  audioVolume: 0.35,

  showClaudeBadge: true,
  badgeStartSeconds: 12,

  renderResult: (props) => <BrainstormingResult {...props} />,
};

// =============================================================================
// BRAINSTORMING-SPECIFIC RESULT VISUALIZATION
// =============================================================================

const BrainstormingResult: React.FC<ResultRenderProps> = ({
  frame,
  fps,
  primaryColor,
  secondaryColor,
  opacity,
  scale,
}) => {
  const SPRING_SNAPPY = { damping: 15, stiffness: 180 };

  const boxes = [5, 12, 19, 26].map(delay => {
    const springValue = spring({ frame: Math.max(0, frame - delay), fps, config: SPRING_SNAPPY });
    return springValue;
  });

  const linesOpacity = spring({ frame: Math.max(0, frame - 33), fps, config: SPRING_SNAPPY });

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "white",
          fontFamily: "Inter, system-ui",
          marginBottom: 32,
        }}
      >
        <span style={{ color: primaryColor }}>Option A:</span> Event-Driven Architecture
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <ArchBox label="📱 Client App" progress={boxes[0]} borderColor={secondaryColor} direction="down" />
        <Arrow opacity={linesOpacity} label="WebSocket" />

        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
          <ArchBox label="🚀 API Gateway" progress={boxes[1]} borderColor={primaryColor} direction="left" />
          <Arrow opacity={linesOpacity} horizontal />
          <ArchBox label="📡 Redis Pub/Sub" progress={boxes[2]} borderColor="#ef4444" direction="right" />
        </div>

        <Arrow opacity={linesOpacity} label="Events" />
        <ArchBox label="⚡ Notification Services" progress={boxes[3]} borderColor="#22c55e" direction="up" />

        <div
          style={{
            marginTop: 20,
            padding: "8px 20px",
            backgroundColor: "#22c55e",
            borderRadius: 20,
            opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: "white", fontFamily: "Inter" }}>
            Score: 8.5/10 ✓
          </span>
        </div>
      </div>
    </div>
  );
};

const ArchBox: React.FC<{
  label: string;
  progress: number;
  borderColor: string;
  direction: "up" | "down" | "left" | "right";
}> = ({ label, progress, borderColor, direction }) => {
  const offset = 20 * (1 - progress);

  const getTransform = () => {
    switch (direction) {
      case "up": return makeTransform([translateY(offset)]);
      case "down": return makeTransform([translateY(-offset)]);
      case "left": return makeTransform([translateX(-offset)]);
      case "right": return makeTransform([translateX(offset)]);
    }
  };

  return (
    <div
      style={{
        opacity: progress,
        transform: getTransform(),
        padding: "16px 32px",
        backgroundColor: "#1f2937",
        borderRadius: 12,
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 20px ${borderColor}30`,
      }}
    >
      <span style={{ fontSize: 18, fontWeight: 600, color: "white", fontFamily: "Inter" }}>
        {label}
      </span>
    </div>
  );
};

const Arrow: React.FC<{ opacity: number; label?: string; horizontal?: boolean }> = ({
  opacity,
  label,
  horizontal,
}) => (
  <div style={{ opacity, color: "#6b7280", fontSize: 20 }}>
    {horizontal ? "⟷" : `↓${label ? ` ${label}` : ""}`}
  </div>
);
