# Quick Reference Guide

## Page Object Model - Quick Reference

### LoginPage

```javascript
import { LoginPage } from '../pages';
const loginPage = new LoginPage();

// Navigation
loginPage.load()                          // Go to login page
loginPage.clickSignup()                   // Go to signup
loginPage.clickForgotPassword()           // Go to forgot password

// Interactions
loginPage.enterUsername('testuser')       // Enter username
loginPage.enterPassword('pass123')        // Enter password
loginPage.clickSubmit()                   // Submit form
loginPage.toggleRememberMe(true)          // Toggle remember me

// Compound Actions
loginPage.login(user, pass, rememberMe)   // Complete login flow
loginPage.loginWithFixture('validUser')   // Login with fixture
loginPage.loginWithEnv()                  // Login with env vars

// Assertions
loginPage.verifyPageLoaded()              // Verify page loaded
loginPage.verifyErrorMessage('msg')       // Verify error shown
loginPage.verifyLoginSuccess('/dashboard')// Verify redirect
```

### DashboardPage

```javascript
import { DashboardPage } from '../pages';
const dashboardPage = new DashboardPage();

// Navigation
dashboardPage.load()                      // Go to dashboard
dashboardPage.logout()                    // Logout user
dashboardPage.navigateToHome()            // Go to home
dashboardPage.navigateToAccount()         // Go to account
dashboardPage.openSettings()              // Open settings

// Interactions
dashboardPage.search('term')              // Search
dashboardPage.openNotifications()         // Open notifications
dashboardPage.clickCreate()               // Open create form
dashboardPage.clickTransaction(0)         // Click transaction
dashboardPage.toggleMenu()                // Toggle menu

// Data Access
dashboardPage.getUserGreeting()           // Get greeting
dashboardPage.getBalance()                // Get balance
dashboardPage.getTransactions()           // Get all transactions
dashboardPage.getTransactionByIndex(0)    // Get specific transaction

// Assertions
dashboardPage.verifyPageLoaded()          // Verify page loaded
dashboardPage.verifyUserLoggedIn('user')  // Verify logged in
dashboardPage.verifyTransactionsDisplayed(5) // Verify transactions
dashboardPage.verifyBalanceDisplayed('$100') // Verify balance
```

## Custom Commands - Quick Reference

### Authentication

```javascript
cy.login('username', 'password')          // Login with session
cy.loginWithFixture('validUser')          // Login with fixture
cy.loginUser()                            // Login with env vars
cy.logout()                               // Logout
```

### Data Seeding

```javascript
cy.seedData('/api/endpoint', {...})       // Seed data via API
cy.seedTransactions(5)                    // Seed 5 transactions
cy.seedNotifications(3)                   // Seed 3 notifications
```

### State Management

```javascript
cy.resetState()                           // Clear all state
cy.resetUser('username')                  // Reset user data
```

### API Mocking

```javascript
cy.interceptAuth('success')               // Mock auth API
cy.waitForApi('alias', 5000)             // Wait for API
cy.mockApi('GET', '/api/users', {...}, 'getUsers')
```

### Element Interactions

```javascript
cy.get('button').stableClick()            // Stable click
cy.get('input').slowType('text', 100)     // Type with delay
cy.get('.status').retryUntil(($el) => {   // Retry until
  return $el.text() === 'Complete';
})
```

## Test Utilities - Quick Reference

### API Helpers

```javascript
import {
  waitForApi,
  interceptAuth,
  interceptEndpoint,
  interceptWithDelay
} from '../utils';

waitForApi('loginRequest', 200, 5000)
interceptAuth(true)
interceptEndpoint('GET', '/api/users', {...}, 'getUsers')
interceptWithDelay('GET', '/api/slow', 3000, 'slowApi')
```

### DOM Helpers

```javascript
import {
  stableClick,
  safeType,
  retryUntil,
  waitForElement,
  waitForElementToDisappear,
  scrollAndClick
} from '../utils';

stableClick('submit-button', true)
safeType('username', 'testuser', true)
waitForElement('.loading', 5000)
waitForElementToDisappear('.loading', 5000)
scrollAndClick('footer-link')
```

### Data Generation

```javascript
import {
  generateRandomEmail,
  generateRandomUsername,
  generateRandomString,
  generateRandomNumber,
  formatCurrency
} from '../utils';

const email = generateRandomEmail('test')      // test_123_456@example.com
const username = generateRandomUsername('user') // user_123_456
const str = generateRandomString(10)           // aBc123XyZ4
const num = generateRandomNumber(1, 100)       // Random 1-100
const money = formatCurrency(1234.56, '$')     // $1,234.56
```

### Date Helpers

```javascript
import {
  formatDate,
  getPastDate,
  getFutureDate
} from '../utils';

formatDate(new Date(), 'YYYY-MM-DD')      // 2025-10-21
getPastDate(7)                            // Date 7 days ago
getFutureDate(7)                          // Date 7 days from now
```

### Validation

```javascript
import { isValidEmail, isValidUrl } from '../utils';

isValidEmail('test@example.com')          // true
isValidUrl('https://example.com')         // true
```

### Environment & Storage

```javascript
import {
  getEnv,
  isCI,
  setLocalStorage,
  getLocalStorage,
  clearAllStorage
} from '../utils';

getEnv('apiUrl', 'http://localhost:3001')
isCI()                                    // true/false
setLocalStorage('token', 'abc123')
getLocalStorage('token')
clearAllStorage()
```

## BDD - Quick Reference

### Feature File Structure

```gherkin
Feature: Feature Name
  As a [role]
  I want to [action]
  So that [benefit]

  Background:
    Given common setup step

  @smoke
  Scenario: Scenario name
    Given I am on the page
    When I perform an action
    Then I should see a result

  @regression
  Scenario Outline: Data-driven scenario
    When I enter "<username>" and "<password>"
    Then I should see "<result>"

    Examples:
      | username | password | result  |
      | user1    | pass1    | success |
      | user2    | pass2    | success |
```

### Step Definition Structure

```javascript
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { LoginPage } from '../../pages';

const loginPage = new LoginPage();

Given('I am on the login page', () => {
  loginPage.load().verifyPageLoaded();
});

When('I enter {string} and {string}', (username, password) => {
  loginPage.enterUsername(username);
  loginPage.enterPassword(password);
});

Then('I should be redirected to {string}', (url) => {
  cy.url().should('include', url);
});
```

## Test Structure - Quick Reference

### Standard Cypress Test

```javascript
import { LoginPage, DashboardPage } from '../../src/pages';
import { interceptAuth, waitForApi } from '../../src/utils';

describe('Test Suite', () => {
  let loginPage;
  let dashboardPage;

  beforeEach(() => {
    loginPage = new LoginPage();
    dashboardPage = new DashboardPage();
    cy.resetState();
  });

  context('@smoke - Critical Tests', () => {
    it('should perform action', () => {
      // Arrange
      interceptAuth(true);

      // Act
      loginPage.load().loginWithEnv();

      // Assert
      waitForApi('authRequest', 200);
      loginPage.verifyLoginSuccess();
    });
  });

  context('@regression - Detailed Tests', () => {
    it('should handle error', () => {
      // Test implementation
    });
  });
});
```

## Import Patterns

### Single-Point Imports (Recommended)

```javascript
// Pages
import { LoginPage, DashboardPage } from '../../src/pages';

// Utils
import {
  waitForApi,
  stableClick,
  generateRandomEmail
} from '../../src/utils';
```

### Individual Imports

```javascript
// Individual page import
import LoginPage from '../../src/pages/LoginPage';

// Individual util import
import { waitForApi } from '../../src/utils/test-utils';
```

## Common Patterns

### Pattern 1: Login and Verify

```javascript
loginPage.load().loginWithEnv();
dashboardPage.verifyPageLoaded().verifyUserLoggedIn();
```

### Pattern 2: Mock API and Test

```javascript
interceptAuth(true);
loginPage.loginWithEnv();
waitForApi('authRequest', 200);
```

### Pattern 3: Seed Data and Test

```javascript
cy.seedTransactions(5);
dashboardPage.load().verifyTransactionsDisplayed(5);
```

### Pattern 4: Error Handling

```javascript
interceptAuth(false);
loginPage.loginWithEnv();
loginPage.verifyErrorMessage('Invalid credentials');
```

### Pattern 5: Form Interaction

```javascript
const email = generateRandomEmail('test');
safeType('email-input', email);
stableClick('submit-button');
waitForApi('submitForm', 200);
```

## File Locations

```
Page Objects:           src/pages/*.js
Feature Files:          src/tests/features/*.feature
Step Definitions:       src/tests/step-definitions/*.steps.js
Test Utilities:         src/utils/test-utils.js
Custom Commands:        cypress/support/commands.js
Standard Tests:         cypress/e2e/*.cy.js
Fixtures:              cypress/fixtures/*.json
```

## Running Tests

```bash
# Interactive mode
npm run test:open

# Headless mode
npm run test:run

# By tag
npm run test:smoke
npm run test:regression

# Specific file
npx cypress run --spec "cypress/e2e/login-pom.cy.js"
npx cypress run --spec "src/tests/features/login.feature"

# With environment variables
BASE_URL=https://example.com npm run test:run
```

## Debugging Tips

```javascript
// Take screenshot
cy.takeTimestampedScreenshot('login-error');

// Log to terminal
cy.logMessage('Starting login test');

// Debug element
cy.get('[data-test="submit"]').debug();

// Pause execution
cy.pause();

// Print variable
cy.log('Username:', username);

// Get element info
cy.get('[data-test="submit"]').then(($el) => {
  console.log('Element:', $el);
});
```

## Best Practices Checklist

- ✅ Use page objects for all UI interactions
- ✅ Use single-point imports for pages and utils
- ✅ Reset state before each test
- ✅ Use data-test attributes for selectors
- ✅ Mock external API calls
- ✅ Use fixtures for test data
- ✅ Tag tests with @smoke or @regression
- ✅ Use descriptive test names
- ✅ Keep tests independent
- ✅ Use custom commands for common flows
- ✅ Wait for API calls to complete
- ✅ Use method chaining for readability
- ✅ Verify all assertions
- ✅ Clean up test data after tests
