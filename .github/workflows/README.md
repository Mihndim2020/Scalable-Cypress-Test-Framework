# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated Cypress testing.

## Workflows Overview

### 1. cypress.yml - Main Test Workflow

**Purpose**: Primary workflow for PR validation and main branch testing

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual dispatch with test suite selection

**Jobs**:
- `install` - Caches dependencies and Cypress binary
- `smoke-tests` - Quick validation (all PRs and pushes)
- `regression-tests` - Full suite (main branch only)
- `flaky-detection` - Analyzes test stability
- `coverage` - Code coverage reports

**Matrix**:
- Node.js: 18, 20
- Browsers: Chrome, Firefox, Edge

**Artifacts**:
- Screenshots (on failure, 7 days)
- Videos (all tests, 7 days)
- HTML reports (14 days)
- Test results JSON (30 days)

---

### 2. browserstack.yml - Cross-Browser Testing

**Purpose**: Test across multiple OS/browser combinations using BrowserStack

**Triggers**:
- Push to `main` branch
- Pull requests to `main`
- Nightly at 2 AM UTC
- Manual dispatch

**Jobs**:
- `browserstack-tests` - Desktop browser matrix
- `browserstack-mobile` - Mobile device testing
- `browserstack-report` - Consolidated reporting

**Configurations**:
- **Desktop**: Windows 10/11, macOS (Monterey, Ventura)
- **Browsers**: Chrome, Firefox, Edge, Safari
- **Mobile**: iPhone 13/14, Samsung Galaxy S23, Google Pixel 7

**Artifacts**:
- BrowserStack logs (14 days)
- Test results (14 days)
- Summary report (30 days)

**Required Secrets**:
- `BROWSERSTACK_USERNAME`
- `BROWSERSTACK_ACCESS_KEY`

---

### 3. nightly.yml - Nightly Regression Suite

**Purpose**: Comprehensive testing with extended scenarios

**Triggers**:
- Daily at 2 AM UTC
- Manual dispatch with environment selection

**Jobs**:
- `setup` - Environment configuration
- `full-regression` - Complete test suite (5 shards per browser)
- `accessibility-tests` - a11y validation
- `performance-tests` - Performance metrics
- `visual-regression` - Visual diff testing
- `report-generation` - Consolidated HTML reports
- `flaky-detection` - Long-term flakiness analysis
- `notification` - Alerts on failure

**Sharding**: 5 parallel shards per browser for faster execution

**Artifacts**:
- All types with extended retention (30-90 days)
- Comprehensive nightly report
- Flaky test trends

**Notifications**:
- Creates GitHub issue on failure
- Optional Slack webhook
- Optional email alerts

---

## Quick Actions

### Manually Trigger Workflows

```bash
# Main Cypress workflow with specific test suite
gh workflow run cypress.yml -f test_suite=regression

# BrowserStack workflow
gh workflow run browserstack.yml

# Nightly workflow with staging environment
gh workflow run nightly.yml -f environment=staging -f parallel_runs=5
```

### View Workflow Runs

```bash
# List all workflow runs
gh run list --workflow=cypress.yml

# View specific run details
gh run view <run-id>

# Watch a running workflow
gh run watch <run-id>
```

### Download Artifacts

```bash
# Download all artifacts from a run
gh run download <run-id>

# Download specific artifact
gh run download <run-id> -n smoke-screenshots-chrome-node18-123
```

### Check Workflow Status

```bash
# View status of latest runs
gh run list --limit 5

# View logs for failed run
gh run view <run-id> --log-failed
```

---

## Workflow Configuration

### Modifying Matrix

Edit the `matrix` section in each workflow:

```yaml
strategy:
  matrix:
    node: ['18', '20']        # Add/remove Node versions
    browser: ['chrome', 'edge'] # Add/remove browsers
```

### Changing Triggers

Edit the `on` section:

```yaml
on:
  push:
    branches: [main, develop, feature/*]  # Add more branches
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'  # Change time (6 AM UTC)
```

### Adjusting Caching

Cache configuration in `install` job:

```yaml
- uses: actions/cache@v4
  with:
    path: node_modules
    key: node-modules-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      node-modules-${{ runner.os }}-
```

### Artifact Retention

Change `retention-days` in upload steps:

```yaml
- uses: actions/upload-artifact@v4
  with:
    retention-days: 14  # Default is 7-90 depending on artifact type
```

---

## Environment Variables

### Workflow-Level

Set in workflow file under `env`:

```yaml
env:
  CI: true
  NODE_ENV: test
  CYPRESS_CACHE_FOLDER: ~/.cache/cypress
```

### Job-Level

Set per job:

```yaml
jobs:
  test:
    env:
      CYPRESS_BASE_URL: ${{ secrets.BASE_URL }}
      CYPRESS_USERNAME: ${{ secrets.CYPRESS_USERNAME }}
```

### Step-Level

Set per step:

```yaml
- name: Run tests
  env:
    DEBUG: 'cypress:*'
```

---

## Required Secrets

Configure in: **Settings → Secrets and variables → Actions**

### Core Secrets (Required)

| Secret | Description | Used In |
|--------|-------------|---------|
| `BASE_URL` | Application URL | All workflows |
| `API_URL` | API endpoint URL | All workflows |
| `CYPRESS_USERNAME` | Test user username | All workflows |
| `CYPRESS_PASSWORD` | Test user password | All workflows |

### Optional Secrets

| Secret | Description | Used In |
|--------|-------------|---------|
| `CYPRESS_RECORD_KEY` | Cypress Dashboard key | cypress.yml, nightly.yml |
| `BROWSERSTACK_USERNAME` | BrowserStack username | browserstack.yml |
| `BROWSERSTACK_ACCESS_KEY` | BrowserStack access key | browserstack.yml |
| `STAGING_BASE_URL` | Staging environment URL | nightly.yml |
| `STAGING_API_URL` | Staging API URL | nightly.yml |
| `PERCY_TOKEN` | Percy visual testing | nightly.yml |
| `SLACK_WEBHOOK_URL` | Slack notifications | nightly.yml |

---

## Troubleshooting

### Workflow Not Triggering

1. Check branch names in `on.push.branches`
2. Verify workflow file syntax: `yamllint .github/workflows/cypress.yml`
3. Check Actions tab for errors

### Tests Failing in CI but Passing Locally

1. Check environment variables and secrets
2. Verify application is accessible at `BASE_URL`
3. Review CI logs: `gh run view <run-id> --log`
4. Check for timing issues (increase timeouts)

### Artifacts Not Uploading

1. Verify path exists: `cypress/screenshots`, `cypress/videos`
2. Check if-condition: `if: failure()` or `if: always()`
3. Ensure tests are generating artifacts

### Cache Not Working

1. Verify `package-lock.json` is committed
2. Check cache key matches in save/restore steps
3. Cache max size is 10GB per repository

### BrowserStack Connection Issues

1. Verify secrets are set correctly
2. Check BrowserStack status page
3. Review local tunnel configuration
4. Increase tunnel wait time

---

## Best Practices

### 1. Test Organization

- **Smoke tests**: < 5 minutes, critical paths only
- **Regression tests**: < 30 minutes, comprehensive coverage
- **Nightly tests**: Any duration, extended scenarios

### 2. Parallelization

- Use sharding for large test suites
- Balance tests across shards evenly
- Monitor shard execution time

### 3. Artifact Management

- Only upload screenshots on failure
- Set appropriate retention periods
- Clean up old artifacts regularly

### 4. Secrets Security

- Never log secret values
- Rotate secrets regularly
- Use environment-specific secrets

### 5. Performance Optimization

- Cache aggressively
- Run smoke tests on every PR
- Run full regression only on main
- Use parallel execution

---

## Workflow Status Badges

Add to your README.md:

```markdown
![Cypress Tests](https://github.com/your-org/your-repo/workflows/Cypress%20Tests/badge.svg)
![BrowserStack Tests](https://github.com/your-org/your-repo/workflows/BrowserStack%20Cross-Browser%20Tests/badge.svg)
![Nightly Regression](https://github.com/your-org/your-repo/workflows/Nightly%20Regression%20Tests/badge.svg)
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cypress GitHub Action](https://github.com/cypress-io/github-action)
- [BrowserStack Automate](https://www.browserstack.com/docs/automate/cypress)
- [Full CI Setup Guide](../CI_SETUP.md)

---

**Last Updated**: 2025-10-21
