# Test Matrix Quick Start

Quick reference for running the representative RWA test matrix.

## 🚀 Quick Commands

### Run All 6 Tests (Sequential)
```bash
# Run all test files
npm run test:run

# Estimated time: ~12 minutes
```

### Run Smoke Tests Only (< 8 minutes)
```bash
# Run tests tagged with @smoke
npm run test:smoke

# Includes:
# - Login & Dashboard
# - Single purchase flow
# - Header responsive checks
# - Guest checkout
```

### Run Individual Tests

```bash
# Test 1: Login & Dashboard (~30 sec)
cypress run --spec "cypress/e2e/01-smoke-login-dashboard.cy.js"

# Test 2: UI+API Transaction (~2 min)
cypress run --spec "cypress/e2e/02-ui-api-transaction.cy.js"

# Test 3: API Order Creation (~1.5 min)
cypress run --spec "cypress/e2e/03-api-order-creation.cy.js"

# Test 4: BDD Purchase Flow (~3 min)
cypress run --spec "src/tests/features/04-purchase-flow.feature"

# Test 5: Cross-Browser Responsive (~2 min)
cypress run --spec "cypress/e2e/05-cross-browser-responsive.cy.js"

# Test 6: Negative Checkout (~2.5 min)
cypress run --spec "cypress/e2e/06-negative-checkout.cy.js"
```

### Run by Test Type

```bash
# API tests only (Tests 2 & 3)
cypress run --env TAGS='@api'

# E2E tests only (Test 4)
cypress run --env TAGS='@e2e'

# Negative tests only (Test 6)
cypress run --env TAGS='@negative'

# Responsive/UI tests (Test 5)
cypress run --env TAGS='@responsive'

# Integration tests (Tests 2 & 3)
cypress run --env TAGS='@integration'
```

## ⚡ Parallel Execution

### Run with 4 Parallel Workers (~4 min total)
```bash
# Using GitHub Actions workflow
git push origin main
# Automatically runs all tests in parallel

# Or trigger manually
gh workflow run parallel-tests.yml
```

### Local Parallel Execution
```bash
# Collect tests first
npm run parallel:collect

# Run shard 0 of 4
npm run parallel:shard -- --total 4 --index 0

# Run shard 1 of 4
npm run parallel:shard -- --total 4 --index 1

# Etc...
```

## 🎯 Selective Testing (PR Mode)

```bash
# Run only tests affected by your changes
npm run parallel:selective

# Example: Changed auth code → runs Test 1 + @smoke tests
```

## 🌐 Cross-Browser Testing

### Local
```bash
# Chrome
npm run test:chrome

# Firefox
npm run test:firefox

# Edge (Windows/Linux)
npm run test:edge
```

### BrowserStack (Cloud)
```bash
# Run on BrowserStack
npm run browserstack:run

# Run with local tunnel
npm run browserstack:local
```

### Docker
```bash
# Run in Docker container
npm run docker:test

# Run specific test in Docker
docker-compose run --rm cypress-chrome npx cypress run \
  --spec "cypress/e2e/01-smoke-login-dashboard.cy.js"
```

## 📊 Test Execution Times

| Test | Duration | When to Run |
|------|----------|-------------|
| **Test 1: Login** | 30 sec | Every commit |
| **Test 2: UI+API** | 2 min | PRs, Main |
| **Test 3: API Only** | 1.5 min | PRs, Main |
| **Test 4: BDD E2E** | 3 min | Main, Nightly |
| **Test 5: Responsive** | 2 min | UI changes |
| **Test 6: Negative** | 2.5 min | Main, Nightly |
| **Smoke Set** | 7-8 min | Every commit |
| **Full Suite** | 12 min | Main, Nightly |
| **Full Suite (Parallel)** | 4 min | CI/CD |

## 🏷️ Tag Reference

```bash
# Critical smoke tests
cypress run --env TAGS='@smoke'

# Critical must-pass tests
cypress run --env TAGS='@critical'

# Authentication tests
cypress run --env TAGS='@auth'

# Purchase/checkout flow
cypress run --env TAGS='@purchase'

# Form validation tests
cypress run --env TAGS='@validation'

# Mobile responsive
cypress run --env TAGS='@mobile'

# Desktop tests
cypress run --env TAGS='@desktop'
```

## 📝 Interactive Mode

```bash
# Open Cypress Test Runner
npm run test:open

# Select and run individual tests
# Great for development and debugging
```

## 🔍 Debugging

```bash
# Run with headed mode
cypress run --headed --spec "cypress/e2e/01-smoke-login-dashboard.cy.js"

# Run with slow motion
cypress run --headed --slow 500 --spec "cypress/e2e/01-smoke-login-dashboard.cy.js"

# Run with browser DevTools open
cypress run --headed --browser chrome --spec "cypress/e2e/01-smoke-login-dashboard.cy.js"
```

## 📈 CI/CD Integration

### GitHub Actions (Automatic)

**On Pull Request:**
```yaml
Trigger: Pull request opened/updated
Runs: Smoke tests (2 shards)
Duration: ~2 minutes
```

**On Push to Main:**
```yaml
Trigger: Merge to main
Runs: Full regression (4 shards)
Duration: ~4 minutes
```

**Nightly:**
```yaml
Trigger: Daily at 2 AM
Runs: Full suite + cross-browser
Duration: ~30 minutes
```

### Manual Workflow Trigger

```bash
# Trigger with specific tag
gh workflow run parallel-tests.yml -f test_tag='@smoke'

# Trigger with custom shard count
gh workflow run parallel-tests.yml -f shard_count='2'
```

## 🎭 Environment Variables

### Required
```bash
# .env file
CYPRESS_baseUrl=http://localhost:3000
TEST_USERNAME=testuser
TEST_PASSWORD=Password123!
```

### Optional
```bash
# API configuration
apiUrl=http://localhost:3000/api

# BrowserStack
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_key

# Recording
CYPRESS_RECORD_KEY=your_record_key
```

## 📦 Test Data

### Seed Test Data
```bash
# Using custom command in tests
cy.seedTransactions(5)
cy.seedNotifications(3)

# Reset state
cy.resetState()
```

### Generate Test Users
```bash
# Ephemeral users (auto-cleanup)
node scripts/generate-test-users.js --count 10
```

## 🔧 Troubleshooting

### Tests Failing Locally

```bash
# 1. Verify Cypress installation
npm run cypress:verify

# 2. Check environment variables
npm run security:validate-env

# 3. Clear cache
npx cypress cache clear
npm ci

# 4. Run single test to isolate
cypress run --spec "cypress/e2e/01-smoke-login-dashboard.cy.js"
```

### Slow Test Execution

```bash
# Check test duration
npm run parallel:collect

# Review test-collection.json
cat test-collection.json | jq '.tests | sort_by(.estimatedDuration) | reverse | .[0:5]'
```

### Flaky Tests

```bash
# Run test multiple times
cypress run --spec "cypress/e2e/01-smoke-login-dashboard.cy.js" --config retries=3

# Tag as flaky
describe('Test', { tags: ['@flaky'] }, () => {})

# Run flaky tests separately
cypress run --env TAGS='@flaky'
```

## 📚 More Information

- **Full Test Matrix:** [TEST_MATRIX.md](./TEST_MATRIX.md)
- **Parallelization:** [PARALLELIZATION_GUIDE.md](./PARALLELIZATION_GUIDE.md)
- **CI/CD Setup:** [../CI_SETUP.md](../CI_SETUP.md)
- **Docker Guide:** [../DOCKER_EXECUTION_GUIDE.md](../DOCKER_EXECUTION_GUIDE.md)

---

## 💡 Pro Tips

1. **Run smoke tests before pushing:**
   ```bash
   npm run test:smoke && git push
   ```

2. **Watch mode for development:**
   ```bash
   npm run test:open
   # Select test and enable "Auto-reload"
   ```

3. **Quick validation:**
   ```bash
   # Run just critical tests
   cypress run --env TAGS='@critical'
   ```

4. **Performance check:**
   ```bash
   # Run API tests (fastest)
   cypress run --env TAGS='@api'
   ```

5. **Before release:**
   ```bash
   # Full regression with all browsers
   npm run test:chrome && npm run test:firefox
   ```

---

**Need help?** Check [TEST_MATRIX.md](./TEST_MATRIX.md) for detailed information.
