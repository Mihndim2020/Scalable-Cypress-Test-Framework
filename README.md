# Noveo Cypress Sample Project

This is a Cypress E2E testing project based on the Cypress Real World App (RWA) structure. It implements a **modular test architecture** using Page Object Model (POM) and Behavior-Driven Development (BDD) with Cucumber.

## Features

- **Page Object Model (POM)** - Maintainable and reusable page objects
- **BDD with Cucumber** - Gherkin syntax for readable test scenarios
- **Scalable Test Data Strategy** - Fixtures, data factories, and environment-aware seeding
- **Data-Driven Testing** - Parametrized tests with multiple user roles
- **Custom Commands** - Reusable commands for common flows (login, seedData, resetState)
- **Test Utilities** - Helper functions for API mocking, DOM interactions, and data generation
- **Single-Point Imports** - Organized exports for pages and utilities
- **Intelligent Parallelization** - Hash-based sharding with duration balancing (4x faster CI)
- **Selective Testing** - Git diff-based test selection for fast PR feedback (10x faster)
- **Automatic Retry Logic** - Failed shard retry up to 3 times for flaky test resilience
- **Docker Support** - Containerized test execution for reproducibility
- **BrowserStack Integration** - Real device and cross-browser testing
- **Security & Secrets Management** - Environment validation, secret redaction, ephemeral users
- **Comprehensive Reporting** - Allure, Mochawesome, metrics dashboard, GitHub Pages
- **Code Quality Tools** - ESLint and Prettier for consistent code
- **CI/CD Ready** - Comprehensive GitHub Actions workflows with parallel execution

📖 **Documentation:**
- **[Test Matrix](./docs/TEST_MATRIX.md)** - Representative RWA test flows and coverage
- **[Architecture Guide](./ARCHITECTURE.md)** - Modular test architecture details
- **[Test Data Strategy](./TEST_DATA_STRATEGY.md)** - Comprehensive data management guide
- **[Reliability Guide](./RELIABILITY_GUIDE.md)** - Writing stable, non-flaky tests
- **[Parallelization Guide](./docs/PARALLELIZATION_GUIDE.md)** - Intelligent parallelization and selective testing
- **[Parallelization Quick Ref](./docs/PARALLELIZATION_QUICK_REF.md)** - Quick command reference
- **[CI/CD Setup Guide](./CI_SETUP.md)** - GitHub Actions workflows and configuration
- **[Docker Execution Guide](./DOCKER_EXECUTION_GUIDE.md)** - Running tests in Docker containers
- **[BrowserStack Integration Guide](./BROWSERSTACK_INTEGRATION_GUIDE.md)** - Cross-browser testing setup
- **[Cross-Browser Quick Start](./CROSS_BROWSER_QUICKSTART.md)** - Quick reference for all execution methods
- **[Quick Reference](./QUICK_REFERENCE.md)** - Quick API reference
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - What's been implemented

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Noveo-Cypress-Sample-Project
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration values.

## Project Structure

```
Noveo-Cypress-Sample-Project/
├── cypress/
│   ├── e2e/                           # E2E test files
│   │   ├── *.cy.js                    # Standard Cypress tests (with POM)
│   │   ├── *.feature                  # BDD feature files
│   │   └── example/steps.js           # Step definitions (legacy)
│   ├── fixtures/                      # Test data files (JSON)
│   │   └── users.json                 # User test data
│   ├── support/                       # Support files and custom commands
│   │   ├── commands.js                # Custom Cypress commands
│   │   └── e2e.js                     # Global configuration and hooks
│   ├── screenshots/                   # Screenshots from test failures
│   └── videos/                        # Video recordings of test runs
├── src/
│   ├── pages/                         # Page Object Models (POM)
│   │   ├── BasePage.js                # Base class with common methods
│   │   ├── LoginPage.js               # Login page object (8+ methods)
│   │   ├── DashboardPage.js           # Dashboard page object (12+ methods)
│   │   └── index.js                   # Single-point export for pages
│   ├── tests/
│   │   ├── features/                  # BDD feature files (Gherkin)
│   │   │   ├── login.feature          # Login scenarios
│   │   │   └── dashboard.feature      # Dashboard scenarios
│   │   └── step-definitions/          # Cucumber step definitions
│   │       ├── login.steps.js         # Login steps
│   │       └── dashboard.steps.js     # Dashboard steps
│   └── utils/                         # Utility functions
│       ├── test-utils.js              # Test utilities (40+ functions)
│       ├── helpers.js                 # Legacy helpers
│       └── index.js                   # Single-point export for utils
├── ci/                                # CI/CD configuration files
│   └── github-actions.yml             # GitHub Actions workflow
├── cypress.config.js                  # Cypress configuration
├── .cypress-cucumber-preprocessorrc.json  # Cucumber preprocessor config
├── .eslintrc.json             # ESLint configuration
├── .prettierrc.json           # Prettier configuration
├── .env.example               # Example environment variables
└── package.json               # Project dependencies and scripts
```

## Quick Start Guide

### Using Page Object Model (POM)

```javascript
import { LoginPage, DashboardPage } from '../../src/pages';

describe('Login Flow', () => {
  it('should login successfully', () => {
    const loginPage = new LoginPage();
    const dashboardPage = new DashboardPage();

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

### Using BDD with Cucumber

**Feature File** (`src/tests/features/login.feature`):
```gherkin
@smoke
Scenario: Successful login
  Given I am on the login page
  When I enter valid username and password
  And I click the submit button
  Then I should be redirected to the dashboard
```

**Step Definitions** (`src/tests/step-definitions/login.steps.js`):
```javascript
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { LoginPage } from '../../pages';

const loginPage = new LoginPage();

Given('I am on the login page', () => {
  loginPage.load().verifyPageLoaded();
});
```

### Using Custom Commands

```javascript
// Login with session management
cy.loginUser();

// Seed test data
cy.seedTransactions(5);
cy.seedNotifications(3);

// Reset application state
cy.resetState();
```

### Using Test Utilities

```javascript
import {
  waitForApi,
  interceptAuth,
  stableClick,
  generateRandomEmail
} from '../../src/utils';

// Mock authentication
interceptAuth(true);
cy.login('user', 'pass');
waitForApi('authRequest', 200);

// Generate test data
const email = generateRandomEmail('test');

// Stable interactions
stableClick('submit-button');
```

## Available Scripts

### Test Execution

- **Open Cypress Test Runner**
  ```bash
  npm run test:open
  ```
  Opens the Cypress Test Runner in interactive mode.

- **Run All Tests (Headless)**
  ```bash
  npm run test:run
  ```
  Runs all tests in headless mode.

- **Run Smoke Tests**
  ```bash
  npm run test:smoke
  ```
  Runs tests tagged with `@smoke` (critical user journeys).

- **Run Regression Tests**
  ```bash
  npm run test:regression
  ```
  Runs tests tagged with `@regression` (detailed functionality tests).

- **Browser-Specific Tests**
  ```bash
  npm run test:chrome    # Chrome browser
  npm run test:firefox   # Firefox browser
  npm run test:edge      # Edge browser
  ```

### Parallelization & Selective Testing

Intelligent test execution for faster feedback:

- **Collect Tests**
  ```bash
  npm run parallel:collect         # Generate test collection with tags
  node scripts/collect-tests.js --tag @smoke  # Filter by tag
  ```

- **Shard Tests (Local)**
  ```bash
  npm run parallel:shard -- --total 4 --index 0  # Run shard 0 of 4
  node scripts/shard-tests.js --total 4 --index 1 --tag @smoke  # Shard with filter
  ```

- **Selective Testing (PR Mode)**
  ```bash
  npm run parallel:selective       # Auto-detect changed tests
  node scripts/selective-runner.js --base origin/develop  # Custom base branch
  ```

See [Parallelization Guide](./docs/PARALLELIZATION_GUIDE.md) for details.

### Docker Execution

Run tests in Docker containers for reproducible environments:

- **Run Tests in Docker**
  ```bash
  npm run docker:test      # Headless mode
  npm run docker:smoke     # Smoke tests only
  npm run docker:chrome    # Chrome browser
  npm run docker:firefox   # Firefox browser
  npm run docker:edge      # Edge browser
  npm run docker:headed    # Interactive mode (requires X11)
  ```

- **Docker Management**
  ```bash
  npm run docker:build     # Build Docker image
  npm run docker:clean     # Clean up containers and artifacts
  npm run docker:shell     # Open shell in container
  ```

See **[DOCKER_EXECUTION_GUIDE.md](./DOCKER_EXECUTION_GUIDE.md)** for detailed documentation.

### BrowserStack Execution

Run tests on real devices via BrowserStack:

- **Run on BrowserStack**
  ```bash
  npm run browserstack:run      # Run on all configured browsers
  npm run browserstack:local    # Run with local tunnel (for localhost)
  npm run browserstack:info     # View build information
  npm run browserstack:stop     # Stop running build
  ```

See **[BROWSERSTACK_INTEGRATION_GUIDE.md](./BROWSERSTACK_INTEGRATION_GUIDE.md)** for complete setup.

### Reporting

- **Generate Reports**
  ```bash
  npm run report:merge      # Merge Mochawesome reports
  npm run report:generate   # Generate HTML report
  npm run report:clean      # Clean report directories
  ```

### Code Quality

- **Lint Code**
  ```bash
  npm run lint
  ```
  Runs ESLint on all JavaScript files in the `src` directory.

- **Format Code**
  ```bash
  npm run format
  ```
  Formats code using Prettier.

### Utilities

- **Verify Cypress Installation**
  ```bash
  npm run cypress:verify
  ```

- **Check Cypress Version**
  ```bash
  npm run cypress:version
  ```

## Environment Variables

The project uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

- `BASE_URL` - The base URL of the application under test
- `API_URL` - The API endpoint URL
- `TEST_USERNAME` - Test user username
- `TEST_PASSWORD` - Test user password
- `TAGS` - Filter tests by tags (for smoke/regression runs)

See `.env.example` for a template.

## Writing Tests

### Standard Cypress Tests

Create test files with `.cy.js` extension in the `cypress/e2e` directory:

```javascript
describe('My Test Suite', () => {
  it('should do something', () => {
    cy.visit('/');
    cy.get('[data-test="submit"]').click();
  });
});
```

### BDD/Cucumber Tests

1. Create a `.feature` file in `cypress/e2e`:

```gherkin
Feature: Login
  Scenario: Successful login
    Given I visit the login page
    When I enter valid credentials
    Then I should be logged in
```

2. Create corresponding step definitions in `cypress/e2e/<feature-name>/steps.js`:

```javascript
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I visit the login page', () => {
  cy.visit('/login');
});
```

## Custom Commands

The project includes several custom commands defined in `cypress/support/commands.js`:

- `cy.login(username, password)` - Log in a user with session management
- `cy.getByTestId(selector)` - Get element by data-test attribute
- `cy.getByCy(selector)` - Get element by data-cy attribute

## Test Tags

Use tags to categorize and filter tests:

- `@smoke` - Critical user journeys that should always pass
- `@regression` - Detailed functionality tests

## CI/CD Integration

The project includes comprehensive GitHub Actions workflows for automated testing:

### 🚀 Available Workflows

1. **[Main Cypress Workflow](.github/workflows/cypress.yml)** - Runs on PRs and pushes
   - Smoke tests (Chrome, Firefox, Edge)
   - Full regression tests (on main branch)
   - Flaky test detection
   - Code coverage reporting

2. **[BrowserStack Workflow](.github/workflows/browserstack.yml)** - Cross-browser testing
   - Desktop browsers (Windows, macOS)
   - Mobile devices (iOS, Android)
   - Nightly schedule + manual trigger

3. **[Nightly Regression](.github/workflows/nightly.yml)** - Comprehensive testing
   - Full test suite with parallel execution
   - Accessibility tests
   - Performance tests
   - Visual regression tests

### 📋 Setup Instructions

1. **Configure GitHub Secrets** (required):
   ```bash
   gh secret set BASE_URL --body "https://your-app.com"
   gh secret set API_URL --body "https://api.your-app.com"
   gh secret set CYPRESS_USERNAME --body "test.user@example.com"
   gh secret set CYPRESS_PASSWORD --body "SecurePassword123"
   ```

2. **Optional: BrowserStack Integration**:
   ```bash
   gh secret set BROWSERSTACK_USERNAME --body "your_username"
   gh secret set BROWSERSTACK_ACCESS_KEY --body "your_access_key"
   ```

3. **Optional: Cypress Dashboard**:
   ```bash
   gh secret set CYPRESS_RECORD_KEY --body "your-record-key"
   ```

### 📊 Workflow Features

- ✅ **Multi-browser matrix**: Chrome, Firefox, Edge
- ✅ **Node.js versions**: 18, 20
- ✅ **Smart caching**: node_modules and Cypress binary
- ✅ **Conditional execution**: Smoke tests on PR, full regression on main
- ✅ **Parallel execution**: Sharded test runs for faster feedback
- ✅ **Artifacts**: Screenshots, videos, HTML reports
- ✅ **Flaky detection**: Automatic analysis with PR comments

### 📚 Full Documentation

See **[CI_SETUP.md](./CI_SETUP.md)** for complete setup instructions, secrets configuration, troubleshooting, and best practices.

## Troubleshooting

### Cypress won't open

Run verification:
```bash
npm run cypress:verify
```

### Tests fail to run

1. Check that your `.env` file is configured correctly
2. Verify the application is running and accessible at `BASE_URL`
3. Check Cypress version compatibility: `npm run cypress:version`

### ESLint errors

Run the linter with auto-fix:
```bash
npm run lint
```

## Contributing

1. Create a feature branch
2. Write your tests
3. Run linting and formatting
4. Submit a pull request

## Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app)
- [Cypress Cucumber Preprocessor](https://github.com/badeball/cypress-cucumber-preprocessor)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)

## License

MIT
