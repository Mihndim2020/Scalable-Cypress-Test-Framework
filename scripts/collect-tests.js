#!/usr/bin/env node

/**
 * Test Collection and Tagging System
 *
 * Collects all test files and categorizes them by tags:
 * - @smoke: Critical path tests
 * - @regression: Full functionality tests
 * - @flaky: Known unstable tests
 * - @integration: API/integration tests
 * - @unit: Unit-level tests
 *
 * Usage:
 *   node scripts/collect-tests.js [--output FILE] [--tag TAG]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const config = {
  testPatterns: ['cypress/e2e/**/*.cy.js', 'src/tests/features/**/*.feature'],
  outputFile: process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : 'test-collection.json',
  filterTag: process.argv.includes('--tag')
    ? process.argv[process.argv.indexOf('--tag') + 1]
    : null,
};

// Test metadata
const testCollection = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  byTag: {},
  byType: {},
  tests: [],
};

// Helper functions
function log(message, color = '') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

function getFilesRecursive(dir, pattern) {
  let files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files = files.concat(getFilesRecursive(fullPath, pattern));
    } else if (fullPath.match(pattern)) {
      files.push(fullPath);
    }
  });

  return files;
}

function extractTags(content) {
  const tags = new Set();

  // Match Cypress tags: describe('Test', { tags: ['@smoke'] })
  const cypressTagMatch = content.match(/tags:\s*\[(.*?)\]/g);
  if (cypressTagMatch) {
    cypressTagMatch.forEach((match) => {
      const tagList = match.match(/['"]@[\w-]+['"]/g);
      if (tagList) {
        tagList.forEach((tag) => tags.add(tag.replace(/['"]/g, '')));
      }
    });
  }

  // Match Gherkin tags: @smoke
  const gherkinTagMatch = content.match(/^@[\w-]+/gm);
  if (gherkinTagMatch) {
    gherkinTagMatch.forEach((tag) => tags.add(tag));
  }

  // Match inline tags in test names
  const inlineTagMatch = content.match(/\[@[\w-]+\]/g);
  if (inlineTagMatch) {
    inlineTagMatch.forEach((tag) => tags.add(tag.replace(/[\[\]]/g, '')));
  }

  return Array.from(tags);
}

function detectTestType(filePath, content) {
  // Feature files are BDD
  if (filePath.endsWith('.feature')) {
    return 'bdd';
  }

  // Check for API tests
  if (content.includes('cy.request(') || content.includes('cy.api(')) {
    return 'api';
  }

  // Check for integration tests
  if (content.includes('cy.intercept(') || content.includes('cy.route(')) {
    return 'integration';
  }

  // Default to e2e
  return 'e2e';
}

function estimateDuration(content) {
  // Simple heuristic based on test complexity
  const testCount = (content.match(/it\(/g) || []).length;
  const stepCount = (content.match(/cy\./g) || []).length;

  // Rough estimate: 5 seconds per test + 0.5 seconds per step
  return (testCount * 5 + stepCount * 0.5) * 1000;
}

function calculateHash(filePath) {
  return crypto.createHash('md5').update(filePath).digest('hex');
}

function analyzeTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  const tags = extractTags(content);
  const type = detectTestType(filePath, content);
  const estimatedDuration = estimateDuration(content);
  const hash = calculateHash(relativePath);

  // Count tests
  const testCount = type === 'bdd'
    ? (content.match(/Scenario:/g) || []).length
    : (content.match(/it\(/g) || []).length;

  const test = {
    file: relativePath,
    absolutePath: filePath,
    hash,
    type,
    tags: tags.length > 0 ? tags : ['@untagged'],
    testCount,
    estimatedDuration,
    size: content.length,
  };

  // Update statistics
  testCollection.totalTests += testCount;

  tags.forEach((tag) => {
    if (!testCollection.byTag[tag]) {
      testCollection.byTag[tag] = { count: 0, files: [] };
    }
    testCollection.byTag[tag].count += testCount;
    testCollection.byTag[tag].files.push(relativePath);
  });

  if (!testCollection.byType[type]) {
    testCollection.byType[type] = { count: 0, files: [] };
  }
  testCollection.byType[type].count += testCount;
  testCollection.byType[type].files.push(relativePath);

  return test;
}

function collectTests() {
  log('🔍 Collecting Tests...', 'blue');

  const allFiles = [];

  // Collect from all patterns
  config.testPatterns.forEach((pattern) => {
    const [dir, ...rest] = pattern.split('/');
    const filePattern = rest.join('/').replace('**/', '.*').replace('*', '.*');
    const regex = new RegExp(filePattern);

    const files = getFilesRecursive(dir, regex);
    allFiles.push(...files);
  });

  log(`Found ${allFiles.length} test files`, 'cyan');

  allFiles.forEach((file) => {
    const test = analyzeTestFile(file);

    // Filter by tag if specified
    if (!config.filterTag || test.tags.includes(config.filterTag)) {
      testCollection.tests.push(test);
    }
  });

  // Sort by estimated duration (longest first for better parallelization)
  testCollection.tests.sort((a, b) => b.estimatedDuration - a.estimatedDuration);
}

function printSummary() {
  log('\n' + '='.repeat(60), 'blue');
  log('Test Collection Summary', 'blue');
  log('='.repeat(60), 'blue');

  log(`\n📊 Statistics:`);
  log(`  Total Test Files: ${testCollection.tests.length}`, 'cyan');
  log(`  Total Tests: ${testCollection.totalTests}`, 'cyan');
  log(`  Estimated Duration: ${(testCollection.tests.reduce((sum, t) => sum + t.estimatedDuration, 0) / 1000).toFixed(2)}s`, 'cyan');

  if (Object.keys(testCollection.byTag).length > 0) {
    log(`\n🏷️  Tests by Tag:`, 'blue');
    Object.entries(testCollection.byTag)
      .sort(([, a], [, b]) => b.count - a.count)
      .forEach(([tag, data]) => {
        log(`  ${tag}: ${data.count} tests in ${data.files.length} files`, 'yellow');
      });
  }

  if (Object.keys(testCollection.byType).length > 0) {
    log(`\n📝 Tests by Type:`, 'blue');
    Object.entries(testCollection.byType)
      .sort(([, a], [, b]) => b.count - a.count)
      .forEach(([type, data]) => {
        log(`  ${type}: ${data.count} tests in ${data.files.length} files`, 'green');
      });
  }

  if (config.filterTag) {
    log(`\n🔍 Filtered by tag: ${config.filterTag}`, 'yellow');
  }
}

function saveCollection() {
  const outputPath = path.join(process.cwd(), config.outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(testCollection, null, 2));

  log(`\n✅ Collection saved to: ${outputPath}`, 'green');
}

// Main execution
try {
  collectTests();
  printSummary();
  saveCollection();
  process.exit(0);
} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
}
