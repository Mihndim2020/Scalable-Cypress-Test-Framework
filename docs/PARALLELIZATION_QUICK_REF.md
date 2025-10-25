# Parallelization Quick Reference

## 🚀 Quick Commands

### Test Collection
```bash
# Collect all tests
npm run parallel:collect

# Collect with tag filter
node scripts/collect-tests.js --tag @smoke
```

### Test Sharding
```bash
# Run shard 0 of 4 (duration-balanced)
node scripts/shard-tests.js --total 4 --index 0

# Run shard with tag filter
node scripts/shard-tests.js --total 4 --index 1 --tag @smoke

# Hash-based sharding (no balancing)
node scripts/shard-tests.js --total 4 --index 0 --no-balance

# Verbose output
node scripts/shard-tests.js --total 4 --index 0 --verbose
```

### Selective Testing
```bash
# Auto-detect changed tests
npm run parallel:selective

# Custom base branch
node scripts/selective-runner.js --base origin/develop

# Manual file list
node scripts/selective-runner.js --changed-files "src/auth/login.js"

# Force run all
node scripts/selective-runner.js --run-all
```

### Run Cypress with Shard
```bash
# Extract and run
SPECS=$(node scripts/shard-tests.js --total 4 --index 0 | \
        sed -n '/--- SPEC LIST START ---/,/--- SPEC LIST END ---/p' | \
        grep -v "---")
cypress run --spec "$SPECS"
```

---

## 📊 Tag Reference

| Tag | Purpose | Example |
|-----|---------|---------|
| `@smoke` | Critical path tests | Login, checkout flow |
| `@regression` | Full functionality | All features |
| `@integration` | API/backend tests | API endpoints |
| `@flaky` | Known unstable tests | Timing-sensitive tests |
| `@unit` | Unit-level tests | Utility functions |

---

## 🔧 GitHub Actions

### Trigger Workflows

```bash
# Manual trigger with custom params
gh workflow run parallel-tests.yml \
  -f test_tag=@smoke \
  -f shard_count=2

# Check workflow status
gh run list --workflow=parallel-tests.yml

# View logs
gh run view --log
```

### Workflow Behavior

| Event | Shards | Mode | Tests |
|-------|--------|------|-------|
| PR | 2 | Selective | Changed tests only |
| Push to main | 4 | Full | All tests |
| Manual | Custom | Custom | By tag filter |
| Nightly | 4 | Full | All + @regression |

---

## 📁 Key Files

| File | Description |
|------|-------------|
| `test-collection.json` | Generated test metadata |
| `test-mapping.json` | Selective test mapping rules |
| `shard-N-manifest.json` | Shard spec list |
| `.github/workflows/parallel-tests.yml` | Main workflow |

---

## 🎯 Common Workflows

### Local Development (Fast Feedback)
```bash
# 1. Collect tests
npm run parallel:collect

# 2. Run selective tests
SPECS=$(npm run parallel:selective)

# 3. Run Cypress
cypress run --spec "$SPECS" --headed
```

### CI/CD (Full Validation)
```bash
# Automatically runs on PR/push
# - Collects tests
# - Shards across 4 workers
# - Retries failures
# - Aggregates results
# - Publishes reports
```

### Debug Specific Shard
```bash
# 1. See what's in shard 2
node scripts/shard-tests.js --total 4 --index 2 --verbose

# 2. Run just that shard
SPECS=$(node scripts/shard-tests.js --total 4 --index 2 | \
        sed -n '/--- SPEC LIST START ---/,/--- SPEC LIST END ---/p' | \
        grep -v "---")
cypress open --spec "$SPECS"
```

---

## 🐛 Troubleshooting

### Uneven Shard Duration
```bash
# Check distribution
for i in 0 1 2 3; do
  node scripts/shard-tests.js --total 4 --index $i --verbose
done

# Solution: Use duration balancing (default)
node scripts/shard-tests.js --total 4 --index 0  # Already balanced
```

### Selective Runner Misses Tests
```bash
# Debug with verbose
node scripts/selective-runner.js --verbose

# Solution: Add mapping rule to test-mapping.json
```

### Shard Always Fails
```bash
# Check metadata
cat artifacts/shard-2-results/shard-2-metadata.json

# If flaky: Tag tests and run separately
describe('Test', { tags: ['@flaky'] }, () => {});
```

---

## 📈 Performance Tips

1. **Optimize slow tests:**
```bash
# Find slow tests
cat test-collection.json | jq '.tests | sort_by(.estimatedDuration) | reverse | .[0:10]'
```

2. **Increase shards for large suites:**
```bash
# 125+ tests: Use 4-8 shards
# 50-125 tests: Use 2-4 shards
# <50 tests: Use 1-2 shards
```

3. **Use selective testing in PRs:**
```bash
# PR: ~70% faster with selective mode
# Main: Full validation with all tests
```

4. **Balance flaky tests:**
```bash
# Separate flaky tests to dedicated shard
node scripts/shard-tests.js --total 4 --index 0 --tag @flaky
```

---

## 🔗 Resources

- Full Guide: [PARALLELIZATION_GUIDE.md](./PARALLELIZATION_GUIDE.md)
- CI Setup: [CI_SETUP.md](./CI_SETUP.md)
- Docker: [DOCKER_EXECUTION_GUIDE.md](./DOCKER_EXECUTION_GUIDE.md)

---

**Need Help?** See [Troubleshooting](./PARALLELIZATION_GUIDE.md#troubleshooting) in the full guide.
