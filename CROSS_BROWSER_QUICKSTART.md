# Cross-Browser Testing Quick Start

This guide provides quick examples for running tests locally (headed/headless), in Docker, and on BrowserStack.

## 📋 Table of Contents

- [Local Execution](#local-execution)
- [Docker Execution](#docker-execution)
- [BrowserStack Execution](#browserstack-execution)
- [GitHub Actions Example](#github-actions-example)

---

## Local Execution

### Headed Mode (Interactive)

```bash
# Open Cypress Test Runner
npm run test:open

# Run specific browser
npm run test:chrome
npm run test:firefox
npm run test:edge
```

### Headless Mode

```bash
# Run all tests
npm run test:run

# Run smoke tests
npm run test:smoke

# Run regression tests
npm run test:regression

# Run in specific browser (headless)
cypress run --browser chrome
cypress run --browser firefox
cypress run --browser edge
```

### Examples

```bash
# Example 1: Run smoke tests in Chrome (headless)
npm run test:chrome -- --spec "cypress/e2e/**/*[@smoke]*.cy.js"

# Example 2: Run specific test file in Firefox
npm run test:firefox -- --spec "cypress/e2e/login.cy.js"

# Example 3: Run with custom base URL
CYPRESS_baseUrl=https://staging.example.com npm run test:chrome

# Example 4: Run with video disabled
CYPRESS_video=false npm run test:run
```

---

## Docker Execution

### Prerequisites

```bash
# Install Docker
docker --version

# Install Docker Compose
docker compose version
```

### Basic Commands

```bash
# Run tests in Docker (headless)
npm run docker:test

# Run smoke tests
npm run docker:smoke

# Run in specific browser
npm run docker:chrome
npm run docker:firefox
npm run docker:edge

# Build Docker image
npm run docker:build

# Clean up
npm run docker:clean
```

### Using Helper Script

```bash
# Run tests
./scripts/docker-run.sh test

# Run smoke tests
./scripts/docker-run.sh smoke

# Run in specific browser
./scripts/docker-run.sh chrome
./scripts/docker-run.sh firefox

# Headed mode (requires X11)
./scripts/docker-run.sh headed

# Open shell in container
./scripts/docker-run.sh shell

# View logs
./scripts/docker-run.sh logs

# Clean everything
./scripts/docker-run.sh clean
```

### Docker Examples

```bash
# Example 1: Run all tests in Docker
docker compose up --abort-on-container-exit cypress

# Example 2: Run smoke tests
docker compose --profile smoke up --abort-on-container-exit cypress-smoke

# Example 3: Run in Firefox
docker compose --profile firefox up --abort-on-container-exit cypress-firefox

# Example 4: Custom environment variables
BASE_URL=https://staging.example.com \
  docker compose up --abort-on-container-exit cypress

# Example 5: Interactive shell for debugging
docker compose run --rm cypress /bin/bash
# Then inside container:
# npm run test:chrome
# exit
```

---

## BrowserStack Execution

### Prerequisites

```bash
# 1. Sign up at browserstack.com

# 2. Get credentials from Account → Settings
# https://www.browserstack.com/accounts/settings

# 3. Set environment variables
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"

# Or add to .env file
echo "BROWSERSTACK_USERNAME=your_username" >> .env
echo "BROWSERSTACK_ACCESS_KEY=your_access_key" >> .env
```

### Basic Commands

```bash
# Run on all configured browsers
npm run browserstack:run

# Run with local tunnel (for localhost testing)
npm run browserstack:local

# View build information
npm run browserstack:info

# Stop running build
npm run browserstack:stop <build_id>
```

### Using Wrapper Script

```bash
# Basic execution (synchronous - waits for results)
./scripts/run-browserstack.sh --sync

# With local tunnel (for testing localhost)
./scripts/run-browserstack.sh --local --sync

# Custom build name
./scripts/run-browserstack.sh \
  --build-name "PR-123" \
  --sync

# Custom config file
./scripts/run-browserstack.sh \
  --config browserstack-mobile.json \
  --sync

# Run specific specs
./scripts/run-browserstack.sh \
  --specs "cypress/e2e/smoke/**/*.cy.js" \
  --sync

# Custom parallelization
./scripts/run-browserstack.sh \
  --parallel 10 \
  --sync
```

### BrowserStack Examples

```bash
# Example 1: Run on desktop browsers (Chrome, Firefox, Edge)
npx browserstack-cypress run --sync

# Example 2: Test localhost application
# Terminal 1: Start your app
npm start

# Terminal 2: Run tests with local tunnel
./scripts/run-browserstack.sh --local --sync

# Example 3: Run only on Chrome (Windows 10)
# Create custom config
cat > browserstack-chrome.json <<EOF
{
  "auth": {
    "username": "${BROWSERSTACK_USERNAME}",
    "access_key": "${BROWSERSTACK_ACCESS_KEY}"
  },
  "browsers": [
    {
      "browser": "chrome",
      "os": "Windows 10",
      "versions": ["latest"]
    }
  ],
  "run_settings": {
    "cypress_config_file": "./cypress.config.js",
    "parallels": 3
  }
}
EOF

./scripts/run-browserstack.sh --config browserstack-chrome.json --sync

# Example 4: Mobile devices only (iPhone 14, Samsung Galaxy S23)
# Use predefined mobile browsers in browserstack-cypress.json
jq '.browsers = [
  {"device": "iPhone 14", "os_version": "16", "real_mobile": true},
  {"device": "Samsung Galaxy S23", "os_version": "13.0", "real_mobile": true}
]' browserstack-cypress.json > browserstack-mobile.json

./scripts/run-browserstack.sh --config browserstack-mobile.json --sync
```

---

## GitHub Actions Example

The project includes a comprehensive cross-browser demo workflow: **[.github/workflows/cross-browser-demo.yml](.github/workflows/cross-browser-demo.yml)**

### Execution Matrix

The workflow runs the same test suite across:

1. **Chrome** (GitHub-hosted runner)
2. **Firefox** (GitHub-hosted runner)
3. **Docker** (containerized execution)
4. **BrowserStack Desktop** (Chrome, Firefox on Windows 10)
5. **BrowserStack Mobile** (iPhone 14, Samsung Galaxy S23)

### Trigger Workflow

```bash
# Automatically triggers on:
# - Push to main/develop
# - Pull requests to main

# Manual trigger
gh workflow run cross-browser-demo.yml

# With BrowserStack enabled
gh workflow run cross-browser-demo.yml -f enable_browserstack=true
```

### Configuration Example

```yaml
# .github/workflows/cross-browser-demo.yml

jobs:
  chrome-github:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          browser: chrome
          spec: 'cypress/e2e/**/*.cy.js'

  firefox-github:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          browser: firefox
          spec: 'cypress/e2e/**/*.cy.js'

  browserstack-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run on BrowserStack
        run: ./scripts/run-browserstack.sh --local --sync
        env:
          BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
          BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
```

---

## Comparison Table

| Method | Setup | Speed | Browsers | Cost | Best For |
|--------|-------|-------|----------|------|----------|
| **Local Headed** | ⭐ Easy | ⚡ Fast | Chrome, Firefox, Edge | Free | Development, debugging |
| **Local Headless** | ⭐ Easy | ⚡⚡ Faster | Chrome, Firefox, Edge | Free | Quick validation |
| **Docker** | ⭐⭐ Medium | ⚡⚡ Fast | Chrome, Firefox, Edge | Free | CI/CD, reproducibility |
| **BrowserStack Desktop** | ⭐⭐⭐ Complex | ⚡ Slow | All browsers + Safari | Paid | Cross-browser, Safari |
| **BrowserStack Mobile** | ⭐⭐⭐ Complex | ⚡ Slow | Real mobile devices | Paid | Mobile testing |

---

## Decision Tree

### When to use each method?

```
Are you developing a new feature?
├─ Yes → Use LOCAL HEADED mode
│         (npm run test:open)
│
└─ No → Is this for CI/CD?
    ├─ Yes → Use DOCKER
    │         (docker compose up cypress)
    │
    └─ No → Do you need Safari or mobile?
        ├─ Yes → Use BROWSERSTACK
        │         (./scripts/run-browserstack.sh --sync)
        │
        └─ No → Use LOCAL HEADLESS
                  (npm run test:run)
```

---

## Quick Examples by Use Case

### Use Case 1: Local Development

```bash
# Interactive development
npm run test:open

# Quick validation
npm run test:chrome -- --spec "cypress/e2e/login.cy.js"
```

### Use Case 2: Pre-Commit Hook

```bash
# Fast smoke tests before commit
npm run test:smoke
```

### Use Case 3: Pull Request Validation

```bash
# Run in Docker for consistency
./scripts/docker-run.sh test

# Or use GitHub Actions (automatic)
```

### Use Case 4: Cross-Browser Validation

```bash
# Test in all browsers locally
npm run test:chrome && \
npm run test:firefox && \
npm run test:edge

# Or use BrowserStack for more browsers
./scripts/run-browserstack.sh --sync
```

### Use Case 5: Mobile Testing

```bash
# BrowserStack only (real devices)
./scripts/run-browserstack.sh --config browserstack-mobile.json --sync
```

### Use Case 6: Testing Localhost Application

```bash
# Method 1: Local execution
npm start &  # Start app in background
npm run test:chrome

# Method 2: Docker
docker compose up -d app
npm run docker:test

# Method 3: BrowserStack with local tunnel
npm start &
./scripts/run-browserstack.sh --local --sync
```

---

## Environment Variables Reference

### Common Variables

```bash
# Application URLs
BASE_URL=http://localhost:3000
API_URL=http://localhost:3001

# Test credentials
TEST_USERNAME=testuser
TEST_PASSWORD=testpassword

# Cypress settings
CYPRESS_VIDEO=true
CYPRESS_SCREENSHOTS=true
CYPRESS_baseUrl=http://localhost:3000

# CI environment
CI=true

# BrowserStack
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_access_key
```

### Setting Environment Variables

```bash
# Method 1: .env file
cat > .env <<EOF
BASE_URL=http://localhost:3000
BROWSERSTACK_USERNAME=your_username
EOF

# Method 2: Command line
BASE_URL=https://staging.example.com npm run test:chrome

# Method 3: Export (session-wide)
export BASE_URL=https://staging.example.com
npm run test:chrome
```

---

## Troubleshooting

### Local Tests Fail

```bash
# Check Cypress installation
npm run cypress:verify

# Clear Cypress cache
npx cypress cache clear
npm install

# Run with debug logs
DEBUG=cypress:* npm run test:chrome
```

### Docker Tests Fail

```bash
# Rebuild image
docker compose build --no-cache

# Check logs
docker compose logs cypress

# Clean and restart
./scripts/docker-run.sh clean
./scripts/docker-run.sh test
```

### BrowserStack Tests Fail

```bash
# Verify credentials
curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  https://api.browserstack.com/automate/plan.json

# Check tunnel
browserstack-local --daemon status

# View logs
cat /tmp/browserstack-local.log
```

---

## Next Steps

### Full Documentation

- **[DOCKER_EXECUTION_GUIDE.md](./DOCKER_EXECUTION_GUIDE.md)** - Complete Docker guide
- **[BROWSERSTACK_INTEGRATION_GUIDE.md](./BROWSERSTACK_INTEGRATION_GUIDE.md)** - Complete BrowserStack guide
- **[CI_SETUP.md](./CI_SETUP.md)** - CI/CD setup and configuration

### Learn More

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Test architecture overview
- **[RELIABILITY_GUIDE.md](./RELIABILITY_GUIDE.md)** - Writing stable tests
- **[TEST_DATA_STRATEGY.md](./TEST_DATA_STRATEGY.md)** - Data management

---

**Last Updated**: 2025-10-21
**Quick Reference**: Keep this guide handy for day-to-day testing!
