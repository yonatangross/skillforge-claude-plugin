import { Composition } from "remotion";
import { HybridDemo, hybridDemoSchema } from "./components/HybridDemo";
import { VerticalDemo, verticalDemoSchema } from "./components/VerticalDemo";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const VERTICAL_WIDTH = 1080;
const VERTICAL_HEIGHT = 1920;

// Common audio settings
const AUDIO_DEFAULTS = {
  backgroundMusic: "audio/ambient-tech.mp3",
  musicVolume: 0.12,
  enableSoundEffects: true,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ==================== HORIZONTAL 16:9 DEMOS ==================== */}

      {/* /explore - 13s VHS video */}
      <Composition
        id="ExploreDemo"
        component={HybridDemo}
        durationInFrames={FPS * 13}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={hybridDemoSchema}
        defaultProps={{
          skillName: "explore",
          hook: "Understand any codebase instantly",
          terminalVideo: "explore-demo.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#8b5cf6",
          showHook: true,
          showCTA: true,
          hookDuration: 45,
          ctaDuration: 75,
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /verify - 8s VHS video */}
      <Composition
        id="VerifyDemo"
        component={HybridDemo}
        durationInFrames={FPS * 8}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={hybridDemoSchema}
        defaultProps={{
          skillName: "verify",
          hook: "6 parallel agents validate your feature",
          terminalVideo: "verify-demo.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#22c55e",
          showHook: true,
          showCTA: true,
          hookDuration: 40,
          ctaDuration: 60,
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /commit - 8s VHS video */}
      <Composition
        id="CommitDemo"
        component={HybridDemo}
        durationInFrames={FPS * 8}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={hybridDemoSchema}
        defaultProps={{
          skillName: "commit",
          hook: "AI-generated conventional commits",
          terminalVideo: "commit-demo.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#06b6d4",
          showHook: true,
          showCTA: true,
          hookDuration: 40,
          ctaDuration: 60,
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /brainstorming - 10s VHS video */}
      <Composition
        id="BrainstormingDemo"
        component={HybridDemo}
        durationInFrames={FPS * 10}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={hybridDemoSchema}
        defaultProps={{
          skillName: "brainstorming",
          hook: "Think before you code",
          terminalVideo: "brainstorming-demo.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#f59e0b",
          showHook: true,
          showCTA: true,
          hookDuration: 40,
          ctaDuration: 70,
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /review-pr - 13s VHS video */}
      <Composition
        id="ReviewPRDemo"
        component={HybridDemo}
        durationInFrames={FPS * 13}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={hybridDemoSchema}
        defaultProps={{
          skillName: "review-pr",
          hook: "6 specialized agents review your PR",
          terminalVideo: "review-pr-demo.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#f97316",
          showHook: true,
          showCTA: true,
          hookDuration: 45,
          ctaDuration: 75,
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /remember - 8s VHS video */}
      <Composition
        id="RememberDemo"
        component={HybridDemo}
        durationInFrames={FPS * 8}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={hybridDemoSchema}
        defaultProps={{
          skillName: "remember",
          hook: "Teach Claude your patterns",
          terminalVideo: "remember-demo.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#ec4899",
          showHook: true,
          showCTA: true,
          hookDuration: 40,
          ctaDuration: 60,
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* ==================== VERTICAL 9:16 DEMOS (TikTok/Reels) ==================== */}

      {/* /explore - Vertical */}
      <Composition
        id="ExploreDemo-Vertical"
        component={VerticalDemo}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        schema={verticalDemoSchema}
        defaultProps={{
          skillName: "explore",
          hook: "Understand any codebase instantly",
          terminalVideo: "explore-demo-vertical.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#8b5cf6",
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /verify - Vertical */}
      <Composition
        id="VerifyDemo-Vertical"
        component={VerticalDemo}
        durationInFrames={FPS * 12}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        schema={verticalDemoSchema}
        defaultProps={{
          skillName: "verify",
          hook: "6 parallel agents validate your feature",
          terminalVideo: "verify-demo-vertical.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#22c55e",
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /commit - Vertical */}
      <Composition
        id="CommitDemo-Vertical"
        component={VerticalDemo}
        durationInFrames={FPS * 12}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        schema={verticalDemoSchema}
        defaultProps={{
          skillName: "commit",
          hook: "AI-generated conventional commits",
          terminalVideo: "commit-demo-vertical.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#06b6d4",
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /brainstorming - Vertical */}
      <Composition
        id="BrainstormingDemo-Vertical"
        component={VerticalDemo}
        durationInFrames={FPS * 14}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        schema={verticalDemoSchema}
        defaultProps={{
          skillName: "brainstorming",
          hook: "Think before you code",
          terminalVideo: "brainstorming-demo-vertical.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#f59e0b",
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /review-pr - Vertical */}
      <Composition
        id="ReviewPRDemo-Vertical"
        component={VerticalDemo}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        schema={verticalDemoSchema}
        defaultProps={{
          skillName: "review-pr",
          hook: "6 specialized agents review your PR",
          terminalVideo: "review-pr-demo-vertical.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#f97316",
          ...AUDIO_DEFAULTS,
        }}
      />

      {/* /remember - Vertical */}
      <Composition
        id="RememberDemo-Vertical"
        component={VerticalDemo}
        durationInFrames={FPS * 12}
        fps={FPS}
        width={VERTICAL_WIDTH}
        height={VERTICAL_HEIGHT}
        schema={verticalDemoSchema}
        defaultProps={{
          skillName: "remember",
          hook: "Teach Claude your patterns",
          terminalVideo: "remember-demo-vertical.mp4",
          ccVersion: "CC 2.1.16",
          primaryColor: "#ec4899",
          ...AUDIO_DEFAULTS,
        }}
      />
    </>
  );
};
