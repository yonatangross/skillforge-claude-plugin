#!/bin/bash
# Mem0 Decision Saver Hook
# Reminds Claude to save design decisions to Mem0 after skill completion
#
# Version: 1.1.0 - Simplified for robustness

set -euo pipefail

# Just output a simple reminder - no complex parsing
echo '{"continue":true}'