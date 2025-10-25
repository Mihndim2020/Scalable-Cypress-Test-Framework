# Test Architecture Documentation

This document describes the modular test architecture using Page Object Model (POM) and Behavior-Driven Development (BDD).

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Page Object Model](#page-object-model)
- [BDD with Cucumber](#bdd-with-cucumber)
- [Custom Commands](#custom-commands)
- [Test Utilities](#test-utilities)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Architecture Overview

The test architecture follows a layered approach:

```
┌─────────────────────────────────────────┐
│         Test Layer (BDD/POM)            │
│  - Feature Files (.feature)             │
│  - Step Definitions (.steps.js)        │
│  - Test Files (.cy.js)                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Page Object Layer               │
│  - BasePage (base functionality)        │
│  - LoginPage, DashboardPage, etc.       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│    Custom Commands & Utilities          │
│  - Cypress Commands (commands.js)       │
│  - Test Utils (test-utils.js)           │
│  - Helper Functions (helpers.js)        │
└─────────────────────────────────────────┘
```

## Page Object Model

### Directory Structure

```
src/
├── pages/
│   ├── BasePage.js         # Base class with common methods
│   ├── LoginPage.js        # Login page object
│   ├── DashboardPage.js    # Dashboard page object
│   └── index.js            # Single-point export
```

### BasePage

The `BasePage` class provides common functionality for all page objects:

**Key Methods:**
- `visit(url)` - Navigate to a URL
- `getElement(selector)` - Get element by CSS selector
- `getByTestId(testId)` - Get element by data-test attribute
- `click(selector)` - Click an element
- `type(selector, text)` - Type text into input
- `verifyUrlContains(text)` - Assert URL contains text
- `verifyElementVisible(selector)` - Assert element is visible
- `waitForElement(selector)` - Wait for element to be visible

**Example:**
```javascript
import BasePage from './BasePage';

class MyPage extends BasePage {
  load() {
    this.visit('/my-page');
    return this;
  }
}
```

### LoginPage

The `LoginPage` handles all login-related interactions.

**Key Methods:**

1. **Load & Navigation**
   - `load()` - Navigate to login page
   - `clickSignup()` - Navigate to signup
   - `clickForgotPassword()` - Navigate to forgot password

2. **Interactions**
   - `enterUsername(username)` - Enter username
   - `enterPassword(password)` - Enter password
   - `clickSubmit()` - Submit form
   - `toggleRememberMe(check)` - Toggle remember me checkbox

3. **Compound Actions**
   - `login(username, password, rememberMe)` - Complete login flow
   - `loginWithFixture(userType)` - Login using fixture data
   - `loginWithEnv()` - Login using environment variables

4. **Assertions**
   - `verifyPageLoaded()` - Verify login page loaded
   - `verifyErrorMessage(message)` - Verify error displayed
   - `verifyLoginSuccess(url)` - Verify successful login
   - `verifySubmitDisabled()` - Verify submit button disabled

**Example Usage:**
```javascript
import { LoginPage } from '../pages';

const loginPage = new LoginPage();

loginPage
  .load()
  .login('testuser', 'Password123!')
  .verifyLoginSuccess('/dashboard');
```

### DashboardPage

The `DashboardPage` handles all dashboard interactions.

**Key Methods:**

1. **Load & Navigation**
   - `load()` - Navigate to dashboard
   - `logout()` - Logout user
   - `navigateToHome()` - Navigate to home
   - `navigateToAccount()` - Navigate to account

2. **Interactions**
   - `openNotifications()` - Open notifications panel
   - `openSettings()` - Open settings
   - `search(searchTerm)` - Search for content
   - `clickCreate()` - Open create form
   - `toggleMenu()` - Toggle side navigation

3. **Data Access**
   - `getUserGreeting()` - Get user greeting text
   - `getBalance()` - Get account balance
   - `getTransactions()` - Get all transactions
   - `getTransactionByIndex(index)` - Get specific transaction

4. **Assertions**
   - `verifyPageLoaded()` - Verify dashboard loaded
   - `verifyUserLoggedIn(username)` - Verify user is logged in
   - `verifyTransactionsDisplayed(count)` - Verify transactions shown
   - `verifyBalanceDisplayed(amount)` - Verify balance shown

**Example Usage:**
```javascript
import { DashboardPage } from '../pages';

const dashboardPage = new DashboardPage();

dashboardPage
  .load()
  .verifyPageLoaded()
  .verifyUserLoggedIn('testuser')
  .clickTransaction(0);
```

### Single-Point Import

All page objects can be imported from a single location:

```javascript
import { LoginPage, DashboardPage } from '../pages';
// or
import Pages from '../pages';

const loginPage = new Pages.LoginPage();
```

## BDD with Cucumber

### Directory Structure

```
src/
├── tests/
│   ├── features/
│   │   ├── login.feature       # Login scenarios
│   │   └── dashboard.feature   # Dashboard scenarios
│   └── step-definitions/
│       ├── login.steps.js      # Login step definitions
│       └── dashboard.steps.js  # Dashboard step definitions
```

### Feature Files

Feature files use Gherkin syntax to describe test scenarios:

**Example: login.feature**
```gherkin
Feature: User Login
  As a registered user
  I want to log in to the application
  So that I can access my dashboard

  Background:
    Given I am on the login page

  @smoke
  Scenario: Successful login with valid credentials
    When I enter valid username and password
    And I click the submit button
    Then I should be redirected to the dashboard
    And I should see a welcome message
```

### Step Definitions

Step definitions map Gherkin steps to actual test code:

**Example: login.steps.js**
```javascript
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { LoginPage } from '../../pages';

const loginPage = new LoginPage();

Given('I am on the login page', () => {
  loginPage.load();
  loginPage.verifyPageLoaded();
});

When('I enter valid username and password', () => {
  cy.fixture('users').then((users) => {
    loginPage.login(users.validUser.username, users.validUser.password);
  });
});
```

### Running BDD Tests

```bash
# Run all feature files
npm run test:run

# Run specific feature
npx cypress run --spec "src/tests/features/login.feature"

# Run by tag
npm run test:smoke
npm run test:regression
```

## Custom Commands

Custom commands are defined in `cypress/support/commands.js`.

### Authentication Commands

- `cy.login(username, password)` - Login with session management
- `cy.loginWithFixture(userType)` - Login using fixture
- `cy.loginUser()` - Login using environment variables
- `cy.logout()` - Logout and clear session

**Example:**
```javascript
cy.loginUser();
cy.visit('/dashboard');
cy.logout();
```

### Data Seeding Commands

- `cy.seedData(endpoint, data)` - Seed data via API
- `cy.seedTransactions(count)` - Seed multiple transactions
- `cy.seedNotifications(count)` - Seed notifications

**Example:**
```javascript
cy.seedTransactions(5);
cy.seedNotifications(3);
```

### State Reset Commands

- `cy.resetState()` - Clear all cookies, localStorage, and reset database
- `cy.resetUser(username)` - Reset specific user data

**Example:**
```javascript
beforeEach(() => {
  cy.resetState();
});
```

### API Intercept Commands

- `cy.interceptAuth(response)` - Intercept authentication API
- `cy.waitForApi(alias, timeout)` - Wait for API call
- `cy.mockApi(method, url, response, alias)` - Mock API response

**Example:**
```javascript
cy.interceptAuth('success');
cy.login('user', 'pass');
cy.waitForApi('loginRequest');
```

### Child Commands

- `cy.get('button').stableClick()` - Stable click (waits for element)
- `cy.get('input').slowType('text', delay)` - Type with delay
- `cy.get('.status').retryUntil(assertion)` - Retry until condition met

**Example:**
```javascript
cy.get('[data-test="submit"]').stableClick();
cy.get('[data-test="username"]').slowType('testuser', 100);
```

## Test Utilities

Test utilities are in `src/utils/test-utils.js`.

### API Helpers

- `waitForApi(alias, expectedStatus, timeout)` - Wait for API and verify status
- `interceptAuth(shouldSucceed)` - Intercept auth endpoints
- `interceptEndpoint(method, url, data, alias)` - Intercept any endpoint
- `interceptWithDelay(method, url, delay, alias)` - Intercept with delay

**Example:**
```javascript
import { waitForApi, interceptAuth } from '../utils';

interceptAuth(true);
cy.login('user', 'pass');
waitForApi('authRequest', 200);
```

### DOM Interaction Helpers

- `stableClick(selector, useTestId)` - Stable click with waits
- `safeType(selector, text, useTestId)` - Safe type with validation
- `retryUntil(checkFunction, maxRetries, delay)` - Retry until condition
- `waitForElement(selector, timeout)` - Wait for element to appear
- `waitForElementToDisappear(selector, timeout)` - Wait for element to disappear
- `scrollAndClick(selector)` - Scroll into view and click

**Example:**
```javascript
import { stableClick, waitForElement } from '../utils';

waitForElement('.loading-spinner', 5000);
stableClick('submit-button');
```

### Data Generation Helpers

- `generateRandomEmail(prefix)` - Generate random email
- `generateRandomUsername(prefix)` - Generate random username
- `generateRandomString(length)` - Generate random string
- `generateRandomNumber(min, max)` - Generate random number
- `formatCurrency(amount, currency)` - Format currency

**Example:**
```javascript
import { generateRandomEmail, generateRandomUsername } from '../utils';

const email = generateRandomEmail('test');
const username = generateRandomUsername('user');
```

### Date Helpers

- `formatDate(date, format)` - Format date to string
- `getPastDate(days)` - Get date in the past
- `getFutureDate(days)` - Get date in the future

**Example:**
```javascript
import { formatDate, getPastDate } from '../utils';

const today = formatDate(new Date(), 'YYYY-MM-DD');
const lastWeek = getPastDate(7);
```

### Single-Point Import

All utilities can be imported from a single location:

```javascript
import { waitForApi, stableClick, generateRandomEmail } from '../utils';
// or
import TestUtils from '../utils';
```

## Usage Examples

### Example 1: Standard Cypress Test with POM

```javascript
import { LoginPage, DashboardPage } from '../../src/pages';

describe('Login Flow', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();

  it('should login and view dashboard', () => {
    loginPage
      .load()
      .login('testuser', 'Password123!')
      .verifyLoginSuccess();

    dashboardPage
      .verifyPageLoaded()
      .verifyUserLoggedIn('testuser');
  });
});
```

### Example 2: BDD Test with Step Definitions

**Feature File:**
```gherkin
@smoke
Scenario: Login and logout
  Given I am on the login page
  When I login with valid credentials
  Then I should see the dashboard
  When I logout
  Then I should see the login page
```

**Step Definitions:**
```javascript
import { LoginPage, DashboardPage } from '../../pages';

const loginPage = new LoginPage();
const dashboardPage = new DashboardPage();

When('I login with valid credentials', () => {
  loginPage.loginWithEnv();
});

Then('I should see the dashboard', () => {
  dashboardPage.verifyPageLoaded();
});
```

### Example 3: Using Test Utilities

```javascript
import { DashboardPage } from '../../src/pages';
import {
  interceptEndpoint,
  waitForApi,
  stableClick,
  generateRandomEmail,
} from '../../src/utils';

it('should create transaction with mocked API', () => {
  const dashboardPage = new DashboardPage();

  // Mock API response
  interceptEndpoint(
    'POST',
    '**/api/transactions',
    { id: 1, status: 'success' },
    'createTransaction'
  );

  // Use page object
  dashboardPage.load();

  // Use utility for stable click
  stableClick('create-button');

  // Generate test data
  const email = generateRandomEmail('recipient');

  // Fill form and submit
  cy.get('[data-test="recipient"]').type(email);
  cy.get('[data-test="amount"]').type('100');
  stableClick('submit-transaction');

  // Wait for API
  waitForApi('createTransaction', 200);
});
```

## Best Practices

### 1. Page Object Design

- **Single Responsibility**: Each page object represents one page or component
- **Method Chaining**: Return `this` from methods for chaining
- **Clear Names**: Use descriptive method names (e.g., `verifyLoginSuccess`)
- **Selectors**: Store selectors in a `selectors` object
- **Assertions**: Prefix assertion methods with `verify`

### 2. Step Definitions

- **Keep them Simple**: Step definitions should be thin wrappers
- **Reuse Page Objects**: Use page objects within step definitions
- **Shared Steps**: Create common steps in a shared file
- **Clear Imports**: Import only what you need

### 3. Test Organization

- **Use Contexts**: Group related tests with `context()`
- **Use Tags**: Tag tests with `@smoke`, `@regression`
- **Clear Descriptions**: Use descriptive test names
- **Setup/Teardown**: Use `beforeEach`/`afterEach` for common setup

### 4. Custom Commands

- **Authentication**: Use commands for login/logout
- **Data Seeding**: Use commands for test data setup
- **API Mocking**: Use commands for consistent API mocking
- **Avoid Overuse**: Don't create commands for simple actions

### 5. Test Data

- **Fixtures**: Use fixtures for static test data
- **Environment Variables**: Use env vars for configuration
- **Random Data**: Generate random data for unique values
- **Data Cleanup**: Reset state between tests

### 6. API Testing

- **Mock Strategically**: Mock external dependencies
- **Intercept Patterns**: Use consistent intercept patterns
- **Wait for APIs**: Always wait for API responses
- **Verify Responses**: Check status codes and response data

## Configuration

### Cucumber Preprocessor

Configuration in `.cypress-cucumber-preprocessorrc.json`:

```json
{
  "stepDefinitions": [
    "cypress/e2e/**/*.{js,ts}",
    "src/tests/step-definitions/**/*.{js,ts}"
  ],
  "filterSpecs": true,
  "omitFiltered": true
}
```

### Cypress Config

Configuration in `cypress.config.js`:

```javascript
specPattern: [
  'cypress/e2e/**/*.{feature,cy.js}',
  'src/tests/features/**/*.feature'
]
```

## Running Tests

```bash
# Open Cypress Test Runner
npm run test:open

# Run all tests headless
npm run test:run

# Run smoke tests
npm run test:smoke

# Run regression tests
npm run test:regression

# Run specific feature
npx cypress run --spec "src/tests/features/login.feature"
```

## Troubleshooting

### Step Definitions Not Found

Ensure step definitions path is correct in `.cypress-cucumber-preprocessorrc.json`.

### Import Errors

Check that paths are correct. Use relative imports from test files:
```javascript
import { LoginPage } from '../../src/pages';
```

### Page Object Methods Not Working

Ensure you're calling methods on the correct page object instance and that the selectors match your application.

## Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Page Object Model Pattern](https://martinfowler.com/bliki/PageObject.html)
- [Cucumber Best Practices](https://cucumber.io/docs/bdd/)
- [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app)
