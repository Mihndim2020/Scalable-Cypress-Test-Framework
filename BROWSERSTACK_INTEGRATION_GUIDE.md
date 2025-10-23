# BrowserStack Integration Guide

Complete guide for running Cypress tests on BrowserStack for cross-browser and cross-device testing.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [Running Tests](#running-tests)
6. [Browser and Device Matrix](#browser-and-device-matrix)
7. [Local Testing](#local-testing)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

### Why BrowserStack?

✅ **Real Devices** - Test on 3000+ real browsers and devices
✅ **No Setup** - No need to maintain browsers/devices locally
✅ **Parallel Execution** - Run tests concurrently across multiple configurations
✅ **Local Testing** - Test localhost/internal apps via secure tunnel
✅ **Screenshots & Videos** - Automatic capture of test execution
✅ **Debug Tools** - Console logs, network logs, visual debugging

### What's Included

- **[browserstack-cypress.json](browserstack-cypress.json)** - Main configuration file
- **[scripts/run-browserstack.sh](scripts/run-browserstack.sh)** - Wrapper script for execution
- **[.github/workflows/cross-browser-demo.yml](.github/workflows/cross-browser-demo.yml)** - CI/CD example
- **[.github/workflows/browserstack.yml](.github/workflows/browserstack.yml)** - Full BrowserStack workflow

---

## Prerequisites

### 1. BrowserStack Account

Create a free account at [browserstack.com](https://www.browserstack.com/)

**Get Your Credentials**:
1. Sign in to BrowserStack
2. Go to **[Account → Settings](https://www.browserstack.com/accounts/settings)**
3. Copy your **Username** and **Access Key**

### 2. Install BrowserStack CLI

```bash
# Install globally
npm install -g browserstack-cypress-cli

# Or use via npx (no install needed)
npx browserstack-cypress --version
```

### 3. Set Environment Variables

```bash
# Add to ~/.bashrc or ~/.zshrc
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"

# Or create .env file
cat >> .env <<EOF
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_access_key
EOF

# Source the file
source ~/.bashrc
```

---

## Quick Start

### 1. Run Tests on BrowserStack

```bash
# Using wrapper script (recommended)
./scripts/run-browserstack.sh --sync

# Using BrowserStack CLI directly
npx browserstack-cypress run --sync
```

### 2. View Results

After execution, you'll see:
```
[Browserstack] Test Run summary
────────────────────────────────────────────────────
Build ID: abc123xyz
Build URL: https://automate.browserstack.com/dashboard/v2/builds/abc123xyz
```

Click the URL to view:
- Test results per browser
- Screenshots and videos
- Console logs
- Network logs
- Visual debugging

---

## Configuration

### Main Config File: browserstack-cypress.json

The **[browserstack-cypress.json](browserstack-cypress.json)** file contains all BrowserStack configuration:

```json
{
  "auth": {
    "username": "${BROWSERSTACK_USERNAME}",
    "access_key": "${BROWSERSTACK_ACCESS_KEY}"
  },
  "browsers": [
    {
      "browser": "chrome",
      "os": "Windows 10",
      "versions": ["latest", "latest - 1"]
    }
  ],
  "run_settings": {
    "cypress_config_file": "./cypress.config.js",
    "project_name": "Noveo Cypress Sample Project",
    "build_name": "Build ${BUILD_NUMBER:-local}",
    "parallels": 5
  },
  "connection_settings": {
    "local": true,
    "local_identifier": "${LOCAL_IDENTIFIER:-local}"
  }
}
```

### Configuration Sections

#### 1. Authentication

```json
{
  "auth": {
    "username": "${BROWSERSTACK_USERNAME}",  // From environment
    "access_key": "${BROWSERSTACK_ACCESS_KEY}"  // From environment
  }
}
```

#### 2. Browser/Device Selection

**Desktop Browsers**:
```json
{
  "browser": "chrome",
  "os": "Windows 10",
  "versions": ["latest"]
}
```

**Mobile Devices**:
```json
{
  "device": "iPhone 14",
  "os_version": "16",
  "real_mobile": true
}
```

#### 3. Run Settings

```json
{
  "run_settings": {
    "cypress_config_file": "./cypress.config.js",
    "cypress_version": "13",
    "project_name": "My Project",
    "build_name": "Build #123",
    "parallels": 5,  // Number of parallel tests
    "specs": [
      "cypress/e2e/**/*.cy.js"
    ],
    "npm_dependencies": {
      "@badeball/cypress-cucumber-preprocessor": "^23.2.1"
    }
  }
}
```

#### 4. Connection Settings (Local Testing)

```json
{
  "connection_settings": {
    "local": true,  // Enable local tunnel
    "local_identifier": "unique-id",
    "local_mode": "always-on"
  }
}
```

#### 5. Artifacts

```json
{
  "downloads": {
    "screenshots": true,
    "videos": true,
    "network_logs": true
  },
  "video_config": {
    "upload_on_pass": false  // Only upload failed test videos
  }
}
```

---

## Running Tests

### Using Wrapper Script (Recommended)

The **[scripts/run-browserstack.sh](scripts/run-browserstack.sh)** provides additional features:

```bash
# Basic execution (synchronous)
./scripts/run-browserstack.sh --sync

# Custom build name
./scripts/run-browserstack.sh \
  --build-name "PR-123" \
  --sync

# Custom config file
./scripts/run-browserstack.sh \
  --config browserstack-mobile.json \
  --sync

# Enable local tunnel
./scripts/run-browserstack.sh \
  --local \
  --sync

# Run specific specs
./scripts/run-browserstack.sh \
  --specs "cypress/e2e/smoke/**/*.cy.js" \
  --sync

# Custom parallelization
./scripts/run-browserstack.sh \
  --parallel 10 \
  --sync

# Show help
./scripts/run-browserstack.sh --help
```

### Using BrowserStack CLI Directly

```bash
# Run with default config
npx browserstack-cypress run --sync

# Specify config file
npx browserstack-cypress run \
  --config-file browserstack-cypress.json \
  --sync

# Asynchronous execution (don't wait)
npx browserstack-cypress run

# Check build status
npx browserstack-cypress build-info <build_id>

# Stop a running build
npx browserstack-cypress stop <build_id>
```

### Environment-Specific Execution

```bash
# Development
BUILD_NUMBER=dev-$(date +%Y%m%d) ./scripts/run-browserstack.sh --sync

# Staging
BUILD_NUMBER=staging-123 \
  BASE_URL=https://staging.example.com \
  ./scripts/run-browserstack.sh --sync

# Production smoke test
BUILD_NUMBER=prod-smoke \
  BASE_URL=https://example.com \
  ./scripts/run-browserstack.sh \
  --specs "cypress/e2e/smoke/**/*.cy.js" \
  --sync
```

---

## Browser and Device Matrix

### Supported Desktop Browsers

| Browser | Operating Systems | Latest Versions |
|---------|-------------------|-----------------|
| Chrome | Windows 10/11, macOS | 120, 119, 118 |
| Firefox | Windows 10/11, macOS | 121, 120, 119 |
| Edge | Windows 10/11 | 120, 119, 118 |
| Safari | macOS Monterey, Ventura, Sonoma | 16, 15.6, 15 |

### Supported Mobile Devices

#### iOS Devices

| Device | OS Versions | Browser |
|--------|-------------|---------|
| iPhone 15 Pro | iOS 17 | Safari |
| iPhone 14 | iOS 16, 17 | Safari |
| iPhone 13 | iOS 15, 16 | Safari |
| iPhone 12 | iOS 14, 15 | Safari |
| iPad Pro 12.9 | iOS 16, 17 | Safari |

#### Android Devices

| Device | OS Versions | Browser |
|--------|-------------|---------|
| Samsung Galaxy S23 | Android 13 | Chrome |
| Samsung Galaxy S22 | Android 12, 13 | Chrome |
| Google Pixel 7 | Android 13 | Chrome |
| Google Pixel 6 | Android 12, 13 | Chrome |
| OnePlus 11 | Android 13 | Chrome |

### Example Configurations

**Windows 10 - Multiple Browsers**:
```json
{
  "browsers": [
    {"browser": "chrome", "os": "Windows 10", "versions": ["latest"]},
    {"browser": "firefox", "os": "Windows 10", "versions": ["latest"]},
    {"browser": "edge", "os": "Windows 10", "versions": ["latest"]}
  ]
}
```

**macOS - Safari**:
```json
{
  "browsers": [
    {"browser": "safari", "os": "OS X Monterey", "versions": ["15.6"]},
    {"browser": "safari", "os": "OS X Ventura", "versions": ["16.0"]}
  ]
}
```

**Mobile - iOS & Android**:
```json
{
  "browsers": [
    {"device": "iPhone 14", "os_version": "16", "real_mobile": true},
    {"device": "Samsung Galaxy S23", "os_version": "13.0", "real_mobile": true}
  ]
}
```

**Version Ranges**:
```json
{
  "browsers": [
    {
      "browser": "chrome",
      "os": "Windows 10",
      "versions": ["latest", "latest - 1", "latest - 2"]
    }
  ]
}
```

---

## Local Testing

### What is Local Testing?

BrowserStack Local allows testing applications running on:
- localhost (http://localhost:3000)
- Private/internal networks
- Behind firewalls
- Development machines

### Enable Local Tunnel

#### Method 1: Using Wrapper Script

```bash
# Automatically starts and manages tunnel
./scripts/run-browserstack.sh --local --sync
```

#### Method 2: Manual Setup

```bash
# 1. Download BrowserStack Local binary
wget https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip
unzip BrowserStackLocal-linux-x64.zip

# 2. Start tunnel
./BrowserStackLocal \
  --key $BROWSERSTACK_ACCESS_KEY \
  --local-identifier my-tunnel

# 3. In another terminal, run tests
npx browserstack-cypress run --sync

# 4. Stop tunnel (Ctrl+C)
```

#### Method 3: Via npm (Recommended)

```bash
# Install globally
npm install -g browserstack-local

# Start tunnel
browserstack-local \
  --key $BROWSERSTACK_ACCESS_KEY \
  --local-identifier my-tunnel \
  --daemon start

# Check status
browserstack-local --daemon status

# Stop tunnel
browserstack-local --daemon stop
```

### Configuration for Local Testing

Update **[browserstack-cypress.json](browserstack-cypress.json)**:

```json
{
  "connection_settings": {
    "local": true,
    "local_identifier": "my-tunnel",
    "local_mode": "always-on",
    "local_config_file": null
  }
}
```

### Testing localhost Application

```bash
# 1. Start your app locally
npm start  # Runs on http://localhost:3000

# 2. Enable local tunnel and run tests
./scripts/run-browserstack.sh \
  --local \
  --sync

# Tests will access http://localhost:3000 via tunnel
```

### Advanced Local Options

```bash
# Only route specific hosts through tunnel
./BrowserStackLocal \
  --key $BROWSERSTACK_ACCESS_KEY \
  --only localhost,dev.local

# Force local connections
./BrowserStackLocal \
  --key $BROWSERSTACK_ACCESS_KEY \
  --force-local

# Proxy configuration
./BrowserStackLocal \
  --key $BROWSERSTACK_ACCESS_KEY \
  --proxy-host proxy.example.com \
  --proxy-port 8080
```

---

## CI/CD Integration

### GitHub Actions Example

See **[.github/workflows/cross-browser-demo.yml](.github/workflows/cross-browser-demo.yml)** for complete example.

#### Basic Job

```yaml
browserstack-test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run BrowserStack tests
      run: ./scripts/run-browserstack.sh --sync
      env:
        BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
        BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
        BUILD_NUMBER: ${{ github.run_number }}
```

#### Matrix Strategy (Multiple Browsers)

```yaml
browserstack-matrix:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      browser: [chrome, firefox, edge]
  steps:
    - uses: actions/checkout@v4

    - name: Install jq
      run: sudo apt-get install -y jq

    - name: Create browser-specific config
      run: |
        jq --arg browser "${{ matrix.browser }}" \
           '.browsers = [{"browser": $browser, "os": "Windows 10", "versions": ["latest"]}]' \
           browserstack-cypress.json > config-${{ matrix.browser }}.json

    - name: Run tests
      run: |
        ./scripts/run-browserstack.sh \
          --config config-${{ matrix.browser }}.json \
          --sync
      env:
        BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
        BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
```

### GitLab CI Example

```yaml
browserstack:
  image: node:18
  before_script:
    - npm ci
  script:
    - chmod +x scripts/run-browserstack.sh
    - ./scripts/run-browserstack.sh --sync
  variables:
    BROWSERSTACK_USERNAME: $BROWSERSTACK_USERNAME
    BROWSERSTACK_ACCESS_KEY: $BROWSERSTACK_ACCESS_KEY
    BUILD_NUMBER: $CI_PIPELINE_ID
  only:
    - main
```

### Jenkins Example

```groovy
pipeline {
    agent any

    environment {
        BROWSERSTACK_USERNAME = credentials('browserstack-username')
        BROWSERSTACK_ACCESS_KEY = credentials('browserstack-access-key')
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('BrowserStack Tests') {
            steps {
                sh 'chmod +x scripts/run-browserstack.sh'
                sh './scripts/run-browserstack.sh --sync'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'cypress/results/**/*', allowEmptyArchive: true
        }
    }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error**: `Invalid credentials`

**Solution**:
```bash
# Verify credentials
echo $BROWSERSTACK_USERNAME
echo $BROWSERSTACK_ACCESS_KEY

# Test authentication
curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  https://api.browserstack.com/automate/plan.json

# Expected: JSON response with plan details
```

#### 2. Local Tunnel Not Connecting

**Error**: `Could not connect to local testing server`

**Solution**:
```bash
# 1. Check if tunnel is running
ps aux | grep BrowserStackLocal

# 2. Check tunnel logs
cat /tmp/browserstack-local.log

# 3. Verify firewall rules
# Allow outbound connections to:
# - *.browserstack.com (port 443, 80)
# - *.bsstag.com (port 443, 80)

# 4. Try different local identifier
LOCAL_IDENTIFIER=unique-$(date +%s) ./scripts/run-browserstack.sh --local --sync
```

#### 3. Tests Timing Out

**Error**: `Test execution timed out`

**Solution**:

Increase timeout in **[browserstack-cypress.json](browserstack-cypress.json)**:
```json
{
  "timeout": {
    "global": 1800,  // 30 minutes (default: 900)
    "spec": 900      // 15 minutes (default: 600)
  }
}
```

#### 4. Browser Not Available

**Error**: `Browser not supported`

**Solution**:
```bash
# Check available browsers
curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  https://api.browserstack.com/automate/browsers.json | jq

# Verify your configuration matches available browsers
```

#### 5. Parallel Limit Exceeded

**Error**: `Parallel limit exceeded`

**Solution**:
```bash
# Check your plan limits
curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  https://api.browserstack.com/automate/plan.json | jq '.parallel_sessions_running'

# Reduce parallelization
jq '.run_settings.parallels = 2' browserstack-cypress.json > temp.json
mv temp.json browserstack-cypress.json
```

#### 6. Spec Files Not Found

**Error**: `No specs found`

**Solution**:
```bash
# Verify spec pattern
ls -la cypress/e2e/**/*.cy.js

# Update spec pattern in browserstack-cypress.json
{
  "run_settings": {
    "specs": [
      "cypress/e2e/**/*.cy.js",
      "cypress/e2e/**/*.feature"  // Include all patterns
    ]
  }
}
```

---

## Best Practices

### 1. Organize Tests by Priority

```json
{
  "browsers": [
    // High priority: Latest stable browsers
    {"browser": "chrome", "os": "Windows 10", "versions": ["latest"]},
    {"browser": "firefox", "os": "Windows 10", "versions": ["latest"]},

    // Medium priority: Previous versions
    {"browser": "chrome", "os": "Windows 10", "versions": ["latest - 1"]},

    // Low priority: Legacy support
    {"browser": "safari", "os": "OS X Monterey", "versions": ["15.6"]}
  ]
}
```

### 2. Use Build Names Effectively

```bash
# Include useful metadata
BUILD_NAME="PR-${PR_NUMBER}-${BROWSER}-$(date +%Y%m%d)" \
  ./scripts/run-browserstack.sh --build-name "$BUILD_NAME" --sync

# Examples:
# - "PR-123-chrome-20250121"
# - "main-nightly-20250121"
# - "release-v1.2.3"
```

### 3. Optimize Parallelization

```json
{
  "run_settings": {
    "parallels": 5  // Match your BrowserStack plan
  }
}
```

**Recommendations**:
- Free plan: 1-2 parallels
- Paid plan: 5-10 parallels
- Enterprise: 10+ parallels

### 4. Minimize Test Duration

```javascript
// Use viewport presets
beforeEach(() => {
  cy.viewport('iphone-x');  // Faster than custom dimensions
});

// Stub external services
beforeEach(() => {
  cy.intercept('**google-analytics.com/**', { statusCode: 200 });
});

// Use fixtures instead of API calls
cy.fixture('users').then((users) => {
  // Use fixture data
});
```

### 5. Selective Video Recording

```json
{
  "video_config": {
    "upload_on_pass": false  // Only record failures
  }
}
```

### 6. Use Local Testing Wisely

Only enable when testing localhost:

```bash
# Enable local for localhost testing
./scripts/run-browserstack.sh --local --sync

# Disable for public URLs (faster)
./scripts/run-browserstack.sh --sync
```

### 7. Tag Tests Appropriately

```javascript
// cypress/e2e/login.cy.js
describe('Login', { tags: ['@smoke', '@critical'] }, () => {
  it('should login successfully', () => {
    // Test code
  });
});
```

Run only critical tests:
```bash
./scripts/run-browserstack.sh \
  --specs "cypress/e2e/**/*[@critical]*.cy.js" \
  --sync
```

---

## Cost Optimization

### Estimate Usage

```javascript
// Calculate monthly cost
const testsPerDay = 50;
const avgDuration = 5; // minutes
const browsers = 3;
const daysPerMonth = 22;

const totalMinutes = testsPerDay * avgDuration * browsers * daysPerMonth;
console.log(`Monthly minutes: ${totalMinutes}`);
// Check against your BrowserStack plan minutes
```

### Reduce Costs

1. **Run smoke tests more frequently, full suite less often**
   ```bash
   # Daily: Smoke tests (5 min)
   # Weekly: Full regression (30 min)
   ```

2. **Use GitHub runners for Chrome/Firefox, BrowserStack for Safari/Edge**
   ```yaml
   # Free on GitHub Actions
   - Chrome (Linux)
   - Firefox (Linux)

   # BrowserStack only
   - Safari (macOS)
   - Edge (Windows)
   - Mobile devices
   ```

3. **Optimize parallelization**
   ```json
   {
     "run_settings": {
       "parallels": 3  // Don't exceed what you need
     }
   }
   ```

---

## Additional Resources

- **[BrowserStack Documentation](https://www.browserstack.com/docs/automate/cypress)**
- **[BrowserStack Status](https://status.browserstack.com/)**
- **[Browser List API](https://www.browserstack.com/automate/browsers.json)**
- **[BrowserStack Support](https://www.browserstack.com/support)**
- **[Pricing Calculator](https://www.browserstack.com/pricing)**

---

**Last Updated**: 2025-10-21
**Maintainer**: QA Team
