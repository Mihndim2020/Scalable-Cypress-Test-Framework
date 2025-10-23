#!/usr/bin/env node

/**
 * Selective Test Runner with Git Diff Detection
 *
 * Intelligently runs only tests affected by code changes for fast PR feedback.
 *
 * Features:
 * - Detects changed files using git diff
 * - Maps changed files to affected test files
 * - Supports custom mapping rules (e.g., src/auth/** -> tests/auth/**)
 * - Falls back to full suite if mapping is uncertain
 * - Outputs spec list compatible with Cypress --spec flag
 *
 * Usage:
 *   node scripts/selective-runner.js
 *   node scripts/selective-runner.js --base main
 *   node scripts/selective-runner.js --base origin/main --tag @smoke
 *   node scripts/selective-runner.js --changed-files "src/auth/login.js,src/utils/api.js"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  baseBranch: process.argv.includes('--base')
    ? process.argv[process.argv.indexOf('--base') + 1]
    : 'origin/main',
  changedFiles: process.argv.includes('--changed-files')
    ? process.argv[process.argv.indexOf('--changed-files') + 1].split(',')
    : null,
  filterTag: process.argv.includes('--tag')
    ? process.argv[process.argv.indexOf('--tag') + 1]
    : null,
  outputFile: process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : null,
  collectionFile: 'test-collection.json',
  mappingFile: process.argv.includes('--mapping')
    ? process.argv[process.argv.indexOf('--mapping') + 1]
    : 'test-mapping.json',
  runAll: process.argv.includes('--run-all'),
  verbose: process.argv.includes('--verbose'),
};

// Color utilities
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
};

function log(message, color = '') {
  console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

function logVerbose(message, color = '') {
  if (config.verbose) {
    log(`  ${message}`, color);
  }
}

/**
 * Get changed files from git diff
 */
function getChangedFiles() {
  if (config.changedFiles) {
    log('📝 Using provided changed files', 'cyan');
    return config.changedFiles;
  }

  try {
    log(`🔍 Detecting changed files (comparing to ${config.baseBranch})...`, 'blue');

    // Ensure we have the latest remote info
    try {
      execSync('git fetch origin --quiet', { stdio: 'pipe' });
    } catch (e) {
      logVerbose('Note: Could not fetch from origin', 'yellow');
    }

    // Get changed files
    const diffCommand = `git diff --name-only ${config.baseBranch}...HEAD`;
    const output = execSync(diffCommand, { encoding: 'utf8' });

    const files = output
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    log(`📊 Found ${files.length} changed files`, 'cyan');

    if (config.verbose && files.length > 0) {
      log('\nChanged files:', 'blue');
      files.forEach((f) => logVerbose(f, 'cyan'));
    }

    return files;
  } catch (error) {
    log(`⚠️  Warning: Could not get changed files from git: ${error.message}`, 'yellow');
    log('Falling back to running all tests', 'yellow');
    return [];
  }
}

/**
 * Load test collection
 */
function loadTestCollection() {
  const collectionPath = path.join(process.cwd(), config.collectionFile);

  if (!fs.existsSync(collectionPath)) {
    log(`⚠️  Test collection not found at ${collectionPath}`, 'yellow');
    log('Run: node scripts/collect-tests.js', 'yellow');
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
  } catch (error) {
    log(`⚠️  Error loading test collection: ${error.message}`, 'yellow');
    return null;
  }
}

/**
 * Load custom test mapping rules
 *
 * Example mapping file (test-mapping.json):
 * {
 *   "rules": [
 *     {
 *       "source": "src/auth/**",
 *       "tests": ["cypress/e2e/auth/**", "cypress/e2e/login.cy.js"]
 *     },
 *     {
 *       "source": "src/api/**",
 *       "tests": ["cypress/e2e/api/**"]
 *     }
 *   ],
 *   "alwaysRun": ["cypress/e2e/smoke/**"]
 * }
 */
function loadMappingRules() {
  const mappingPath = path.join(process.cwd(), config.mappingFile);

  if (!fs.existsSync(mappingPath)) {
    logVerbose('No custom mapping file found, using default rules', 'yellow');
    return null;
  }

  try {
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    log('✅ Loaded custom test mapping rules', 'green');
    return mapping;
  } catch (error) {
    log(`⚠️  Error loading mapping file: ${error.message}`, 'yellow');
    return null;
  }
}

/**
 * Default mapping rules based on common patterns
 */
function getDefaultMappingRules() {
  return {
    rules: [
      // Direct test file changes
      {
        pattern: /^(cypress|src\/tests)\/.+\.(cy\.js|feature)$/,
        mapper: (file) => [file],
        description: 'Direct test file changes',
      },
      // Page object changes -> related E2E tests
      {
        pattern: /^src\/pages\/(.+)\.js$/,
        mapper: (file, match) => {
          const pageName = match[1];
          return [`cypress/e2e/**/*${pageName}*.cy.js`];
        },
        description: 'Page object changes',
      },
      // Fixture changes -> tests using that fixture
      {
        pattern: /^(cypress\/fixtures|src\/fixtures)\/(.+)\.json$/,
        mapper: (file, match) => {
          const fixtureName = match[2];
          // This would require analyzing test files to see which use this fixture
          return [`cypress/e2e/**/*.cy.js`]; // Conservative: run all for now
        },
        description: 'Fixture changes',
      },
      // Support/utility changes -> run all (too broad to map)
      {
        pattern: /^(cypress\/support|src\/utils)\/.+\.js$/,
        mapper: () => ['@all'],
        description: 'Support/utility changes (run all)',
      },
      // Config changes -> run all
      {
        pattern: /^(cypress\.config\.js|\.env.*|package\.json)$/,
        mapper: () => ['@all'],
        description: 'Configuration changes (run all)',
      },
    ],
    alwaysRun: ['@smoke'], // Always run smoke tests
  };
}

/**
 * Match file to mapping rule
 */
function matchFileToRule(file, rules) {
  for (const rule of rules) {
    const match = file.match(rule.pattern);
    if (match) {
      return { rule, match };
    }
  }
  return null;
}

/**
 * Map changed files to affected tests
 */
function mapChangedFilesToTests(changedFiles, customMapping) {
  const defaultRules = getDefaultMappingRules();
  const mappingRules = customMapping?.rules || defaultRules.rules;
  const alwaysRun = customMapping?.alwaysRun || defaultRules.alwaysRun;

  const affectedTests = new Set();
  const unmappedFiles = [];
  let runAll = false;

  log('\n🗺️  Mapping changed files to tests...', 'blue');

  changedFiles.forEach((file) => {
    const ruleMatch = matchFileToRule(file, mappingRules);

    if (ruleMatch) {
      const { rule, match } = ruleMatch;
      const tests = rule.mapper(file, match);

      logVerbose(`${file} -> ${rule.description}`, 'cyan');

      tests.forEach((test) => {
        if (test === '@all') {
          runAll = true;
          log(`  ⚠️  ${file} requires running all tests`, 'yellow');
        } else {
          affectedTests.add(test);
          logVerbose(`    + ${test}`, 'green');
        }
      });
    } else {
      unmappedFiles.push(file);
      logVerbose(`${file} -> no mapping (will be conservative)`, 'yellow');
    }
  });

  // Add always-run tests
  if (alwaysRun && alwaysRun.length > 0) {
    log('\n🎯 Adding always-run tests...', 'blue');
    alwaysRun.forEach((test) => {
      affectedTests.add(test);
      logVerbose(`  + ${test}`, 'green');
    });
  }

  // If we have unmapped files, be conservative
  if (unmappedFiles.length > 0) {
    log(`\n⚠️  ${unmappedFiles.length} files have no mapping rules`, 'yellow');
    log('Being conservative: will run all tests', 'yellow');
    runAll = true;
  }

  return { affectedTests: Array.from(affectedTests), runAll };
}

/**
 * Expand glob patterns to actual test files
 */
function expandGlobPatterns(patterns, testCollection) {
  if (!testCollection) {
    return patterns;
  }

  const allTests = testCollection.tests;
  const expandedTests = new Set();

  patterns.forEach((pattern) => {
    // Check if it's a tag
    if (pattern.startsWith('@')) {
      const testsWithTag = allTests.filter((test) =>
        test.tags.includes(pattern)
      );
      testsWithTag.forEach((test) => expandedTests.add(test.file));
      logVerbose(`Tag ${pattern} matched ${testsWithTag.length} tests`, 'cyan');
      return;
    }

    // Check for glob patterns
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$'
      );

      const matchedTests = allTests.filter((test) => regex.test(test.file));
      matchedTests.forEach((test) => expandedTests.add(test.file));
      logVerbose(`Pattern ${pattern} matched ${matchedTests.length} tests`, 'cyan');
    } else {
      // Direct file reference
      expandedTests.add(pattern);
    }
  });

  return Array.from(expandedTests);
}

/**
 * Filter tests by tag
 */
function filterByTag(tests, tag, testCollection) {
  if (!tag || !testCollection) {
    return tests;
  }

  const allTests = testCollection.tests;
  const testFiles = new Set(tests);

  const filtered = allTests
    .filter((test) => testFiles.has(test.file) && test.tags.includes(tag))
    .map((test) => test.file);

  log(`\n🏷️  Filtered by tag ${tag}: ${filtered.length} tests`, 'cyan');
  return filtered;
}

/**
 * Main selective runner logic
 */
function selectiveRunner() {
  log('🎯 Selective Test Runner', 'blue');
  log('='.repeat(60), 'blue');

  // Check if we should run all tests
  if (config.runAll) {
    log('\n▶️  Running ALL tests (--run-all flag)', 'green');
    return '@all';
  }

  // Get changed files
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    log('\n⚠️  No changed files detected', 'yellow');
    log('Falling back to smoke tests', 'yellow');
    return '@smoke';
  }

  // Load test collection
  const testCollection = loadTestCollection();

  // Load custom mapping
  const customMapping = loadMappingRules();

  // Map changed files to affected tests
  const { affectedTests, runAll } = mapChangedFilesToTests(
    changedFiles,
    customMapping
  );

  // If we need to run all, return early
  if (runAll) {
    log('\n▶️  Running ALL tests (required by changes)', 'green');
    return '@all';
  }

  if (affectedTests.length === 0) {
    log('\n⚠️  No affected tests identified', 'yellow');
    log('Running smoke tests as fallback', 'yellow');
    return '@smoke';
  }

  // Expand glob patterns
  log('\n🔍 Expanding patterns to test files...', 'blue');
  let selectedTests = expandGlobPatterns(affectedTests, testCollection);

  // Filter by tag if specified
  if (config.filterTag) {
    selectedTests = filterByTag(selectedTests, config.filterTag, testCollection);
  }

  log(`\n✅ Selected ${selectedTests.length} tests to run`, 'green');

  return selectedTests;
}

/**
 * Format output
 */
function formatOutput(selectedTests) {
  if (selectedTests === '@all') {
    return 'ALL';
  }

  if (selectedTests === '@smoke') {
    return 'SMOKE';
  }

  return selectedTests.join(',');
}

/**
 * Print summary
 */
function printSummary(selectedTests) {
  log('\n' + '='.repeat(60), 'blue');
  log('Selective Runner Summary', 'blue');
  log('='.repeat(60), 'blue');

  if (selectedTests === '@all') {
    log('\n🔄 Mode: Run ALL tests', 'magenta');
    return;
  }

  if (selectedTests === '@smoke') {
    log('\n💨 Mode: Run SMOKE tests', 'magenta');
    return;
  }

  log(`\n📦 Selected ${selectedTests.length} test file(s)`, 'green');

  if (config.verbose && Array.isArray(selectedTests) && selectedTests.length > 0) {
    log('\n📄 Test files to run:', 'blue');
    selectedTests.forEach((test) => {
      log(`  ${test}`, 'cyan');
    });
  }
}

/**
 * Save output
 */
function saveOutput(selectedTests) {
  const output = formatOutput(selectedTests);

  if (config.outputFile) {
    const outputPath = path.join(process.cwd(), config.outputFile);
    fs.writeFileSync(outputPath, output);
    log(`\n✅ Output saved to: ${outputPath}`, 'green');
  }

  // Output to stdout for piping
  console.log('\n--- SELECTIVE SPEC LIST START ---');
  console.log(output);
  console.log('--- SELECTIVE SPEC LIST END ---\n');
}

// Main execution
try {
  const selectedTests = selectiveRunner();
  printSummary(selectedTests);
  saveOutput(selectedTests);

  process.exit(0);
} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
}
