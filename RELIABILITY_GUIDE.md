## Test Reliability Guide

Complete guide to writing stable, non-flaky Cypress tests.

## Table of Contents

- [Overview](#overview)
- [Common Causes of Flakiness](#common-causes-of-flakiness)
- [Stable Selectors](#stable-selectors)
- [Intelligent Waiting](#intelligent-waiting)
- [Network Stubbing](#network-stubbing)
- [Timeout Configuration](#timeout-configuration)
- [Flaky Test Detection](#flaky-test-detection)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

Test flakiness is when a test passes or fails inconsistently without code changes. This guide provides strategies to eliminate flakiness and make tests reliable.

### Key Principles

1. **Use stable selectors** - data-cy attributes instead of CSS classes
2. **Wait intelligently** - Condition-based waiting instead of fixed delays
3. **Stub third-party services** - Remove external dependencies
4. **Centralize configuration** - Consistent timeouts and retries
5. **Detect flakiness** - Track and fix flaky tests proactively

## Common Causes of Flakiness

### 1. Timing Issues

**Problem:**
```javascript
// ❌ FLAKY
cy.get('.button').click();
cy.wait(2000); // What if operation takes 2.1 seconds?
cy.get('.result').should('be.visible');
```

**Solution:**
```javascript
// ✅ STABLE
cy.get('.button').click();
retryUntil(
  () => cy.get('.result').should('be.visible'),
  { timeout: 10000 }
);
```

### 2. Unstable Selectors

**Problem:**
```javascript
// ❌ FLAKY - CSS classes change
cy.get('.btn.btn-primary.submit-btn').click();

// ❌ FLAKY - nth-child breaks with DOM changes
cy.get('div:nth-child(3) > button').click();
```

**Solution:**
```javascript
// ✅ STABLE - data-cy attribute
cy.getByCy('submit-button').click();
```

### 3. External Dependencies

**Problem:**
```javascript
// ❌ FLAKY - Third-party service might be down
cy.visit('/'); // Page loads Google Analytics
// Test might fail if GA is slow/down
```

**Solution:**
```javascript
// ✅ STABLE - Stub external services
stubAllThirdParty();
cy.visit('/'); // External services stubbed
```

### 4. Race Conditions

**Problem:**
```javascript
// ❌ FLAKY - User data might not be loaded
cy.visit('/dashboard');
cy.get('[data-cy="user-name"]').should('contain', 'John');
```

**Solution:**
```javascript
// ✅ STABLE - Wait for API to complete
cy.intercept('GET', '/api/user').as('getUser');
cy.visit('/dashboard');
cy.wait('@getUser');
cy.get('[data-cy="user-name"]').should('contain', 'John');
```

### 5. State Leakage

**Problem:**
```javascript
// ❌ FLAKY - Test depends on previous test's data
it('test 1', () => {
  cy.visit('/');
  cy.get('[data-cy="item"]').should('have.length', 1);
});

it('test 2', () => {
  // Fails if test 1 didn't clean up
  cy.visit('/');
  cy.get('[data-cy="item"]').should('have.length', 0);
});
```

**Solution:**
```javascript
// ✅ STABLE - Reset state before each test
beforeEach(() => {
  cy.resetState();
});

it('test 1', () => {
  cy.visit('/');
  cy.get('[data-cy="item"]').should('have.length', 1);
});

it('test 2', () => {
  cy.visit('/');
  cy.get('[data-cy="item"]').should('have.length', 0);
});
```

## Stable Selectors

See **[STABLE_SELECTORS_GUIDE.md](./STABLE_SELECTORS_GUIDE.md)** for complete details.

### Quick Reference

```javascript
// ✅ BEST - data-cy attributes
cy.getByCy('submit-button').click();

// ✅ GOOD - data-test attributes
cy.getByTestId('submit-button').click();

// ⚠️ ACCEPTABLE - ARIA attributes
cy.get('[aria-label="Submit"]').click();

// ❌ AVOID - CSS classes
cy.get('.btn-primary').click();

// ❌ AVOID - Text content
cy.contains('Submit').click();
```

## Intelligent Waiting

### retryUntil - Core Utility

**File:** [src/utils/reliability-helpers.js](src/utils/reliability-helpers.js:1)

```javascript
import { retryUntil } from '../utils';

// Wait for condition with retry
retryUntil(
  () => cy.get('[data-cy="status"]').invoke('text').then(text => text === 'Ready'),
  {
    timeout: 10000,
    interval: 500,
    errorMessage: 'Status never became Ready'
  }
);
```

### Specialized Waiting Functions

#### waitForText
```javascript
import { waitForText } from '../utils';

// Wait for specific text
waitForText('[data-cy="status"]', 'Complete', { timeout: 5000 });
```

#### waitForCount
```javascript
import { waitForCount } from '../utils';

// Wait for specific number of elements
waitForCount('[data-cy="list-item"]', 5, { timeout: 3000 });
```

#### waitForStable
```javascript
import { waitForStable } from '../utils';

// Wait for element to stop changing
waitForStable('[data-cy="counter"]', {
  property: 'text',
  stableFor: 1000
});
```

#### waitForApiReady
```javascript
import { waitForApiReady } from '../utils';

// Poll API until ready
waitForApiReady('/api/health', {
  validateResponse: (body) => body.status === 'healthy',
  timeout: 30000
});
```

#### waitForUrl
```javascript
import { waitForUrl } from '../utils';

// Wait for URL to match pattern
waitForUrl('/dashboard');
waitForUrl(/\/user\/\d+/);
```

### Replacing Fragile cy.wait Calls

❌ **Before:**
```javascript
cy.get('[data-cy="button"]').click();
cy.wait(3000); // FRAGILE!
cy.get('[data-cy="result"]').should('be.visible');
```

✅ **After:**
```javascript
cy.get('[data-cy="button"]').click();
retryUntil(
  () => cy.get('[data-cy="result"]').should('be.visible'),
  { timeout: 10000 }
);
```

❌ **Before:**
```javascript
cy.intercept('POST', '/api/login').as('login');
cy.get('[data-cy="submit"]').click();
cy.wait('@login'); // Basic wait
```

✅ **After:**
```javascript
cy.intercept('POST', '/api/login').as('login');
cy.get('[data-cy="submit"]').click();
cy.wait('@login').then((interception) => {
  expect(interception.response.statusCode).to.eq(200);
  expect(interception.response.body).to.have.property('token');
});
```

## Network Stubbing

**File:** [cypress/support/network-stubs.js](cypress/support/network-stubs.js:1)

### Stub All Third-Party Services

```javascript
import { stubAllThirdParty } from '../support/network-stubs';

beforeEach(() => {
  stubAllThirdParty(); // Stubs analytics, ads, fonts, etc.
});
```

### Selective Stubbing

```javascript
import { stubAnalytics, allowRealBackend } from '../support/network-stubs';

beforeEach(() => {
  stubAnalytics(); // Stub non-essential
  allowRealBackend(); // Allow essential API calls
});
```

### Environment-Aware Stubbing

```javascript
import { environmentAwareStubbing } from '../support/network-stubs';

beforeEach(() => {
  environmentAwareStubbing();
  // Automatically configures stubbing based on environment
});
```

### Stubbed Services

- **Analytics**: Google Analytics, Mixpanel, Segment, Amplitude
- **Advertising**: Google Ads, Facebook Ads, Twitter Ads
- **Fonts**: Google Fonts, Adobe Fonts
- **CDN**: Cloudflare, JSDelivr
- **Chat**: Intercom, Zendesk, Drift
- **Error Tracking**: Sentry, Bugsnag, Rollbar

## Timeout Configuration

**File:** [cypress/support/test-config.js](cypress/support/test-config.js:1)

### Centralized Timeouts

```javascript
import { TIMEOUTS } from '../support/test-config';

// Use consistent timeouts
cy.get('[data-cy="button"]', { timeout: TIMEOUTS.element.default });
cy.request('/api/endpoint', { timeout: TIMEOUTS.api.default });
```

### Available Timeout Categories

```javascript
TIMEOUTS.element.default    // 10000ms
TIMEOUTS.element.short      // 5000ms
TIMEOUTS.element.long       // 30000ms

TIMEOUTS.api.default        // 10000ms
TIMEOUTS.api.long           // 30000ms
TIMEOUTS.api.veryLong       // 60000ms

TIMEOUTS.pageLoad.default   // 60000ms
TIMEOUTS.animation.medium   // 500ms
TIMEOUTS.retry.normal       // 500ms
```

### Environment-Aware Timeouts

```javascript
import { getTimeout } from '../support/test-config';

// Automatically adds 1.5x multiplier in CI
const timeout = getTimeout(10000); // 10s local, 15s CI
```

## Flaky Test Detection

**Script:** [ci/flaky-test-detector.js](ci/flaky-test-detector.js:1)

### Running the Detector

```bash
# Analyze test results
node ci/flaky-test-detector.js \
  --results-dir cypress/results \
  --threshold 0.2 \
  --min-runs 10

# Post report to PR
node ci/flaky-test-detector.js --pr-comment
```

### Configuration

```bash
--threshold 0.2        # 20% failure rate = flaky
--min-runs 10          # Need 10 runs before marking flaky
--history-size 50      # Analyze last 50 runs
```

### GitHub Actions Integration

```yaml
- name: Detect Flaky Tests
  if: always()
  run: |
    node ci/flaky-test-detector.js \
      --pr-comment \
      --threshold 0.2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITHUB_REPOSITORY: ${{ github.repository }}
    GITHUB_PR_NUMBER: ${{ github.event.pull_request.number }}
```

## Best Practices

### 1. Always Reset State

```javascript
beforeEach(() => {
  cy.resetState();
});
```

### 2. Use Unique Test Data

```javascript
const uniqueEmail = `test_${Date.now()}@example.com`;
cy.get('[data-cy="email"]').type(uniqueEmail);
```

### 3. Wait for Conditions, Not Time

```javascript
// ❌ DON'T
cy.wait(2000);

// ✅ DO
retryUntil(() => cy.get('[data-cy="loaded"]').should('exist'));
```

### 4. Stub External Dependencies

```javascript
beforeEach(() => {
  stubAllThirdParty();
});
```

### 5. Use Stable Selectors

```javascript
// ❌ DON'T
cy.get('.class-name').click();

// ✅ DO
cy.getByCy('button-name').click();
```

### 6. Handle Loading States

```javascript
// Wait for loading to finish
cy.get('[data-cy="loading"]').should('not.exist');

// Then interact with content
cy.get('[data-cy="content"]').should('be.visible');
```

### 7. Validate API Responses

```javascript
cy.wait('@apiCall').then((interception) => {
  expect(interception.response.statusCode).to.eq(200);
  expect(interception.response.body).to.have.property('data');
});
```

### 8. Use Appropriate Timeouts

```javascript
import { TIMEOUTS } from '../support/test-config';

cy.get('[data-cy="slow-element"]', {
  timeout: TIMEOUTS.element.long
});
```

### 9. Cleanup Test Data

```javascript
afterEach(() => {
  cy.cleanupEntity('users', userId);
});
```

### 10. Screenshot on Failure

```javascript
// Already configured in cypress.config.js
screenshotOnRunFailure: true
```

## Examples

See **[cypress/e2e/reliable-tests-examples.cy.js](cypress/e2e/reliable-tests-examples.cy.js:1)** for comprehensive examples.

### Example 1: Replacing cy.wait

❌ **Fragile:**
```javascript
loginPage.load();
cy.wait(3000);
loginPage.login('user', 'pass');
```

✅ **Reliable:**
```javascript
loginPage.load();
retryUntil(
  () => cy.getByCy('login-form').should('be.visible'),
  { timeout: 10000 }
);
loginPage.login('user', 'pass');
```

### Example 2: Waiting for List Items

❌ **Fragile:**
```javascript
cy.visit('/dashboard');
cy.wait(2000);
cy.get('.item').should('have.length', 5);
```

✅ **Reliable:**
```javascript
cy.visit('/dashboard');
waitForCount('[data-cy="item"]', 5, { timeout: 10000 });
```

### Example 3: Waiting for API

❌ **Fragile:**
```javascript
cy.get('[data-cy="load-button"]').click();
cy.wait(5000);
cy.get('[data-cy="data"]').should('exist');
```

✅ **Reliable:**
```javascript
cy.intercept('GET', '/api/data').as('getData');
cy.get('[data-cy="load-button"]').click();
cy.wait('@getData').its('response.statusCode').should('eq', 200);
cy.get('[data-cy="data"]').should('exist');
```

### Example 4: Handling Animations

❌ **Fragile:**
```javascript
cy.get('[data-cy="dropdown"]').click();
cy.wait(500);
cy.get('[data-cy="option"]').click();
```

✅ **Reliable:**
```javascript
cy.get('[data-cy="dropdown"]').click();
cy.get('[data-cy="dropdown-menu"]')
  .should('be.visible')
  .and('have.css', 'opacity', '1');
cy.get('[data-cy="option"]').click();
```

## Troubleshooting

### Test is Still Flaky After Following Guide

1. **Check network dependencies**: Are there un-stubbed external calls?
2. **Verify selectors**: Are selectors truly stable?
3. **Review timeouts**: Are timeouts appropriate for operation?
4. **Check state isolation**: Does test depend on other tests?
5. **Run flaky detector**: Analyze historical results

### How to Debug Flaky Test

1. **Run test multiple times**:
   ```bash
   npx cypress run --spec "cypress/e2e/test.cy.js" --headed
   ```

2. **Add debugging**:
   ```javascript
   cy.getByCy('element').then($el => {
     console.log('Element:', $el);
     debugger;
   });
   ```

3. **Increase logging**:
   ```javascript
   retryUntil(
     () => cy.getByCy('status').invoke('text'),
     { log: true } // Logs each attempt
   );
   ```

4. **Check network tab**: Are there unexpected API calls?

5. **Review screenshots/videos**: What was the state when it failed?

## Summary Checklist

- [ ] Use data-cy selectors
- [ ] Replace cy.wait() with retryUntil()
- [ ] Stub third-party services
- [ ] Reset state in beforeEach()
- [ ] Use centralized timeouts
- [ ] Validate API responses
- [ ] Handle loading states
- [ ] Use unique test data
- [ ] Clean up after tests
- [ ] Run flaky test detector in CI

## Resources

- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [STABLE_SELECTORS_GUIDE.md](./STABLE_SELECTORS_GUIDE.md)
- [reliability-helpers.js](./src/utils/reliability-helpers.js)
- [network-stubs.js](./cypress/support/network-stubs.js)
- [test-config.js](./cypress/support/test-config.js)
