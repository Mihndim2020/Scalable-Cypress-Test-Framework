#!/usr/bin/env node

/**
 * Test Metrics Generator
 *
 * This script analyzes test results and generates comprehensive metrics including:
 * - Test execution duration
 * - Pass/fail rates
 * - Retry statistics
 * - Environment tags
 * - Browser statistics
 * - Flaky test detection
 *
 * Usage:
 *   node scripts/generate-metrics.js [--input DIR] [--output FILE]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  inputDir: process.argv.includes('--input')
    ? process.argv[process.argv.indexOf('--input') + 1]
    : 'cypress/results',
  metadataDir: 'test-metadata',
  outputFile: process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : 'test-metrics.json',
  timestamp: new Date().toISOString(),
};

console.log('📊 Generating Test Metrics...');
console.log(`Input Directory: ${config.inputDir}`);
console.log(`Output File: ${config.outputFile}`);
console.log('');

// Helper functions
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
    return null;
  }
}

function getAllFiles(dir, extension = '.json') {
  if (!fs.existsSync(dir)) {
    console.warn(`Warning: Directory ${dir} does not exist`);
    return [];
  }

  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, extension));
    } else if (item.endsWith(extension)) {
      files.push(fullPath);
    }
  });

  return files;
}

function calculatePercentage(value, total) {
  return total > 0 ? ((value / total) * 100).toFixed(2) : 0;
}

// Collect test results
function collectTestResults() {
  const files = getAllFiles(config.inputDir);
  const results = [];

  files.forEach((file) => {
    const data = readJsonFile(file);
    if (data && data.stats) {
      results.push({
        file: path.basename(file),
        ...data,
      });
    }
  });

  return results;
}

// Collect metadata
function collectMetadata() {
  if (!fs.existsSync(config.metadataDir)) {
    return [];
  }

  const files = getAllFiles(config.metadataDir);
  return files.map((file) => readJsonFile(file)).filter(Boolean);
}

// Analyze results
function analyzeResults(results) {
  const analysis = {
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      pending: 0,
      skipped: 0,
      passRate: 0,
      duration: 0,
      retries: 0,
    },
    browsers: {},
    environments: {},
    suites: [],
    flakyTests: [],
    slowTests: [],
    failedTests: [],
  };

  results.forEach((result) => {
    if (!result.stats) return;

    const stats = result.stats;

    // Summary statistics
    analysis.summary.totalTests += stats.tests || 0;
    analysis.summary.passed += stats.passes || 0;
    analysis.summary.failed += stats.failures || 0;
    analysis.summary.pending += stats.pending || 0;
    analysis.summary.skipped += stats.skipped || 0;
    analysis.summary.duration += stats.duration || 0;

    // Extract browser info from filename or results
    const browser = result.config?.browser || 'unknown';
    if (!analysis.browsers[browser]) {
      analysis.browsers[browser] = { tests: 0, passed: 0, failed: 0 };
    }
    analysis.browsers[browser].tests += stats.tests || 0;
    analysis.browsers[browser].passed += stats.passes || 0;
    analysis.browsers[browser].failed += stats.failures || 0;

    // Extract environment info
    const env = result.config?.env?.environment || 'unknown';
    if (!analysis.environments[env]) {
      analysis.environments[env] = { tests: 0, passed: 0, failed: 0 };
    }
    analysis.environments[env].tests += stats.tests || 0;
    analysis.environments[env].passed += stats.passes || 0;
    analysis.environments[env].failed += stats.failures || 0;

    // Suite information
    if (result.results) {
      result.results.forEach((suite) => {
        analysis.suites.push({
          title: suite.title || suite.fullTitle,
          tests: suite.tests?.length || 0,
          passed: suite.tests?.filter((t) => t.pass).length || 0,
          failed: suite.tests?.filter((t) => t.fail).length || 0,
          duration: suite.duration || 0,
        });

        // Identify failed tests
        suite.tests?.forEach((test) => {
          if (test.fail) {
            analysis.failedTests.push({
              title: test.title,
              suite: suite.title,
              error: test.err?.message || 'Unknown error',
              duration: test.duration,
            });
          }

          // Identify slow tests (> 30 seconds)
          if (test.duration > 30000) {
            analysis.slowTests.push({
              title: test.title,
              suite: suite.title,
              duration: test.duration,
            });
          }
        });
      });
    }
  });

  // Calculate pass rate
  analysis.summary.passRate = calculatePercentage(
    analysis.summary.passed,
    analysis.summary.totalTests
  );

  // Sort slow tests
  analysis.slowTests.sort((a, b) => b.duration - a.duration);
  analysis.slowTests = analysis.slowTests.slice(0, 10); // Top 10

  return analysis;
}

// Detect flaky tests
function detectFlakyTests(results) {
  const testRuns = {};

  results.forEach((result) => {
    if (!result.results) return;

    result.results.forEach((suite) => {
      suite.tests?.forEach((test) => {
        const key = `${suite.title}::${test.title}`;

        if (!testRuns[key]) {
          testRuns[key] = {
            title: test.title,
            suite: suite.title,
            runs: [],
            passed: 0,
            failed: 0,
          };
        }

        testRuns[key].runs.push({
          passed: test.pass || false,
          duration: test.duration,
          timestamp: result.stats?.end || new Date().toISOString(),
        });

        if (test.pass) {
          testRuns[key].passed++;
        } else {
          testRuns[key].failed++;
        }
      });
    });
  });

  // Identify flaky tests (tests with both passes and failures)
  const flakyTests = Object.values(testRuns)
    .filter((test) => test.passed > 0 && test.failed > 0 && test.runs.length >= 2)
    .map((test) => ({
      ...test,
      flakyRate: calculatePercentage(test.failed, test.runs.length),
      totalRuns: test.runs.length,
    }))
    .sort((a, b) => b.flakyRate - a.flakyRate);

  return flakyTests;
}

// Generate metrics
function generateMetrics() {
  const results = collectTestResults();
  const metadata = collectMetadata();

  if (results.length === 0) {
    console.warn('⚠️  No test results found');
    return null;
  }

  console.log(`✓ Found ${results.length} test result file(s)`);
  console.log(`✓ Found ${metadata.length} metadata file(s)`);

  const analysis = analyzeResults(results);
  const flakyTests = detectFlakyTests(results);

  const metrics = {
    generated: config.timestamp,
    summary: analysis.summary,
    browsers: analysis.browsers,
    environments: analysis.environments,
    suites: analysis.suites,
    flakyTests,
    slowTests: analysis.slowTests,
    failedTests: analysis.failedTests,
    metadata: metadata.slice(0, 5), // Last 5 metadata entries
    raw: {
      totalResultFiles: results.length,
      totalMetadataFiles: metadata.length,
    },
  };

  return metrics;
}

// Save metrics
function saveMetrics(metrics) {
  if (!metrics) {
    console.error('❌ No metrics to save');
    process.exit(1);
  }

  const outputPath = path.join(process.cwd(), config.outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));

  console.log('');
  console.log('✅ Metrics generated successfully!');
  console.log(`📄 Output: ${outputPath}`);
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Total Tests: ${metrics.summary.totalTests}`);
  console.log(`   Passed: ${metrics.summary.passed} (${metrics.summary.passRate}%)`);
  console.log(`   Failed: ${metrics.summary.failed}`);
  console.log(`   Duration: ${(metrics.summary.duration / 1000).toFixed(2)}s`);
  console.log(`   Flaky Tests: ${metrics.flakyTests.length}`);
  console.log(`   Slow Tests: ${metrics.slowTests.length}`);
}

// Main execution
try {
  const metrics = generateMetrics();
  saveMetrics(metrics);
} catch (error) {
  console.error('❌ Error generating metrics:', error);
  process.exit(1);
}
