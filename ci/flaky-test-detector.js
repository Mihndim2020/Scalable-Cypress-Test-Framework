#!/usr/bin/env node

/**
 * Flaky Test Detector
 * Analyzes test results to detect flaky tests and reports them
 *
 * Usage:
 *   node ci/flaky-test-detector.js [options]
 *
 * Options:
 *   --results-dir <path>    Directory containing test results (default: cypress/results)
 *   --history-size <num>    Number of recent runs to analyze (default: 50)
 *   --threshold <num>       Flakiness threshold 0-1 (default: 0.2 = 20%)
 *   --min-runs <num>        Minimum runs before considering flaky (default: 10)
 *   --output <path>         Output file for flaky tests report (default: flaky-tests.json)
 *   --pr-comment            Post comment to PR (requires GITHUB_TOKEN)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  resultsDir: process.argv.includes('--results-dir')
    ? process.argv[process.argv.indexOf('--results-dir') + 1]
    : 'cypress/results',
  historySize: process.argv.includes('--history-size')
    ? parseInt(process.argv[process.argv.indexOf('--history-size') + 1])
    : 50,
  threshold: process.argv.includes('--threshold')
    ? parseFloat(process.argv[process.argv.indexOf('--threshold') + 1])
    : 0.2,
  minRuns: process.argv.includes('--min-runs')
    ? parseInt(process.argv[process.argv.indexOf('--min-runs') + 1])
    : 10,
  output: process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : 'flaky-tests.json',
  prComment: process.argv.includes('--pr-comment'),
};

/**
 * Parse test results from JSON files
 */
function parseTestResults(resultsDir) {
  const results = [];

  if (!fs.existsSync(resultsDir)) {
    console.warn(`Results directory not found: ${resultsDir}`);
    return results;
  }

  const files = fs.readdirSync(resultsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(-config.historySize); // Get most recent files

  files.forEach(file => {
    try {
      const filePath = path.join(resultsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Handle different result formats (mochawesome, junit, etc.)
      if (data.results && Array.isArray(data.results)) {
        results.push(...parseResults(data.results, file));
      } else if (data.tests && Array.isArray(data.tests)) {
        results.push(...parseResults(data.tests, file));
      }
    } catch (error) {
      console.warn(`Failed to parse ${file}:`, error.message);
    }
  });

  return results;
}

/**
 * Parse individual test results
 */
function parseResults(tests, fileName) {
  const parsed = [];
  const timestamp = extractTimestamp(fileName);

  tests.forEach(test => {
    // Handle nested suites
    if (test.suites && Array.isArray(test.suites)) {
      test.suites.forEach(suite => {
        if (suite.tests) {
          parsed.push(...parseResults(suite.tests, fileName));
        }
      });
    }

    // Handle test cases
    if (test.tests && Array.isArray(test.tests)) {
      parsed.push(...parseResults(test.tests, fileName));
    }

    // Handle individual test
    if (test.title) {
      parsed.push({
        name: test.fullTitle || test.title,
        suite: test.parent || test.suite || '',
        status: test.state || test.status || 'unknown',
        duration: test.duration || 0,
        timestamp,
        fileName,
      });
    }
  });

  return parsed;
}

/**
 * Extract timestamp from filename
 */
function extractTimestamp(fileName) {
  const match = fileName.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
  return match ? match[1] : new Date().toISOString();
}

/**
 * Analyze test results for flakiness
 */
function analyzeFlakiness(results) {
  const testStats = {};

  // Group results by test name
  results.forEach(result => {
    if (!testStats[result.name]) {
      testStats[result.name] = {
        name: result.name,
        suite: result.suite,
        runs: [],
        passes: 0,
        failures: 0,
        totalRuns: 0,
      };
    }

    const stats = testStats[result.name];
    stats.runs.push(result);
    stats.totalRuns++;

    if (result.status === 'passed') {
      stats.passes++;
    } else if (result.status === 'failed') {
      stats.failures++;
    }
  });

  // Calculate flakiness scores
  const flakyTests = [];

  Object.values(testStats).forEach(stats => {
    if (stats.totalRuns < config.minRuns) {
      return; // Not enough data
    }

    const flakyRate = stats.failures / stats.totalRuns;

    if (flakyRate > 0 && flakyRate < 1 && flakyRate >= config.threshold) {
      flakyTests.push({
        ...stats,
        flakyRate: parseFloat((flakyRate * 100).toFixed(2)),
        severity: getSeverity(flakyRate),
      });
    }
  });

  // Sort by flakiness rate
  flakyTests.sort((a, b) => b.flakyRate - a.flakyRate);

  return flakyTests;
}

/**
 * Get severity level based on flaky rate
 */
function getSeverity(rate) {
  if (rate >= 0.5) return 'critical';
  if (rate >= 0.3) return 'high';
  if (rate >= 0.2) return 'medium';
  return 'low';
}

/**
 * Generate report
 */
function generateReport(flakyTests) {
  const report = {
    timestamp: new Date().toISOString(),
    config: {
      threshold: config.threshold,
      minRuns: config.minRuns,
      historySize: config.historySize,
    },
    summary: {
      totalFlakyTests: flakyTests.length,
      critical: flakyTests.filter(t => t.severity === 'critical').length,
      high: flakyTests.filter(t => t.severity === 'high').length,
      medium: flakyTests.filter(t => t.severity === 'medium').length,
      low: flakyTests.filter(t => t.severity === 'low').length,
    },
    tests: flakyTests,
  };

  return report;
}

/**
 * Generate PR comment markdown
 */
function generatePRComment(report) {
  if (report.summary.totalFlakyTests === 0) {
    return '✅ No flaky tests detected!';
  }

  let comment = '⚠️ **Flaky Tests Detected**\n\n';
  comment += `Found ${report.summary.totalFlakyTests} flaky test(s) `;
  comment += `(threshold: ${(config.threshold * 100).toFixed(0)}%)\n\n`;

  // Summary table
  comment += '| Severity | Count |\n';
  comment += '|----------|-------|\n';
  comment += `| 🔴 Critical | ${report.summary.critical} |\n`;
  comment += `| 🟠 High | ${report.summary.high} |\n`;
  comment += `| 🟡 Medium | ${report.summary.medium} |\n`;
  comment += `| 🟢 Low | ${report.summary.low} |\n\n`;

  // Top 10 flaky tests
  comment += '### Top Flaky Tests\n\n';
  comment += '| Test | Suite | Flaky Rate | Runs | Severity |\n';
  comment += '|------|-------|------------|------|----------|\n';

  report.tests.slice(0, 10).forEach(test => {
    const icon = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[test.severity];

    comment += `| ${test.name} | ${test.suite} | ${test.flakyRate}% | ${test.totalRuns} | ${icon} ${test.severity} |\n`;
  });

  comment += '\n---\n';
  comment += `*Analyzed ${config.historySize} recent test runs*\n`;

  return comment;
}

/**
 * Post comment to GitHub PR
 */
async function postPRComment(comment) {
  if (!process.env.GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN not found. Cannot post PR comment.');
    return;
  }

  if (!process.env.GITHUB_REPOSITORY || !process.env.GITHUB_PR_NUMBER) {
    console.error('GitHub environment variables not found.');
    return;
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const prNumber = process.env.GITHUB_PR_NUMBER;

  try {
    const { Octokit } = require('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment,
    });

    console.log('✅ Posted flaky test report to PR');
  } catch (error) {
    console.error('Failed to post PR comment:', error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Analyzing test results for flakiness...\n');

  // Parse results
  const results = parseTestResults(config.resultsDir);
  console.log(`Parsed ${results.length} test results from ${config.resultsDir}`);

  if (results.length === 0) {
    console.log('No test results found.');
    return;
  }

  // Analyze flakiness
  const flakyTests = analyzeFlakiness(results);
  console.log(`Found ${flakyTests.length} flaky tests\n`);

  // Generate report
  const report = generateReport(flakyTests);

  // Save report
  fs.writeFileSync(config.output, JSON.stringify(report, null, 2));
  console.log(`📝 Report saved to ${config.output}`);

  // Display summary
  console.log('\n📊 Summary:');
  console.log(`  Total flaky tests: ${report.summary.totalFlakyTests}`);
  console.log(`  🔴 Critical: ${report.summary.critical}`);
  console.log(`  🟠 High: ${report.summary.high}`);
  console.log(`  🟡 Medium: ${report.summary.medium}`);
  console.log(`  🟢 Low: ${report.summary.low}`);

  // Display top flaky tests
  if (flakyTests.length > 0) {
    console.log('\n🔥 Top 5 Flaky Tests:');
    flakyTests.slice(0, 5).forEach((test, i) => {
      console.log(`  ${i + 1}. ${test.name}`);
      console.log(`     Flaky Rate: ${test.flakyRate}% (${test.failures}/${test.totalRuns} runs)`);
      console.log(`     Severity: ${test.severity}`);
    });
  }

  // Post to PR if requested
  if (config.prComment) {
    const comment = generatePRComment(report);
    postPRComment(comment);
  }

  // Exit with error if critical flaky tests found
  if (report.summary.critical > 0) {
    console.error('\n❌ Critical flaky tests detected!');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  parseTestResults,
  analyzeFlakiness,
  generateReport,
  generatePRComment,
};
