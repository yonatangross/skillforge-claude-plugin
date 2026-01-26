import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  random,
} from "remotion";
import { z } from "zod";
import { ORCHESTKIT_STATS } from "../constants";

/**
 * MarketplaceDemo - AnimStats-Inspired Full Restyle v3
 *
 * 45 seconds @ 30fps = 1350 frames
 * Features: Cursor choreography, confetti, hard cuts, geometric backgrounds
 */

export const marketplaceDemoSchema = z.object({
  primaryColor: z.string().default("#9B5DE5"),
});

type MarketplaceDemoProps = z.infer<typeof marketplaceDemoSchema>;

// AnimStats color palette
const WHITE_BG = "#FFFFFF";
const BLACK_BG = "#050505";
const SURFACE_DARK = "#1A1A1A";
const GRADIENT_PURPLE = "#9B5DE5";
const GRADIENT_PINK = "#F15BB5";
const GRADIENT_YELLOW = "#FEE440";
const TEXT_DARK = "#050505";
const TEXT_LIGHT = "#FFFFFF";
const DIM_DARK = "#666666";
const DIM_LIGHT = "#94a3b8";
const GREEN = "#22c55e";
const CYAN = "#06b6d4";
const RED = "#ef4444";
const BLUE = "#3b82f6";

// Spring configs
const SNAPPY_SPRING = { damping: 12, stiffness: 200 };
const POP_SPRING = { damping: 10, stiffness: 300, mass: 0.8 };
const BOUNCE_SPRING = { damping: 8, stiffness: 200 };

// Agent definitions
const IMPLEMENT_AGENTS = [
  { icon: "🏗️", name: "backend", color: CYAN, task: "Auth endpoints" },
  { icon: "🔒", name: "security", color: RED, task: "JWT validation" },
  { icon: "📊", name: "workflow", color: GRADIENT_PURPLE, task: "Dependencies" },
  { icon: "🧪", name: "tests", color: GREEN, task: "Test fixtures" },
  { icon: "📝", name: "docs", color: GRADIENT_PINK, task: "API docs" },
];

const VERIFY_AGENTS = [
  { icon: "🔒", name: "Security", score: 9.5, color: RED },
  { icon: "🧪", name: "Tests", score: 9.2, color: CYAN },
  { icon: "📊", name: "Quality", score: 8.8, color: GRADIENT_PURPLE },
  { icon: "⚡", name: "Perf", score: 9.1, color: GRADIENT_YELLOW },
  { icon: "♿", name: "A11y", score: 8.5, color: BLUE },
  { icon: "📝", name: "Docs", score: 9.0, color: GRADIENT_PINK },
];

const BREADTH_COMMANDS = [
  { cmd: "/explore", result: "847 files mapped", color: GRADIENT_PURPLE },
  { cmd: "/brainstorming", result: "JWT + refresh", color: GRADIENT_YELLOW },
  { cmd: "/commit", result: "feat(auth): JWT", color: GRADIENT_PINK },
  { cmd: "/create-pr", result: "PR #143 ready", color: BLUE },
  { cmd: "/doctor", result: "All systems ✓", color: GREEN },
];

// Gradient text component
const GradientText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <span
    style={{
      background: `linear-gradient(90deg, ${GRADIENT_PURPLE} 0%, ${GRADIENT_PINK} 50%, ${GRADIENT_YELLOW} 100%)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      ...style,
    }}
  >
    {children}
  </span>
);

// Floating geometric shapes for depth
const GeometricBackground: React.FC<{ frame: number; dark?: boolean }> = ({ frame, dark = true }) => {
  const shapes = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: random(`shape-x-${i}`) * 100,
    y: random(`shape-y-${i}`) * 100,
    size: 20 + random(`shape-size-${i}`) * 40,
    rotation: random(`shape-rot-${i}`) * 360,
    type: i % 3, // 0=diamond, 1=triangle, 2=circle
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {shapes.map((shape) => {
        const float = Math.sin((frame + shape.id * 20) * 0.02) * 10;
        const rotate = shape.rotation + frame * 0.1;
        const opacity = dark ? 0.08 : 0.05;

        return (
          <div
            key={shape.id}
            style={{
              position: "absolute",
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: shape.size,
              height: shape.size,
              transform: `translateY(${float}px) rotate(${rotate}deg)`,
              opacity,
              border: `2px solid ${dark ? TEXT_LIGHT : TEXT_DARK}`,
              borderRadius: shape.type === 2 ? "50%" : shape.type === 0 ? 0 : 0,
              clipPath: shape.type === 1 ? "polygon(50% 0%, 0% 100%, 100% 100%)" : shape.type === 0 ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
};

// Confetti burst component
const ConfettiBurst: React.FC<{ frame: number; fps: number; startFrame: number }> = ({ frame, fps, startFrame }) => {
  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame > fps * 2) return null;

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    angle: (i / 30) * Math.PI * 2 + random(`conf-angle-${i}`) * 0.5,
    speed: 200 + random(`conf-speed-${i}`) * 300,
    color: [GRADIENT_PURPLE, GRADIENT_PINK, GRADIENT_YELLOW, GREEN, CYAN][i % 5],
    size: 8 + random(`conf-size-${i}`) * 8,
    rotationSpeed: random(`conf-rot-${i}`) * 10 - 5,
  }));

  const progress = localFrame / fps;
  const gravity = progress * progress * 400;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map((p) => {
        const x = Math.cos(p.angle) * p.speed * progress;
        const y = Math.sin(p.angle) * p.speed * progress + gravity;
        const opacity = interpolate(localFrame, [fps * 1.5, fps * 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const rotation = localFrame * p.rotationSpeed;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "40%",
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: random(`conf-shape-${p.id}`) > 0.5 ? "50%" : 2,
              transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};

// Animated cursor with bezier movement
const AnimatedCursor: React.FC<{
  frame: number;
  fps: number;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  startFrame: number;
  duration: number;
  onClick?: boolean;
}> = ({ frame, fps, startPos, endPos, startFrame, duration, onClick = false }) => {
  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame > duration + fps * 0.3) return null;

  const progress = Math.min(1, localFrame / duration);
  // Bezier curve for natural movement
  const eased = Easing.bezier(0.25, 0.1, 0.25, 1)(progress);

  const x = startPos.x + (endPos.x - startPos.x) * eased;
  const y = startPos.y + (endPos.y - startPos.y) * eased;

  // Click animation
  const isClicking = onClick && localFrame > duration && localFrame < duration + fps * 0.2;
  const clickScale = isClicking ? 0.85 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 24,
        height: 24,
        transform: `scale(${clickScale})`,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {/* Cursor SVG */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3L19 12L12 13L9 20L5 3Z"
          fill={TEXT_LIGHT}
          stroke={TEXT_DARK}
          strokeWidth="2"
        />
      </svg>
      {/* Click ripple */}
      {isClicking && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `2px solid ${GRADIENT_PURPLE}`,
            transform: "translate(-8px, -8px)",
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
};

// Reaction emoji component
const ReactionEmoji: React.FC<{ frame: number; fps: number; startFrame: number; emoji: string }> = ({ frame, fps, startFrame, emoji }) => {
  const localFrame = frame - startFrame;
  if (localFrame < 0) return null;

  const scale = spring({ frame: localFrame, fps, config: BOUNCE_SPRING });
  const wiggle = Math.sin(localFrame * 0.3) * 5;

  return (
    <div
      style={{
        position: "absolute",
        right: 100,
        top: "40%",
        fontSize: 80,
        transform: `scale(${scale}) rotate(${wiggle}deg)`,
      }}
    >
      {emoji}
    </div>
  );
};

export const MarketplaceDemo: React.FC<MarketplaceDemoProps> = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Scene boundaries
  const HOOK_END = fps * 4;
  const IMPLEMENT_END = fps * 16;
  const VERIFY_INTRO_END = fps * 17;
  const VERIFY_END = fps * 25;
  const BREADTH_INTRO_END = fps * 26;
  const BREADTH_END = fps * 34;
  const CTA_INTRO_END = fps * 35;

  const isHook = frame < HOOK_END;
  const isImplement = frame >= HOOK_END && frame < IMPLEMENT_END;
  const isVerifyIntro = frame >= IMPLEMENT_END && frame < VERIFY_INTRO_END;
  const isVerify = frame >= VERIFY_INTRO_END && frame < VERIFY_END;
  const isBreadthIntro = frame >= VERIFY_END && frame < BREADTH_INTRO_END;
  const isBreadth = frame >= BREADTH_INTRO_END && frame < BREADTH_END;
  const isCTAIntro = frame >= BREADTH_END && frame < CTA_INTRO_END;
  const isCTA = frame >= CTA_INTRO_END;

  const bgColor = isHook || isCTA ? WHITE_BG : isVerifyIntro || isBreadthIntro || isCTAIntro ? WHITE_BG : BLACK_BG;
  const isDarkBg = bgColor === BLACK_BG;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Geometric background */}
      <GeometricBackground frame={frame} dark={isDarkBg} />

      {/* Scene content */}
      {isHook && <KineticHookScene frame={frame} fps={fps} />}
      {isImplement && <FastImplementScene frame={frame - HOOK_END} fps={fps} width={width} />}
      {isVerifyIntro && <PopIntroCard frame={frame - IMPLEMENT_END} fps={fps} title="Quality Check" subtitle="/verify" icon="🔍" />}
      {isVerify && <FastVerifyScene frame={frame - VERIFY_INTRO_END} fps={fps} />}
      {isBreadthIntro && <PopIntroCard frame={frame - VERIFY_END} fps={fps} title="22 Skills" subtitle="ecosystem" icon="⚡" />}
      {isBreadth && <RapidBreadthScene frame={frame - BREADTH_INTRO_END} fps={fps} />}
      {isCTAIntro && <PopIntroCard frame={frame - BREADTH_END} fps={fps} title="Get Started" subtitle="one command" icon="🚀" />}
      {isCTA && <KineticCTAScene frame={frame - CTA_INTRO_END} fps={fps} />}

      {/* Scene badge */}
      {(isImplement || isVerify || isBreadth) && (
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 40,
            backgroundColor: BLACK_BG,
            borderRadius: 30,
            padding: "10px 24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          }}
        >
          <GradientText style={{ fontSize: 18, fontWeight: 800 }}>
            {isImplement ? "/implement" : isVerify ? "/verify" : "Skills"}
          </GradientText>
        </div>
      )}

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: isDarkBg ? "#333" : "#E5E5E5",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(frame / (fps * 45)) * 100}%`,
            background: `linear-gradient(90deg, ${GRADIENT_PURPLE} 0%, ${GRADIENT_PINK} 50%, ${GRADIENT_YELLOW} 100%)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Scene 1: Kinetic Hook with hard contrast slams
const KineticHookScene: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  // Phase 1: "Stop" (0-0.5s) - Black on white
  // Phase 2: "explaining your stack" (0.5-1.5s) - White on black (SLAM)
  // Phase 3: "Start shipping" (1.5-2.5s) - Gradient on white
  // Phase 4: Stats (2.5-4s)

  const phase1End = fps * 0.6;
  const phase2End = fps * 1.4;
  const phase3End = fps * 2.4;

  const isPhase1 = frame < phase1End;
  const isPhase2 = frame >= phase1End && frame < phase2End;
  const isPhase3 = frame >= phase2End && frame < phase3End;
  const isPhase4 = frame >= phase3End;

  // Hard cut backgrounds
  const bgColor = isPhase2 ? BLACK_BG : WHITE_BG;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      <GeometricBackground frame={frame} dark={isPhase2} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          fontFamily: "Inter, SF Pro Display, -apple-system, sans-serif",
        }}
      >
        {/* Phase 1: "Stop" */}
        {isPhase1 && (
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              color: TEXT_DARK,
              transform: `scale(${spring({ frame, fps, config: POP_SPRING })})`,
            }}
          >
            Stop
          </div>
        )}

        {/* Phase 2: Hard slam to black - "explaining your stack" */}
        {isPhase2 && (
          <div
            style={{
              fontSize: 90,
              fontWeight: 900,
              color: TEXT_LIGHT,
              textAlign: "center",
              transform: `scale(${spring({ frame: frame - phase1End, fps, config: POP_SPRING })})`,
            }}
          >
            explaining your stack.
          </div>
        )}

        {/* Phase 3: Gradient payoff */}
        {isPhase3 && (
          <div style={{ textAlign: "center" }}>
            <GradientText
              style={{
                fontSize: 120,
                fontWeight: 900,
                display: "block",
                transform: `scale(${spring({ frame: frame - phase2End, fps, config: POP_SPRING })})`,
              }}
            >
              Start shipping.
            </GradientText>
          </div>
        )}

        {/* Phase 4: Stats */}
        {isPhase4 && (
          <div style={{ display: "flex", gap: 80 }}>
            {[
              { value: ORCHESTKIT_STATS.skills, label: "SKILLS" },
              { value: ORCHESTKIT_STATS.agents, label: "AGENTS" },
              { value: ORCHESTKIT_STATS.hooks, label: "HOOKS" },
            ].map((stat, idx) => {
              const statDelay = idx * fps * 0.1;
              const statFrame = frame - phase3End - statDelay;
              if (statFrame <= 0) return <div key={idx} />;

              const scale = spring({ frame: statFrame, fps, config: POP_SPRING });
              const countUp = Math.min(
                Math.floor(interpolate(statFrame, [0, fps * 0.5], [0, stat.value], {
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                })),
                stat.value
              );

              return (
                <div key={idx} style={{ textAlign: "center", transform: `scale(${scale})` }}>
                  <GradientText style={{ fontSize: 80, fontWeight: 900, fontFamily: "SF Mono, monospace" }}>
                    {countUp}
                  </GradientText>
                  <div style={{ fontSize: 18, color: DIM_DARK, fontWeight: 700, letterSpacing: 3, marginTop: 8 }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Pop Intro Card - Fixed with visible content
const PopIntroCard: React.FC<{
  frame: number;
  fps: number;
  title: string;
  subtitle: string;
  icon: string;
}> = ({ frame, fps, title, subtitle, icon }) => {
  const scale = spring({ frame, fps, config: POP_SPRING });
  const iconBounce = spring({ frame: Math.max(0, frame - fps * 0.1), fps, config: BOUNCE_SPRING });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        fontFamily: "Inter, SF Pro Display, sans-serif",
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          fontSize: 140,
          transform: `scale(${iconBounce}) rotate(${Math.sin(frame * 0.3) * 8}deg)`,
          marginBottom: 30,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 72, fontWeight: 900, color: TEXT_DARK, marginBottom: 16 }}>
        {title}
      </div>
      <GradientText style={{ fontSize: 32, fontWeight: 700 }}>
        {subtitle}
      </GradientText>
    </div>
  );
};

// Scene 2: Fast Implement with cursor and confetti
const FastImplementScene: React.FC<{ frame: number; fps: number; width: number }> = ({ frame, fps, width }) => {
  const PAGE_DURATION = fps * 4;
  const currentPage = Math.min(2, Math.floor(frame / PAGE_DURATION));
  const pageFrame = frame % PAGE_DURATION;

  const pageScale = spring({ frame: pageFrame, fps, config: SNAPPY_SPRING });

  const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const spinnerIdx = Math.floor(frame / 2) % SPINNER.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "40px 60px",
        fontFamily: "SF Mono, Monaco, monospace",
        position: "relative",
      }}
    >
      {/* Command bar */}
      <div
        style={{
          backgroundColor: SURFACE_DARK,
          borderRadius: 20,
          padding: "20px 30px",
          marginBottom: 20,
          boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: GREEN }}>$</span>
          <GradientText>/implement user authentication</GradientText>
          <span style={{ color: GRADIENT_YELLOW, fontSize: 18, marginLeft: "auto" }}>
            {currentPage < 2 ? `${SPINNER[spinnerIdx]} Running...` : "✓ Done"}
          </span>
        </div>
      </div>

      {/* Page indicator */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, justifyContent: "center" }}>
        {["Agents", "Code", "Complete"].map((label, idx) => {
          const isActive = currentPage === idx;
          const isPast = currentPage > idx;
          return (
            <div
              key={idx}
              style={{
                padding: "8px 20px",
                borderRadius: 30,
                background: isActive ? `linear-gradient(90deg, ${GRADIENT_PURPLE}, ${GRADIENT_PINK})` : isPast ? GREEN : SURFACE_DARK,
                boxShadow: isActive ? "0 4px 20px rgba(155, 93, 229, 0.4)" : "none",
              }}
            >
              <span style={{ color: TEXT_LIGHT, fontSize: 14, fontWeight: 700 }}>
                {isPast ? "✓" : idx + 1}. {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Page content */}
      <div style={{ flex: 1, transform: `scale(${pageScale})`, transformOrigin: "top center" }}>
        {/* Page 1: Agents */}
        {currentPage === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {IMPLEMENT_AGENTS.map((agent, idx) => {
              const agentDelay = idx * fps * 0.15;
              const agentFrame = pageFrame - agentDelay;
              if (agentFrame <= 0) return <div key={idx} />;

              const agentScale = spring({ frame: agentFrame, fps, config: POP_SPRING });
              const progress = Math.min(100, (agentFrame / (fps * 2)) * 100);

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: SURFACE_DARK,
                    borderRadius: 20,
                    padding: 24,
                    transform: `scale(${agentScale})`,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{agent.icon}</div>
                  <div style={{ color: agent.color, fontWeight: 800, fontSize: 16 }}>{agent.name}</div>
                  <div style={{ color: DIM_LIGHT, fontSize: 14, marginTop: 8 }}>{agent.task}</div>
                  <div style={{ height: 8, backgroundColor: "#333", borderRadius: 4, marginTop: 16 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${agent.color}, ${GRADIENT_PINK})`,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Page 2: Code */}
        {currentPage === 1 && (
          <div
            style={{
              backgroundColor: SURFACE_DARK,
              borderRadius: 20,
              padding: 40,
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
              height: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: RED }} />
              <span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: GRADIENT_YELLOW }} />
              <span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: GREEN }} />
              <span style={{ color: DIM_LIGHT, fontSize: 14, marginLeft: 16 }}>src/api/auth.py</span>
            </div>
            {[
              { code: '@router.post("/login")', color: GRADIENT_PURPLE },
              { code: 'async def login(creds: LoginSchema):', color: CYAN },
              { code: '    user = await authenticate(creds)', color: TEXT_LIGHT },
              { code: '    if not user: raise HTTPException(401)', color: RED },
              { code: '    return create_tokens(user.id)', color: GREEN },
            ].map((line, idx) => {
              const lineDelay = idx * fps * 0.25;
              const lineFrame = pageFrame - lineDelay;
              if (lineFrame <= 0) return null;
              const typedChars = Math.min(Math.floor(lineFrame * 2), line.code.length);

              return (
                <div key={idx} style={{ color: line.color, fontSize: 22, marginBottom: 12, fontWeight: 600 }}>
                  {line.code.slice(0, typedChars)}
                  {typedChars < line.code.length && (
                    <span style={{ backgroundColor: TEXT_LIGHT, width: 3, height: 24, display: "inline-block", marginLeft: 2 }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Page 3: Complete with confetti */}
        {currentPage === 2 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 24,
              position: "relative",
            }}
          >
            <ConfettiBurst frame={frame} fps={fps} startFrame={HOOK_END + PAGE_DURATION * 2} />

            <div style={{ fontSize: 120, transform: `scale(${spring({ frame: pageFrame, fps, config: POP_SPRING })})` }}>
              ✓
            </div>
            <GradientText style={{ fontSize: 56, fontWeight: 900 }}>Feature Complete</GradientText>
            <div style={{ display: "flex", gap: 40, marginTop: 20 }}>
              {[
                { value: "6", label: "Files" },
                { value: "487", label: "Lines" },
                { value: "12", label: "Tests" },
              ].map((stat, idx) => {
                const statScale = spring({ frame: Math.max(0, pageFrame - idx * fps * 0.1), fps, config: POP_SPRING });
                return (
                  <div key={idx} style={{ textAlign: "center", transform: `scale(${statScale})` }}>
                    <GradientText style={{ fontSize: 48, fontWeight: 900 }}>{stat.value}</GradientText>
                    <div style={{ color: DIM_LIGHT, fontSize: 14, marginTop: 8 }}>{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Reaction emoji */}
            <ReactionEmoji frame={frame} fps={fps} startFrame={HOOK_END + PAGE_DURATION * 2 + fps * 0.5} emoji="👀" />
          </div>
        )}
      </div>

      {/* Cursor animation */}
      {currentPage === 0 && pageFrame > fps * 2 && (
        <AnimatedCursor
          frame={pageFrame}
          fps={fps}
          startPos={{ x: width - 200, y: 300 }}
          endPos={{ x: width / 2, y: 500 }}
          startFrame={fps * 2}
          duration={fps * 1}
        />
      )}
    </div>
  );
};

// Scene 3: Fast Verify with reactions
const FastVerifyScene: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const showGrade = frame >= fps * 4;
  const gradeValue = 8.7;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 40, position: "relative" }}>
      {/* Agent grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 30 }}>
        {VERIFY_AGENTS.map((agent, idx) => {
          const agentDelay = idx * fps * 0.1;
          const agentFrame = frame - agentDelay;
          if (agentFrame <= 0) return null;

          const scale = spring({ frame: agentFrame, fps, config: POP_SPRING });
          const showScore = agentFrame > fps * 1.5;

          return (
            <div
              key={idx}
              style={{
                backgroundColor: SURFACE_DARK,
                borderRadius: 16,
                padding: 20,
                transform: `scale(${scale})`,
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ fontSize: 36 }}>{agent.icon}</div>
              <div style={{ color: agent.color, fontWeight: 700, fontSize: 14, marginTop: 8 }}>{agent.name}</div>
              {showScore && (
                <GradientText style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                  {agent.score}
                </GradientText>
              )}
            </div>
          );
        })}
      </div>

      {/* Grade reveal */}
      {showGrade && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${spring({ frame: frame - fps * 4, fps, config: POP_SPRING })})`,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ color: DIM_LIGHT, fontSize: 24, fontWeight: 700, letterSpacing: 4, marginBottom: 16 }}>
              QUALITY SCORE
            </div>
            <GradientText style={{ fontSize: 180, fontWeight: 900, fontFamily: "SF Mono, monospace", lineHeight: 1 }}>
              {gradeValue}
            </GradientText>
            <div
              style={{
                marginTop: 30,
                backgroundColor: GREEN,
                borderRadius: 30,
                padding: "16px 40px",
                boxShadow: `0 10px 40px ${GREEN}50`,
              }}
            >
              <span style={{ color: TEXT_LIGHT, fontSize: 24, fontWeight: 800 }}>🚀 READY FOR MERGE</span>
            </div>
          </div>
        </div>
      )}

      {/* Celebration reaction */}
      {showGrade && frame > fps * 5 && (
        <ReactionEmoji frame={frame} fps={fps} startFrame={fps * 5} emoji="🎉" />
      )}
    </div>
  );
};

// Scene 4: Rapid Breadth
const RapidBreadthScene: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const COMMAND_DURATION = fps * 1.5;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: 60,
        fontFamily: "SF Mono, Monaco, monospace",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 1000 }}>
        {BREADTH_COMMANDS.map((item, idx) => {
          const itemStart = idx * COMMAND_DURATION;
          const itemFrame = frame - itemStart;
          if (itemFrame <= 0) return null;

          const scale = spring({ frame: itemFrame, fps, config: POP_SPRING });
          const showResult = itemFrame > fps * 0.3;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                backgroundColor: SURFACE_DARK,
                borderRadius: 16,
                padding: "20px 32px",
                transform: `scale(${scale})`,
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
              }}
            >
              <span style={{ color: item.color, fontSize: 28, fontWeight: 800, minWidth: 220 }}>{item.cmd}</span>
              {showResult && (
                <span style={{ color: TEXT_LIGHT, fontSize: 20, opacity: interpolate(itemFrame - fps * 0.3, [0, fps * 0.2], [0, 1]) }}>
                  → {item.result}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 5: Kinetic CTA
const KineticCTAScene: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const titleScale = spring({ frame, fps, config: POP_SPRING });
  const ctaScale = spring({ frame: Math.max(0, frame - fps * 1), fps, config: POP_SPRING });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        fontFamily: "Inter, SF Pro Display, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", transform: `scale(${titleScale})` }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: TEXT_DARK, marginBottom: 16 }}>
          Works with your projects.
        </div>
        <div style={{ fontSize: 24, color: DIM_DARK }}>
          30+ plugins • {ORCHESTKIT_STATS.skills} skills • {ORCHESTKIT_STATS.agents} agents
        </div>
      </div>

      <div
        style={{
          marginTop: 50,
          transform: `scale(${ctaScale})`,
          background: `linear-gradient(90deg, ${GRADIENT_PURPLE}, ${GRADIENT_PINK})`,
          borderRadius: 20,
          padding: "24px 48px",
          boxShadow: `0 20px 60px ${GRADIENT_PURPLE}50`,
        }}
      >
        <span style={{ color: TEXT_LIGHT, fontSize: 32, fontWeight: 800, fontFamily: "SF Mono, monospace" }}>
          $ /plugin install ork
        </span>
      </div>

      <div style={{ marginTop: 40, opacity: interpolate(frame, [fps * 2, fps * 2.5], [0, 1]) }}>
        <GradientText style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6 }}>ORCHESTKIT</GradientText>
      </div>
    </div>
  );
};

// Export HOOK_END for confetti timing
const HOOK_END = 30 * 4; // fps * 4
