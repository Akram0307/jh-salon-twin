#!/usr/bin/env bash

BASE_URL="${1:-https://salonos-owner-frontend-687369167038.us-central1.run.app}"
OUT_DIR="/a0/usr/projects/jh_salon_twin/frontend/visual_qa_reports"
VISION_CMD="/a0/usr/projects/jh_salon_twin/skills/vision_analyzer/bin/vision"

mkdir -p "$OUT_DIR"

TS=$(date +%Y%m%d_%H%M%S)
SCREENSHOT="$OUT_DIR/visual_${TS}.png"
REPORT="$OUT_DIR/visual_${TS}_report.txt"

node <<NODE
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("$BASE_URL", { waitUntil: 'networkidle' });

  await page.screenshot({ path: "$SCREENSHOT", fullPage: true });

  console.log("Screenshot saved: $SCREENSHOT");

  await browser.close();
})();
NODE

echo "Running AI visual analysis..." | tee "$REPORT"

$VISION_CMD "$SCREENSHOT" >> "$REPORT"

echo ""
echo "Visual QA report saved to: $REPORT"
