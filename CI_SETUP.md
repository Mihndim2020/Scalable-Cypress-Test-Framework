# CI/CD Setup Guide

This document provides complete instructions for configuring GitHub Actions workflows for Cypress testing.

## Table of Contents

1. [Overview](#overview)
2. [Workflows](#workflows)
3. [Required GitHub Secrets](#required-github-secrets)
4. [Environment Variables](#environment-variables)
5. [Workflow Configuration](#workflow-configuration)
6. [BrowserStack Setup](#browserstack-setup)
7. [Artifacts and Reports](#artifacts-and-reports)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This project includes three main GitHub Actions workflows:

1. **cypress.yml** - Main test workflow (PR and push events)
2. **browserstack.yml** - Cross-browser testing with BrowserStack
3. **nightly.yml** - Comprehensive nightly regression suite

### Key Features

✅ Multi-browser testing (Chrome, Firefox, Edge, Safari)
✅ Node.js version matrix (18, 20)
✅ Intelligent caching (node_modules, Cypress binary)
✅ Conditional execution (smoke vs regression)
✅ Parallel test execution with sharding
✅ Automatic artifact collection (screenshots, videos, reports)
✅ Flaky test detection with PR comments
✅ BrowserStack integration for desktop and mobile
✅ Code coverage reporting

---

## Workflows

### 1. Main Cypress Workflow (cypress.yml)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual dispatch with test suite selection

**Jobs:**
- **install**: Cache dependencies and Cypress binary
- **smoke-tests**: Quick validation (runs on all PRs)
- **regression-tests**: Full test suite (runs on main branch)
- **flaky-detection**: Analyzes test stability
- **coverage**: Generates code coverage reports

**Matrix Strategy:**
```yaml
matrix:
  node: ['18', '20']
  browser: ['chrome', 'firefox', 'edge']
```

### 2. BrowserStack Workflow (browserstack.yml)

**Triggers:**
- Push to `main` branch
- Pull requests to `main`
- Nightly schedule (2 AM UTC)
- Manual dispatch

**Features:**
- Desktop browsers (Windows, macOS)
- Mobile browsers (iOS Safari, Android Chrome)
- BrowserStack Local tunnel for localhost testing
- Automated result reporting

### 3. Nightly Regression Workflow (nightly.yml)

**Triggers:**
- Scheduled (daily at 2 AM UTC)
- Manual dispatch with environment selection

**Test Suites:**
- Full regression (5 parallel shards per browser)
- Accessibility tests (cypress-axe)
- Performance tests
- Visual regression tests (Percy)
- Flaky test detection

---

## Required GitHub Secrets

Configure these secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### Core Secrets

| Secret Name | Description | Required | Example Value |
|-------------|-------------|----------|---------------|
| `BASE_URL` | Application base URL | Yes | `https://your-app.com` |
| `API_URL` | API endpoint URL | Yes | `https://api.your-app.com` |
| `CYPRESS_USERNAME` | Test user username | Yes | `test.user@example.com` |
| `CYPRESS_PASSWORD` | Test user password | Yes | `SecureP@ssw0rd!` |
| `CYPRESS_RECORD_KEY` | Cypress Dashboard key | No* | `abc123-xyz-456` |

\* Required only if using Cypress Dashboard for recording

### BrowserStack Secrets

| Secret Name | Description | Required | How to Get |
|-------------|-------------|----------|------------|
| `BROWSERSTACK_USERNAME` | BrowserStack username | For BrowserStack workflow | [Account Settings](https://www.browserstack.com/accounts/settings) |
| `BROWSERSTACK_ACCESS_KEY` | BrowserStack access key | For BrowserStack workflow | [Account Settings](https://www.browserstack.com/accounts/settings) |

### Optional Secrets

| Secret Name | Description | Use Case |
|-------------|-------------|----------|
| `STAGING_BASE_URL` | Staging environment URL | Nightly tests against staging |
| `STAGING_API_URL` | Staging API URL | Nightly tests against staging |
| `PERCY_TOKEN` | Percy visual testing token | Visual regression tests |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Test failure alerts |
| `SENDGRID_API_KEY` | SendGrid API key | Email notifications |

### Setting Secrets via GitHub CLI

```bash
# Set core secrets
gh secret set BASE_URL --body "https://your-app.com"
gh secret set API_URL --body "https://api.your-app.com"
gh secret set CYPRESS_USERNAME --body "test.user@example.com"
gh secret set CYPRESS_PASSWORD --body "YourPassword123"

# Set BrowserStack secrets
gh secret set BROWSERSTACK_USERNAME --body "your_username"
gh secret set BROWSERSTACK_ACCESS_KEY --body "your_access_key"

# Set optional secrets
gh secret set CYPRESS_RECORD_KEY --body "your-record-key"
gh secret set PERCY_TOKEN --body "your-percy-token"
```

---

## Environment Variables

### Workflow-Level Environment Variables

These are set in the workflow files and available to all jobs:

```yaml
env:
  CI: true
  NODE_ENV: test
  CYPRESS_CACHE_FOLDER: ~/.cache/cypress
```

### Job-Level Environment Variables

Set per job or step using the `env` key:

```yaml
env:
  CYPRESS_BASE_URL: ${{ secrets.BASE_URL }}
  CYPRESS_API_URL: ${{ secrets.API_URL }}
  CYPRESS_USERNAME: ${{ secrets.CYPRESS_USERNAME }}
  CYPRESS_PASSWORD: ${{ secrets.CYPRESS_PASSWORD }}
  CYPRESS_ENVIRONMENT: ci
```

### Available to Cypress Tests

All `CYPRESS_*` environment variables are automatically available in tests:

```javascript
// Access in tests
const baseUrl = Cypress.env('BASE_URL');
const username = Cypress.env('USERNAME');
const apiUrl = Cypress.env('API_URL');
```

---

## Workflow Configuration

### Customizing Test Execution

#### 1. Modify Matrix Strategy

Edit [.github/workflows/cypress.yml](.github/workflows/cypress.yml):

```yaml
strategy:
  matrix:
    node: ['18', '20', '21']  # Add Node 21
    browser: ['chrome', 'firefox', 'edge', 'electron']  # Add Electron
```

#### 2. Change Smoke Test Specs

```yaml
- name: Run Cypress smoke tests
  uses: cypress-io/github-action@v6
  with:
    browser: ${{ matrix.browser }}
    spec: 'cypress/e2e/smoke/**/*.cy.js'  # Only smoke folder
```

#### 3. Adjust Retry Configuration

In [cypress.config.js](cypress.config.js):

```javascript
module.exports = defineConfig({
  e2e: {
    retries: {
      runMode: 3,  // Retry 3 times in CI (was 2)
      openMode: 0
    }
  }
});
```

#### 4. Enable/Disable Parallel Execution

```yaml
- name: Run Cypress regression tests
  uses: cypress-io/github-action@v6
  with:
    record: true
    parallel: true  # Set to false to disable
    group: 'Regression-${{ matrix.browser }}'
```

### Customizing Nightly Schedule

Edit [.github/workflows/nightly.yml](.github/workflows/nightly.yml):

```yaml
on:
  schedule:
    # Change from 2 AM to 6 PM UTC
    - cron: '0 18 * * *'

    # Run only on weekdays (Monday-Friday)
    - cron: '0 2 * * 1-5'

    # Run twice daily (2 AM and 2 PM)
    - cron: '0 2,14 * * *'
```

### Adjusting Artifact Retention

Default retention periods:

| Artifact Type | Retention | Configurable In |
|---------------|-----------|-----------------|
| Screenshots (failures) | 7 days | `retention-days` parameter |
| Videos | 7-14 days | `retention-days` parameter |
| HTML Reports | 14-30 days | `retention-days` parameter |
| Test Results (JSON) | 30-90 days | `retention-days` parameter |
| Flaky Reports | 90 days | `retention-days` parameter |

Change retention in workflow:

```yaml
- name: Upload screenshots
  uses: actions/upload-artifact@v4
  with:
    retention-days: 14  # Change from 7 to 14 days
```

---

## BrowserStack Setup

### 1. Create BrowserStack Account

1. Sign up at [browserstack.com](https://www.browserstack.com/)
2. Navigate to **Account → Settings**
3. Copy your **Username** and **Access Key**

### 2. Configure GitHub Secrets

```bash
gh secret set BROWSERSTACK_USERNAME --body "your_username"
gh secret set BROWSERSTACK_ACCESS_KEY --body "your_access_key"
```

### 3. Install BrowserStack Dependencies

Already included in [package.json](package.json):

```json
{
  "devDependencies": {
    "browserstack-local": "^1.5.1",
    "browserstack-cypress-cli": "^1.31.0"
  }
}
```

### 4. Supported Configurations

#### Desktop Browsers

| OS | Browsers | Versions |
|----|----------|----------|
| Windows 10 | Chrome, Firefox, Edge | Latest |
| Windows 11 | Chrome | Latest |
| macOS Monterey | Chrome, Safari | Latest, 15.6 |
| macOS Ventura | Safari | 16.0 |

#### Mobile Devices

| Device | OS | Browser |
|--------|-----|---------|
| iPhone 14 | iOS 16 | Safari |
| iPhone 13 | iOS 15 | Safari |
| Samsung Galaxy S23 | Android 13 | Chrome |
| Google Pixel 7 | Android 13 | Chrome |

### 5. Customize Browser Matrix

Edit [.github/workflows/browserstack.yml](.github/workflows/browserstack.yml):

```yaml
matrix:
  include:
    # Add new configuration
    - os: 'Windows 11'
      browser: 'Firefox'
      browser_version: '120.0'
      resolution: '2560x1440'
```

### 6. Local Testing Setup

BrowserStack Local allows testing applications running on localhost:

```yaml
- name: Start BrowserStack Local tunnel
  run: |
    browserstack-local \
      --key ${{ secrets.BROWSERSTACK_ACCESS_KEY }} \
      --daemon start
```

---

## Artifacts and Reports

### Artifact Collection

All workflows automatically collect:

1. **Screenshots** (on test failure only)
   - Location: `cypress/screenshots`
   - Format: PNG
   - Naming: `{spec}-{test-name}-(failed).png`

2. **Videos** (all tests in CI)
   - Location: `cypress/videos`
   - Format: MP4
   - Controlled by: `video: process.env.CI === 'true'` in config

3. **HTML Reports** (Mochawesome)
   - Location: `cypress/reports`
   - Format: HTML with inline assets
   - Merged from all spec files

4. **Test Results** (JSON)
   - Location: `cypress/results`
   - Format: JSON (Mochawesome format)
   - Used for flaky test detection

### Accessing Artifacts

#### Via GitHub UI

1. Go to **Actions** tab
2. Click on workflow run
3. Scroll to **Artifacts** section
4. Download desired artifact (ZIP file)

#### Via GitHub CLI

```bash
# List artifacts for a run
gh run view 12345 --log

# Download all artifacts
gh run download 12345

# Download specific artifact
gh run download 12345 -n smoke-videos-chrome-node18-123
```

### Report Generation

#### Mochawesome Reports

Automatically generated and merged:

```bash
# Merge all JSON reports
npx mochawesome-merge cypress/results/*.json > combined-report.json

# Generate HTML report
npx marge combined-report.json \
  --reportDir cypress/reports \
  --inline \
  --reportTitle "Cypress Test Report"
```

#### Allure Reports (Optional)

Add to [package.json](package.json):

```json
{
  "devDependencies": {
    "@shelex/cypress-allure-plugin": "^2.40.0",
    "allure-commandline": "^2.25.0"
  }
}
```

Configure in [cypress.config.js](cypress.config.js):

```javascript
const allureWriter = require('@shelex/cypress-allure-plugin/writer');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureWriter(on, config);
      return config;
    },
  },
});
```

Generate report:

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

### Custom Report Types

#### JUnit XML (for CI integration)

```bash
npm install --save-dev cypress-multi-reporters mocha-junit-reporter
```

Configure in [cypress.config.js](cypress.config.js):

```javascript
module.exports = defineConfig({
  e2e: {
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      configFile: 'reporter-config.json',
    },
  },
});
```

[reporter-config.json](reporter-config.json):

```json
{
  "reporterEnabled": "mochawesome, mocha-junit-reporter",
  "mochawesomeReporterOptions": {
    "reportDir": "cypress/results",
    "overwrite": false,
    "html": false,
    "json": true
  },
  "mochaJunitReporterReporterOptions": {
    "mochaFile": "cypress/results/junit/results-[hash].xml"
  }
}
```

---

## Flaky Test Detection

### How It Works

The flaky test detector ([ci/flaky-test-detector.js](ci/flaky-test-detector.js)) analyzes test results across multiple runs to identify inconsistent tests.

**Detection Criteria:**
- Test must run at least 3 times (configurable via `--min-runs`)
- Failure rate between 0% and 100% (not always passing or always failing)
- Failure rate ≥ 10% (configurable via `--threshold`)

### Configuration

Default configuration in [ci/flaky-test-detector.js](ci/flaky-test-detector.js):

```javascript
const config = {
  threshold: 0.1,      // 10% flaky threshold
  minRuns: 3,          // Minimum runs required
  inputDir: './test-artifacts',
  outputFile: 'flaky-report.json'
};
```

### Command Line Usage

```bash
# Basic usage
node ci/flaky-test-detector.js

# Custom threshold (20% instead of 10%)
node ci/flaky-test-detector.js --threshold 0.2

# Require more runs (5 instead of 3)
node ci/flaky-test-detector.js --min-runs 5

# Custom input/output
node ci/flaky-test-detector.js \
  --input ./custom-artifacts \
  --output ./reports/flaky.json
```

### PR Comment Example

When flaky tests are detected, a comment is posted:

```markdown
## ⚠️ Flaky Tests Detected

**Summary**: 3 flaky tests found out of 150 total tests

**Flaky Tests:**

1. **Login flow › should handle invalid credentials**
   - Runs: 5 | Passes: 3 | Failures: 2 | Flaky Rate: 40%

2. **Dashboard › should load user transactions**
   - Runs: 4 | Passes: 3 | Failures: 1 | Flaky Rate: 25%

3. **Payment › should process card payment**
   - Runs: 6 | Passes: 5 | Failures: 1 | Flaky Rate: 17%

See artifacts for full report.
```

---

## Troubleshooting

### Common Issues

#### 1. Cache Not Working

**Symptom**: Dependencies reinstall every run

**Solution**:
```yaml
# Ensure cache key matches exactly
- uses: actions/cache@v4
  with:
    path: node_modules
    key: node-modules-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
    # Key must include package-lock.json hash
```

#### 2. Tests Timeout

**Symptom**: Tests fail with timeout errors

**Solutions**:
- Increase timeout in [cypress.config.js](cypress.config.js):
  ```javascript
  defaultCommandTimeout: 10000,  // Increase to 15000
  pageLoadTimeout: 60000,        // Increase to 90000
  ```
- Add wait-on for app readiness:
  ```bash
  npx wait-on http://localhost:3000 -t 120000
  ```

#### 3. BrowserStack Connection Failed

**Symptom**: "Could not connect to BrowserStack Local"

**Solutions**:
1. Verify secrets are set correctly
2. Check BrowserStack status: [status.browserstack.com](https://status.browserstack.com/)
3. Increase tunnel wait time:
   ```bash
   sleep 30  # Increase from 10 to 30 seconds
   ```

#### 4. Artifacts Not Uploading

**Symptom**: "No files found with provided path"

**Solutions**:
```yaml
- name: Upload screenshots
  if: failure()  # Ensure condition is correct
  uses: actions/upload-artifact@v4
  with:
    name: screenshots-${{ github.run_number }}
    path: cypress/screenshots/**/*  # Add wildcard
    if-no-files-found: warn  # Add this to see warnings
```

#### 5. Flaky Test Detector Fails

**Symptom**: "Cannot read property 'stats' of undefined"

**Solutions**:
1. Ensure Mochawesome reports are generated:
   ```javascript
   // cypress.config.js
   reporter: 'mochawesome',
   reporterOptions: {
     reportDir: 'cypress/results',
     overwrite: false,
     html: false,
     json: true  // Must be true
   }
   ```

2. Check artifact download path:
   ```yaml
   - uses: actions/download-artifact@v4
     with:
       path: test-artifacts
       pattern: test-results-*  # Ensure pattern matches upload names
   ```

#### 6. Out of Disk Space

**Symptom**: "No space left on device"

**Solutions**:
1. Reduce video retention:
   ```javascript
   // cypress.config.js
   video: false  // Disable in smoke tests
   ```

2. Clean up Docker images:
   ```bash
   - name: Free disk space
     run: |
       docker system prune -af
       sudo rm -rf /usr/local/lib/android
   ```

### Debug Mode

Enable verbose logging in workflows:

```yaml
env:
  DEBUG: 'cypress:*'
  ACTIONS_STEP_DEBUG: true  # GitHub Actions debug mode
```

### Manual Test Run

Test workflow locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow locally
act -j smoke-tests --secret-file .secrets
```

---

## Best Practices

### 1. Secrets Management

- ✅ Never commit secrets to repository
- ✅ Use environment-specific secrets (e.g., `STAGING_BASE_URL`)
- ✅ Rotate secrets regularly
- ✅ Use GitHub environments for production secrets

### 2. Test Organization

- ✅ Smoke tests: Critical paths only (< 5 minutes)
- ✅ Regression tests: Full coverage (< 30 minutes)
- ✅ Nightly tests: Extended scenarios (any duration)

### 3. Resource Optimization

- ✅ Cache aggressively (node_modules, Cypress binary)
- ✅ Limit video recording to CI only
- ✅ Use parallel execution for large suites
- ✅ Set appropriate artifact retention periods

### 4. Failure Handling

- ✅ Use retries for known flaky tests
- ✅ Capture screenshots on failure
- ✅ Generate comprehensive reports
- ✅ Set up failure notifications (Slack, email)

### 5. Monitoring

- ✅ Track flaky test trends
- ✅ Monitor test execution time
- ✅ Review artifact sizes
- ✅ Analyze pass/fail rates

---

## Additional Resources

### Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cypress GitHub Action](https://github.com/cypress-io/github-action)
- [BrowserStack Automate](https://www.browserstack.com/docs/automate)
- [Cypress Configuration](https://docs.cypress.io/guides/references/configuration)

### Tools

- [GitHub CLI](https://cli.github.com/) - Manage secrets and workflows
- [act](https://github.com/nektos/act) - Run workflows locally
- [Cypress Dashboard](https://dashboard.cypress.io/) - Test analytics

### Support

- **GitHub Actions**: [GitHub Community](https://github.community/)
- **Cypress**: [Discord](https://discord.gg/cypress) | [GitHub Discussions](https://github.com/cypress-io/cypress/discussions)
- **BrowserStack**: [Support Portal](https://www.browserstack.com/support)

---

## Quick Reference

### Common Commands

```bash
# Run tests locally
npm run test:open          # Interactive mode
npm run test:run           # Headless mode
npm run test:smoke         # Smoke tests only
npm run test:regression    # Full regression

# GitHub CLI commands
gh workflow list                              # List workflows
gh workflow run cypress.yml                   # Trigger workflow
gh run list --workflow=cypress.yml           # List runs
gh run view <run-id>                         # View run details
gh run download <run-id>                     # Download artifacts

# BrowserStack commands
npx browserstack-cypress run                  # Run on BrowserStack
npx browserstack-cypress run --sync          # Synchronous execution
```

### Workflow Triggers

```yaml
# On push to specific branches
on:
  push:
    branches: [main, develop]

# On pull request
on:
  pull_request:
    branches: [main]

# On schedule (cron)
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

# Manual dispatch
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [dev, staging, prod]
```

---

**Last Updated**: 2025-10-21
**Maintained By**: QA Team
