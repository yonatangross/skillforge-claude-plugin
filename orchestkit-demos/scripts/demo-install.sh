#!/usr/bin/env bash
# OrchestKit Demo - Marketplace Install
set -euo pipefail

P="\033[35m" C="\033[36m" G="\033[32m" Y="\033[33m" D="\033[90m" B="\033[1m" N="\033[0m"

clear
sleep 0.3

echo -e "${D}────────────────────────────────────────────────${N}"
echo -e "${C}Claude Code${N} v2.1.16"
echo -e "${D}────────────────────────────────────────────────${N}"
echo
sleep 0.4

echo -e "${G}>${N} ${B}/plugin install ork${N}"
sleep 0.5
echo

echo -e "${P}●${N} Fetching ${C}yonatangross/orchestkit${N}..."
sleep 0.3
echo -e "  ${D}→ Validating plugin.json${N}"
sleep 0.2
echo -e "  ${D}→ Checking engine: >=2.1.16${N}"
sleep 0.2
echo -e "${G}✓${N} Plugin validated"
echo
sleep 0.3

echo -e "${P}●${N} Installing components..."
sleep 0.2
echo -e "  ${G}✓${N} ${C}168${N} skills"
echo -e "  ${G}✓${N} ${C}35${N} agents"
echo -e "  ${G}✓${N} ${C}148${N} hooks"
sleep 0.4
echo

echo -e "${D}────────────────────────────────────────────────${N}"
echo -e "${G}${B}✓ OrchestKit installed${N}"
echo
echo -e "  Try: ${C}/verify${N}  ${C}/commit${N}  ${C}/explore${N}"
echo -e "${D}────────────────────────────────────────────────${N}"
sleep 1.5
