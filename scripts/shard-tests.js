#!/usr/bin/env node

/**
 * Hash-Based Test Sharding
 *
 * Distributes tests across multiple parallel runners for optimal execution.
 *
 * Features:
 * - Deterministic hash-based distribution (same shard gets same tests)
 * - Duration-balanced sharding (distributes long-running tests evenly)
 * - Tag-based filtering (run only @smoke, @regression, etc.)
 * - Outputs spec list compatible with Cypress --spec flag
 *
 * Usage:
 *   node scripts/shard-tests.js --total 4 --index 1
 *   node scripts/shard-tests.js --total 4 --index 1 --tag @smoke
 *   node scripts/shard-tests.js --total 4 --index 1 --output specs.txt
 */

const fs = require('fs');
const path = require('path');

// Configuration from command-line arguments
const config = {
  collectionFile: process.argv.includes('--collection')
    ? process.argv[process.argv.indexOf('--collection') + 1]
    : 'test-collection.json',
  totalShards: process.argv.includes('--total')
    ? parseInt(process.argv[process.argv.indexOf('--total') + 1], 10)
    : 1,
  shardIndex: process.argv.includes('--index')
    ? parseInt(process.argv[process.argv.indexOf('--index') + 1], 10)
    : 0,
  filterTag: process.argv.includes('--tag')
    ? process.argv[process.argv.indexOf('--tag') + 1]
    : null,
  outputFile: process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : null,
  balanceByDuration: !process.argv.includes('--no-balance'),
  verbose: process.argv.includes('--verbose'),
};

// Color utilities
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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
 * Load test collection from JSON file
 */
function loadTestCollection() {
  const collectionPath = path.join(process.cwd(), config.collectionFile);

  if (!fs.existsSync(collectionPath)) {
    log(`❌ Error: Test collection not found at ${collectionPath}`, 'red');
    log(`Run 'node scripts/collect-tests.js' first to generate the collection.`, 'yellow');
    process.exit(1);
  }

  try {
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    return collection;
  } catch (error) {
    log(`❌ Error parsing test collection: ${error.message}`, 'red');
    process.exit(1);
  }
}

/**
 * Filter tests by tag
 */
function filterTestsByTag(tests, tag) {
  if (!tag) return tests;

  return tests.filter((test) => test.tags.includes(tag));
}

/**
 * Simple hash function for deterministic distribution
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Hash-based sharding (simple modulo distribution)
 */
function hashBasedSharding(tests, totalShards, shardIndex) {
  return tests.filter((test) => {
    const hash = hashCode(test.file);
    return hash % totalShards === shardIndex;
  });
}

/**
 * Duration-balanced sharding using round-robin with bins
 *
 * Distributes tests to balance total duration across shards
 */
function durationBalancedSharding(tests, totalShards, shardIndex) {
  // Sort tests by estimated duration (longest first)
  const sortedTests = [...tests].sort(
    (a, b) => b.estimatedDuration - a.estimatedDuration
  );

  // Create bins for each shard
  const bins = Array.from({ length: totalShards }, () => ({
    tests: [],
    totalDuration: 0,
  }));

  // Distribute tests to bins (greedy algorithm - assign to bin with least duration)
  sortedTests.forEach((test) => {
    // Find bin with minimum duration
    const minBin = bins.reduce((min, bin, idx) =>
      bin.totalDuration < bins[min].totalDuration ? idx : min
    , 0);

    bins[minBin].tests.push(test);
    bins[minBin].totalDuration += test.estimatedDuration;
  });

  logVerbose('Duration distribution across shards:', 'blue');
  bins.forEach((bin, idx) => {
    const duration = (bin.totalDuration / 1000).toFixed(2);
    logVerbose(`  Shard ${idx}: ${bin.tests.length} tests, ~${duration}s`, 'cyan');
  });

  return bins[shardIndex].tests;
}

/**
 * Main sharding logic
 */
function shardTests() {
  log('🔀 Sharding Tests...', 'blue');
  log(`  Total Shards: ${config.totalShards}`, 'cyan');
  log(`  Current Shard: ${config.shardIndex}`, 'cyan');
  if (config.filterTag) {
    log(`  Filter Tag: ${config.filterTag}`, 'cyan');
  }

  // Validate inputs
  if (config.shardIndex < 0 || config.shardIndex >= config.totalShards) {
    log(`❌ Error: Shard index must be between 0 and ${config.totalShards - 1}`, 'red');
    process.exit(1);
  }

  // Load collection
  const collection = loadTestCollection();
  let tests = collection.tests;

  log(`\n📊 Total tests in collection: ${tests.length}`, 'cyan');

  // Filter by tag if specified
  if (config.filterTag) {
    tests = filterTestsByTag(tests, config.filterTag);
    log(`📊 Tests after filtering by ${config.filterTag}: ${tests.length}`, 'cyan');
  }

  if (tests.length === 0) {
    log('⚠️  No tests found matching criteria', 'yellow');
    return [];
  }

  // Apply sharding strategy
  let shardedTests;
  if (config.balanceByDuration) {
    logVerbose('\n🎯 Using duration-balanced sharding...', 'blue');
    shardedTests = durationBalancedSharding(tests, config.totalShards, config.shardIndex);
  } else {
    logVerbose('\n🎯 Using hash-based sharding...', 'blue');
    shardedTests = hashBasedSharding(tests, config.totalShards, config.shardIndex);
  }

  return shardedTests;
}

/**
 * Format output for Cypress --spec flag
 */
function formatSpecList(tests) {
  return tests.map((test) => test.file).join(',');
}

/**
 * Print summary
 */
function printSummary(shardedTests) {
  log('\n' + '='.repeat(60), 'blue');
  log(`Shard ${config.shardIndex} Summary`, 'blue');
  log('='.repeat(60), 'blue');

  log(`\n📦 Tests in this shard: ${shardedTests.length}`, 'green');

  if (shardedTests.length > 0) {
    const totalDuration = shardedTests.reduce((sum, t) => sum + t.estimatedDuration, 0);
    log(`⏱️  Estimated duration: ${(totalDuration / 1000).toFixed(2)}s`, 'cyan');

    // Group by type
    const byType = {};
    shardedTests.forEach((test) => {
      byType[test.type] = (byType[test.type] || 0) + 1;
    });

    log(`\n📝 Tests by type:`, 'blue');
    Object.entries(byType).forEach(([type, count]) => {
      log(`  ${type}: ${count}`, 'yellow');
    });

    // Group by tag
    const byTag = {};
    shardedTests.forEach((test) => {
      test.tags.forEach((tag) => {
        byTag[tag] = (byTag[tag] || 0) + 1;
      });
    });

    if (Object.keys(byTag).length > 0) {
      log(`\n🏷️  Tests by tag:`, 'blue');
      Object.entries(byTag)
        .sort(([, a], [, b]) => b - a)
        .forEach(([tag, count]) => {
          log(`  ${tag}: ${count}`, 'yellow');
        });
    }

    if (config.verbose) {
      log(`\n📄 Test files:`, 'blue');
      shardedTests.forEach((test) => {
        log(`  ${test.file}`, 'cyan');
      });
    }
  }
}

/**
 * Save output
 */
function saveOutput(shardedTests) {
  const specList = formatSpecList(shardedTests);

  if (config.outputFile) {
    const outputPath = path.join(process.cwd(), config.outputFile);
    fs.writeFileSync(outputPath, specList);
    log(`\n✅ Spec list saved to: ${outputPath}`, 'green');
  }

  // Always output to stdout for piping
  console.log('\n--- SPEC LIST START ---');
  console.log(specList);
  console.log('--- SPEC LIST END ---\n');

  // Also output as JSON for programmatic use
  if (config.verbose) {
    const jsonOutput = {
      shard: config.shardIndex,
      totalShards: config.totalShards,
      testCount: shardedTests.length,
      estimatedDuration: shardedTests.reduce((sum, t) => sum + t.estimatedDuration, 0),
      specs: shardedTests.map((t) => t.file),
    };

    const jsonPath = path.join(
      process.cwd(),
      `shard-${config.shardIndex}-manifest.json`
    );
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
    log(`✅ Shard manifest saved to: ${jsonPath}`, 'green');
  }
}

// Main execution
try {
  const shardedTests = shardTests();
  printSummary(shardedTests);
  saveOutput(shardedTests);

  if (shardedTests.length === 0) {
    log('\n⚠️  Warning: No tests in this shard', 'yellow');
    process.exit(0);
  }

  process.exit(0);
} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
}
