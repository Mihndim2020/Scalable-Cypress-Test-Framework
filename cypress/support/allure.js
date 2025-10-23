// Allure Reporter Support for Cypress
import '@shelex/cypress-allure-plugin';

// Custom Allure commands and helpers

/**
 * Add environment information to Allure report
 */
before(() => {
  const envInfo = {
    'Base URL': Cypress.config('baseUrl'),
    'Browser': Cypress.browser.name,
    'Browser Version': Cypress.browser.version,
    'Viewport': `${Cypress.config('viewportWidth')}x${Cypress.config('viewportHeight')}`,
    'OS': Cypress.platform,
    'Node Version': Cypress.version,
    'CI': Cypress.env('CI') || 'false',
    'Environment': Cypress.env('environment') || 'development',
  };

  // Add environment info to Allure
  Object.entries(envInfo).forEach(([key, value]) => {
    cy.allure().writeEnvironmentInfo({
      [key]: String(value),
    });
  });
});

/**
 * Automatically attach screenshots to Allure on test failure
 */
Cypress.on('test:after:run', (test, runnable) => {
  if (test.state === 'failed') {
    const screenshot = `${runnable.parent.title} -- ${test.title} (failed).png`;
    cy.allure().attachment('Screenshot on Failure', screenshot, 'image/png');
  }
});

/**
 * Add custom Cypress commands for Allure metadata
 */

Cypress.Commands.add('addAllureLabel', (name, value) => {
  cy.allure().label(name, value);
});

Cypress.Commands.add('addAllureTag', (tag) => {
  cy.allure().tag(tag);
});

Cypress.Commands.add('addAllureSeverity', (severity) => {
  // severity: blocker, critical, normal, minor, trivial
  cy.allure().severity(severity);
});

Cypress.Commands.add('addAllureEpic', (epic) => {
  cy.allure().epic(epic);
});

Cypress.Commands.add('addAllureFeature', (feature) => {
  cy.allure().feature(feature);
});

Cypress.Commands.add('addAllureStory', (story) => {
  cy.allure().story(story);
});

Cypress.Commands.add('addAllureIssue', (issueId, url) => {
  cy.allure().issue(issueId, url);
});

Cypress.Commands.add('addAllureTestCase', (testCaseId, url) => {
  cy.allure().testID(testCaseId, url);
});

Cypress.Commands.add('addAllureParameter', (name, value) => {
  cy.allure().parameter(name, value);
});

Cypress.Commands.add('addAllureAttachment', (name, content, type) => {
  cy.allure().attachment(name, content, type);
});

Cypress.Commands.add('logStepToAllure', (step) => {
  cy.allure().step(step);
});

/**
 * Example usage in tests:
 *
 * describe('Login Tests', () => {
 *   beforeEach(() => {
 *     cy.addAllureEpic('Authentication');
 *     cy.addAllureFeature('Login');
 *     cy.addAllureSeverity('critical');
 *   });
 *
 *   it('should login successfully', () => {
 *     cy.addAllureStory('Successful Login');
 *     cy.addAllureTestCase('TC-001', 'https://jira.example.com/TC-001');
 *     cy.addAllureParameter('username', 'testuser');
 *
 *     cy.logStepToAllure('Navigate to login page');
 *     cy.visit('/login');
 *
 *     cy.logStepToAllure('Enter credentials');
 *     cy.get('[data-cy="username"]').type('testuser');
 *     cy.get('[data-cy="password"]').type('password');
 *
 *     cy.logStepToAllure('Click login button');
 *     cy.get('[data-cy="submit"]').click();
 *
 *     cy.logStepToAllure('Verify successful login');
 *     cy.url().should('include', '/dashboard');
 *   });
 * });
 */
