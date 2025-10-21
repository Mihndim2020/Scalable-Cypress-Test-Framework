# Noveo Cypress Sample Project

This is a Cypress E2E testing project based on the Cypress Real World App (RWA) structure. It includes support for BDD with Cucumber, code coverage with NYC, and code quality tools.

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
│   ├── e2e/                    # E2E test files (.cy.js and .feature files)
│   ├── fixtures/               # Test data files
│   ├── support/                # Support files and custom commands
│   │   ├── commands.js         # Custom Cypress commands
│   │   └── e2e.js             # Global configuration and hooks
│   ├── screenshots/            # Screenshots from test failures
│   └── videos/                 # Video recordings of test runs
├── src/
│   ├── tests/                  # Additional test files
│   ├── pages/                  # Page Object Models
│   ├── fixtures/               # Additional test data
│   ├── support/                # Helper functions
│   ├── plugins/                # Custom plugins
│   └── utils/                  # Utility functions
├── ci/                         # CI/CD configuration files
├── cypress.config.js           # Cypress configuration
├── .cypress-cucumber-preprocessorrc.json  # Cucumber preprocessor config
├── .eslintrc.json             # ESLint configuration
├── .prettierrc.json           # Prettier configuration
├── .env.example               # Example environment variables
└── package.json               # Project dependencies and scripts
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

The project is ready for CI/CD integration. Example configuration files for popular CI/CD platforms can be added to the `ci/` directory.

### GitHub Actions Example

```yaml
name: Cypress Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: cypress-io/github-action@v5
        with:
          build: npm install
          start: npm start
          wait-on: 'http://localhost:3000'
```

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
