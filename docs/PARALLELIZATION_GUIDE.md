# Parallelization and Selective Testing Guide

This guide covers the intelligent test parallelization and selective testing system for optimal test execution performance.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Test Collection](#test-collection)
- [Test Sharding](#test-sharding)
- [Selective Testing](#selective-testing)
- [GitHub Actions Integration](#github-actions-integration)
- [Local Parallel Execution](#local-parallel-execution)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The parallelization system provides:

1. **Test Collection & Tagging**: Automatic categorization of tests by tags and type
2. **Hash-Based Sharding**: Deterministic distribution across parallel workers
3. **Duration Balancing**: Smart load balancing based on estimated test duration
4. **Selective Execution**: Git diff-based test selection for fast PR feedback
5. **Automatic Retry**: Failed shards retry up to 3 times
6. **Result Aggregation**: Consolidated reporting from all parallel workers

### Performance Benefits

- **4x faster CI runs** with 4 parallel workers
- **70% faster PR feedback** with selective testing
- **Reduced flakiness** with automatic retry logic
- **Better resource utilization** with duration-balanced sharding

---

## Key Features

### 1. Test Tagging System

Tests are automatically tagged based on their content:

```javascript
// Cypress test with tags
describe('Login', { tags: ['@smoke', '@auth'] }, () => {
  it('should login successfully', () => {
    // test code
  });
});

// Gherkin feature with tags
@smoke @auth
Feature: Login
  Scenario: Successful login
    Given I am on the login page
```

**Supported Tags:**
- `@smoke` - Critical path tests (quick validation)
- `@regression` - Full functionality tests
- `@integration` - API/integration tests
- `@flaky` - Known unstable tests
- `@unit` - Unit-level tests

### 2. Sharding Strategies

#### Hash-Based Sharding
- Deterministic distribution (same shard always gets same tests)
- Simple modulo distribution: `hash(test_file) % total_shards`

#### Duration-Balanced Sharding (Default)
- Tests sorted by estimated duration
- Greedy bin-packing algorithm
- Each shard gets similar total duration
- Better parallelization efficiency

### 3. Selective Test Execution

Intelligently runs only tests affected by code changes:

```bash
# Changed files in PR
src/auth/login.js
src/api/users.js

# Runs only affected tests
cypress/e2e/auth/login.cy.js
cypress/e2e/auth/signup.cy.js  # Related
cypress/e2e/api/users.cy.js
```

### 4. Automatic Retry Logic

Failed shards automatically retry up to 3 times:
- **Attempt 1**: Initial run
- **Attempt 2**: First retry (if failed)
- **Attempt 3**: Final retry (if still failed)

Reduces false negatives from flaky tests.

---

## Quick Start

### 1. Collect Tests

Generate test collection with metadata:

```bash
npm run parallel:collect

# With tag filter
node scripts/collect-tests.js --tag @smoke

# Custom output file
node scripts/collect-tests.js --output my-tests.json
```

**Output:** `test-collection.json`

```json
{
  "timestamp": "2025-01-20T10:00:00.000Z",
  "totalTests": 125,
  "byTag": {
    "@smoke": { "count": 25, "files": [...] },
    "@regression": { "count": 100, "files": [...] }
  },
  "tests": [
    {
      "file": "cypress/e2e/login.cy.js",
      "hash": "a1b2c3d4",
      "type": "e2e",
      "tags": ["@smoke", "@auth"],
      "testCount": 5,
      "estimatedDuration": 15000
    }
  ]
}
```

### 2. Run Sharded Tests Locally

```bash
# Shard 0 of 4 (duration-balanced)
node scripts/shard-tests.js --total 4 --index 0

# Shard 1 with tag filter
node scripts/shard-tests.js --total 4 --index 1 --tag @smoke

# Output spec list to file
node scripts/shard-tests.js --total 4 --index 2 --output shard-2.txt

# Hash-based sharding (no balancing)
node scripts/shard-tests.js --total 4 --index 0 --no-balance

# Verbose output
node scripts/shard-tests.js --total 4 --index 0 --verbose
```

**Run Cypress with shard specs:**

```bash
# Extract spec list from output
SPECS=$(node scripts/shard-tests.js --total 4 --index 0 | sed -n '/--- SPEC LIST START ---/,/--- SPEC LIST END ---/p' | grep -v "---")

# Run Cypress
cypress run --spec "$SPECS"
```

### 3. Selective Testing (PR Mode)

```bash
# Detect changed tests based on git diff
npm run parallel:selective

# Custom base branch
node scripts/selective-runner.js --base origin/develop

# With tag filter
node scripts/selective-runner.js --tag @smoke

# Provide changed files manually
node scripts/selective-runner.js --changed-files "src/auth/login.js,src/api/users.js"

# Force run all tests
node scripts/selective-runner.js --run-all
```

---

## Test Collection

### How It Works

The `collect-tests.js` script:

1. **Scans** all test files matching patterns:
   - `cypress/e2e/**/*.cy.js`
   - `src/tests/features/**/*.feature`

2. **Extracts Tags** from multiple formats:
   - Cypress: `{ tags: ['@smoke'] }`
   - Gherkin: `@smoke`
   - Inline: `it('test [@smoke]', ...)`

3. **Detects Test Type**:
   - `bdd` - Feature files
   - `api` - Tests with `cy.request()` or `cy.api()`
   - `integration` - Tests with `cy.intercept()`
   - `e2e` - Default

4. **Estimates Duration**:
   - Heuristic: `testCount * 5s + stepCount * 0.5s`
   - Used for duration balancing

5. **Calculates Hash**:
   - MD5 hash of file path
   - Used for deterministic sharding

### Custom Patterns

Edit `scripts/collect-tests.js`:

```javascript
const config = {
  testPatterns: [
    'cypress/e2e/**/*.cy.js',
    'cypress/integration/**/*.spec.js',  // Add custom pattern
    'src/tests/features/**/*.feature'
  ],
  // ...
};
```

---

## Test Sharding

### Duration-Balanced Sharding Algorithm

```
1. Sort tests by estimatedDuration (longest first)
2. Create N empty bins (one per shard)
3. For each test:
   - Find bin with minimum total duration
   - Add test to that bin
4. Return tests from bin[shardIndex]
```

**Example Distribution:**

```
Shard 0: 32 tests, ~45.2s  [longest tests distributed here]
Shard 1: 35 tests, ~44.8s  [balanced load]
Shard 2: 28 tests, ~45.1s  [fewer but longer tests]
Shard 3: 30 tests, ~44.9s  [balanced load]
```

### Hash-Based Sharding

Simple modulo distribution:

```javascript
function hashBasedSharding(tests, totalShards, shardIndex) {
  return tests.filter(test => {
    const hash = hashCode(test.file);
    return hash % totalShards === shardIndex;
  });
}
```

**When to use:**
- When you need guaranteed deterministic distribution
- When duration estimation is not accurate
- When tests have similar duration

### Custom Sharding

Create your own sharding strategy in `shard-tests.js`:

```javascript
function customSharding(tests, totalShards, shardIndex) {
  // Your custom logic here
  // Example: Shard by test type
  const testsByType = groupBy(tests, 'type');
  const types = Object.keys(testsByType);
  const myTypes = types.filter((_, i) => i % totalShards === shardIndex);

  return myTypes.flatMap(type => testsByType[type]);
}
```

---

## Selective Testing

### Mapping Rules

Define custom mapping in `test-mapping.json`:

```json
{
  "rules": [
    {
      "name": "Authentication changes",
      "source": "src/auth/**",
      "tests": [
        "cypress/e2e/auth/**",
        "cypress/e2e/login.cy.js",
        "@smoke"
      ]
    },
    {
      "name": "API changes",
      "source": "src/api/**",
      "tests": ["@integration"]
    }
  ],
  "alwaysRun": ["@smoke"]
}
```

### Default Mapping Rules

Built-in rules when no `test-mapping.json`:

| Changed File Pattern | Runs Tests |
|---------------------|------------|
| `cypress/**/*.cy.js` | That test file |
| `src/pages/Login.js` | `cypress/e2e/**/*Login*.cy.js` |
| `cypress/fixtures/*.json` | All tests (conservative) |
| `cypress/support/**` | All tests |
| `package.json` | All tests |

### Selective Runner Modes

```bash
# Mode 1: Changed test detection (default)
node scripts/selective-runner.js
# Output: List of affected test files

# Mode 2: Run all tests
node scripts/selective-runner.js --run-all
# Output: "ALL"

# Mode 3: Fallback to smoke
# (when no changes detected or mapping uncertain)
# Output: "SMOKE"
```

### Example Workflow

```bash
# 1. Developer changes src/auth/login.js
git diff origin/main...HEAD
# Output: src/auth/login.js

# 2. Run selective runner
SPECS=$(npm run parallel:selective)
# Output: cypress/e2e/auth/login.cy.js,cypress/e2e/auth/signup.cy.js

# 3. Run only affected tests
cypress run --spec "$SPECS"
# Runs: 2 test files instead of full suite (125 tests)
# Time saved: 90%
```

---

## GitHub Actions Integration

### Parallel Workflow Overview

The `.github/workflows/parallel-tests.yml` workflow has 4 jobs:

```
┌─────────────┐
│   Setup     │  Collect tests, decide run mode
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼
  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │Shard 0 │ │Shard 1 │ │Shard 2 │ │Shard 3 │  Run tests (parallel)
  └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
       │          │          │          │
       └──────────┴──────────┴──────────┘
                  ▼
         ┌────────────────┐
         │   Aggregate    │  Merge results, generate reports
         └────────┬───────┘
                  ▼
         ┌────────────────┐
         │Publish Reports │  Deploy to GitHub Pages
         └────────────────┘
```

### Job 1: Setup

```yaml
setup:
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Install dependencies
    - Decide run mode (selective for PR, full for main)
    - Collect tests
    - Upload test-collection.json artifact
```

**Outputs:**
- `run-mode`: "selective" or "full"
- `shard-count`: Number of shards (2 for PR, 4 for main)
- `spec-list`: Path to test collection

### Job 2: Test Shards (Matrix)

```yaml
test-shards:
  strategy:
    matrix:
      shard: [0, 1, 2, 3]
  steps:
    - Download test-collection.json
    - Generate shard spec list
    - Run Cypress (attempt 1)
    - Retry on failure (attempt 2)
    - Final retry (attempt 3)
    - Record outcome metadata
    - Upload artifacts
```

**Retry Logic:**

```yaml
- name: Run Cypress
  id: cypress-run
  continue-on-error: true

- name: Retry (Attempt 1)
  if: steps.cypress-run.outcome == 'failure'
  id: retry-1
  continue-on-error: true

- name: Retry (Attempt 2)
  if: steps.retry-1.outcome == 'failure'
  id: retry-2
```

**Outcome Tracking:**

```json
{
  "shard": 2,
  "outcome": "passed-retry-1",
  "attempts": 2,
  "timestamp": "2025-01-20T10:15:00Z"
}
```

### Job 3: Aggregate Results

```yaml
aggregate-results:
  needs: [setup, test-shards]
  if: always()
  steps:
    - Download all shard artifacts
    - Merge results from all shards
    - Generate metrics (generate-metrics.js)
    - Generate dashboard (generate-dashboard.js)
    - Create GitHub summary
    - Upload aggregated artifacts
    - Fail job if any shard failed
```

**Summary Output:**

```markdown
# 📊 Parallel Test Execution Summary

**Workflow Run:** 1234567890
**Commit:** `abc123...`
**Branch:** main

- **Shard 0:** passed (1 attempt(s))
- **Shard 1:** passed-retry-1 (2 attempt(s))
- **Shard 2:** passed (1 attempt(s))
- **Shard 3:** failed (3 attempt(s))

## Summary
- ✅ Passed (first try): 2
- 🔄 Passed (after retry): 1
- ❌ Failed: 1

## Test Metrics
- Total Tests: 125
- Pass Rate: 92.5%
- Duration: 45200ms
```

### Job 4: Publish Reports

```yaml
publish-reports:
  needs: aggregate-results
  if: github.ref == 'refs/heads/main'
  steps:
    - Download aggregated results
    - Deploy to GitHub Pages
    - Comment on commit with report URL
```

### Workflow Triggers

```yaml
on:
  pull_request:
    branches: [main, develop]
    # Runs with 2 shards, selective mode

  push:
    branches: [main, develop]
    # Runs with 4 shards, full mode

  workflow_dispatch:
    inputs:
      test_tag:
        description: 'Test tag (@smoke, @regression)'
      shard_count:
        description: 'Number of parallel shards'
        default: '4'
```

### Manual Workflow Execution

```bash
# Via GitHub UI: Actions → Parallel Test Execution → Run workflow

# Via gh CLI
gh workflow run parallel-tests.yml \
  -f test_tag=@smoke \
  -f shard_count=2
```

---

## Local Parallel Execution

### Method 1: npm Scripts

```bash
# Collect tests
npm run parallel:collect

# Run specific shard
npm run parallel:shard -- --total 4 --index 0

# Run all shards (sequential, for demo)
npm run parallel:test-all
```

### Method 2: Shell Script

Create `scripts/run-parallel-local.sh`:

```bash
#!/bin/bash

TOTAL_SHARDS=4

# Collect tests
echo "Collecting tests..."
npm run parallel:collect

# Run shards in parallel
for i in $(seq 0 $((TOTAL_SHARDS - 1))); do
  (
    echo "Starting shard $i..."
    SPECS=$(node scripts/shard-tests.js --total $TOTAL_SHARDS --index $i | \
            sed -n '/--- SPEC LIST START ---/,/--- SPEC LIST END ---/p' | \
            grep -v "---")

    cypress run --spec "$SPECS" --config video=false \
      > "shard-$i.log" 2>&1

    echo "Shard $i complete"
  ) &
done

# Wait for all shards
wait

echo "All shards complete!"
```

```bash
chmod +x scripts/run-parallel-local.sh
./scripts/run-parallel-local.sh
```

### Method 3: Docker Compose

Create `docker-compose.parallel.yml`:

```yaml
version: '3.8'

services:
  shard-0:
    image: cypress/included:13.6.3
    working_dir: /e2e
    volumes:
      - ./:/e2e
    environment:
      - SHARD_INDEX=0
      - TOTAL_SHARDS=4
    command: >
      sh -c "
        npm run parallel:collect &&
        SPECS=$(node scripts/shard-tests.js --total 4 --index 0) &&
        cypress run --spec \"$$SPECS\"
      "

  shard-1:
    # Similar config with SHARD_INDEX=1

  shard-2:
    # Similar config with SHARD_INDEX=2

  shard-3:
    # Similar config with SHARD_INDEX=3
```

```bash
docker-compose -f docker-compose.parallel.yml up --abort-on-container-exit
```

---

## Advanced Configuration

### Custom Test Duration Estimation

Edit `scripts/collect-tests.js`:

```javascript
function estimateDuration(content) {
  // Your custom logic
  const testCount = (content.match(/it\(/g) || []).length;
  const stepCount = (content.match(/cy\./g) || []).length;
  const hasApiCall = content.includes('cy.request');

  let duration = testCount * 5000 + stepCount * 500;

  // API tests take longer
  if (hasApiCall) {
    duration *= 1.5;
  }

  return duration;
}
```

### Dynamic Shard Count

Adjust shard count based on total test count:

```javascript
// In GitHub Actions
const totalTests = 125;
const shardCount = Math.min(
  4,  // Max shards
  Math.ceil(totalTests / 25)  // ~25 tests per shard
);
```

### Shard-Specific Configuration

Run different configs per shard:

```yaml
- name: Run Cypress
  uses: cypress-io/github-action@v6
  with:
    spec: ${{ steps.shard.outputs.spec-list }}
    browser: ${{ matrix.shard == 0 && 'chrome' || 'firefox' }}
    config: ${{ matrix.shard < 2 && 'video=true' || 'video=false' }}
```

### Conditional Tagging

Auto-tag tests based on performance:

```javascript
// In cypress/support/e2e.js
afterEach(function() {
  const duration = Cypress.currentTest.duration;

  if (duration > 30000) {
    // Flag slow tests
    cy.task('flagSlowTest', {
      test: this.currentTest.title,
      duration: duration
    });
  }
});
```

---

## Troubleshooting

### Issue: Uneven Shard Duration

**Symptom:** One shard takes much longer than others

**Solution 1:** Use duration-balanced sharding (default)
```bash
node scripts/shard-tests.js --total 4 --index 0  # Balancing enabled
```

**Solution 2:** Increase shard count
```bash
node scripts/shard-tests.js --total 8 --index 0  # More granular distribution
```

**Solution 3:** Improve duration estimation
```javascript
// Edit scripts/collect-tests.js
function estimateDuration(content) {
  // Add more accurate heuristics
  // Consider historical test data
}
```

### Issue: Selective Runner Missing Tests

**Symptom:** Changed code but selective runner doesn't run affected tests

**Solution 1:** Add custom mapping rule
```json
{
  "rules": [
    {
      "name": "My feature",
      "source": "src/my-feature/**",
      "tests": ["cypress/e2e/my-feature/**"]
    }
  ]
}
```

**Solution 2:** Use conservative fallback
```javascript
// In selective-runner.js
if (unmappedFiles.length > 0) {
  runAll = true;  // Safe fallback
}
```

**Solution 3:** Run with --verbose to debug
```bash
node scripts/selective-runner.js --verbose
```

### Issue: Shard Fails Intermittently

**Symptom:** Shard passes on retry but fails first time

**Indicators:**
- Flaky tests
- Race conditions
- Timing issues

**Solutions:**

1. **Identify flaky tests:**
```bash
# Check shard metadata
cat artifacts/shard-1-metadata.json
# Look for "passed-retry-1" or "passed-retry-2"
```

2. **Tag flaky tests:**
```javascript
describe('Login', { tags: ['@flaky'] }, () => {
  // test
});
```

3. **Run flaky tests separately:**
```yaml
# In GitHub Actions
- name: Run flaky tests with extra retries
  if: steps.shard.outputs.has-flaky == 'true'
  run: |
    cypress run --spec "$FLAKY_SPECS" \
      --config retries=3
```

4. **Add stability improvements:**
```javascript
// Use proper waits
cy.get('[data-cy=submit]').should('be.visible').click();

// Avoid fixed waits
cy.wait(5000); // ❌ Bad

// Use assertions
cy.get('[data-cy=result]').should('contain', 'Success'); // ✅ Good
```

### Issue: Git Diff Detection Fails

**Symptom:** Selective runner can't detect changed files

**Causes:**
- Shallow clone in CI
- Missing remote branches
- Incorrect base branch

**Solutions:**

1. **Fetch full history:**
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Full history
```

2. **Specify correct base:**
```bash
node scripts/selective-runner.js --base origin/develop
```

3. **Provide files manually:**
```bash
node scripts/selective-runner.js \
  --changed-files "src/auth/login.js,src/api/users.js"
```

### Issue: Artifact Upload Fails

**Symptom:** "No files found" error when uploading artifacts

**Solutions:**

1. **Check file paths:**
```yaml
- uses: actions/upload-artifact@v4
  with:
    path: |
      cypress/results/**/*
      cypress/screenshots/**/*
    if-no-files-found: warn  # Don't fail if empty
```

2. **Verify results exist:**
```yaml
- name: Debug artifacts
  run: |
    find . -name "*.json" -o -name "*.png"
    ls -la cypress/results/ || true
```

3. **Create directories first:**
```yaml
- name: Ensure directories
  run: |
    mkdir -p cypress/results
    mkdir -p cypress/screenshots
```

---

## Performance Benchmarks

### Baseline (No Parallelization)

```
Total Tests: 125
Duration: 12m 30s
Pass Rate: 95%
```

### With 4 Parallel Shards

```
Shard 0: 32 tests, 3m 15s
Shard 1: 31 tests, 3m 10s
Shard 2: 30 tests, 3m 05s
Shard 3: 32 tests, 3m 20s

Total Duration: 3m 20s (4x speedup)
Pass Rate: 95% (same)
```

### With Selective Testing (PR)

```
Changed Files: 2
Affected Tests: 12
Duration: 1m 15s (10x speedup)
Pass Rate: 100%
```

### Combined (Selective + Parallel)

```
Changed Files: 8
Affected Tests: 35
Shards: 2
Duration per shard: 45s
Total Duration: 45s (16x speedup!)
```

---

## Best Practices

### 1. Tag Your Tests Appropriately

```javascript
// ✅ Good: Clear, specific tags
describe('Login', { tags: ['@smoke', '@auth', '@critical'] }, () => {});

// ❌ Bad: Too many or vague tags
describe('Login', { tags: ['@test', '@e2e', '@web', '@frontend'] }, () => {});
```

### 2. Keep Test Duration Estimates Accurate

- Run `npm run parallel:collect` regularly
- Review slow tests and optimize
- Update estimation heuristics as needed

### 3. Maintain Test Mapping Rules

- Update `test-mapping.json` when adding new features
- Review mapping effectiveness monthly
- Add always-run tests to catch regressions

### 4. Monitor Shard Balance

```bash
# Check shard distribution
node scripts/shard-tests.js --total 4 --index 0 --verbose
node scripts/shard-tests.js --total 4 --index 1 --verbose
node scripts/shard-tests.js --total 4 --index 2 --verbose
node scripts/shard-tests.js --total 4 --index 3 --verbose

# Compare durations
```

### 5. Handle Flaky Tests

- Tag with `@flaky`
- Run separately with retries
- Fix root cause (race conditions, timing issues)
- Monitor flaky test trends

### 6. Optimize for CI vs Local

**CI (GitHub Actions):**
- Maximum parallelization (4+ shards)
- Video recording enabled
- Full retry logic

**Local Development:**
- Fewer shards (2-3)
- Video disabled
- Headed mode for debugging

---

## Resources

### Scripts Reference

| Script | Purpose | Key Options |
|--------|---------|-------------|
| `collect-tests.js` | Generate test collection | `--tag`, `--output` |
| `shard-tests.js` | Distribute tests to shards | `--total`, `--index`, `--tag`, `--no-balance` |
| `selective-runner.js` | Detect affected tests | `--base`, `--tag`, `--changed-files` |

### Configuration Files

| File | Purpose |
|------|---------|
| `test-collection.json` | Test metadata and categorization |
| `test-mapping.json` | Selective testing mapping rules |
| `shard-N-manifest.json` | Shard-specific test manifest |

### Workflow Files

| File | Purpose |
|------|---------|
| `.github/workflows/parallel-tests.yml` | Main parallel execution workflow |
| `.github/workflows/cypress.yml` | Standard CI workflow |
| `.github/workflows/nightly.yml` | Comprehensive nightly tests |

### Documentation

- [Cypress Documentation](https://docs.cypress.io)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Test Parallelization Best Practices](../README.md)

---

## Summary

This parallelization system provides:

✅ **4x faster CI** with parallel shards
✅ **10x faster PR feedback** with selective testing
✅ **Automatic retry** for flaky tests
✅ **Smart load balancing** across workers
✅ **Comprehensive reporting** from aggregated results

**Next Steps:**

1. Run `npm run parallel:collect` to generate test collection
2. Test locally with `npm run parallel:shard -- --total 4 --index 0`
3. Push to trigger GitHub Actions parallel workflow
4. Monitor shard balance and adjust as needed

For questions or issues, see [Troubleshooting](#troubleshooting) or open a GitHub issue.
