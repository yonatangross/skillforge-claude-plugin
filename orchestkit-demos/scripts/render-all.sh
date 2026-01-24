#!/bin/bash
# Render all OrchestKit demo videos (horizontal + vertical)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/out"

cd "$PROJECT_DIR"

echo "=== OrchestKit Demo Video Renderer ==="
echo ""

# Create output directories
mkdir -p "$OUTPUT_DIR/horizontal"
mkdir -p "$OUTPUT_DIR/vertical"

# Horizontal demos (16:9 - YouTube, Twitter)
HORIZONTAL_DEMOS=(
  "ExploreDemo"
  "VerifyDemo"
  "CommitDemo"
  "BrainstormingDemo"
  "ReviewPRDemo"
  "RememberDemo"
)

# Vertical demos (9:16 - TikTok, Reels)
VERTICAL_DEMOS=(
  "ExploreDemo-Vertical"
  "VerifyDemo-Vertical"
  "CommitDemo-Vertical"
  "BrainstormingDemo-Vertical"
  "ReviewPRDemo-Vertical"
  "RememberDemo-Vertical"
)

render_demo() {
  local demo=$1
  local output_dir=$2
  local output_file="$output_dir/${demo}.mp4"

  echo "Rendering: $demo"
  npx remotion render "$demo" "$output_file" --codec h264 --crf 18
  echo "  -> $output_file"
}

# Check if VHS demos exist
echo "Checking VHS terminal recordings..."
for demo in explore verify commit brainstorming review-pr remember; do
  if [ ! -f "$PROJECT_DIR/public/${demo}-demo.mp4" ]; then
    echo "  WARNING: Missing public/${demo}-demo.mp4"
    echo "  Run: cd tapes && vhs sim-${demo}.tape"
  fi
done
echo ""

# Render mode
MODE=${1:-"all"}

case $MODE in
  "horizontal")
    echo "Rendering horizontal (16:9) demos..."
    for demo in "${HORIZONTAL_DEMOS[@]}"; do
      render_demo "$demo" "$OUTPUT_DIR/horizontal"
    done
    ;;
  "vertical")
    echo "Rendering vertical (9:16) demos..."
    for demo in "${VERTICAL_DEMOS[@]}"; do
      render_demo "$demo" "$OUTPUT_DIR/vertical"
    done
    ;;
  "all")
    echo "Rendering all demos..."
    echo ""
    echo "=== Horizontal (16:9) ==="
    for demo in "${HORIZONTAL_DEMOS[@]}"; do
      render_demo "$demo" "$OUTPUT_DIR/horizontal"
    done
    echo ""
    echo "=== Vertical (9:16) ==="
    for demo in "${VERTICAL_DEMOS[@]}"; do
      render_demo "$demo" "$OUTPUT_DIR/vertical"
    done
    ;;
  *)
    echo "Rendering single demo: $MODE"
    if [[ "$MODE" == *"-Vertical" ]]; then
      render_demo "$MODE" "$OUTPUT_DIR/vertical"
    else
      render_demo "$MODE" "$OUTPUT_DIR/horizontal"
    fi
    ;;
esac

echo ""
echo "=== Render complete! ==="
echo "Output: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR/horizontal" "$OUTPUT_DIR/vertical" 2>/dev/null || true
