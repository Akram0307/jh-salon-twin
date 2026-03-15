import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASELINE_DIR = path.join(__dirname, '../screenshots/baseline');
const DIFF_DIR = path.join(__dirname, '../screenshots/diff');
const CURRENT_DIR = path.join(__dirname, '../screenshots/current');

// Ensure directories exist
[DIFF_DIR, CURRENT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface CompareOptions {
  threshold?: number;
  maxDiffPixels?: number;
  viewport: 'desktop' | 'mobile';
  pageName: string;
}

interface CompareResult {
  passed: boolean;
  diffPercentage: number;
  diffPath?: string;
  currentPath: string;
  baselinePath: string;
}

/**
 * Compare current screenshot with baseline
 */
export async function compareWithBaseline(
  page: any,
  options: CompareOptions
): Promise<CompareResult> {
  const { viewport, pageName, threshold = 0.2, maxDiffPixels = 1000 } = options;

  const baselinePath = path.join(BASELINE_DIR, viewport, `${pageName}.png`);
  const currentPath = path.join(CURRENT_DIR, viewport, `${pageName}.png`);
  const diffPath = path.join(DIFF_DIR, viewport, `${pageName}-diff.png`);

  // Take current screenshot
  await page.screenshot({
    path: currentPath,
    fullPage: viewport === 'mobile',
    animations: 'disabled'
  });

  // Check if baseline exists
  if (!fs.existsSync(baselinePath)) {
    console.log(`No baseline found for ${pageName} (${viewport}). Creating baseline.`);
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.copyFileSync(currentPath, baselinePath);
    return {
      passed: true,
      diffPercentage: 0,
      currentPath,
      baselinePath
    };
  }

  // Compare screenshots using Playwright's built-in comparison
  const passed = await test.step(`Compare ${pageName} (${viewport})`, async () => {
    try {
      await expect(page).toHaveScreenshot(`${pageName}.png`, {
        maxDiffPixelRatio: maxDiffPixels / 10000,
        threshold: threshold,
        animations: 'disabled'
      });
      return true;
    } catch (e) {
      return false;
    }
  });

  // Calculate diff percentage (simplified)
  const diffPercentage = passed ? 0 : 100;

  return {
    passed,
    diffPercentage,
    diffPath: passed ? undefined : diffPath,
    currentPath,
    baselinePath
  };
}

/**
 * Generate visual comparison report
 */
export function generateVisualReport(results: CompareResult[]): string {
  let report = '# Visual Regression Test Report

';
  report += `Generated: ${new Date().toISOString()}

`;

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  report += `## Summary
`;
  report += `- Total: ${results.length}
`;
  report += `- Passed: ${passed}
`;
  report += `- Failed: ${failed}

`;

  if (failed > 0) {
    report += `## Failed Tests
`;
    report += '| Page | Viewport | Status | Diff |
';
    report += '|------|----------|--------|------|
';

    results.filter(r => !r.passed).forEach(result => {
      const pageName = path.basename(result.currentPath, '.png');
      const viewport = result.currentPath.includes('desktop') ? 'desktop' : 'mobile';
      report += `| ${pageName} | ${viewport} | ❌ Failed | ${result.diffPercentage.toFixed(2)}% |
`;
    });
  }

  return report;
}

/**
 * Update baseline with current screenshots
 */
export async function updateBaselines(viewport: string, pageNames: string[]): Promise<void> {
  for (const pageName of pageNames) {
    const currentPath = path.join(CURRENT_DIR, viewport, `${pageName}.png`);
    const baselinePath = path.join(BASELINE_DIR, viewport, `${pageName}.png`);

    if (fs.existsSync(currentPath)) {
      fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`Updated baseline: ${pageName} (${viewport})`);
    }
  }
}

/**
 * Generate PR comment for visual changes
 */
export function generatePRComment(results: CompareResult[]): string {
  const failed = results.filter(r => !r.passed);

  if (failed.length === 0) {
    return '✅ All visual regression tests passed!';
  }

  let comment = '## ⚠️ Visual Regression Test Results

';
  comment += `${failed.length} visual change(s) detected:

`;

  failed.forEach(result => {
    const pageName = path.basename(result.currentPath, '.png');
    const viewport = result.currentPath.includes('desktop') ? 'Desktop' : 'Mobile';
    comment += `- **${pageName}** (${viewport}): ${result.diffPercentage.toFixed(2)}% difference
`;
  });

  comment += '
### Actions
';
  comment += '- Review the diff images in the workflow artifacts
';
  comment += '- If changes are intentional, run `npm run update-baselines`
';
  comment += '- If changes are unintended, investigate the source
';

  return comment;
}
